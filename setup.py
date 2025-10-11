"""
Setup configuration for HD4 Fetch.AI UAgent Template
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="hd4-fetchai-uagent-template",
    version="1.0.0",
    author="HD4 Team",
    description="A comprehensive template for creating Fetch.AI UAgents",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/alpaslan-exe/HD4_Fetch_AI_UAgent",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[
        "uagents>=0.12.0",
        "pydantic>=2.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0",
            "flake8>=6.0",
        ],
    },
)
