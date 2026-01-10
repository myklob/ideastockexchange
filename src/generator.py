"""
Generator - Main orchestrator for topic page generation
"""

import os
import json
from typing import Dict, List, Any, Optional

from .llm_client import LLMClient
from .belief_analyzer import BeliefAnalyzer
from .scorer import Scorer
from .template_engine import TemplateEngine


class TopicPageGenerator:
    """Main class for generating topic pages"""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize generator with configuration

        Args:
            config: Configuration dictionary with llm and output settings
        """
        self.config = config
        self.llm = LLMClient(config.get('llm', {}))
        self.analyzer = BeliefAnalyzer(self.llm)
        self.scorer = Scorer(self.llm)

        template_dir = config.get('template_dir', 'templates')
        self.template_engine = TemplateEngine(template_dir)

        self.output_dir = config.get('output', {}).get('directory', 'topics')
        self.base_url = config.get('output', {}).get('base_url', '/w/page')

    def generate_from_input(self, input_data: Dict[str, Any]) -> str:
        """
        Generate topic page from input data

        Args:
            input_data: Dictionary with:
                - topic_name: str
                - raw_beliefs: List[Dict] (each with 'text' and optional 'source')
                - related_topics: Dict (optional, with 'general', 'specific', 'related')
                - context: Dict (optional, additional context)

        Returns:
            Path to generated HTML file
        """
        print(f"Generating topic page for: {input_data['topic_name']}")

        # Step 1: Analyze beliefs
        print("Analyzing beliefs...")
        beliefs = self.analyzer.analyze_beliefs(
            input_data['topic_name'],
            input_data.get('raw_beliefs', [])
        )

        # Step 2: Extract importance factors
        print("Calculating importance...")
        importance_data = self.analyzer.extract_importance_factors(
            input_data['topic_name'],
            beliefs
        )

        # Step 3: Calculate scores
        print("Calculating scores...")
        importance_score = self.scorer.calculate_importance_score(
            input_data['topic_name'],
            beliefs,
            input_data.get('context')
        )

        engagement_score = self.scorer.calculate_engagement_score(
            input_data['topic_name'],
            beliefs,
            input_data.get('metadata')
        )

        # Step 4: Prepare template data
        template_data = {
            'topic_name': input_data['topic_name'],
            'importance_score': importance_score,
            'engagement_score': engagement_score,
            'purpose': beliefs.get('purpose', {}),
            'function': beliefs.get('function', {}),
            'form': beliefs.get('form', {}),
            'neutral': beliefs.get('neutral', {}),
            'importance': {
                'score': importance_data.get('score', f'{importance_score}/100'),
                'argument': importance_data.get('argument', 'To be determined')
            },
            'related_topics': input_data.get('related_topics', {
                'general': [],
                'specific': [],
                'related': []
            }),
            'base_url': self.base_url
        }

        # Step 5: Validate data
        is_valid, errors = self.template_engine.validate_data(template_data)
        if not is_valid:
            print(f"Warning: Data validation errors: {errors}")

        # Step 6: Render HTML
        print("Rendering HTML...")
        html = self.template_engine.render_topic_page(template_data)

        # Step 7: Save file
        filename = self.template_engine.generate_filename(input_data['topic_name'])
        output_path = os.path.join(self.output_dir, filename)

        self.template_engine.save_page(html, output_path)
        print(f"✓ Topic page generated: {output_path}")

        return output_path

    def generate_from_description(self, topic_name: str, description: str) -> str:
        """
        Generate topic page from a simple description

        Uses LLM to extract beliefs from description

        Args:
            topic_name: Name of the topic
            description: Text description of the topic and perspectives

        Returns:
            Path to generated HTML file
        """
        print(f"Generating topic from description: {topic_name}")

        # Extract beliefs from description
        print("Extracting beliefs from description...")
        beliefs = self._extract_beliefs_from_description(topic_name, description)

        # Generate using standard flow
        input_data = {
            'topic_name': topic_name,
            'raw_beliefs': beliefs,
            'related_topics': {'general': [], 'specific': [], 'related': []},
            'context': {'description': description}
        }

        return self.generate_from_input(input_data)

    def update_topic(self, topic_name: str, updates: Dict[str, Any]) -> str:
        """
        Update an existing topic page

        Args:
            topic_name: Name of the topic to update
            updates: Dictionary with fields to update

        Returns:
            Path to updated HTML file
        """
        # Load existing topic data
        filename = self.template_engine.generate_filename(topic_name)
        topic_path = os.path.join(self.output_dir, filename)

        if not os.path.exists(topic_path):
            raise FileNotFoundError(f"Topic not found: {topic_name}")

        # TODO: Parse existing HTML to extract data (or maintain JSON files)
        # For now, treat as regeneration with new beliefs
        print(f"Updating topic: {topic_name}")

        if 'add_belief' in updates:
            # Add new belief and regenerate
            new_belief = {'text': updates['add_belief']}
            input_data = {
                'topic_name': topic_name,
                'raw_beliefs': [new_belief],  # In production, merge with existing
            }
            return self.generate_from_input(input_data)

        raise NotImplementedError("Full update functionality coming soon")

    def batch_generate(self, input_file: str) -> List[str]:
        """
        Generate multiple topic pages from a batch input file

        Args:
            input_file: Path to JSON file with array of topic inputs

        Returns:
            List of paths to generated files
        """
        print(f"Batch processing topics from: {input_file}")

        with open(input_file, 'r') as f:
            topics = json.load(f)

        if not isinstance(topics, list):
            topics = [topics]

        results = []
        for i, topic_data in enumerate(topics, 1):
            print(f"\n[{i}/{len(topics)}] Processing: {topic_data.get('topic_name', 'Unknown')}")
            try:
                output_path = self.generate_from_input(topic_data)
                results.append(output_path)
            except Exception as e:
                print(f"Error processing topic: {e}")
                continue

        print(f"\n✓ Batch complete: {len(results)}/{len(topics)} topics generated")
        return results

    def _extract_beliefs_from_description(self, topic_name: str, description: str) -> List[Dict[str, str]]:
        """
        Use LLM to extract beliefs from a text description

        Args:
            topic_name: Topic name
            description: Text description

        Returns:
            List of belief dictionaries
        """
        system_prompt = """You extract distinct beliefs and perspectives from topic descriptions.
Each belief should represent a different viewpoint or argument about the topic."""

        prompt = f"""Topic: {topic_name}

Description:
{description}

Extract 5-10 distinct beliefs or perspectives from this description.
Each should be a clear statement representing a viewpoint.

Respond with JSON:
{{
  "beliefs": [
    {{"text": "belief statement", "type": "pro|con|neutral"}},
    ...
  ]
}}"""

        try:
            result = self.llm.generate_json(prompt, system_prompt)
            return result.get('beliefs', [])
        except Exception as e:
            print(f"Error extracting beliefs: {e}")
            return [{'text': description, 'type': 'neutral'}]

    def test_connection(self) -> bool:
        """
        Test LLM connection

        Returns:
            True if successful
        """
        return self.llm.test_connection()
