"""
Template Engine - Renders HTML pages using Jinja2
"""

import os
import re
from typing import Dict, Any
from jinja2 import Environment, FileSystemLoader, select_autoescape


class TemplateEngine:
    """Renders topic pages using Jinja2 templates"""

    def __init__(self, template_dir: str = "templates"):
        """
        Initialize template engine

        Args:
            template_dir: Directory containing templates
        """
        self.template_dir = template_dir
        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )

        # Add custom filters
        self.env.filters['slugify'] = self.slugify

    def render_topic_page(self, data: Dict[str, Any]) -> str:
        """
        Render a complete topic page

        Args:
            data: Dictionary containing all topic data
                Required keys:
                - topic_name
                - importance_score
                - engagement_score
                - purpose (dict with moral_ends, interests_served, values_alignment)
                - function (dict with ethical_means, effectiveness, efficiency, reliability)
                - form (dict with appeal, order, harmony)
                - neutral (dict with synthesis, contextual, agnostic)
                - importance (dict with score and argument)
                - related_topics (dict with general, specific, related lists)
                - base_url (optional, defaults to "/w/page")

        Returns:
            Rendered HTML string
        """
        # Add defaults
        data.setdefault('base_url', '/w/page')

        # Load and render template
        template = self.env.get_template('topic-template.html')
        return template.render(**data)

    def render_custom_template(self, template_name: str, data: Dict[str, Any]) -> str:
        """
        Render any template with provided data

        Args:
            template_name: Name of template file
            data: Template data

        Returns:
            Rendered HTML string
        """
        template = self.env.get_template(template_name)
        return template.render(**data)

    def validate_data(self, data: Dict[str, Any]) -> tuple[bool, list[str]]:
        """
        Validate that data has all required fields

        Args:
            data: Data dictionary to validate

        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        required_fields = [
            'topic_name',
            'importance_score',
            'engagement_score',
            'purpose',
            'function',
            'form',
            'neutral',
            'importance',
            'related_topics'
        ]

        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required field: {field}")

        # Validate nested structures
        if 'purpose' in data:
            for subfield in ['moral_ends', 'interests_served', 'values_alignment']:
                if subfield not in data['purpose']:
                    errors.append(f"Missing purpose.{subfield}")

        if 'function' in data:
            for subfield in ['ethical_means', 'effectiveness', 'efficiency', 'reliability']:
                if subfield not in data['function']:
                    errors.append(f"Missing function.{subfield}")

        if 'form' in data:
            for subfield in ['appeal', 'order', 'harmony']:
                if subfield not in data['form']:
                    errors.append(f"Missing form.{subfield}")

        if 'neutral' in data:
            for subfield in ['synthesis', 'contextual', 'agnostic']:
                if subfield not in data['neutral']:
                    errors.append(f"Missing neutral.{subfield}")

        return (len(errors) == 0, errors)

    @staticmethod
    def slugify(text: str) -> str:
        """
        Convert text to URL-friendly slug

        Args:
            text: Text to slugify

        Returns:
            Slugified text
        """
        # Convert to lowercase
        text = text.lower()
        # Replace spaces and special chars with hyphens
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[\s_-]+', '-', text)
        text = re.sub(r'^-+|-+$', '', text)
        return text

    def save_page(self, html: str, output_path: str) -> None:
        """
        Save rendered HTML to file

        Args:
            html: Rendered HTML content
            output_path: Path to save file
        """
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html)

    def generate_filename(self, topic_name: str) -> str:
        """
        Generate filename from topic name

        Args:
            topic_name: Topic name

        Returns:
            Filename (e.g., "universal-healthcare.html")
        """
        return f"{self.slugify(topic_name)}.html"
