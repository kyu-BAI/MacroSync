import os
import re

ROOT_DIR = r"c:\Users\Kaizer\Downloads\MacroSync-main\MacroSync-main"
OUTPUT_FILE = os.path.join(ROOT_DIR, "MacroSync_Full_Codebase.txt")

# Folders to completely ignore
IGNORE_DIRS = {
    "node_modules",
    ".git",
    ".expo",
    ".vscode",
    "android",
    "dist",
    "build",
    "__pycache__",
    ".agents",
    "assets", # images/binary
    "images", # binary
}

# File extensions to include
INCLUDE_EXTS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".md",
    ".html",
    ".css",
    ".sql",
    ".txt"
}

# Specific files to ignore
IGNORE_FILES = {
    "package-lock.json",
    "MacroSync_Full_Codebase.txt",
    "bundle_codebase.py",
    "null"
}

SENSITIVE_PATTERNS = [
    (r'(?i)(api_key|secret|password|token|key|service_role)["\']?\s*[:=]\s*["\']([^"\']{10,})["\']', r'\1: "[REDACTED_FOR_SECURITY]"'),
    (r'(?i)(https:\/\/[a-zA-Z0-9_\-\.]+:[a-zA-Z0-9_\-\.]+@)', r'https://[REDACTED]:[REDACTED]@'),
]

def is_text_file(filepath):
    _, ext = os.path.splitext(filepath)
    if ext.lower() not in INCLUDE_EXTS:
        return False
    return True

def sanitize_content(content):
    # Redact common secrets/keys in env or config
    for pattern, repl in SENSITIVE_PATTERNS:
        content = re.sub(pattern, repl, content)
    return content

def main():
    collected_files = []

    for root, dirs, files in os.walk(ROOT_DIR):
        # Modify dirs in-place to skip ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in sorted(files):
            if file in IGNORE_FILES:
                continue
            filepath = os.path.join(root, file)
            rel_path = os.path.relpath(filepath, ROOT_DIR)
            
            if is_text_file(filepath):
                collected_files.append((rel_path, filepath))

    collected_files.sort(key=lambda x: (0 if "README" in x[0] else 1 if "Backend" in x[0] else 2 if "Frontend" in x[0] else 3, x[0]))

    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        out.write("=" * 80 + "\n")
        out.write("MACROSYNC - COMPLETE SOURCE CODEBASE EXPORT\n")
        out.write("=" * 80 + "\n\n")
        out.write("PROJECT OVERVIEW:\n")
        out.write("MacroSync is a full-stack mobile health & fitness application.\n")
        out.write("- Frontend: React Native (Expo)\n")
        out.write("- Backend: FastAPI (Python) deployed on Vercel\n")
        out.write("- Database: Supabase / PostgreSQL\n")
        out.write("- AI Features: Google Gemini AI (Nutrition Food Scanner, Vita AI Chatbot, Diet Recipes)\n\n")
        
        out.write("INSTRUCTIONS FOR GEMINI (AI EXAMINER / INTERVIEWER):\n")
        out.write("You are an expert Senior Full-Stack Software Engineer and Technical Panel Defense Examiner.\n")
        out.write("The user is presenting this complete project codebase (MacroSync).\n")
        out.write("Your task:\n")
        out.write("1. Ask the user deep, challenging, and insightful technical questions about the architecture, design choices, data flow, state management, security, and AI integrations in this codebase.\n")
        out.write("2. Test their understanding of both Frontend (React Native/Expo) and Backend (FastAPI/Supabase/Gemini).\n")
        out.write("3. Simulate an authentic thesis defense / technical job interview / code defense panel.\n")
        out.write("4. Start by greeting them, providing a 2-sentence summary of what you noticed in their codebase, and ask the first 2-3 focused technical questions.\n\n")

        out.write("TABLE OF CONTENTS (INDEX OF FILES INCLUDED):\n")
        for rel_path, _ in collected_files:
            out.write(f"- {rel_path}\n")
        out.write("\n" + "=" * 80 + "\n\n")

        # Now append all files
        for rel_path, filepath in collected_files:
            out.write("=" * 80 + "\n")
            out.write(f"FILE: {rel_path}\n")
            out.write("=" * 80 + "\n")
            try:
                with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                    content = sanitize_content(content)
                    out.write(content)
                    if not content.endswith("\n"):
                        out.write("\n")
            except Exception as e:
                out.write(f"[Error reading file: {e}]\n")
            out.write("\n\n")

    print(f"Successfully generated {OUTPUT_FILE} with {len(collected_files)} files.")

if __name__ == "__main__":
    main()
