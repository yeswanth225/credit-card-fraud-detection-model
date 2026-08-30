"""
conftest.py — Adds the project root to sys.path so that `src` and `phase2`
packages are importable when running pytest from D:\\quantum.
"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))
