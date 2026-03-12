<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="html" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>

  <!-- Utility: slugify title if @slug not provided -->
  <xsl:template name="slug">
    <xsl:param name="title"/>
    <!-- lower-case and replace non-word chars with dashes (XSLT 1.0 approximation) -->
    <xsl:variable name="lc">
      <xsl:value-of select="translate($title, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')"/>
    </xsl:variable>
    <xsl:value-of select="translate($lc, ' &amp;/.,:;?!()[]{}''&quot;', '------------------------')"/>
  </xsl:template>

  <xsl:template match="/BeliefAnalysis">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Belief Analysis Dashboard</title>
        <style>
          body{font-family:Arial, sans-serif;background:#f4f4f4;padding:20px;color:#333}
          h1{color:#007bff;text-align:center;margin:0 0 1rem}
          .belief{background:#fff;padding:16px;margin:0 0 20px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,.1)}
          .belief-title{font-size:1.5rem;font-weight:bold;color:#2c3e50;margin:0 0 .25rem}
          .category{font-size:.95rem;color:#666}
          .description{margin-top:10px;line-height:1.5}
          .tags{margin-top:10px}
          .tag{display:inline-block;background:#007bff;color:#fff;padding:4px 8px;border-radius:5px;margin:0 6px 6px 0;font-size:.85rem}
          .reasons{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:14px}
          .panel{background:#fafafa;border:1px solid #eee;border-radius:8px;padding:12px}
          .panel h3{margin:.25rem 0 .5rem;font-size:1rem}
          ol{margin:.25rem 0 .25rem 1.1rem}
          .scorechips{margin-top:.5rem;font-size:.85rem}
          .chip{display:inline-block;border:1px solid #ddd;border-radius:999px;padding:2px 8px;margin:0 6px 6px 0;background:#fff}
          .meta{margin-top:8px;font-size:.85rem;color:#777}
          .topnav{margin:0 0 16px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
          .topnav a{background:#fff;border:1px solid #e5e5e5;border-radius:999px;padding:6px 10px;text-decoration:none;color:#333}
        </style>
      </head>
      <body>
        <h1>Belief Analysis Dashboard</h1>

        <!-- Quick navigation -->
        <div class="topnav">
          <xsl:for-each select="Beliefs/Belief">
            <xsl:variable name="slug">
              <xsl:choose>
                <xsl:when test="@slug"><xsl:value-of select="@slug"/></xsl:when>
                <xsl:otherwise><xsl:call-template name="slug"><xsl:with-param name="title" select="Title"/></xsl:call-template></xsl:otherwise>
              </xsl:choose>
            </xsl:variable>
            <a>
              <xsl:attribute name="href">#<xsl:value-of select="$slug"/></xsl:attribute>
              <xsl:value-of select="Title"/>
            </a>
          </xsl:for-each>
        </div>

        <xsl:apply-templates select="Beliefs/Belief"/>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="Belief">
    <xsl:variable name="slug">
      <xsl:choose>
        <xsl:when test="@slug"><xsl:value-of select="@slug"/></xsl:when>
        <xsl:otherwise><xsl:call-template name="slug"><xsl:with-param name="title" select="Title"/></xsl:call-template></xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <div class="belief">
      <a>
        <xsl:attribute name="id"><xsl:value-of select="$slug"/></xsl:attribute>
      </a>
      <div class="belief-title">
        <xsl:value-of select="Title"/>
      </div>
      <div class="category">
        <xsl:text>Category: </xsl:text><xsl:value-of select="Category"/>
        <xsl:if test="@id">
          <span class="meta">
            <xsl:text> • ID: </xsl:text><xsl:value-of select="@id"/>
          </span>
        </xsl:if>
      </div>
      <div class="description">
        <xsl:value-of select="Description"/>
      </div>

      <!-- Tags -->
      <xsl:if test="Tags/Tag">
        <div class="tags">
          <strong>Tags:</strong>
          <xsl:for-each select="Tags/Tag">
            <span class="tag"><xsl:value-of select="."/></span>
          </xsl:for-each>
        </div>
      </xsl:if>

      <!-- Reasons (optional) -->
      <xsl:if test="Reasons/Reason">
        <div class="reasons">
          <div class="panel">
            <h3>✅ Top Reasons to Agree</h3>
            <ol>
              <xsl:for-each select="Reasons/Reason[@side='pro']">
                <li>
                  <xsl:value-of select="Text"/>
                  <div class="scorechips">
                    <xsl:if test="Scores/LVS"><span class="chip">LVS: <xsl:value-of select="format-number(Scores/LVS, '0.00')"/></span></xsl:if>
                    <xsl:if test="Scores/EVS"><span class="chip">EVS: <xsl:value-of select="format-number(Scores/EVS, '0.00')"/></span></xsl:if>
                    <xsl:if test="Scores/ECLS"><span class="chip">ECLS: <xsl:value-of select="format-number(Scores/ECLS, '0.00')"/></span></xsl:if>
                    <xsl:if test="Scores/Importance"><span class="chip">Imp: <xsl:value-of select="format-number(Scores/Importance, '0.00')"/></span></xsl:if>
                  </div>
                </li>
              </xsl:for-each>
            </ol>
          </div>

          <div class="panel">
            <h3>❌ Top Reasons to Disagree</h3>
            <ol>
              <xsl:for-each select="Reasons/Reason[@side='con']">
                <li>
                  <xsl:value-of select="Text"/>
                  <div class="scorechips">
                    <xsl:if test="Scores/LVS"><span class="chip">LVS: <xsl:value-of select="format-number(Scores/LVS, '0.00')"/></span></xsl:if>
                    <xsl:if test="Scores/EVS"><span class="chip">EVS: <xsl:value-of select="format-number(Scores/EVS, '0.00')"/></span></xsl:if>
                    <xsl:if test="Scores/ECLS"><span class="chip">ECLS: <xsl:value-of select="format-number(Scores/ECLS, '0.00')"/></span></xsl:if>
                    <xsl:if test="Scores/Importance"><span class="chip">Imp: <xsl:value-of select="format-number(Scores/Importance, '0.00')"/></span></xsl:if>
                  </div>
                </li>
              </xsl:for-each>
            </ol>
          </div>
        </div>
      </xsl:if>

      <!-- Meta (optional) -->
      <xsl:if test="Meta">
        <div class="meta">
          <xsl:if test="Meta/Created">Created: <xsl:value-of select="Meta/Created"/> </xsl:if>
          <xsl:if test="Meta/Updated">• Updated: <xsl:value-of select="Meta/Updated"/> </xsl:if>
          <xsl:if test="Meta/Source">• Source: <xsl:value-of select="Meta/Source"/></xsl:if>
        </div>
      </xsl:if>
    </div>
  </xsl:template>

</xsl:stylesheet>