"""Command-line interface for the Belief Scanner"""

import asyncio
import logging
from pathlib import Path
from typing import Optional

import click
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

from .scanner import BeliefScanner
from .utils.config import get_config

console = Console()


def setup_logging(verbose: bool):
    """Setup logging configuration"""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('logs/scanner.log'),
            logging.StreamHandler() if verbose else logging.NullHandler()
        ]
    )


@click.group()
@click.version_option(version="1.0.0")
def cli():
    """
    Idea Stock Exchange - Belief Argument Scanner

    Scan the internet for arguments, evidence, and examples related to beliefs.
    """
    pass


@cli.command()
@click.argument('belief')
@click.option('--output', '-o', default='output/belief.xml', help='Output XML file path')
@click.option('--description', '-d', help='Description of the belief')
@click.option('--max-sources', '-m', type=int, help='Maximum number of sources to search')
@click.option('--depth', type=int, help='Depth of sub-argument exploration (1-5)')
@click.option('--no-enrich', is_flag=True, help='Skip metadata enrichment')
@click.option('--no-stress-tests', is_flag=True, help='Skip stress test generation')
@click.option('--no-proposals', is_flag=True, help='Skip proposal generation')
@click.option('--config', '-c', help='Path to configuration file')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def scan(
    belief: str,
    output: str,
    description: Optional[str],
    max_sources: Optional[int],
    depth: Optional[int],
    no_enrich: bool,
    no_stress_tests: bool,
    no_proposals: bool,
    config: Optional[str],
    verbose: bool
):
    """
    Scan a belief and generate structured XML output.

    Example:
        belief-scanner scan "Democracy requires informed citizens" -o democracy.xml
    """
    setup_logging(verbose)

    # Create output directory
    Path(output).parent.mkdir(parents=True, exist_ok=True)

    # Initialize scanner
    scanner = BeliefScanner(config_path=config)

    # Show status
    console.print(f"\n[bold blue]Scanning belief:[/bold blue] {belief}\n")

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:

        task = progress.add_task("Initializing scan...", total=None)

        async def run_scan():
            progress.update(task, description="Searching for sources...")
            result = await scanner.scan_belief(
                belief=belief,
                description=description,
                max_sources=max_sources,
                depth=depth,
                enrich_metadata=not no_enrich,
                generate_stress_tests=not no_stress_tests,
                generate_proposals=not no_proposals
            )

            progress.update(task, description="Generating XML...")
            scanner.save_xml(result, output)

            return result

        # Run async scan
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            belief_obj = loop.run_until_complete(run_scan())
        finally:
            loop.close()

    # Display summary
    console.print("\n[bold green]✓ Scan complete![/bold green]\n")

    table = Table(title="Results Summary")
    table.add_column("Category", style="cyan")
    table.add_column("Count", style="magenta", justify="right")

    table.add_row("Reasons to Agree", str(len(belief_obj.reasons_to_agree)))
    table.add_row("Reasons to Disagree", str(len(belief_obj.reasons_to_disagree)))
    table.add_row("Evidence Items", str(len(belief_obj.evidence)))
    table.add_row("Stress Tests", str(len(belief_obj.stress_tests)))
    table.add_row("Proposals", str(len(belief_obj.proposals)))
    table.add_row("Sources", str(belief_obj.metadata.source_count))

    console.print(table)
    console.print(f"\n[bold]Output saved to:[/bold] {output}\n")


@cli.command()
@click.argument('belief')
@click.option('--max-sources', '-m', type=int, default=10, help='Maximum sources to search')
@click.option('--config', '-c', help='Path to configuration file')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def search(belief: str, max_sources: int, config: Optional[str], verbose: bool):
    """
    Search for sources related to a belief (without full scan).

    Example:
        belief-scanner search "Climate change requires action"
    """
    setup_logging(verbose)

    scanner = BeliefScanner(config_path=config)

    console.print(f"\n[bold blue]Searching for:[/bold blue] {belief}\n")

    async def run_search():
        return await scanner._search_sources(belief, max_sources)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        sources = loop.run_until_complete(run_search())
    finally:
        loop.close()

    if sources:
        table = Table(title=f"Found {len(sources)} Sources")
        table.add_column("Title", style="cyan")
        table.add_column("URL", style="blue")

        for source in sources[:20]:  # Show top 20
            table.add_row(
                source.title[:60] + "..." if len(source.title) > 60 else source.title,
                source.url[:50] + "..." if len(source.url) > 50 else source.url
            )

        console.print(table)
        console.print()
    else:
        console.print("[yellow]No sources found.[/yellow]\n")


@cli.command()
@click.argument('xml_file', type=click.Path(exists=True))
def validate(xml_file: str):
    """
    Validate an XML file against the schema.

    Example:
        belief-scanner validate output/belief.xml
    """
    from .generation import XMLGenerator

    console.print(f"\n[bold blue]Validating:[/bold blue] {xml_file}\n")

    generator = XMLGenerator()

    if not generator.schema:
        console.print("[red]Error: Schema not loaded.[/red]\n")
        return

    try:
        with open(xml_file) as f:
            xml_content = f.read()

        generator.schema.validate(xml_content)
        console.print("[green]✓ Validation successful![/green]\n")
    except Exception as e:
        console.print(f"[red]✗ Validation failed:[/red]\n{e}\n")


@cli.command()
def status():
    """Check the status of configured services."""
    config = get_config()

    table = Table(title="Service Status")
    table.add_column("Service", style="cyan")
    table.add_column("Status", style="magenta")
    table.add_column("Details", style="white")

    # Check search providers
    from .search import SearchManager
    manager = SearchManager()
    status_map = manager.get_provider_status()

    for provider, available in status_map.items():
        status = "[green]✓ Available[/green]" if available else "[red]✗ Not configured[/red]"
        table.add_row(provider, status, "")

    # Check LLM
    from .extraction import LLMClient
    llm = LLMClient()
    llm_status = "[green]✓ Available[/green]" if llm.is_available() else "[red]✗ Not configured[/red]"
    table.add_row("LLM Provider", llm_status, f"{config.llm.provider} ({config.llm.model})")

    console.print()
    console.print(table)
    console.print()


def main():
    """Main entry point"""
    # Create necessary directories
    Path("logs").mkdir(exist_ok=True)
    Path("output").mkdir(exist_ok=True)

    cli()


if __name__ == '__main__':
    main()
