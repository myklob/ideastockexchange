"""Generate XML from Belief objects"""

import logging
from pathlib import Path
from typing import Optional
from xml.dom import minidom
from xml.etree.ElementTree import Element, SubElement, ElementTree, tostring

import xmlschema

from ..models import (
    Belief, Reason, Evidence, StressTest, Proposal,
    ArgumentNode, EvidenceType
)
from ..utils.config import get_config

logger = logging.getLogger(__name__)


class XMLGenerator:
    """
    Generates XML output from Belief objects according to the schema.
    """

    def __init__(self, schema_path: Optional[str] = None):
        """
        Initialize XML generator.

        Args:
            schema_path: Path to XSD schema file (optional)
        """
        self.config = get_config()
        self.schema_path = schema_path or "schemas/belief_schema.xsd"
        self.namespace = "http://ideastockexchange.com/schema/belief/1.0"

        # Load schema if validation is enabled
        self.schema = None
        if self.config.output.validate_xml and Path(self.schema_path).exists():
            try:
                self.schema = xmlschema.XMLSchema(self.schema_path)
                logger.info(f"Loaded XML schema from {self.schema_path}")
            except Exception as e:
                logger.warning(f"Could not load schema: {e}")

    def generate(self, belief: Belief) -> str:
        """
        Generate XML from a Belief object.

        Args:
            belief: The belief to convert to XML

        Returns:
            XML string
        """
        root = self._create_belief_element(belief)
        tree = ElementTree(root)

        # Convert to string
        xml_str = tostring(root, encoding='unicode')

        # Pretty print if enabled
        if self.config.output.pretty_print:
            dom = minidom.parseString(xml_str)
            xml_str = dom.toprettyxml(indent="  ")
            # Remove extra blank lines
            xml_str = "\n".join([line for line in xml_str.split("\n") if line.strip()])

        # Validate if enabled and schema is available
        if self.config.output.validate_xml and self.schema:
            try:
                self.schema.validate(xml_str)
                logger.info("XML validation successful")
            except Exception as e:
                logger.error(f"XML validation failed: {e}")

        return xml_str

    def _create_belief_element(self, belief: Belief) -> Element:
        """Create the root belief element"""
        root = Element(
            f"{{{self.namespace}}}belief",
            attrib={
                "id": belief.id,
                "version": belief.version,
                "created": belief.created.isoformat(),
                "updated": belief.updated.isoformat()
            }
        )

        # Metadata
        metadata = SubElement(root, "metadata")
        if belief.metadata.source:
            SubElement(metadata, "source").text = belief.metadata.source
        if belief.metadata.author:
            SubElement(metadata, "author").text = belief.metadata.author
        for category in belief.metadata.categories:
            SubElement(metadata, "category").text = category
        SubElement(metadata, "scan-date").text = belief.metadata.scan_date.isoformat()
        SubElement(metadata, "source-count").text = str(belief.metadata.source_count)
        if belief.metadata.confidence_score is not None:
            SubElement(metadata, "confidence-score").text = str(belief.metadata.confidence_score)

        # Title and description
        SubElement(root, "title").text = belief.title
        SubElement(root, "description").text = belief.description

        # Breadcrumb
        if belief.breadcrumb:
            breadcrumb = SubElement(root, "breadcrumb")
            for category in belief.breadcrumb:
                SubElement(breadcrumb, "category").text = category

        # Reasons to agree
        if belief.reasons_to_agree:
            reasons_agree = SubElement(root, "reasons-to-agree")
            for reason in belief.reasons_to_agree:
                self._add_reason_element(reasons_agree, reason)

        # Reasons to disagree
        if belief.reasons_to_disagree:
            reasons_disagree = SubElement(root, "reasons-to-disagree")
            for reason in belief.reasons_to_disagree:
                self._add_reason_element(reasons_disagree, reason)

        # Core principles
        if belief.core_principles:
            principles = SubElement(root, "core-principles")
            for principle in belief.core_principles:
                p_elem = SubElement(principles, "principle", attrib={"id": principle.id})
                SubElement(p_elem, "title").text = principle.title
                SubElement(p_elem, "description").text = principle.description
                for meaning in principle.practical_meanings:
                    SubElement(p_elem, "practical-meaning").text = meaning

        # Specific applications
        if belief.specific_applications:
            applications = SubElement(root, "specific-applications")
            for app in belief.specific_applications:
                app_elem = SubElement(applications, "application", attrib={"id": app.id})
                SubElement(app_elem, "title").text = app.title
                SubElement(app_elem, "description").text = app.description
                for req in app.requirements:
                    SubElement(app_elem, "requirements").text = req
                for ex in app.examples:
                    SubElement(app_elem, "examples").text = ex

        # Related beliefs
        if belief.related_beliefs:
            related = SubElement(root, "related-beliefs")

            if belief.related_beliefs.upstream:
                upstream = SubElement(related, "upstream")
                for ref in belief.related_beliefs.upstream:
                    ref_elem = SubElement(upstream, "belief-ref")
                    if ref.ref:
                        ref_elem.set("ref", ref.ref)
                    SubElement(ref_elem, "title").text = ref.title
                    if ref.url:
                        SubElement(ref_elem, "url").text = ref.url
                    if ref.relationship_description:
                        SubElement(ref_elem, "relationship-description").text = ref.relationship_description

            if belief.related_beliefs.downstream:
                downstream = SubElement(related, "downstream")
                for ref in belief.related_beliefs.downstream:
                    ref_elem = SubElement(downstream, "belief-ref")
                    if ref.ref:
                        ref_elem.set("ref", ref.ref)
                    SubElement(ref_elem, "title").text = ref.title
                    if ref.url:
                        SubElement(ref_elem, "url").text = ref.url
                    if ref.relationship_description:
                        SubElement(ref_elem, "relationship-description").text = ref.relationship_description

            if belief.related_beliefs.related:
                related_section = SubElement(related, "related")
                for ref in belief.related_beliefs.related:
                    ref_elem = SubElement(related_section, "belief-ref")
                    if ref.ref:
                        ref_elem.set("ref", ref.ref)
                    SubElement(ref_elem, "title").text = ref.title
                    if ref.url:
                        SubElement(ref_elem, "url").text = ref.url
                    if ref.relationship_description:
                        SubElement(ref_elem, "relationship-description").text = ref.relationship_description

        # Evidence
        if belief.evidence:
            evidence_section = SubElement(root, "evidence")
            for evidence in belief.evidence:
                self._add_evidence_element(evidence_section, evidence)

        # Stress tests
        if belief.stress_tests:
            stress_tests = SubElement(root, "stress-tests")
            for st in belief.stress_tests:
                self._add_stress_test_element(stress_tests, st)

        # Proposals
        if belief.proposals:
            proposals = SubElement(root, "proposals")
            for proposal in belief.proposals:
                self._add_proposal_element(proposals, proposal)

        # Tags
        if belief.tags:
            tags = SubElement(root, "tags")
            for tag in belief.tags:
                SubElement(tags, "tag").text = tag

        return root

    def _add_reason_element(self, parent: Element, reason: Reason):
        """Add a reason element"""
        attribs = {"id": reason.id}
        if reason.importance is not None:
            attribs["importance"] = str(reason.importance)

        reason_elem = SubElement(parent, "reason", attrib=attribs)
        SubElement(reason_elem, "title").text = reason.title
        SubElement(reason_elem, "description").text = reason.description

        # Linkage
        linkage = SubElement(reason_elem, "linkage")
        SubElement(linkage, "score").text = str(reason.linkage.score)
        SubElement(linkage, "justification").text = reason.linkage.justification

        link_arg = SubElement(linkage, "linkage-argument")
        SubElement(link_arg, "premise").text = reason.linkage.linkage_argument.premise
        SubElement(link_arg, "inference-rule").text = reason.linkage.linkage_argument.inference_rule
        SubElement(link_arg, "conclusion").text = reason.linkage.linkage_argument.conclusion
        SubElement(link_arg, "strength-analysis").text = reason.linkage.linkage_argument.strength_analysis

        if reason.linkage.linkage_argument.counterarguments:
            counterargs = SubElement(link_arg, "counterarguments")
            for ca in reason.linkage.linkage_argument.counterarguments:
                SubElement(counterargs, "counterargument").text = ca.description

        # Sub-reasons
        if reason.sub_reasons:
            sub_reasons = SubElement(reason_elem, "sub-reasons")
            for sub in reason.sub_reasons:
                SubElement(sub_reasons, "sub-reason").text = sub

        # Evidence refs
        if reason.evidence_refs:
            evidence_refs = SubElement(reason_elem, "evidence-refs")
            for ref in reason.evidence_refs:
                SubElement(evidence_refs, "evidence-ref").text = ref

        # Sources
        if reason.sources:
            sources = SubElement(reason_elem, "sources")
            for source in reason.sources:
                source_elem = SubElement(sources, "source")
                SubElement(source_elem, "url").text = source.url
                SubElement(source_elem, "title").text = source.title
                if source.snippet:
                    SubElement(source_elem, "snippet").text = source.snippet
                SubElement(source_elem, "accessed").text = source.accessed.isoformat()

    def _add_evidence_element(self, parent: Element, evidence: Evidence):
        """Add an evidence element"""
        attribs = {"id": evidence.id}
        if evidence.relevance_score is not None:
            attribs["relevance-score"] = str(evidence.relevance_score)

        ev_elem = SubElement(parent, "evidence-item", attrib=attribs)
        SubElement(ev_elem, "type").text = evidence.type.value
        SubElement(ev_elem, "title").text = evidence.title
        if evidence.description:
            SubElement(ev_elem, "description").text = evidence.description

        # Metadata
        metadata = SubElement(ev_elem, "metadata")
        if evidence.metadata.url:
            SubElement(metadata, "url").text = evidence.metadata.url
        if evidence.metadata.isbn:
            SubElement(metadata, "isbn").text = evidence.metadata.isbn
        if evidence.metadata.doi:
            SubElement(metadata, "doi").text = evidence.metadata.doi
        if evidence.metadata.podcast_feed_id:
            SubElement(metadata, "podcast-feed-id").text = evidence.metadata.podcast_feed_id

        if evidence.metadata.authors:
            authors = SubElement(metadata, "authors")
            for author in evidence.metadata.authors:
                SubElement(authors, "author").text = author

        if evidence.metadata.published_date:
            SubElement(metadata, "published-date").text = evidence.metadata.published_date.isoformat()
        if evidence.metadata.publisher:
            SubElement(metadata, "publisher").text = evidence.metadata.publisher
        if evidence.metadata.accessed_date:
            SubElement(metadata, "accessed-date").text = evidence.metadata.accessed_date.isoformat()
        if evidence.metadata.pages:
            SubElement(metadata, "pages").text = evidence.metadata.pages
        if evidence.metadata.volume:
            SubElement(metadata, "volume").text = evidence.metadata.volume
        if evidence.metadata.issue:
            SubElement(metadata, "issue").text = evidence.metadata.issue

        if evidence.metadata.custom_fields:
            custom = SubElement(metadata, "custom-fields")
            for name, value in evidence.metadata.custom_fields.items():
                field = SubElement(custom, "field", attrib={"name": name})
                field.text = value

        if evidence.relevance:
            SubElement(ev_elem, "relevance").text = evidence.relevance
        if evidence.quote:
            SubElement(ev_elem, "quote").text = evidence.quote

    def _add_stress_test_element(self, parent: Element, stress_test: StressTest):
        """Add a stress test element"""
        st_elem = SubElement(parent, "stress-test", attrib={"id": stress_test.id})
        SubElement(st_elem, "title").text = stress_test.title
        SubElement(st_elem, "description").text = stress_test.description
        SubElement(st_elem, "violation-type").text = stress_test.violation_type
        SubElement(st_elem, "severity").text = str(stress_test.severity)

        examples = SubElement(st_elem, "examples")
        for example in stress_test.examples:
            SubElement(examples, "example").text = example

        SubElement(st_elem, "analysis").text = stress_test.analysis

        if stress_test.sources:
            sources = SubElement(st_elem, "sources")
            for source in stress_test.sources:
                source_elem = SubElement(sources, "source")
                SubElement(source_elem, "url").text = source.url
                SubElement(source_elem, "title").text = source.title
                if source.snippet:
                    SubElement(source_elem, "snippet").text = source.snippet
                SubElement(source_elem, "accessed").text = source.accessed.isoformat()

    def _add_proposal_element(self, parent: Element, proposal: Proposal):
        """Add a proposal element"""
        attribs = {"id": proposal.id}
        if proposal.priority is not None:
            attribs["priority"] = str(proposal.priority)

        prop_elem = SubElement(parent, "proposal", attrib=attribs)
        SubElement(prop_elem, "title").text = proposal.title
        SubElement(prop_elem, "description").text = proposal.description

        for st_id in proposal.addresses_stress_tests:
            SubElement(prop_elem, "addresses-stress-test").text = st_id

        # Argument tree
        arg_tree = SubElement(prop_elem, "argument-tree")
        SubElement(arg_tree, "root-claim").text = proposal.argument_tree.root_claim
        supporting = SubElement(arg_tree, "supporting-arguments")
        for node in proposal.argument_tree.supporting_arguments:
            self._add_argument_node(supporting, node)

        # Implementation steps
        if proposal.implementation_steps:
            steps = SubElement(prop_elem, "implementation-steps")
            for step in proposal.implementation_steps:
                SubElement(steps, "step").text = step

        # Expected outcomes
        if proposal.expected_outcomes:
            outcomes = SubElement(prop_elem, "expected-outcomes")
            for outcome in proposal.expected_outcomes:
                SubElement(outcomes, "outcome").text = outcome

        # Potential objections
        if proposal.potential_objections:
            objections = SubElement(prop_elem, "potential-objections")
            for objection in proposal.potential_objections:
                obj_elem = SubElement(objections, "objection")
                SubElement(obj_elem, "description").text = objection.description
                SubElement(obj_elem, "response").text = objection.response

    def _add_argument_node(self, parent: Element, node: ArgumentNode):
        """Add an argument node element"""
        node_elem = SubElement(parent, "argument-node", attrib={"id": node.id})
        SubElement(node_elem, "claim").text = node.claim
        SubElement(node_elem, "support-type").text = node.support_type

        if node.evidence_refs:
            evidence_refs = SubElement(node_elem, "evidence-refs")
            for ref in node.evidence_refs:
                SubElement(evidence_refs, "evidence-ref").text = ref

        if node.sub_arguments:
            sub_args = SubElement(node_elem, "sub-arguments")
            for sub_node in node.sub_arguments:
                self._add_argument_node(sub_args, sub_node)

    def save(self, belief: Belief, output_path: str):
        """
        Generate XML and save to file.

        Args:
            belief: The belief to convert
            output_path: Path to save XML file
        """
        xml_str = self.generate(belief)

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(xml_str)

        logger.info(f"Saved XML to {output_path}")
