"""
Idea Stock Exchange - Belief Argument Scanner

A comprehensive system for scanning the internet for arguments, evidence,
and examples related to beliefs, and organizing them in a structured framework.
"""

__version__ = "1.0.0"

from .scanner import BeliefScanner, scan_belief_sync
from .models import (
    Belief, Reason, Evidence, StressTest, Proposal,
    Linkage, LinkageArgument, EvidenceType
)
from .generation import XMLGenerator

__all__ = [
    "BeliefScanner",
    "scan_belief_sync",
    "Belief",
    "Reason",
    "Evidence",
    "StressTest",
    "Proposal",
    "Linkage",
    "LinkageArgument",
    "EvidenceType",
    "XMLGenerator",
]
