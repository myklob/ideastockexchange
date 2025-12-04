# Belief Template Transformation System

## Overview

This system transforms XML and PHP belief data into standardized HTML templates for the Idea Stock Exchange. It includes:

1. **Comprehensive Tag Schema** - Structured metadata for beliefs and relationships
2. **XML Parser** - Extracts belief data and relationships from XML files
3. **Template Generator** - Creates HTML pages in the standard template format
4. **Scoring System** - Calculates belief scores based on supporting/opposing relationships

## Quick Start

### Installation

```bash
# Install required dependencies
pip3 install lxml
```

### Basic Usage

```bash
# Transform all beliefs in an XML file
python3 backend/scripts/transform_to_template.py \
  -i backend/data/sample-beliefs-with-relationships.xml \
  -o backend/output/beliefs

# Transform a specific belief
python3 backend/scripts/transform_to_template.py \
  -i backend/data/sample-beliefs-with-relationships.xml \
  -o backend/output/beliefs \
  -b tax-carbon-production
```

## Tag Schema

### All Beliefs Have Text IDs

Every belief must have a unique identifier (text ID). This can be:
- An explicit ID: `<Belief id="climate-change-human-caused">`
- A BeliefID element: `<BeliefID>climate-change-human-caused</BeliefID>`
- Auto-generated from statement hash if not provided

### Relationship Tags

The core feature is **RelationshipTags** which represent:
- **Reasons to Agree**: Beliefs that support another belief (SUPPORTS)
- **Reasons to Disagree**: Beliefs that oppose another belief (OPPOSES)

Each relationship has multiple scoring dimensions:

#### Scoring Dimensions (0-1 scale)

1. **Linkage Score** (40% weight)
   - How relevant is the connection?
   - Does the from_belief actually relate to the to_belief?

2. **Truth Score** (30% weight)
   - How true is the supporting/opposing belief itself?
   - Independent assessment of validity

3. **Importance Score** (20% weight)
   - How important is this relationship?
   - Does it matter significantly?

4. **Evidence Strength** (10% weight)
   - Quality of evidence supporting this relationship
   - Tier 1 (best) to Tier 4 (weakest)

#### Composite Score

Overall Contribution = (linkage × 0.4) + (truth × 0.3) + (importance × 0.2) + (evidence × 0.1)

## XML Format

### Supporting Arguments

```xml
<SupportingArgument>
  <ConclusionID>belief-being-supported</ConclusionID>
  <SupportingArgumentID>belief-providing-support</SupportingArgumentID>
  <LinkageScore>85</LinkageScore>      <!-- 0-100 scale -->
  <TruthScore>90</TruthScore>          <!-- 0-100 scale -->
  <ImportanceScore>80</ImportanceScore> <!-- 0-100 scale -->
  <EvidenceStrength>88</EvidenceStrength> <!-- 0-100 scale -->
</SupportingArgument>
```

### Opposing Arguments

```xml
<WeakeningArgument>
  <ConclusionID>belief-being-opposed</ConclusionID>
  <WeakeningArgumentID>belief-providing-opposition</WeakeningArgumentID>
  <LinkageScore>70</LinkageScore>
  <TruthScore>40</TruthScore>
  <ImportanceScore>60</ImportanceScore>
  <EvidenceStrength>35</EvidenceStrength>
</WeakeningArgument>
```

### Explicit Links (Alternative Format)

```xml
<Link>
  <LinkID>1</LinkID>
  <IfThisBeliefWereTrueID>belief-A</IfThisBeliefWereTrueID>
  <AffectedBeliefID>belief-B</AffectedBeliefID>
  <LinkType>Supporting</LinkType>  <!-- or "Opposing" -->
  <JustificationText>Explanation of why this relationship exists</JustificationText>
</Link>
```

## Belief Scoring System

### Score Calculation

```
Base Score = 50 (neutral)
Final Score = Base + Σ(supporting contributions × 10) - Σ(opposing contributions × 10)
Clamped to [0, 100]
```

### Score Interpretation

- **80-100**: Strongly Supported
  - Well-evidenced with strong arguments and minimal valid opposition

- **60-79**: Moderately Supported
  - Good evidence but some valid concerns exist

- **40-59**: Contested
  - Balanced arguments on both sides

- **20-39**: Weakly Supported
  - Strong opposition with limited support

- **0-19**: Likely False
  - Overwhelming opposition with little support

## Example: Complete Belief with Relationships

```xml
<?xml version="1.0" encoding="UTF-8"?>
<BeliefAnalysis>
  <Beliefs>
    <Belief id="conclusion">
      <Statement>We should implement policy X</Statement>
      <Category>Policy</Category>
    </Belief>

    <Belief id="supporting-belief-1">
      <Statement>Policy X has proven effective in other countries</Statement>
      <Category>Evidence</Category>
    </Belief>

    <Belief id="supporting-belief-2">
      <Statement>The benefits of policy X outweigh the costs</Statement>
      <Category>Analysis</Category>
    </Belief>

    <Belief id="opposing-belief-1">
      <Statement>Policy X is too expensive to implement</Statement>
      <Category>Economics</Category>
    </Belief>
  </Beliefs>

  <Arguments>
    <SupportingArgument>
      <ConclusionID>conclusion</ConclusionID>
      <SupportingArgumentID>supporting-belief-1</SupportingArgumentID>
      <LinkageScore>90</LinkageScore>
      <TruthScore>85</TruthScore>
      <ImportanceScore>80</ImportanceScore>
      <EvidenceStrength>95</EvidenceStrength>
    </SupportingArgument>

    <SupportingArgument>
      <ConclusionID>conclusion</ConclusionID>
      <SupportingArgumentID>supporting-belief-2</SupportingArgumentID>
      <LinkageScore>85</LinkageScore>
      <TruthScore>75</TruthScore>
      <ImportanceScore>90</ImportanceScore>
      <EvidenceStrength>70</EvidenceStrength>
    </SupportingArgument>

    <WeakeningArgument>
      <ConclusionID>conclusion</ConclusionID>
      <WeakeningArgumentID>opposing-belief-1</WeakeningArgumentID>
      <LinkageScore>70</LinkageScore>
      <TruthScore>50</TruthScore>
      <ImportanceScore>60</ImportanceScore>
      <EvidenceStrength>45</EvidenceStrength>
    </WeakeningArgument>
  </Arguments>
</BeliefAnalysis>
```

### Resulting Scores

1. **supporting-belief-1 contribution**:
   - (0.90 × 0.4) + (0.85 × 0.3) + (0.80 × 0.2) + (0.95 × 0.1) = 0.870

2. **supporting-belief-2 contribution**:
   - (0.85 × 0.4) + (0.75 × 0.3) + (0.90 × 0.2) + (0.70 × 0.1) = 0.815

3. **opposing-belief-1 contribution**:
   - (0.70 × 0.4) + (0.50 × 0.3) + (0.60 × 0.2) + (0.45 × 0.1) = 0.595

4. **Final Belief Score**:
   - 50 + (0.870 × 10) + (0.815 × 10) - (0.595 × 10) = **60.9**
   - Interpretation: **Moderately Supported**

## Output Format

The generated HTML follows the standard Idea Stock Exchange template with:

- Metadata comments (page, uid, time, etc.)
- Score display with interpretation
- Evidence tables (Tier 1-4)
- Argument trees (Top reasons to agree/disagree)
- Core values conflict
- Interests and motivations
- Foundational assumptions
- Objective criteria
- Cost-benefit analysis
- Short vs long-term impacts
- Compromise solutions
- Obstacles to resolution
- Biases
- Media resources
- Legal framework
- General to specific belief mapping
- Similar beliefs

Each argument in the "Argument Trees" section shows:
- Link to the belief page
- Contribution score as a percentage

Example:
```html
<tr>
  <td>1. <a href="/belief/supporting-belief">Supporting belief text</a> (Score: 87%)</td>
  <td>1. <a href="/belief/opposing-belief">Opposing belief text</a> (Score: 60%)</td>
</tr>
```

## Files

- **transform_to_template.py** - Main transformation script
- **TAG_SCHEMA.md** - Complete documentation of the tag schema
- **sample-beliefs-with-relationships.xml** - Example XML with all features
- **README_TRANSFORM.md** - This file

## Advanced Features

### Generating Tags for Various Relationship Types

The system can be extended to support additional tag types:

1. **Evidence Tags** - Classify and score evidence
2. **Value Tags** - Track value alignments
3. **Interest Tags** - Identify stakeholder interests
4. **Assumption Tags** - Document foundational assumptions

These are defined in the tag schema but not yet fully implemented in the XML parser. To add support:

1. Add corresponding XML elements to your input files
2. Extend the `BeliefXMLParser` class with parsing methods
3. Update the template generator to include these in the output

### Custom Scoring Formulas

The contribution score formula can be customized by modifying the `calculate_overall_contribution()` method in the `RelationshipTag` class:

```python
def calculate_overall_contribution(self) -> float:
    # Custom weights
    self.overall_contribution = (
        self.linkage_score * 0.5 +    # Increase linkage importance
        self.truth_score * 0.25 +      # Reduce truth importance
        self.importance_score * 0.15 +
        self.evidence_strength * 0.10
    )
    return self.overall_contribution
```

## Integration with Database

The tag schema maps to existing MongoDB models:

- **BeliefTag** → `Belief` model
- **RelationshipTag** → `BeliefLink` model
- **ArgumentTag** → `Argument` model
- **EvidenceTag** → `Evidence` model

To integrate with the database:

1. Use the XML format as an import/export mechanism
2. Create a migration script to convert between formats
3. Use the scoring formulas in the database models

## Troubleshooting

### Missing lxml module

```bash
pip3 install lxml
```

### XML Parsing Errors

Ensure your XML:
- Has proper UTF-8 encoding declaration
- Is well-formed (all tags closed)
- Has required elements (Beliefs, Arguments)

### Score Calculation Issues

Verify:
- Scores are in correct format (0-100 or 0.0-1.0)
- Belief IDs match between beliefs and relationships
- No circular dependencies in belief relationships

## Future Enhancements

Potential improvements:

1. **PHP Parser** - Add support for parsing PHP data structures
2. **Database Import** - Direct import from MongoDB
3. **Batch Processing** - Process multiple XML files
4. **Visualization** - Generate belief network graphs
5. **Validation** - Add XML schema validation
6. **Circular Dependency Detection** - Prevent scoring loops
7. **Caching** - Cache computed scores for performance

## Contributing

When adding new tag types:

1. Define the tag class in `transform_to_template.py`
2. Add XML parsing logic in `BeliefXMLParser`
3. Update template generation in `BeliefTemplateGenerator`
4. Document in `TAG_SCHEMA.md`
5. Add examples to sample XML files

## License

Part of the Idea Stock Exchange project. See main repository for license details.
