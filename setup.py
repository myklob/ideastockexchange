"""Setup script for Idea Stock Exchange"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text() if readme_file.exists() else ""

setup(
    name="idea-stock-exchange",
    version="1.0.0",
    description="Intelligent belief argument scanner and analyzer",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Idea Stock Exchange Team",
    author_email="info@ideastockexchange.com",
    url="https://github.com/yourusername/ideastockexchange",
    packages=find_packages(),
    install_requires=[
        line.strip()
        for line in Path("requirements.txt").read_text().splitlines()
        if line.strip() and not line.startswith("#")
    ],
    entry_points={
        "console_scripts": [
            "belief-scanner=src.cli:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Text Processing :: Linguistic",
    ],
    python_requires=">=3.9",
    include_package_data=True,
    zip_safe=False,
)
