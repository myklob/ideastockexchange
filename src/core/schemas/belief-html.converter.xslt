<?xml version="1.0" encoding="UTF-8"?>
<!-- Renders a BeliefAnalysis document (belief-data.schema.xsd) to HTML.
     The XML is the source of truth; this output is a render, never edited.
     Worked example input: belief-outline-data.xml. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/BeliefAnalysis">
    <html>
        <head>
            <style>
                .belief {
                    margin-bottom: 20px;
                }
                .table-container {
                    display: flex;
                    flex-wrap: wrap;
                }
                .belief-table {
                    flex: 1;
                    min-width: 300px;
                    border-collapse: collapse;
                    margin-right: 10px;
                    margin-bottom: 10px;
                }
                .belief-table th, .belief-table td {
                    border: 1px solid black;
                    padding: 5px;
                }
                .status-confirmed { color: #7f1d1d; font-weight: bold; }
                .status-rejected { color: #4b5563; }
                .status-open { color: #92400e; }
                .tier-T0 { color: #7f1d1d; font-weight: bold; text-decoration: line-through; }
                .tier-history { font-size: 0.85em; color: #6b7280; }
                .grounding-chip { display: inline-block; padding: 2px 8px; border: 1px solid #9ca3af; border-radius: 4px; font-size: 0.85em; }
                .grounding-unfounded { background: #f8d7da; }
                .grounding-thin { background: #fff3cd; }
                .grounding-grounded { background: #d9f0d1; }
                .grounding-well-grounded { background: #d4edda; }
                .ranking-note { font-size: 0.9em; color: #374151; max-width: 60em; }
            </style>
        </head>
        <body>
            <!-- Evidence-Based Ranking: the front page of this document.
                 Ordered by GroundingScore — engine-computed contact with
                 tiered evidence. There is no engagement column in the data,
                 so there is nothing else to rank by: the only way up this
                 table is better evidence. -->
            <h4>🏛️ Evidence-Based Ranking</h4>
            <p class="ranking-note">
                Ranked by how much each claim&#8217;s argument tree bottoms out in
                tiered evidence (grounding = raw / (raw + 1)). Unfounded claims sit
                at the bottom no matter how engaging their phrasing is; a citation
                ring grounds nothing.
            </p>
            <table class="belief-table" style="width:100%">
                <tr>
                    <th>#</th>
                    <th>Belief</th>
                    <th>Grounding</th>
                    <th>Band</th>
                    <th>Truth</th>
                </tr>
                <xsl:for-each select="Beliefs/Belief">
                    <xsl:sort select="GroundingScore" data-type="number" order="descending"/>
                    <xsl:sort select="TruthScore" data-type="number" order="descending"/>
                    <tr>
                        <td><xsl:value-of select="position()"/></td>
                        <td><xsl:value-of select="Statement"/></td>
                        <td><xsl:value-of select="GroundingScore"/></td>
                        <td>
                            <span class="grounding-chip grounding-{GroundingBand}">
                                <xsl:value-of select="GroundingBand"/>
                            </span>
                        </td>
                        <td><xsl:value-of select="TruthScore"/></td>
                    </tr>
                </xsl:for-each>
            </table>

            <xsl:for-each select="Beliefs/Belief">
                <div class="belief">
                    <h3><xsl:value-of select="Statement"/></h3>
                    <xsl:if test="GroundingScore">
                        <p>
                            <span class="grounding-chip grounding-{GroundingBand}">
                                <xsl:text>Grounding: </xsl:text>
                                <xsl:value-of select="GroundingScore"/>
                                <xsl:text> (</xsl:text>
                                <xsl:value-of select="GroundingBand"/>
                                <xsl:text>)</xsl:text>
                            </span>
                        </p>
                    </xsl:if>

                    <!-- Definitions Table -->
                    <xsl:if test="Definitions/Definition">
                        <h4>📖 Definitions</h4>
                        <table class="belief-table" style="width:100%">
                            <tr>
                                <th style="width:30%">Term</th>
                                <th style="width:70%">Definition Used in This Analysis</th>
                            </tr>
                            <xsl:for-each select="Definitions/Definition">
                                <tr>
                                    <td><xsl:value-of select="Term"/></td>
                                    <td><xsl:value-of select="Definition"/></td>
                                </tr>
                            </xsl:for-each>
                        </table>
                    </xsl:if>

                    <!-- Falsifiability Test -->
                    <xsl:if test="Falsifiability">
                        <h4>🔬 Falsifiability Test</h4>
                        <p><xsl:value-of select="Falsifiability"/></p>
                    </xsl:if>

                    <!-- Testable Predictions Table -->
                    <xsl:if test="TestablePredictions/Prediction">
                        <h4>🔮 Testable Predictions</h4>
                        <table class="belief-table" style="width:100%">
                            <tr>
                                <th>Prediction</th>
                                <th>Timeframe</th>
                                <th>Verification Method</th>
                            </tr>
                            <xsl:for-each select="TestablePredictions/Prediction">
                                <tr>
                                    <td><xsl:value-of select="Statement"/></td>
                                    <td><xsl:value-of select="Timeframe"/></td>
                                    <td><xsl:value-of select="VerificationMethod"/></td>
                                </tr>
                            </xsl:for-each>
                        </table>
                    </xsl:if>

                    <div class="table-container">
                        <!-- Reasons to Agree Table -->
                        <xsl:if test="/BeliefAnalysis/Arguments/SupportingArgument[ConclusionID=current()/BeliefID]">
                            <table class="belief-table">
                                <caption>Reasons to Agree</caption>
                                <tr>
                                    <th>Statement</th>
                                    <th>Impact</th>
                                    <th>Linkage</th>
                                    <th>Uniqueness</th>
                                </tr>
                                <xsl:for-each select="/BeliefAnalysis/Arguments/SupportingArgument[ConclusionID=current()/BeliefID]">
                                    <xsl:sort select="PropagatedScore" data-type="number" order="descending"/>
                                    <xsl:variable name="argID" select="SupportingArgumentID"/>
                                    <xsl:variable name="linkedBelief" select="/BeliefAnalysis/Beliefs/Belief[BeliefID = $argID]"/>
                                    <tr>
                                        <td><xsl:value-of select="$linkedBelief/Statement"/></td>
                                        <td><xsl:value-of select="PropagatedScore"/></td>
                                        <td><xsl:value-of select="LinkageScore"/></td>
                                        <td><xsl:value-of select="UniquenessScore"/></td>
                                    </tr>
                                </xsl:for-each>
                            </table>
                        </xsl:if>

                        <!-- Reasons to Disagree Table -->
                        <xsl:if test="/BeliefAnalysis/Arguments/WeakeningArgument[ConclusionID=current()/BeliefID]">
                            <table class="belief-table">
                                <caption>Reasons to Disagree</caption>
                                <tr>
                                    <th>Statement</th>
                                    <th>Impact</th>
                                    <th>Linkage</th>
                                    <th>Uniqueness</th>
                                </tr>
                                <xsl:for-each select="/BeliefAnalysis/Arguments/WeakeningArgument[ConclusionID=current()/BeliefID]">
                                    <xsl:sort select="PropagatedScore" data-type="number" order="descending"/>
                                    <xsl:variable name="argID" select="WeakeningArgumentID"/>
                                    <xsl:variable name="linkedBelief" select="/BeliefAnalysis/Beliefs/Belief[BeliefID = $argID]"/>
                                    <tr>
                                        <td><xsl:value-of select="$linkedBelief/Statement"/></td>
                                        <td><xsl:value-of select="PropagatedScore"/></td>
                                        <td><xsl:value-of select="LinkageScore"/></td>
                                        <td><xsl:value-of select="UniquenessScore"/></td>
                                    </tr>
                                </xsl:for-each>
                            </table>
                        </xsl:if>
                    </div>

                    <!-- Evidence Ledger: the sources this conclusion rests
                         on, score-ranked. A retracted source (tier T0)
                         stays visible with its tier history, so readers
                         see why dependent scores moved. -->
                    <xsl:if test="/BeliefAnalysis/EvidenceRecords/EvidenceRecord[BeliefID=current()/BeliefID]">
                        <h4>📊 Evidence Ledger</h4>
                        <table class="belief-table" style="width:100%">
                            <tr>
                                <th>Evidence</th>
                                <th>Side</th>
                                <th>Tier</th>
                                <th>EVS</th>
                                <th>Linkage</th>
                                <th>Impact</th>
                                <th>Tier History</th>
                            </tr>
                            <xsl:for-each select="/BeliefAnalysis/EvidenceRecords/EvidenceRecord[BeliefID=current()/BeliefID]">
                                <xsl:sort select="ImpactScore" data-type="number" order="descending"/>
                                <tr>
                                    <td><xsl:value-of select="Description"/></td>
                                    <td><xsl:value-of select="Side"/></td>
                                    <td>
                                        <span class="tier-{Tier}"><xsl:value-of select="Tier"/></span>
                                    </td>
                                    <td><xsl:value-of select="EVS"/></td>
                                    <td><xsl:value-of select="LinkageScore"/></td>
                                    <td><xsl:value-of select="ImpactScore"/></td>
                                    <td class="tier-history">
                                        <xsl:for-each select="TierHistory/TierChange">
                                            <xsl:value-of select="FromTier"/>
                                            <xsl:text> &#8594; </xsl:text>
                                            <xsl:value-of select="ToTier"/>
                                            <xsl:text>: </xsl:text>
                                            <xsl:value-of select="Reason"/>
                                        </xsl:for-each>
                                    </td>
                                </tr>
                            </xsl:for-each>
                        </table>
                    </xsl:if>

                    <!-- Fallacy Claims against this belief's argument edges.
                         An accusation is an argument: it shows its full
                         template and its consensus state. Only "confirmed"
                         claims have touched any score. -->
                    <xsl:if test="/BeliefAnalysis/FallacyClaims/FallacyClaim[TargetConclusionID=current()/BeliefID]">
                        <h4>⚖️ Fallacy Claims</h4>
                        <table class="belief-table" style="width:100%">
                            <tr>
                                <th>Type</th>
                                <th>Quoted Text</th>
                                <th>What&#8217;s Missing</th>
                                <th>Status</th>
                                <th>Consensus</th>
                            </tr>
                            <xsl:for-each select="/BeliefAnalysis/FallacyClaims/FallacyClaim[TargetConclusionID=current()/BeliefID]">
                                <tr>
                                    <td>
                                        <xsl:value-of select="FallacyType"/>
                                        <xsl:text> (</xsl:text>
                                        <xsl:value-of select="Severity"/>
                                        <xsl:text> &#8594; </xsl:text>
                                        <xsl:value-of select="TargetFactor"/>
                                        <xsl:text>)</xsl:text>
                                    </td>
                                    <td><xsl:value-of select="QuotedText"/></td>
                                    <td><xsl:value-of select="MissingElements"/></td>
                                    <td>
                                        <span class="status-{Status}"><xsl:value-of select="Status"/></span>
                                    </td>
                                    <td><xsl:value-of select="Consensus"/></td>
                                </tr>
                            </xsl:for-each>
                        </table>
                    </xsl:if>
                </div>
            </xsl:for-each>

            <!-- Grouped restatements: same claim, different words, settled
                 by community vote. Grouped rows are priced by the
                 uniqueness discount instead of counting twice. -->
            <xsl:if test="GroupingCandidates/Candidate">
                <h4>🔗 Grouping Candidates</h4>
                <table class="belief-table" style="width:100%">
                    <tr>
                        <th>New Argument</th>
                        <th>Existing Argument</th>
                        <th>Similarity</th>
                        <th>Band</th>
                        <th>Status</th>
                        <th>Consensus</th>
                    </tr>
                    <xsl:for-each select="GroupingCandidates/Candidate">
                        <tr>
                            <td><xsl:value-of select="NewArgumentID"/></td>
                            <td><xsl:value-of select="ExistingArgumentID"/></td>
                            <td><xsl:value-of select="Similarity"/></td>
                            <td><xsl:value-of select="Band"/></td>
                            <td><xsl:value-of select="Status"/></td>
                            <td><xsl:value-of select="Consensus"/></td>
                        </tr>
                    </xsl:for-each>
                </table>
            </xsl:if>
        </body>
    </html>
</xsl:template>

</xsl:stylesheet>
