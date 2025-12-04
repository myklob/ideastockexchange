#!/usr/bin/env python3
"""
Transform XML/PHP Belief Data to HTML Template Format

This script converts belief data from XML format into the comprehensive
HTML template format used by the Idea Stock Exchange. It handles:
- Belief relationships (support/oppose)
- Scoring for each relationship
- Evidence, arguments, values, interests, and more
"""

import os
import argparse
import hashlib
import time
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from lxml import etree


# ============================================================================
# TAG SCHEMA DEFINITIONS
# ============================================================================

@dataclass
class BeliefTag:
    """
    Base tag for all beliefs. Every belief has a unique text ID.
    """
    text_id: str  # Unique identifier (slug or hash)
    statement: str  # The belief statement
    category: str = "other"
    description: str = ""
    created: str = ""
    updated: str = ""


@dataclass
class RelationshipTag:
    """
    Tag for belief-to-belief relationships (reasons to agree/disagree).

    This represents one belief being a reason to agree or disagree with another.
    Each relationship has multiple scoring dimensions.
    """
    from_belief_id: str  # The belief providing the reason
    to_belief_id: str  # The belief being supported/opposed
    relationship_type: str  # "SUPPORTS" or "OPPOSES"

    # Scoring dimensions
    linkage_score: float = 0.5  # How relevant is this connection? (0-1)
    truth_score: float = 0.5  # How true is the supporting belief? (0-1)
    importance_score: float = 0.5  # How important is this relationship? (0-1)
    evidence_strength: float = 0.5  # How strong is the evidence? (0-1)

    # Composite scores
    overall_contribution: float = 0.0  # Overall contribution to target belief

    # Metadata
    created_at: str = ""
    created_by: str = ""
    justification: str = ""  # Why does this relationship exist?

    def calculate_overall_contribution(self) -> float:
        """
        Calculate the overall contribution using a weighted formula.

        Formula: contribution = (linkage * 0.4) + (truth * 0.3) +
                               (importance * 0.2) + (evidence * 0.1)
        """
        self.overall_contribution = (
            self.linkage_score * 0.4 +
            self.truth_score * 0.3 +
            self.importance_score * 0.2 +
            self.evidence_strength * 0.1
        )
        return self.overall_contribution


@dataclass
class EvidenceTag:
    """Tag for evidence supporting or opposing a belief."""
    belief_id: str
    evidence_type: str  # "supporting" or "opposing"
    tier: int  # 1-4 (1=best, 4=weakest)
    description: str
    source: str = ""
    url: str = ""
    score: float = 0.5


@dataclass
class ArgumentTag:
    """Tag for arguments (reasons) for a belief."""
    belief_id: str
    argument_type: str  # "supporting" or "opposing"
    content: str
    linkage_score: float = 0.5
    evidence_score: float = 0.5
    logic_score: float = 0.5
    importance_score: float = 0.5


@dataclass
class ValueTag:
    """Tag for values associated with a belief."""
    belief_id: str
    value_type: str  # "supporting" or "opposing"
    value_name: str
    is_advertised: bool = True  # Advertised vs actual motivation


@dataclass
class InterestTag:
    """Tag for interests and motivations."""
    belief_id: str
    interest_type: str  # "supporter" or "opponent"
    stakeholder: str
    motivation: str


@dataclass
class AssumptionTag:
    """Tag for foundational assumptions."""
    belief_id: str
    assumption_type: str  # "required_to_accept" or "required_to_reject"
    assumption: str


@dataclass
class BeliefNetwork:
    """
    Complete network of beliefs with all relationships and tags.
    """
    beliefs: Dict[str, BeliefTag] = field(default_factory=dict)
    relationships: List[RelationshipTag] = field(default_factory=list)
    evidence: List[EvidenceTag] = field(default_factory=list)
    arguments: List[ArgumentTag] = field(default_factory=list)
    values: List[ValueTag] = field(default_factory=list)
    interests: List[InterestTag] = field(default_factory=list)
    assumptions: List[AssumptionTag] = field(default_factory=list)

    def get_belief(self, belief_id: str) -> Optional[BeliefTag]:
        """Get a belief by ID."""
        return self.beliefs.get(belief_id)

    def get_supporting_relationships(self, belief_id: str) -> List[RelationshipTag]:
        """Get all relationships where beliefs support this belief."""
        return [r for r in self.relationships
                if r.to_belief_id == belief_id and r.relationship_type == "SUPPORTS"]

    def get_opposing_relationships(self, belief_id: str) -> List[RelationshipTag]:
        """Get all relationships where beliefs oppose this belief."""
        return [r for r in self.relationships
                if r.to_belief_id == belief_id and r.relationship_type == "OPPOSES"]

    def calculate_belief_score(self, belief_id: str) -> float:
        """
        Calculate overall belief score based on supporting/opposing relationships.

        Returns a score from 0-100 where:
        - 0-20: Likely False
        - 20-40: Weakly Supported
        - 40-60: Contested
        - 60-80: Moderately Supported
        - 80-100: Strongly Supported
        """
        supporting = self.get_supporting_relationships(belief_id)
        opposing = self.get_opposing_relationships(belief_id)

        # Calculate weighted contributions
        support_contribution = sum(r.overall_contribution for r in supporting)
        oppose_contribution = sum(r.overall_contribution for r in opposing)

        # Base score of 50 (neutral)
        base_score = 50

        # Add/subtract contributions (each relationship can contribute up to ±10 points)
        total_score = base_score + (support_contribution * 10) - (oppose_contribution * 10)

        # Clamp to 0-100 range
        return max(0, min(100, total_score))


# ============================================================================
# XML PARSER
# ============================================================================

class BeliefXMLParser:
    """Parse XML files containing belief data."""

    def __init__(self):
        self.network = BeliefNetwork()

    def parse_file(self, xml_file: str) -> BeliefNetwork:
        """Parse an XML file and extract all belief data."""
        tree = etree.parse(xml_file)
        root = tree.getroot()

        # Parse beliefs
        for belief_elem in root.findall('.//Belief'):
            self._parse_belief(belief_elem)

        # Parse arguments/links
        for arg_elem in root.findall('.//SupportingArgument'):
            self._parse_supporting_argument(arg_elem)

        for arg_elem in root.findall('.//WeakeningArgument'):
            self._parse_weakening_argument(arg_elem)

        # Parse explicit links
        for link_elem in root.findall('.//Link'):
            self._parse_link(link_elem)

        # Calculate all contribution scores
        for relationship in self.network.relationships:
            relationship.calculate_overall_contribution()

        return self.network

    def _parse_belief(self, elem):
        """Parse a single belief element."""
        belief_id = elem.findtext('BeliefID') or elem.get('id') or elem.get('slug')
        if not belief_id:
            # Generate ID from statement
            statement = elem.findtext('Statement') or elem.findtext('Title') or ""
            belief_id = self._generate_id(statement)

        statement = elem.findtext('Statement') or elem.findtext('Title') or ""
        category = elem.findtext('Category') or "other"
        description = elem.findtext('Description') or ""

        belief = BeliefTag(
            text_id=belief_id,
            statement=statement,
            category=category,
            description=description,
            created=elem.findtext('Meta/Created') or elem.findtext('Created') or "",
            updated=elem.findtext('Meta/Updated') or elem.findtext('Updated') or ""
        )

        self.network.beliefs[belief_id] = belief

    def _parse_supporting_argument(self, elem):
        """Parse a supporting argument (creates a relationship)."""
        conclusion_id = elem.findtext('ConclusionID')
        supporting_id = elem.findtext('SupportingArgumentID')
        linkage_score = float(elem.findtext('LinkageScore') or 50) / 100

        if conclusion_id and supporting_id:
            relationship = RelationshipTag(
                from_belief_id=supporting_id,
                to_belief_id=conclusion_id,
                relationship_type="SUPPORTS",
                linkage_score=linkage_score
            )
            self.network.relationships.append(relationship)

    def _parse_weakening_argument(self, elem):
        """Parse a weakening argument (creates an opposing relationship)."""
        conclusion_id = elem.findtext('ConclusionID')
        weakening_id = elem.findtext('WeakeningArgumentID')
        linkage_score = float(elem.findtext('LinkageScore') or 50) / 100

        if conclusion_id and weakening_id:
            relationship = RelationshipTag(
                from_belief_id=weakening_id,
                to_belief_id=conclusion_id,
                relationship_type="OPPOSES",
                linkage_score=linkage_score
            )
            self.network.relationships.append(relationship)

    def _parse_link(self, elem):
        """Parse an explicit link element."""
        from_id = elem.findtext('IfThisBeliefWereTrueID')
        to_id = elem.findtext('AffectedBeliefID')
        link_type = elem.findtext('LinkType') or "Supporting"
        justification = elem.findtext('JustificationText') or ""

        if from_id and to_id:
            relationship = RelationshipTag(
                from_belief_id=from_id,
                to_belief_id=to_id,
                relationship_type="SUPPORTS" if link_type == "Supporting" else "OPPOSES",
                justification=justification
            )
            self.network.relationships.append(relationship)

    @staticmethod
    def _generate_id(text: str) -> str:
        """Generate a unique ID from text."""
        return hashlib.sha1(text.encode()).hexdigest()[:12]


# ============================================================================
# HTML TEMPLATE GENERATOR
# ============================================================================

class BeliefTemplateGenerator:
    """Generate HTML pages for beliefs using the standard template."""

    def __init__(self, network: BeliefNetwork):
        self.network = network

    def generate_belief_page(self, belief_id: str, output_file: str):
        """Generate a complete HTML page for a belief."""
        belief = self.network.get_belief(belief_id)
        if not belief:
            raise ValueError(f"Belief {belief_id} not found")

        # Calculate score
        score = self.network.calculate_belief_score(belief_id)

        # Generate HTML
        html = self._generate_html(belief, score)

        # Write to file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)

        print(f"✅ Generated belief page: {output_file}")

    def _generate_html(self, belief: BeliefTag, score: float) -> str:
        """Generate the complete HTML for a belief."""
        # Get relationships
        supporting = self.network.get_supporting_relationships(belief.text_id)
        opposing = self.network.get_opposing_relationships(belief.text_id)

        # Generate metadata comments
        uid = hashlib.sha1(belief.statement.encode()).hexdigest()
        current_time = int(time.time())

        html = f"""<!-- page={belief.statement} -->
<!-- uid={uid} -->
<!-- time={current_time} -->
<!-- ip=127.0.0.1 -->
<!-- content-type=text/html -->
<!-- name=System -->
<!-- email=system@ideastockexchange.com -->
<p><span style="font-family:'Segoe UI', 'Lucida Grande', Arial, sans-serif;font-size:20px;font-weight:bold;">Belief Analysis Template</span></p>
<p><strong>Score:</strong> {score:.1f}/100 ({self._get_score_interpretation(score)})<br />
<strong><a href="/w/page/159323433/One%20Page%20Per%20Topic">Topic</a>:</strong> {belief.category}</p>
<p><em>This template structures every belief page in the Idea Stock Exchange. Each section helps build a complete analysis from multiple angles. <a href="https://github.com/myklob/ideastockexchange">View the full technical documentation on GitHub</a>.</em></p>

<h2>🔬 <a href="/w/page/159353568/Evidence">Best Evidence</a></h2>
<table border="0"><thead><tr><th><strong>✅ Top Supporting Evidence</strong></th><th><strong>❌ Top Weakening</strong></th>
</tr></thead><tbody><tr><td><strong>Tier 1:</strong> Peer-reviewed studies, official data<br /></td>
<td>&nbsp;<br /></td>
</tr><tr><td><strong>Tier 2:</strong> Expert analysis, institutional reports</td>
<td>&nbsp;</td>
</tr><tr><td><strong>Tier 3</strong>: Investigative journalism, surveys</td>
<td>&nbsp;</td>
</tr><tr><td><strong>Tier 4</strong>: Opinion pieces, anecdotal claims</td>
<td>&nbsp;</td>
</tr></tbody></table>

<h2>🔍 <a href="/Reasons">Argument Trees</a></h2>
<table border="0"><thead><tr><th><strong>✅ Top Reasons to Agree</strong></th><th><strong>❌ Top Reasons to Disagree</strong></th>
</tr></thead><tbody>
{self._generate_argument_rows(supporting, opposing)}
</tbody></table>
<p>Each reason links to its own belief page with full analysis. Each reason is a belief with its own page of pros/cons, counterarguments, and rebuttals. Each argument is scored by the <a href="/w/page/21960078/truth">truth</a>, <a href="/w/page/159338766/Linkage%20Scores">linkage</a>, and importance of their linked pro/con sub-arguments. This recursive scoring means strong reasoning rises naturally while weak arguments fade.</p>

<h2>⚖️ <strong><a href="/w/page/21956745/American%20values">Core Values Conflict</a></strong></h2>
<table border="0"><thead><tr><th><strong>Supporting <a href="/w/page/21956745/American%20values">Values</a></strong></th><th><strong>Opposing Values</strong></th>
</tr></thead><tbody><tr><td><strong>Advertised:</strong>&nbsp;</td>
<td><strong>Advertised:</strong>&nbsp;</td>
</tr><tr><td>1.</td>
<td>1.</td>
</tr><tr><td><strong>Actual:</strong>&nbsp;</td>
<td><strong>Actual:</strong>&nbsp;</td>
</tr><tr><td>1.</td>
<td>1.</td>
</tr></tbody></table>

<h2>💡 <a href="/w/page/159301140/Interests">Interest & Motivations</a></h2>
<table border="0"><thead><tr><th><strong>Supporters</strong></th><th><strong>Opponents</strong></th>
</tr></thead><tbody><tr><td>1.&nbsp;</td>
<td>1.&nbsp;</td>
</tr><tr><td>2.&nbsp;</td>
<td>2.&nbsp;</td>
</tr><tr><td>3.</td>
<td>3.&nbsp;</td>
</tr></tbody></table>

<h2>🔗 <a href="/w/page/159301140/Interests">Shared and Conflicting Interests</a></h2>
<table border="0"><thead><tr><th><strong>Shared Interests</strong></th><th><strong>Conflicting Interests</strong></th>
</tr></thead><tbody><tr><td>1.&nbsp;</td>
<td>1.&nbsp;</td>
</tr><tr><td>2.&nbsp;</td>
<td>2.&nbsp;</td>
</tr></tbody></table>

<h2>📜 <a href="/Assumptions">Foundational Assumptions</a></h2>
<table border="0"><thead><tr><th><strong>Required to Accept This Belief</strong></th><th><strong>Required to Reject This Belief</strong></th>
</tr></thead><tbody><tr><td>1.&nbsp;</td>
<td>1.&nbsp;</td>
</tr><tr><td>2.&nbsp;</td>
<td>2.&nbsp;</td>
</tr></tbody></table>

<h2>🔬 <a href="/w/page/159351732/Objective%20criteria%20scores">Top Objective Criteria For Measuring the Strength of this Belief</a></h2>
<table border="0"><thead><tr><th><strong>🧪 Top Objective Criteria</strong></th>
</tr></thead><tbody><tr><td>1.&nbsp;</td>
</tr><tr><td>2.&nbsp;</td>
</tr><tr><td>3.&nbsp;</td>
</tr></tbody></table>

<h2>📉 <a href="/w/page/156187122/cost-benefit%20analysis">Cost-Benefit Analysis</a></h2>
<table border="0"><thead><tr><th><strong>📕 Potential Benefits</strong></th><th><strong>📘 Potential Costs</strong></th>
</tr></thead><tbody><tr><td>1. What improvements would this create?</td>
<td>1. What problems would this create?</td>
</tr><tr><td>2. Who gains and by how much?</td>
<td>2. Who loses and by how much?</td>
</tr><tr><td>3. What positive externalities?</td>
<td>3. What negative externalities?</td>
</tr></tbody></table>

<h2>🎯 Short vs. Long-Term Impacts</h2>
<table border="0"><thead><tr><th><strong>Short-Term</strong></th><th><strong>Long-Term</strong></th>
</tr></thead><tbody><tr><td>1. Immediate effects (0-2 years)</td>
<td>1. Sustained effects (5+ years)</td>
</tr><tr><td>2. Transition costs</td>
<td>2. Structural changes</td>
</tr></tbody></table>

<h2>🤝 <a href="/w/page/162560439/Compromise">Best Compromise Solutions</a></h2>
<table border="0"><thead><tr><th><strong>Solutions Addressing Core Concerns</strong></th>
</tr></thead><tbody><tr><td>1. How could we address both sides' core interests?</td>
</tr><tr><td>2. What creative solutions haven't been tried?</td>
</tr><tr><td>3. What partial implementations could test ideas?</td>
</tr></tbody></table>

<h2>🚧 <a href="/w/page/162560430/Obstacles%20to%20Resolution">Primary Obstacles to Resolution</a></h2>
<table border="0"><thead><tr><th><strong>Barriers to Supporter Honesty/Compromise</strong></th><th><strong>Barriers to Opposition Honesty/Compromise</strong></th>
</tr></thead><tbody><tr><td>1. What prevents supporters from acknowledging costs?</td>
<td>1. What prevents opponents from acknowledging benefits?</td>
</tr><tr><td>2. What incentives reward extreme positions?</td>
<td>2. What incentives reward extreme positions?</td>
</tr></tbody></table>

<h2>🧠 <a href="/w/page/21956934/bias">Biases</a></h2>
<table border="0"><thead><tr><th><strong>Affecting Supporters</strong></th><th><strong>Affecting Opponents</strong></th>
</tr></thead><tbody><tr><td>1. Confirmation bias toward supporting evidence?</td>
<td>1. Confirmation bias toward opposing evidence?</td>
</tr><tr><td>2. Motivated reasoning to defend tribal position?</td>
<td>2. Motivated reasoning to defend tribal position?</td>
</tr><tr><td>3. Availability heuristic from vivid examples?</td>
<td>3. Availability heuristic from vivid examples?</td>
</tr></tbody></table>

<h2>📚 <a href="/w/page/21958666/media">Media Resources</a></h2>
<table border="0"><thead><tr><th><strong>📈 Supporting</strong></th><th><strong>📉 Opposing</strong></th>
</tr></thead><tbody><tr><td><a href="/w/page/21956965/Books">Books</a></td>
<td><a href="/w/page/21956965/Books">Books</a></td>
</tr><tr><td>1.</td>
<td>1.</td>
</tr><tr><td>Articles</td>
<td>Articles</td>
</tr><tr><td>1.</td>
<td>1.</td>
</tr><tr><td><a href="/Podcasts">Podcasts</a></td>
<td><a href="/Podcasts">Podcasts</a></td>
</tr><tr><td>1.</td>
<td>1.</td>
</tr><tr><td><a href="/w/page/21958801/Movies">Movies</a></td>
<td><a href="/w/page/21958801/Movies">Movies</a></td>
</tr><tr><td>1.</td>
<td>1.</td>
</tr><tr><td><a href="/w/page/159557370/Songs%20that%20agree">Songs</a></td>
<td><a href="/w/page/159557370/Songs%20that%20agree">Songs</a></td>
</tr><tr><td>1.</td>
<td>1.</td>
</tr></tbody></table>

<h2>⚖️ <a href="/w/page/159554427/Local%2C%20federal%2C%20and%20international%20laws%20that%20agree">Legal Framework</a></h2>
<table border="0"><thead><tr><th><strong><a href="/w/page/159554427/Local%2C%20federal%2C%20and%20international%20laws%20that%20agree">Supporting Laws</a></strong></th><th><strong><a href="/w/page/159554427/Local%2C%20federal%2C%20and%20international%20laws%20that%20agree">Contradicting Laws</a></strong></th>
</tr></thead><tbody><tr><td>1. Local, state, federal laws that support this</td>
<td>1. Local, state, federal laws that contradict this</td>
</tr><tr><td>2. International treaties or conventions</td>
<td>2. International treaties or conventions</td>
</tr></tbody></table>

<h2>🧭 <a href="/w/page/162560445/Belief%20Sorting">General to Specific Belief Mapping</a></h2>
<h3>🔹 Most General (Upstream)</h3>
<table border="0"><thead><tr><th><strong>Support</strong></th><th><strong>Oppose</strong></th>
</tr></thead><tbody><tr><td>1. Broader principles that, if true, would support this belief</td>
<td>1. Broader principles that, if true, would oppose this belief</td>
</tr></tbody></table>
<h3>🔹 More Specific (Downstream)</h3>
<table border="0"><thead><tr><th><strong>Support</strong></th><th><strong>Oppose</strong></th>
</tr></thead><tbody><tr><td>1. More specific claims that depend on this belief being true</td>
<td>1. More specific claims that depend on this belief being false</td>
</tr></tbody></table>

<h2>🔄 <a href="/w/page/21957126/combine%20similar%20beliefs">Similar Beliefs</a></h2>
<table border="0"><thead><tr><th><strong>More Extreme Versions</strong></th><th><strong>More Moderate Versions</strong></th>
</tr></thead><tbody><tr><td>1.&nbsp;</td>
<td>1.&nbsp;</td>
</tr><tr><td>2.</td>
<td>2.</td>
</tr></tbody></table>

<p><span style="font-family:'Segoe UI', 'Lucida Grande', Arial, sans-serif;font-size:17px;font-weight:bold;">📬 Contribute</span></p>
<p><strong><a href="/w/page/160433328/Contact%20Me">Contact me</a></strong> to contribute to the Idea Stock Exchange.</p>
<p><strong><a href="https://github.com/myklob/ideastockexchange">View the full codebase and technical documentation on GitHub</a></strong> to understand the scoring algorithms, contribute to development, or adapt this system for your own use.</p>
<p><strong>Start by exploring how we:</strong></p>
<ul><li>Calculate <a href="/w/page/159333015/Argument%20scores%20from%20sub-argument%20scores">argument scores from sub-arguments</a></li>
<li>Measure <a href="/w/page/21960078/truth">truth</a> and <a href="/w/page/159353568/Evidence">evidence quality</a></li>
<li>Apply <a href="/w/page/159338766/Linkage%20Scores">linkage scores</a> to weight relevance</li>
<li>Implement <a href="/w/page/159300543/ReasonRank">ReasonRank</a> for quality-based sorting</li>
</ul>
<p><em>This template provides the structure. Your contributions provide the content. Together, we build humanity's knowledge infrastructure for better decisions.</em></p>
"""
        return html

    def _generate_argument_rows(self, supporting: List[RelationshipTag],
                                opposing: List[RelationshipTag]) -> str:
        """Generate table rows for arguments."""
        # Sort by contribution score
        supporting_sorted = sorted(supporting, key=lambda r: r.overall_contribution, reverse=True)
        opposing_sorted = sorted(opposing, key=lambda r: r.overall_contribution, reverse=True)

        # Get top 10 from each
        max_rows = max(len(supporting_sorted[:10]), len(opposing_sorted[:10]), 1)

        rows = []
        for i in range(max_rows):
            sup_belief = ""
            opp_belief = ""

            if i < len(supporting_sorted):
                rel = supporting_sorted[i]
                belief = self.network.get_belief(rel.from_belief_id)
                if belief:
                    score_pct = int(rel.overall_contribution * 100)
                    sup_belief = f'<a href="/belief/{belief.text_id}">{belief.statement}</a> (Score: {score_pct}%)'

            if i < len(opposing_sorted):
                rel = opposing_sorted[i]
                belief = self.network.get_belief(rel.from_belief_id)
                if belief:
                    score_pct = int(rel.overall_contribution * 100)
                    opp_belief = f'<a href="/belief/{belief.text_id}">{belief.statement}</a> (Score: {score_pct}%)'

            rows.append(f"<tr><td>{i+1}. {sup_belief}</td><td>{i+1}. {opp_belief}</td></tr>")

        return "\n".join(rows)

    @staticmethod
    def _get_score_interpretation(score: float) -> str:
        """Get human-readable interpretation of score."""
        if score >= 80:
            return "Strongly Supported"
        elif score >= 60:
            return "Moderately Supported"
        elif score >= 40:
            return "Contested"
        elif score >= 20:
            return "Weakly Supported"
        else:
            return "Likely False"


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Transform XML belief data into HTML template format'
    )
    parser.add_argument(
        '-i', '--input',
        required=True,
        help='Input XML file containing belief data'
    )
    parser.add_argument(
        '-o', '--output-dir',
        default='output/beliefs',
        help='Output directory for generated HTML files'
    )
    parser.add_argument(
        '-b', '--belief-id',
        help='Specific belief ID to generate (if not provided, generates all)'
    )

    args = parser.parse_args()

    # Ensure output directory exists
    os.makedirs(args.output_dir, exist_ok=True)

    # Parse XML file
    print(f"📖 Parsing XML file: {args.input}")
    xml_parser = BeliefXMLParser()
    network = xml_parser.parse_file(args.input)

    print(f"✅ Parsed {len(network.beliefs)} beliefs")
    print(f"✅ Parsed {len(network.relationships)} relationships")

    # Generate HTML
    generator = BeliefTemplateGenerator(network)

    if args.belief_id:
        # Generate single belief
        output_file = os.path.join(args.output_dir, f"{args.belief_id}.html")
        generator.generate_belief_page(args.belief_id, output_file)
    else:
        # Generate all beliefs
        for belief_id in network.beliefs:
            output_file = os.path.join(args.output_dir, f"{belief_id}.html")
            generator.generate_belief_page(belief_id, output_file)

    print(f"\n✅ Transformation complete! Output in: {args.output_dir}")


if __name__ == "__main__":
    main()
