"""
Main BeliefScanner that orchestrates the entire scanning and analysis process.
"""

import asyncio
import logging
from pathlib import Path
from typing import List, Optional

from .models import Belief, BeliefMetadata, Source
from .search import SearchManager
from .extraction import LLMClient, ArgumentExtractor, LinkageAnalyzer
from .enrichment import EnrichmentManager
from .analysis import StressTestAnalyzer, ProposalGenerator
from .generation import XMLGenerator
from .utils.config import get_config

logger = logging.getLogger(__name__)


class BeliefScanner:
    """
    Main scanner that coordinates all components to scan and analyze beliefs.

    The BeliefScanner:
    1. Searches the internet for relevant sources
    2. Extracts arguments and evidence from sources
    3. Analyzes linkages between claims
    4. Enriches metadata (ISBNs, DOIs, etc.)
    5. Identifies stress tests
    6. Generates proposals
    7. Produces structured XML output
    """

    def __init__(
        self,
        config_path: Optional[str] = None
    ):
        """
        Initialize the belief scanner.

        Args:
            config_path: Optional path to configuration file
        """
        self.config = get_config(config_path)

        # Initialize components
        self.search_manager = SearchManager()
        self.llm_client = LLMClient()
        self.argument_extractor = ArgumentExtractor(self.llm_client)
        self.linkage_analyzer = LinkageAnalyzer(self.llm_client)
        self.enrichment_manager = EnrichmentManager()
        self.stress_test_analyzer = StressTestAnalyzer(self.llm_client)
        self.proposal_generator = ProposalGenerator(self.llm_client)
        self.xml_generator = XMLGenerator()

        logger.info("BeliefScanner initialized")

    async def scan_belief(
        self,
        belief: str,
        description: Optional[str] = None,
        breadcrumb: Optional[List[str]] = None,
        max_sources: Optional[int] = None,
        depth: Optional[int] = None,
        enrich_metadata: bool = True,
        generate_stress_tests: bool = True,
        generate_proposals: bool = True
    ) -> Belief:
        """
        Scan and analyze a belief.

        Args:
            belief: The belief statement
            description: Optional description of the belief
            breadcrumb: Optional category breadcrumb
            max_sources: Maximum sources to search (default from config)
            depth: Depth of sub-argument exploration (default from config)
            enrich_metadata: Whether to enrich metadata
            generate_stress_tests: Whether to generate stress tests
            generate_proposals: Whether to generate proposals

        Returns:
            Populated Belief object
        """
        logger.info(f"Starting scan for belief: {belief}")

        max_sources = max_sources or self.config.scanning.max_sources
        depth = depth or self.config.scanning.depth

        # Create belief object
        belief_obj = Belief(
            title=belief,
            description=description or "",
            breadcrumb=breadcrumb or [],
            metadata=BeliefMetadata()
        )

        # Step 1: Search for sources
        logger.info("Searching for sources...")
        sources = await self._search_sources(belief, max_sources)
        belief_obj.metadata.source_count = len(sources)

        # Extract text from sources (simplified - in production would fetch full content)
        sources_text = [f"{s.title}. {s.snippet}" for s in sources]

        # Step 2: Extract arguments
        logger.info("Extracting arguments...")
        arguments = await self.argument_extractor.extract_arguments(
            belief, sources_text
        )

        belief_obj.reasons_to_agree = arguments["agree"]
        belief_obj.reasons_to_disagree = arguments["disagree"]

        # Step 3: Refine linkages
        logger.info("Analyzing linkages...")
        belief_obj.reasons_to_agree = await self.linkage_analyzer.refine_reason_linkages(
            belief_obj.reasons_to_agree, belief
        )
        belief_obj.reasons_to_disagree = await self.linkage_analyzer.refine_reason_linkages(
            belief_obj.reasons_to_disagree, belief
        )

        # Add sources to reasons
        for reason in belief_obj.reasons_to_agree + belief_obj.reasons_to_disagree:
            # Match relevant sources based on keywords
            keywords = reason.title.lower().split()
            for source in sources:
                source_text = (source.title + " " + source.snippet).lower()
                if any(keyword in source_text for keyword in keywords):
                    reason.add_source(
                        Source(
                            url=source.url,
                            title=source.title,
                            snippet=source.snippet
                        )
                    )
                    if len(reason.sources) >= 3:
                        break

        # Step 4: Extract and enrich evidence
        logger.info("Extracting evidence...")
        evidence_items = []
        for text in sources_text[:10]:  # Limit for performance
            items = await self.argument_extractor.identify_evidence_items(
                text, belief
            )
            evidence_items.extend(items)

        if enrich_metadata and evidence_items:
            logger.info("Enriching evidence metadata...")
            evidence_items = await self.enrichment_manager.enrich_multiple(evidence_items)

        belief_obj.evidence = evidence_items

        # Link evidence to reasons
        for reason in belief_obj.reasons_to_agree + belief_obj.reasons_to_disagree:
            for evidence in belief_obj.evidence:
                # Simple matching - could be more sophisticated
                if any(keyword in evidence.title.lower() for keyword in reason.title.lower().split()[:3]):
                    reason.add_evidence_ref(evidence.id)
                    if len(reason.evidence_refs) >= 3:
                        break

        # Step 5: Generate stress tests
        if generate_stress_tests:
            logger.info("Identifying stress tests...")
            stress_tests = await self.stress_test_analyzer.identify_stress_tests(
                belief,
                description,
                sources_text
            )

            # Add sources to stress tests
            stress_tests = await self.stress_test_analyzer.add_sources_to_stress_tests(
                stress_tests,
                [Source(url=s.url, title=s.title, snippet=s.snippet) for s in sources]
            )

            belief_obj.stress_tests = stress_tests

        # Step 6: Generate proposals
        if generate_proposals and belief_obj.stress_tests:
            logger.info("Generating proposals...")
            proposals = await self.proposal_generator.generate_proposals(
                belief,
                belief_obj.stress_tests,
                description
            )

            # Optionally expand argument trees
            for proposal in proposals:
                await self.proposal_generator.expand_argument_tree(proposal, depth=2)

            belief_obj.proposals = proposals

        logger.info(f"Scan complete. Found {len(belief_obj.reasons_to_agree)} reasons to agree, "
                   f"{len(belief_obj.reasons_to_disagree)} reasons to disagree, "
                   f"{len(belief_obj.evidence)} evidence items, "
                   f"{len(belief_obj.stress_tests)} stress tests, "
                   f"{len(belief_obj.proposals)} proposals")

        return belief_obj

    async def _search_sources(self, belief: str, max_sources: int) -> List:
        """Search for sources related to the belief"""
        # Create multiple search queries
        queries = [
            belief,
            f"{belief} arguments",
            f"{belief} evidence",
            f"{belief} examples",
            f"{belief} violations",
        ]

        all_results = []
        for query in queries[:3]:  # Limit number of queries
            results = await self.search_manager.search(
                query,
                max_results=max_sources // 3
            )
            all_results.extend(results)

        # Remove duplicates
        seen_urls = set()
        unique_results = []
        for result in all_results:
            if result.url not in seen_urls:
                seen_urls.add(result.url)
                unique_results.append(result)

        return unique_results[:max_sources]

    def to_xml(self, belief: Belief) -> str:
        """
        Convert belief to XML.

        Args:
            belief: The belief to convert

        Returns:
            XML string
        """
        return self.xml_generator.generate(belief)

    def save_xml(self, belief: Belief, output_path: str):
        """
        Save belief as XML file.

        Args:
            belief: The belief to save
            output_path: Path to save XML file
        """
        self.xml_generator.save(belief, output_path)

    async def scan_and_save(
        self,
        belief: str,
        output_path: str,
        **kwargs
    ) -> Belief:
        """
        Convenience method to scan a belief and save as XML.

        Args:
            belief: The belief statement
            output_path: Path to save XML file
            **kwargs: Additional arguments passed to scan_belief

        Returns:
            Populated Belief object
        """
        belief_obj = await self.scan_belief(belief, **kwargs)
        self.save_xml(belief_obj, output_path)
        return belief_obj


# Synchronous wrapper for easier use
def scan_belief_sync(
    belief: str,
    output_path: Optional[str] = None,
    **kwargs
) -> Belief:
    """
    Synchronous wrapper for scanning a belief.

    Args:
        belief: The belief statement
        output_path: Optional path to save XML
        **kwargs: Additional arguments

    Returns:
        Populated Belief object
    """
    scanner = BeliefScanner()

    # Run async code
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        if output_path:
            belief_obj = loop.run_until_complete(
                scanner.scan_and_save(belief, output_path, **kwargs)
            )
        else:
            belief_obj = loop.run_until_complete(
                scanner.scan_belief(belief, **kwargs)
            )
        return belief_obj
    finally:
        loop.close()
