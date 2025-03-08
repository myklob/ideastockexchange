<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:ba="http://example.org/belief-analysis">

	<xsl:output method="html" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>

	<xsl:template match="/ba:BeliefAnalysis">
		<html lang="en">
			<head>
				<meta charset="UTF-8"/>
				<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
				<title>Belief Analysis Dashboard</title>
				<style>
					body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
					h1 { text-align: center; color: #007bff; }
					.belief-container { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 2px 2px 10px rgba(0,0,0,0.1); }
					.belief-header { display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
					.belief-title { font-size: 1.5em; font-weight: bold; color: #333; }
					.belief-category { font-size: 0.9em; color: #666; }
					.tags { margin-top: 5px; font-size: 0.8em; color: #888; }
					.arguments-section { margin-top: 10px; }
					.pro-argument { background: #d4edda; border-left: 5px solid #28a745; padding: 10px; margin-top: 5px; }
					.con-argument { background: #f8d7da; border-left: 5px solid #dc3545; padding: 10px; margin-top: 5px; }
					.evidence { font-size: 0.9em; color: #555; margin-top: 5px; }
					.justification { font-size: 0.9em; font-style: italic; color: #555; margin-top: 10px; }
				</style>
			</head>
			<body>
				<h1>Belief Analysis Dashboard</h1>

				<xsl:apply-templates select="ba:Beliefs/ba:Belief"/>

				<h2>Argument Relationships</h2>
				<xsl:apply-templates select="ba:Links/ba:Link"/>
			</body>
		</html>
	</xsl:template>

	<xsl:template match="ba:Belief">
		<div class="belief-container">
			<div class="belief-header">
				<span class="belief-title">
					<xsl:value-of select="ba:Title"/>
				</span>
				<span class="belief-category">
					Category: <xsl:value-of select="ba:Category"/>
				</span>
			</div>
			<div class="tags">
				Tags:
				<xsl:for-each select="ba:Tags/ba:Tag">
					<span>
						[<xsl:value-of select="."/>]
					</span>
				</xsl:for-each>
			</div>
			<div class="arguments-section">
				<h3>Supporting Arguments</h3>
				<xsl:apply-templates select="/ba:BeliefAnalysis/ba:Arguments/ba:SupportingArgument[ba:ConclusionID=current()/@uuid]"/>

				<h3>Weakening Arguments</h3>
				<xsl:apply-templates select="/ba:BeliefAnalysis/ba:Arguments/ba:WeakeningArgument[ba:ConclusionID=current()/@uuid]"/>
			</div>
		</div>
	</xsl:template>

	<xsl:template match="ba:SupportingArgument">
		<div class="pro-argument">
			<strong>Argument:</strong>
			<xsl:value-of select="/ba:BeliefAnalysis/ba:Arguments/ba:Argument[@uuid=current()/ba:SupportingArgumentID]/ba:Statement"/>
			<br/>
			<span class="evidence">
				<strong>Evidence:</strong>
				<xsl:variable name="evidenceID" select="/ba:BeliefAnalysis/ba:Arguments/ba:Argument[@uuid=current()/ba:SupportingArgumentID]/ba:Evidence"/>
				<xsl:value-of select="$evidenceID/ba:Details"/>
				(<a href="{$evidenceID/ba:Link}">Source</a>)
			</span>
		</div>
	</xsl:template>

	<xsl:template match="ba:WeakeningArgument">
		<div class="con-argument">
			<strong>Argument:</strong>
			<xsl:value-of select="/ba:BeliefAnalysis/ba:Arguments/ba:Argument[@uuid=current()/ba:WeakeningArgumentID]/ba:Statement"/>
			<br/>
			<span class="evidence">
				<strong>Evidence:</strong>
				<xsl:variable name="evidenceID" select="/ba:BeliefAnalysis/ba:Arguments/ba:Argument[@uuid=current()/ba:WeakeningArgumentID]/ba:Evidence"/>
				<xsl:value-of select="$evidenceID/ba:Details"/>
				(<a href="{$evidenceID/ba:Link}">Source</a>)
			</span>
		</div>
	</xsl:template>

	<xsl:template match="ba:Link">
		<div class="justification">
			<strong>Justification:</strong>
			<xsl:value-of select="ba:JustificationText"/>
			<br/>
			<em>Applies if belief: </em>
			<xsl:value-of select="/ba:BeliefAnalysis/ba:Beliefs/ba:Belief[@uuid=current()/ba:IfThisBeliefWereTrueID]/ba:Title"/>
			<em>affects belief:</em>
			<xsl:value-of select="/ba:BeliefAnalysis/ba:Beliefs/ba:Belief[@uuid=current()/ba:AffectedBeliefID]/ba:Title"/>
		</div>
	</xsl:template>

</xsl:stylesheet>
