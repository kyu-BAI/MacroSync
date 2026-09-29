import glob
import re
import os

screens_dir = r"c:\Users\Kaizer\Downloads\MacroSync-main\MacroSync-main\Frontend\src"
jsx_files = glob.glob(os.path.join(screens_dir, "**", "*.jsx"), recursive=True)

errors = []
for jf in jsx_files:
    fname = os.path.basename(jf)
    relpath = os.path.relpath(jf, screens_dir)
    with open(jf, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Check for references to deleted .styles files
    bad_imports = re.findall(r"import\s+.*from\s+['\"]\..*\.styles['\"]", content)
    if bad_imports:
        errors.append(f"{relpath}: Imports deleted styles file: {bad_imports}")
        
    # 2. Check for duplicate top-level const declarations
    top_consts = re.findall(r"^(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=", content, re.MULTILINE)
    seen = {}
    for c in top_consts:
        seen[c] = seen.get(c, 0) + 1
        if seen[c] == 2:
            errors.append(f"{relpath}: Duplicate top-level variable declaration '{c}'")
            
    # 3. Check for double commas in react-native import
    rn_imports = re.findall(r"import\s*\{([^}]+)\}\s*from\s*['\"]react-native['\"]", content)
    for imp in rn_imports:
        if ",," in imp:
            errors.append(f"{relpath}: Double comma in react-native import")
            
    # 4. Check that getStyles or styles is defined if used
    if re.search(r"\bgetStyles\s*\(", content) and not re.search(r"\bconst\s+getStyles\s*=", content):
        errors.append(f"{relpath}: Calls getStyles() but const getStyles is not defined!")

    # 5. Check if styles is used but not defined or imported
    if re.search(r"style=\{\s*styles\.", content):
        has_styles_def = bool(
            re.search(r"\bconst\s+styles\s*=", content) or
            re.search(r"\blet\s+styles\s*=", content) or
            re.search(r"\bimport\s+.*styles.*from", content)
        )
        if not has_styles_def:
            errors.append(f"{relpath}: Uses style={{styles.something}} but styles is not defined or imported!")

print(f"=== SCANNED {len(jsx_files)} JSX FILES ===")
if errors:
    print(f"Found {len(errors)} issues:")
    for e in errors:
        print(" -", e)
else:
    print("ALL SCREENS AND COMPONENTS PASSED ALL STATIC INTEGRITY CHECKS!")
