"""
XML/XSLT Generator for HTML Rendering.

Generates XML files that represent the full argument tree for a specific topic.
Includes an XSLT stylesheet that transforms the XML into the standardized
ISE HTML format (two-column Pro/Con table).
"""

from __future__ import annotations

from pathlib import Path
from xml.sax.saxutils import escape as _escape

from pipeline.config import PipelineConfig
from pipeline.models.belief_node import ArgumentTree, BeliefNode


def escape(value) -> str:
    """Safely escape a value for XML, handling None and non-string types."""
    if value is None:
        return ""
    return _escape(str(value))


class XmlGenerator:
    """Generate XML and XSLT files from an ArgumentTree."""

    def __init__(self, config: PipelineConfig):
        self.config = config

    def generate(self, tree: ArgumentTree) -> dict[str, str]:
        """
        Generate XML and XSLT files.

        Returns:
            Dict mapping filename -> content.
        """
        files = {}

        # Generate one XML file per root belief
        roots = tree.get_sorted_roots()
        for root in roots:
            safe_id = self._safe_filename(root.belief_id)
            files[f"belief_{safe_id}.xml"] = self._generate_belief_xml(root, tree)

        # Generate a master XML with all beliefs
        files["beliefs_all.xml"] = self._generate_master_xml(tree)

        # Generate the XSLT stylesheet
        files["belief_tree.xslt"] = self._generate_xslt()

        # Generate a lightweight HTML viewer that loads XML + XSLT client-side
        files["viewer.html"] = self._generate_viewer_html()

        return files

    def write(self, tree: ArgumentTree):
        """Generate and write XML/XSLT files to the output directory."""
        files = self.generate(tree)
        out_dir = Path(self.config.xml_output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        for filename, content in files.items():
            filepath = out_dir / filename
            filepath.write_text(content, encoding="utf-8")

    def _generate_belief_xml(self, root: BeliefNode, tree: ArgumentTree) -> str:
        """Generate XML for a single belief's argument tree."""
        lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<?xml-stylesheet type="text/xsl" href="belief_tree.xslt"?>',
            '<BeliefAnalysis>',
        ]

        # Collect all nodes in this subtree
        all_nodes = []
        self._collect_subtree(root.belief_id, tree, all_nodes)

        # Beliefs section
        lines.append('  <Beliefs>')
        for node in all_nodes:
            lines.append('    <Belief>')
            lines.append(f'      <BeliefID>{escape(node.belief_id)}</BeliefID>')
            lines.append(f'      <Statement>{escape(node.statement)}</Statement>')
            lines.append(f'      <Category>{escape(node.category)}</Category>')
            lines.append(f'      <Subcategory>{escape(node.subcategory)}</Subcategory>')
            if node.parent_id:
                lines.append(f'      <ParentID>{escape(node.parent_id)}</ParentID>')
            lines.append(f'      <Side>{escape(node.side)}</Side>')
            lines.append(f'      <TruthScore>{node.truth_score:.4f}</TruthScore>')
            lines.append(f'      <LinkageScore>{node.linkage_score:.4f}</LinkageScore>')
            lines.append(f'      <ImportanceScore>{node.importance_score:.4f}</ImportanceScore>')
            lines.append(f'      <UniquenessScore>{node.uniqueness_score:.4f}</UniquenessScore>')
            lines.append(f'      <ReasonRank>{node.reason_rank:.6f}</ReasonRank>')
            lines.append(f'      <PropagatedScore>{node.propagated_score:.6f}</PropagatedScore>')
            if node.source_url:
                lines.append(f'      <SourceUrl>{escape(node.source_url)}</SourceUrl>')
            lines.append(f'      <EvidenceType>{escape(node.evidence_type)}</EvidenceType>')
            lines.append('    </Belief>')
        lines.append('  </Beliefs>')

        # Arguments section (parent-child relationships)
        lines.append('  <Arguments>')
        for node in all_nodes:
            if node.parent_id:
                tag = "SupportingArgument" if node.side == "supporting" else "WeakeningArgument"
                id_tag = "SupportingArgumentID" if node.side == "supporting" else "WeakeningArgumentID"
                lines.append(f'    <{tag}>')
                lines.append(f'      <ConclusionID>{escape(node.parent_id)}</ConclusionID>')
                lines.append(f'      <{id_tag}>{escape(node.belief_id)}</{id_tag}>')
                lines.append(f'      <LinkageScore>{node.linkage_score:.4f}</LinkageScore>')
                lines.append(f'      <PropagatedScore>{node.propagated_score:.6f}</PropagatedScore>')
                lines.append(f'    </{tag}>')
        lines.append('  </Arguments>')

        # Links section (belief-to-belief relationships)
        lines.append('  <Links>')
        link_id = 1
        for node in all_nodes:
            if node.parent_id:
                link_type = "Supporting" if node.side == "supporting" else "Weakening"
                lines.append('    <Link>')
                lines.append(f'      <LinkID>{link_id}</LinkID>')
                lines.append(f'      <IfThisBeliefWereTrueID>{escape(node.belief_id)}</IfThisBeliefWereTrueID>')
                lines.append(f'      <AffectedBeliefID>{escape(node.parent_id)}</AffectedBeliefID>')
                lines.append(f'      <LinkType>{link_type}</LinkType>')
                lines.append(f'      <JustificationText>{escape(node.statement)}</JustificationText>')
                lines.append('    </Link>')
                link_id += 1
        lines.append('  </Links>')

        lines.append('</BeliefAnalysis>')
        return '\n'.join(lines)

    def _generate_master_xml(self, tree: ArgumentTree) -> str:
        """Generate a master XML with all beliefs in the tree."""
        lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<?xml-stylesheet type="text/xsl" href="belief_tree.xslt"?>',
            '<BeliefAnalysis>',
            '  <Beliefs>',
        ]

        # Sort all nodes: roots first, then children by parent
        for node in tree.nodes.values():
            lines.append('    <Belief>')
            lines.append(f'      <BeliefID>{escape(node.belief_id)}</BeliefID>')
            lines.append(f'      <Statement>{escape(node.statement)}</Statement>')
            lines.append(f'      <Category>{escape(node.category)}</Category>')
            lines.append(f'      <Subcategory>{escape(node.subcategory)}</Subcategory>')
            if node.parent_id:
                lines.append(f'      <ParentID>{escape(node.parent_id)}</ParentID>')
            lines.append(f'      <Side>{escape(node.side)}</Side>')
            lines.append(f'      <TruthScore>{node.truth_score:.4f}</TruthScore>')
            lines.append(f'      <LinkageScore>{node.linkage_score:.4f}</LinkageScore>')
            lines.append(f'      <ImportanceScore>{node.importance_score:.4f}</ImportanceScore>')
            lines.append(f'      <UniquenessScore>{node.uniqueness_score:.4f}</UniquenessScore>')
            lines.append(f'      <ReasonRank>{node.reason_rank:.6f}</ReasonRank>')
            lines.append(f'      <PropagatedScore>{node.propagated_score:.6f}</PropagatedScore>')
            if node.source_url:
                lines.append(f'      <SourceUrl>{escape(node.source_url)}</SourceUrl>')
            lines.append(f'      <EvidenceType>{escape(node.evidence_type)}</EvidenceType>')
            lines.append('    </Belief>')

        lines.append('  </Beliefs>')

        lines.append('  <Arguments>')
        for node in tree.nodes.values():
            if node.parent_id:
                tag = "SupportingArgument" if node.side == "supporting" else "WeakeningArgument"
                id_tag = "SupportingArgumentID" if node.side == "supporting" else "WeakeningArgumentID"
                lines.append(f'    <{tag}>')
                lines.append(f'      <ConclusionID>{escape(node.parent_id)}</ConclusionID>')
                lines.append(f'      <{id_tag}>{escape(node.belief_id)}</{id_tag}>')
                lines.append(f'      <LinkageScore>{node.linkage_score:.4f}</LinkageScore>')
                lines.append(f'      <PropagatedScore>{node.propagated_score:.6f}</PropagatedScore>')
                lines.append(f'    </{tag}>')
        lines.append('  </Arguments>')

        lines.append('  <Links>')
        link_id = 1
        for node in tree.nodes.values():
            if node.parent_id:
                link_type = "Supporting" if node.side == "supporting" else "Weakening"
                lines.append('    <Link>')
                lines.append(f'      <LinkID>{link_id}</LinkID>')
                lines.append(f'      <IfThisBeliefWereTrueID>{escape(node.belief_id)}</IfThisBeliefWereTrueID>')
                lines.append(f'      <AffectedBeliefID>{escape(node.parent_id)}</AffectedBeliefID>')
                lines.append(f'      <LinkType>{link_type}</LinkType>')
                lines.append(f'      <JustificationText>{escape(node.statement)}</JustificationText>')
                lines.append('    </Link>')
                link_id += 1
        lines.append('  </Links>')

        lines.append('</BeliefAnalysis>')
        return '\n'.join(lines)

    def _generate_xslt(self) -> str:
        """Generate the XSLT stylesheet that renders XML into ISE HTML format."""
        return """\
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"
              doctype-system="about:legacy-compat"/>

  <!-- Key for looking up beliefs by ID -->
  <xsl:key name="beliefById" match="//Belief" use="BeliefID"/>

  <!-- Key for looking up supporting arguments by conclusion ID -->
  <xsl:key name="supportingByConclusionId" match="//SupportingArgument" use="ConclusionID"/>

  <!-- Key for looking up weakening arguments by conclusion ID -->
  <xsl:key name="weakeningByConclusionId" match="//WeakeningArgument" use="ConclusionID"/>

  <!-- ═══ Root Template ═══ -->
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>ISE Belief Analysis</title>
        <style>
          :root {
            --ise-pro: #e8f5e9;
            --ise-con: #ffebee;
            --ise-pro-border: #4caf50;
            --ise-con-border: #f44336;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; color: #333;
            max-width: 1400px; margin: 0 auto; padding: 20px; background: #fafafa;
          }
          h1 { margin-bottom: 20px; color: #1a237e; }
          .belief-node {
            border: 1px solid #ddd; border-radius: 8px;
            padding: 12px; margin: 8px 0; background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .belief-header {
            display: flex; justify-content: space-between;
            align-items: center; margin-bottom: 8px;
          }
          .belief-statement { font-weight: 600; flex: 1; }
          .belief-score {
            font-family: monospace; font-size: 0.9em;
            padding: 2px 8px; border-radius: 4px;
            background: #e3f2fd; margin-left: 12px; white-space: nowrap;
          }
          .score-metrics {
            display: flex; gap: 12px; font-size: 0.8em;
            color: #666; margin-bottom: 8px;
          }
          .metric {
            padding: 1px 6px; border-radius: 3px;
            background: #f5f5f5; font-family: monospace;
          }
          .pro-con-table {
            width: 100%; border-collapse: collapse; margin-top: 8px;
          }
          .pro-header {
            background: var(--ise-pro); color: var(--ise-pro-border);
            padding: 8px; font-weight: 600;
            border-bottom: 2px solid var(--ise-pro-border); width: 50%;
          }
          .con-header {
            background: var(--ise-con); color: var(--ise-con-border);
            padding: 8px; font-weight: 600;
            border-bottom: 2px solid var(--ise-con-border); width: 50%;
          }
          .pro-cell {
            vertical-align: top; padding: 4px;
            border-left: 3px solid var(--ise-pro-border);
            background: var(--ise-pro);
          }
          .con-cell {
            vertical-align: top; padding: 4px;
            border-left: 3px solid var(--ise-con-border);
            background: var(--ise-con);
          }
        </style>
      </head>
      <body>
        <h1>ISE Belief Analysis</h1>

        <!-- Render each root belief (no ParentID) -->
        <xsl:for-each select="//Belief[not(ParentID)]">
          <xsl:sort select="PropagatedScore" data-type="number" order="descending"/>
          <xsl:call-template name="renderBeliefNode">
            <xsl:with-param name="beliefId" select="BeliefID"/>
          </xsl:call-template>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>

  <!-- ═══ Belief Node Template ═══ -->
  <xsl:template name="renderBeliefNode">
    <xsl:param name="beliefId"/>
    <xsl:variable name="belief" select="key('beliefById', $beliefId)"/>

    <xsl:if test="$belief">
      <div class="belief-node"
           data-belief-id="{$belief/BeliefID}"
           data-score="{$belief/PropagatedScore}"
           data-truth="{$belief/TruthScore}"
           data-linkage="{$belief/LinkageScore}"
           data-importance="{$belief/ImportanceScore}"
           data-uniqueness="{$belief/UniquenessScore}">

        <!-- Header with statement and score -->
        <div class="belief-header">
          <span class="belief-statement">
            <xsl:value-of select="$belief/Statement"/>
          </span>
          <span class="belief-score">
            <xsl:value-of select="format-number($belief/PropagatedScore, '0.0000')"/>
          </span>
        </div>

        <!-- Score metrics breakdown -->
        <div class="score-metrics">
          <span class="metric">T:<xsl:value-of select="format-number($belief/TruthScore, '0.00')"/></span>
          <span class="metric">L:<xsl:value-of select="format-number($belief/LinkageScore, '0.00')"/></span>
          <span class="metric">I:<xsl:value-of select="format-number($belief/ImportanceScore, '0.00')"/></span>
          <span class="metric">U:<xsl:value-of select="format-number($belief/UniquenessScore, '0.00')"/></span>
        </div>

        <!-- Pro/Con two-column table -->
        <xsl:variable name="supportingArgs" select="key('supportingByConclusionId', $beliefId)"/>
        <xsl:variable name="weakeningArgs" select="key('weakeningByConclusionId', $beliefId)"/>

        <xsl:if test="$supportingArgs or $weakeningArgs">
          <table class="pro-con-table">
            <thead>
              <tr>
                <th class="pro-header">
                  Supporting (<xsl:value-of select="count($supportingArgs)"/>)
                </th>
                <th class="con-header">
                  Weakening (<xsl:value-of select="count($weakeningArgs)"/>)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="pro-cell">
                  <xsl:for-each select="$supportingArgs">
                    <xsl:sort select="PropagatedScore" data-type="number" order="descending"/>
                    <xsl:call-template name="renderBeliefNode">
                      <xsl:with-param name="beliefId" select="SupportingArgumentID"/>
                    </xsl:call-template>
                  </xsl:for-each>
                </td>
                <td class="con-cell">
                  <xsl:for-each select="$weakeningArgs">
                    <xsl:sort select="PropagatedScore" data-type="number" order="descending"/>
                    <xsl:call-template name="renderBeliefNode">
                      <xsl:with-param name="beliefId" select="WeakeningArgumentID"/>
                    </xsl:call-template>
                  </xsl:for-each>
                </td>
              </tr>
            </tbody>
          </table>
        </xsl:if>

      </div>
    </xsl:if>
  </xsl:template>

</xsl:stylesheet>
"""

    def _generate_viewer_html(self) -> str:
        """Generate a client-side HTML viewer that applies XSLT transformation."""
        return """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ISE Belief Analysis Viewer</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1400px; margin: 0 auto; padding: 20px; background: #fafafa;
    }
    .controls {
      margin-bottom: 20px; padding: 16px; background: white;
      border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    select, button {
      padding: 8px 16px; font-size: 1em; border-radius: 4px;
      border: 1px solid #ccc; margin-right: 8px;
    }
    button { background: #1a237e; color: white; border: none; cursor: pointer; }
    button:hover { background: #283593; }
    #output { min-height: 400px; }
  </style>
</head>
<body>
  <h1>ISE Belief Analysis Viewer</h1>
  <div class="controls">
    <label for="xmlFile">Select XML file: </label>
    <select id="xmlFile">
      <option value="beliefs_all.xml">All Beliefs</option>
    </select>
    <button onclick="loadAndTransform()">Load</button>
    <button onclick="exportCsv()">Export as CSV</button>
  </div>
  <div id="output"></div>

  <script>
    async function loadAndTransform() {
      const xmlFile = document.getElementById('xmlFile').value;
      try {
        const [xmlResp, xsltResp] = await Promise.all([
          fetch(xmlFile),
          fetch('belief_tree.xslt')
        ]);
        const xmlText = await xmlResp.text();
        const xsltText = await xsltResp.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const xsltDoc = parser.parseFromString(xsltText, 'text/xml');

        const processor = new XSLTProcessor();
        processor.importStylesheet(xsltDoc);
        const resultDoc = processor.transformToDocument(xmlDoc);

        // Extract just the body content
        const body = resultDoc.querySelector('body');
        document.getElementById('output').innerHTML = body ? body.innerHTML : resultDoc.documentElement.innerHTML;
      } catch (err) {
        document.getElementById('output').innerHTML = '<p style="color:red">Error: ' + err.message + '</p>';
      }
    }

    function exportCsv() {
      const nodes = document.querySelectorAll('.belief-node');
      if (nodes.length === 0) {
        alert('Load a belief tree first.');
        return;
      }

      const rows = [
        ['belief_id', 'statement', 'parent_id', 'side', 'truth_score',
         'linkage_score', 'importance_score', 'uniqueness_score', 'propagated_score']
      ];

      nodes.forEach(node => {
        // Find parent belief-node
        const parentNode = node.parentElement?.closest('.belief-node');
        const parentId = parentNode ? parentNode.dataset.beliefId : '';
        const side = node.closest('.pro-cell') ? 'supporting'
                   : node.closest('.con-cell') ? 'weakening' : '';

        rows.push([
          node.dataset.beliefId || '',
          (node.querySelector('.belief-statement')?.textContent || '').trim(),
          parentId,
          side,
          node.dataset.truth || '',
          node.dataset.linkage || '',
          node.dataset.importance || '',
          node.dataset.uniqueness || '',
          node.dataset.score || ''
        ]);
      });

      const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'beliefs_export.csv';
      a.click();
      URL.revokeObjectURL(url);
    }

    // Auto-load on page open
    loadAndTransform();
  </script>
</body>
</html>
"""

    def _collect_subtree(
        self, belief_id: str, tree: ArgumentTree, result: list[BeliefNode]
    ):
        """Recursively collect all nodes in a subtree."""
        node = tree.nodes.get(belief_id)
        if node is None:
            return
        result.append(node)
        for child in tree.get_sorted_children(belief_id):
            self._collect_subtree(child.belief_id, tree, result)

    def _safe_filename(self, belief_id: str) -> str:
        """Convert a belief ID to a safe filename."""
        import re
        return re.sub(r'[^a-zA-Z0-9_-]', '_', str(belief_id))
