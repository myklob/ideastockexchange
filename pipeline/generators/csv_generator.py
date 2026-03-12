"""
Reverse Processor: HTML to CSV.

Scrapes the ISE-rendered HTML to reconstruct a structured CSV.
The parser looks for the table structures defined in the ISE template,
extracts current scores and textual justification for each argument.
The resulting CSV preserves hierarchical Parent/Child relationships
and can be re-ingested into the pipeline without data loss.
"""

from __future__ import annotations

import csv
import io
from pathlib import Path
from typing import Optional

from pipeline.config import PipelineConfig
from pipeline.models.belief_node import ArgumentTree, BeliefNode


class CsvGenerator:
    """Generate CSV from HTML or from an ArgumentTree directly."""

    def __init__(self, config: PipelineConfig):
        self.config = config

    # ── From ArgumentTree ────────────────────────────────────────

    def generate_from_tree(self, tree: ArgumentTree) -> str:
        """
        Generate a CSV string from an ArgumentTree.

        The CSV format matches what the parsers expect, so it can be
        re-ingested without data loss.
        """
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)

        # Header row
        writer.writerow([
            "belief_id", "statement", "category", "subcategory",
            "parent_id", "side",
            "truth_score", "linkage_score", "importance_score", "uniqueness_score",
            "source_url", "evidence_type",
            "reason_rank", "propagated_score",
        ])

        # Write nodes in tree order (roots first, then children sorted by score)
        for root in tree.get_sorted_roots():
            self._write_subtree(writer, root, tree)

        return output.getvalue()

    def write_from_tree(self, tree: ArgumentTree, filename: str = "beliefs_export.csv"):
        """Write CSV to the output directory."""
        csv_content = self.generate_from_tree(tree)
        out_dir = Path(self.config.csv_output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        filepath = out_dir / filename
        filepath.write_text(csv_content, encoding="utf-8")

    # ── From HTML (Reverse Processing) ───────────────────────────

    def generate_from_html(self, html_content: str) -> str:
        """
        Scrape ISE-rendered HTML and reconstruct a structured CSV.

        Looks for the belief-node div structure with data attributes
        and Pro/Con table layout to extract all arguments with their
        hierarchical relationships.
        """
        try:
            from bs4 import BeautifulSoup
        except ImportError:
            raise ImportError(
                "BeautifulSoup is required for HTML parsing. "
                "Install it with: pip install beautifulsoup4 lxml"
            )

        soup = BeautifulSoup(html_content, "lxml")
        nodes = []
        self._extract_belief_nodes(soup, nodes, parent_id=None)

        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)

        # Header
        writer.writerow([
            "belief_id", "statement", "category", "subcategory",
            "parent_id", "side",
            "truth_score", "linkage_score", "importance_score", "uniqueness_score",
            "source_url", "evidence_type",
            "reason_rank", "propagated_score",
        ])

        for node in nodes:
            writer.writerow([
                node.get("belief_id", ""),
                node.get("statement", ""),
                node.get("category", ""),
                node.get("subcategory", ""),
                node.get("parent_id", ""),
                node.get("side", ""),
                node.get("truth_score", ""),
                node.get("linkage_score", ""),
                node.get("importance_score", ""),
                node.get("uniqueness_score", ""),
                node.get("source_url", ""),
                node.get("evidence_type", ""),
                node.get("reason_rank", ""),
                node.get("propagated_score", ""),
            ])

        return output.getvalue()

    def write_from_html(
        self, html_path: str, output_filename: str = "beliefs_from_html.csv"
    ):
        """Read an HTML file and write the extracted CSV."""
        html_content = Path(html_path).read_text(encoding="utf-8")
        csv_content = self.generate_from_html(html_content)
        out_dir = Path(self.config.csv_output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        filepath = out_dir / output_filename
        filepath.write_text(csv_content, encoding="utf-8")

    def parse_html_to_tree(self, html_content: str) -> ArgumentTree:
        """
        Parse ISE-rendered HTML back into an ArgumentTree.

        This enables the full round-trip:
          Spreadsheet -> Pipeline -> HTML -> CSV -> Pipeline
        """
        try:
            from bs4 import BeautifulSoup
        except ImportError:
            raise ImportError(
                "BeautifulSoup is required for HTML parsing. "
                "Install it with: pip install beautifulsoup4 lxml"
            )

        soup = BeautifulSoup(html_content, "lxml")
        extracted = []
        self._extract_belief_nodes(soup, extracted, parent_id=None)

        tree = ArgumentTree()
        for node_data in extracted:
            node = BeliefNode(
                belief_id=node_data.get("belief_id", ""),
                statement=node_data.get("statement", ""),
                category=node_data.get("category", ""),
                subcategory=node_data.get("subcategory", ""),
                parent_id=node_data.get("parent_id") or None,
                side=node_data.get("side", "supporting"),
                truth_score=float(node_data.get("truth_score", 0.5)),
                linkage_score=float(node_data.get("linkage_score", 0.5)),
                importance_score=float(node_data.get("importance_score", 0.5)),
                uniqueness_score=float(node_data.get("uniqueness_score", 1.0)),
            )
            node.reason_rank = float(node_data.get("reason_rank", 0))
            node.propagated_score = float(node_data.get("propagated_score", 0))
            tree.add_node(node)

        return tree

    # ── From XML (direct XML parsing) ────────────────────────────

    def generate_from_xml(self, xml_content: str) -> str:
        """
        Parse ISE XML and generate CSV.

        This handles the XML format produced by the XmlGenerator.
        """
        try:
            from lxml import etree
        except ImportError:
            raise ImportError(
                "lxml is required for XML parsing. "
                "Install it with: pip install lxml"
            )

        root = etree.fromstring(xml_content.encode("utf-8"))

        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)

        # Header
        writer.writerow([
            "belief_id", "statement", "category", "subcategory",
            "parent_id", "side",
            "truth_score", "linkage_score", "importance_score", "uniqueness_score",
            "source_url", "evidence_type",
            "reason_rank", "propagated_score",
        ])

        for belief in root.findall(".//Belief"):
            writer.writerow([
                self._xml_text(belief, "BeliefID"),
                self._xml_text(belief, "Statement"),
                self._xml_text(belief, "Category"),
                self._xml_text(belief, "Subcategory"),
                self._xml_text(belief, "ParentID"),
                self._xml_text(belief, "Side"),
                self._xml_text(belief, "TruthScore"),
                self._xml_text(belief, "LinkageScore"),
                self._xml_text(belief, "ImportanceScore"),
                self._xml_text(belief, "UniquenessScore"),
                self._xml_text(belief, "SourceUrl"),
                self._xml_text(belief, "EvidenceType"),
                self._xml_text(belief, "ReasonRank"),
                self._xml_text(belief, "PropagatedScore"),
            ])

        return output.getvalue()

    # ── Private helpers ──────────────────────────────────────────

    def _write_subtree(
        self, writer: csv.writer, node: BeliefNode, tree: ArgumentTree
    ):
        """Write a node and all its descendants to the CSV writer."""
        writer.writerow([
            node.belief_id,
            node.statement,
            node.category,
            node.subcategory,
            node.parent_id or "",
            node.side,
            f"{node.truth_score:.4f}",
            f"{node.linkage_score:.4f}",
            f"{node.importance_score:.4f}",
            f"{node.uniqueness_score:.4f}",
            node.source_url,
            node.evidence_type,
            f"{node.reason_rank:.6f}",
            f"{node.propagated_score:.6f}",
        ])

        for child in tree.get_sorted_children(node.belief_id):
            self._write_subtree(writer, child, tree)

    def _extract_belief_nodes(
        self,
        element,
        result: list[dict],
        parent_id: Optional[str],
    ):
        """
        Recursively extract belief nodes from BeautifulSoup-parsed HTML.

        The ISE HTML structure uses:
        - div.belief-node with data-belief-id, data-score, data-truth, etc.
        - span.belief-statement for the text
        - td.pro-cell for supporting children
        - td.con-cell for weakening children
        """
        from bs4 import Tag

        # Find all direct belief-node children (not nested ones)
        belief_divs = element.find_all("div", class_="belief-node", recursive=False)

        if not belief_divs:
            # Check if the element itself is a belief-node
            if isinstance(element, Tag) and "belief-node" in element.get("class", []):
                belief_divs = [element]
            else:
                # Look one level deeper (inside table cells, etc.)
                belief_divs = element.find_all("div", class_="belief-node", recursive=True)
                # Only take the outermost ones
                belief_divs = [
                    d for d in belief_divs
                    if d.parent.find_parent("div", class_="belief-node") is None
                    or d.parent.find_parent("div", class_="belief-node") == element
                ]

        for div in belief_divs:
            belief_id = div.get("data-belief-id", "")
            if not belief_id:
                continue

            # Determine side from parent cell class
            side = "supporting"  # default for root nodes
            parent_cell = div.find_parent("td")
            if parent_cell:
                classes = parent_cell.get("class", [])
                if "con-cell" in classes:
                    side = "weakening"
                elif "pro-cell" in classes:
                    side = "supporting"

            statement_elem = div.find("span", class_="belief-statement")
            statement = statement_elem.get_text(strip=True) if statement_elem else ""

            node_data = {
                "belief_id": belief_id,
                "statement": statement,
                "category": "",
                "subcategory": "",
                "parent_id": parent_id or "",
                "side": side,
                "truth_score": div.get("data-truth", "0.5"),
                "linkage_score": div.get("data-linkage", "0.5"),
                "importance_score": div.get("data-importance", "0.5"),
                "uniqueness_score": div.get("data-uniqueness", "1.0"),
                "source_url": "",
                "evidence_type": "T3",
                "reason_rank": div.get("data-score", "0"),
                "propagated_score": div.get("data-score", "0"),
            }
            result.append(node_data)

            # Recurse into pro-cell children
            pro_cell = div.find("td", class_="pro-cell")
            if pro_cell:
                for child_div in pro_cell.find_all(
                    "div", class_="belief-node", recursive=False
                ):
                    child_result = []
                    self._extract_belief_nodes(child_div, child_result, belief_id)
                    for child in child_result:
                        if child.get("parent_id") == belief_id:
                            child["side"] = "supporting"
                    result.extend(child_result)

            # Recurse into con-cell children
            con_cell = div.find("td", class_="con-cell")
            if con_cell:
                for child_div in con_cell.find_all(
                    "div", class_="belief-node", recursive=False
                ):
                    child_result = []
                    self._extract_belief_nodes(child_div, child_result, belief_id)
                    for child in child_result:
                        if child.get("parent_id") == belief_id:
                            child["side"] = "weakening"
                    result.extend(child_result)

    def _xml_text(self, element, tag: str) -> str:
        """Extract text content from an XML child element."""
        child = element.find(tag)
        if child is not None and child.text:
            return child.text.strip()
        return ""
