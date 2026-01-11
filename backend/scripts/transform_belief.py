import argparse
import os
from lxml import etree

# Resolve project root relative to this script's location
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Default file paths (relative to project structure)
DEFAULT_XML = os.path.join(BASE_DIR, "data", "belief-analysis.xml")
DEFAULT_XSLT = os.path.join(BASE_DIR, "data", "BeliefHTMLConverter.xsl")
DEFAULT_OUTPUT = os.path.join(BASE_DIR, "output", "belief_analysis.html")

def transform_xml_to_html(xml_file, xslt_file, output_file):
    """Applies the XSLT transformation to an XML file and saves the result as an HTML file."""
    try:
        # Ensure the output directory exists
        os.makedirs(os.path.dirname(output_file), exist_ok=True)

        # Check that input files exist
        if not os.path.exists(xml_file):
            raise FileNotFoundError(f"XML file not found: {xml_file}")
        if not os.path.exists(xslt_file):
            raise FileNotFoundError(f"XSLT file not found: {xslt_file}")

        # Load XML and XSLT
        xml_tree = etree.parse(xml_file)
        xslt_tree = etree.parse(xslt_file)
        transform = etree.XSLT(xslt_tree)

        # Apply transformation
        result_html = transform(xml_tree)

        # Write output HTML file
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(str(result_html))
        
        print(f"✅ Transformation successful! HTML saved at: {output_file}")

    except Exception as e:
        print(f"❌ Error during transformation: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transform a belief XML file into HTML using XSLT.")
    parser.add_argument("-x", "--xml", default=DEFAULT_XML, help="Path to the input XML file.")
    parser.add_argument("-s", "--xslt", default=DEFAULT_XSLT, help="Path to the XSLT file.")
    parser.add_argument("-o", "--output", default=DEFAULT_OUTPUT, help="Path to save the output HTML file.")

    args = parser.parse_args()
    transform_xml_to_html(args.xml, args.xslt, args.output)