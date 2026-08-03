import sys
import os

# Add root directory to python import path so Backend module can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from Backend.index import app
