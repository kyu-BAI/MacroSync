import sys
import os
import traceback

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(root_dir, "Backend")

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from Backend.index import app
except Exception as err:
    error_traceback = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import HTMLResponse, JSONResponse

    app = FastAPI()

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])
    async def catch_all(full_path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Vercel Boot Exception",
                "detail": str(err),
                "traceback": error_traceback
            }
        )
