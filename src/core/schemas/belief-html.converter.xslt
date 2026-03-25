<?xml version="1.0" encoding="UTF-8"?>
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
            </style>
        </head>
        <body>
            <xsl:for-each select="Beliefs/Belief">
                <div class="belief">
                    <h3><xsl:value-of select="Statement"/></h3>

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
                        <xsl:if test="/BeliefAnalysis/Arguments/Argument[ConclusionID=current()/BeliefID and ArgumentType='Supporting']">
                            <table class="belief-table">
                                <caption>Reasons to Agree</caption>
                                <tr>
                                    <th>Statement</th>
                                    <th>Score</th>
                                    <th>Linkage</th>
                                </tr>
                                <xsl:for-each select="/BeliefAnalysis/Arguments/Argument[ConclusionID=current()/BeliefID and ArgumentType='Supporting']">
                                    <xsl:variable name="argID" select="ArgumentID"/>
                                    <xsl:variable name="linkedBelief" select="/BeliefAnalysis/Beliefs/Belief[BeliefID = $argID]"/>
                                    <tr>
                                        <td><xsl:value-of select="$linkedBelief/Statement"/></td>
                                        <td><xsl:value-of select="$linkedBelief/Score"/></td>
                                        <td><xsl:value-of select="LinkageScore"/></td>
                                    </tr>
                                </xsl:for-each>
                            </table>
                        </xsl:if>

                        <!-- Reasons to Disagree Table -->
                        <xsl:if test="/BeliefAnalysis/Arguments/Argument[ConclusionID=current()/BeliefID and ArgumentType='Weakening']">
                            <table class="belief-table">
                                <caption>Reasons to Disagree</caption>
                                <tr>
                                    <th>Statement</th>
                                    <th>Score</th>
                                    <th>Linkage</th>
                                </tr>
                                <xsl:for-each select="/BeliefAnalysis/Arguments/Argument[ConclusionID=current()/BeliefID and ArgumentType='Weakening']">
                                    <xsl:variable name="argID" select="ArgumentID"/>
                                    <xsl:variable name="linkedBelief" select="/BeliefAnalysis/Beliefs/Belief[BeliefID = $argID]"/>
                                    <tr>
                                        <td><xsl:value-of select="$linkedBelief/Statement"/></td>
                                        <td><xsl:value-of select="$linkedBelief/Score"/></td>
                                        <td><xsl:value-of select="LinkageScore"/></td>
                                    </tr>
                                </xsl:for-each>
                            </table>
                        </xsl:if>
                    </div>
                </div>
            </xsl:for-each>
        </body>
    </html>
</xsl:template>

</xsl:stylesheet>
