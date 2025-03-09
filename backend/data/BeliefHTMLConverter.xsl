<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    
    <xsl:output method="html" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>

    <xsl:template match="/BeliefAnalysis">
        <html lang="en">
            <head>
                <meta charset="UTF-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <title>Belief Analysis Dashboard</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        padding: 20px;
                        color: #333;
                    }
                    h1 {
                        color: #007bff;
                        text-align: center;
                    }
                    .belief {
                        background: white;
                        padding: 15px;
                        margin-bottom: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }
                    .belief-title {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    .category {
                        font-size: 1rem;
                        color: #666;
                    }
                    .description {
                        margin-top: 10px;
                    }
                    .tags span {
                        background: #007bff;
                        color: white;
                        padding: 5px 10px;
                        border-radius: 5px;
                        margin-right: 5px;
                        font-size: 0.9rem;
                    }
                </style>
            </head>
            <body>
                <h1>Belief Analysis Dashboard</h1>
                
                <!-- Apply templates for each belief -->
                <xsl:apply-templates select="Beliefs/Belief"/>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="Belief">
        <div class="belief">
            <div class="belief-title">
                <xsl:value-of select="Title"/>
            </div>
            <div class="category">
                Category: <xsl:value-of select="Category"/>
            </div>
            <div class="description">
                <xsl:value-of select="Description"/>
            </div>
            <div class="tags">
                <strong>Tags:</strong>
                <xsl:for-each select="Tags/Tag">
                    <span>
                        <xsl:value-of select="."/>
                    </span>
                </xsl:for-each>
            </div>
        </div>
    </xsl:template>

</xsl:stylesheet>
