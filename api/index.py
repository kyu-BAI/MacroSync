import sys
import os

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "Backend")

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from Backend.index import app
except Exception as e:
    print("Fallback importing index directly:", e)
    from index import app
