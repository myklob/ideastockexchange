"""
CLI - Command-line interface for topic page generator
"""

import os
import sys
import click
import yaml
import json
from pathlib import Path
from typing import Optional

from .generator import TopicPageGenerator


def load_config(config_path: Optional[str] = None) -> dict:
    """Load configuration from file"""
    if config_path is None:
        # Try default locations
        for path in ['config.yaml', 'config.yml', '.config.yaml']:
            if os.path.exists(path):
                config_path = path
                break

    if config_path and os.path.exists(config_path):
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)

    # Return default config
    return {
        'llm': {
            'provider': 'ollama',
            'model': 'llama3',
            'api_base': 'http://localhost:11434',
            'temperature': 0.7
        },
        'output': {
            'directory': 'topics',
            'base_url': '/w/page'
        }
    }


@click.group()
@click.option('--config', '-c', help='Path to config file')
@click.pass_context
def cli(ctx, config):
    """Idea Stock Exchange Topic Page Generator

    Generate structured topic pages using local LLM instances.
    """
    ctx.ensure_object(dict)
    ctx.obj['config'] = load_config(config)


@cli.command()
@click.option('--topic', '-t', required=True, help='Topic name')
@click.option('--input', '-i', 'input_file', help='Path to JSON input file')
@click.option('--description', '-d', help='Text description of the topic')
@click.pass_context
def generate(ctx, topic, input_file, description):
    """Generate a single topic page"""

    config = ctx.obj['config']
    generator = TopicPageGenerator(config)

    # Test connection first
    try:
        click.echo("Testing LLM connection...")
        generator.test_connection()
        click.echo("✓ Connected to LLM")
    except Exception as e:
        click.echo(f"✗ Error connecting to LLM: {e}", err=True)
        click.echo("\nMake sure your LLM server is running:", err=True)
        click.echo("  - Ollama: ollama serve", err=True)
        click.echo("  - LM Studio: Start the local server", err=True)
        sys.exit(1)

    try:
        if input_file:
            # Load from JSON file
            with open(input_file, 'r') as f:
                input_data = json.load(f)
            input_data['topic_name'] = topic
            output_path = generator.generate_from_input(input_data)

        elif description:
            # Generate from description
            output_path = generator.generate_from_description(topic, description)

        else:
            click.echo("Error: Either --input or --description must be provided", err=True)
            sys.exit(1)

        click.echo(f"\n✓ Success! Topic page generated: {output_path}")

    except Exception as e:
        click.echo(f"✗ Error generating topic: {e}", err=True)
        import traceback
        traceback.print_exc()
        sys.exit(1)


@cli.command()
@click.option('--input', '-i', 'input_file', required=True, help='Path to batch JSON file')
@click.pass_context
def batch(ctx, input_file):
    """Generate multiple topic pages from a batch file"""

    config = ctx.obj['config']
    generator = TopicPageGenerator(config)

    try:
        click.echo("Testing LLM connection...")
        generator.test_connection()
        click.echo("✓ Connected to LLM\n")
    except Exception as e:
        click.echo(f"✗ Error connecting to LLM: {e}", err=True)
        sys.exit(1)

    try:
        output_paths = generator.batch_generate(input_file)
        click.echo(f"\n✓ Success! Generated {len(output_paths)} topic pages")

    except Exception as e:
        click.echo(f"✗ Error in batch processing: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.option('--topic', '-t', required=True, help='Topic name to update')
@click.option('--add-belief', help='Add a new belief to the topic')
@click.pass_context
def update(ctx, topic, add_belief):
    """Update an existing topic page"""

    config = ctx.obj['config']
    generator = TopicPageGenerator(config)

    if not add_belief:
        click.echo("Error: --add-belief is required for now", err=True)
        click.echo("More update options coming soon!", err=True)
        sys.exit(1)

    try:
        updates = {'add_belief': add_belief}
        output_path = generator.update_topic(topic, updates)
        click.echo(f"✓ Updated: {output_path}")

    except FileNotFoundError:
        click.echo(f"✗ Topic not found: {topic}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"✗ Error updating topic: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.pass_context
def test(ctx):
    """Test connection to LLM"""

    config = ctx.obj['config']
    click.echo("Testing LLM connection...")
    click.echo(f"Provider: {config['llm']['provider']}")
    click.echo(f"Model: {config['llm']['model']}")
    click.echo(f"API Base: {config['llm']['api_base']}")

    generator = TopicPageGenerator(config)

    try:
        generator.test_connection()
        click.echo("\n✓ Connection successful!")

    except Exception as e:
        click.echo(f"\n✗ Connection failed: {e}", err=True)
        click.echo("\nTroubleshooting tips:", err=True)
        click.echo("1. Check if your LLM server is running", err=True)
        click.echo("2. Verify the api_base URL in config.yaml", err=True)
        click.echo("3. Ensure the model is available", err=True)
        sys.exit(1)


@cli.command()
def init():
    """Initialize a new project with default configuration"""

    config_content = """# Idea Stock Exchange Configuration

llm:
  # LLM Provider: ollama, lmstudio, or openai-compatible
  provider: "ollama"

  # Model name (examples: llama3, mistral, gpt-3.5-turbo)
  model: "llama3"

  # API base URL
  api_base: "http://localhost:11434"

  # Temperature (0.0 - 1.0)
  temperature: 0.7

  # Max tokens per request
  max_tokens: 2000

output:
  # Directory for generated topic pages
  directory: "topics"

  # Base URL for links (used in templates)
  base_url: "/w/page"

# Template directory (default: templates)
template_dir: "templates"
"""

    if os.path.exists('config.yaml'):
        click.echo("config.yaml already exists. Delete it first if you want to reinitialize.")
        sys.exit(1)

    with open('config.yaml', 'w') as f:
        f.write(config_content)

    # Create directories
    os.makedirs('topics', exist_ok=True)
    os.makedirs('examples', exist_ok=True)

    click.echo("✓ Initialized project:")
    click.echo("  - Created config.yaml")
    click.echo("  - Created topics/ directory")
    click.echo("  - Created examples/ directory")
    click.echo("\nNext steps:")
    click.echo("  1. Edit config.yaml to match your LLM setup")
    click.echo("  2. Run: python -m src.cli test")
    click.echo("  3. Generate your first topic!")


if __name__ == '__main__':
    cli(obj={})
