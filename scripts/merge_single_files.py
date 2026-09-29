import os
import re
import glob

def process_screen(jsx_path, styles_path):
    print(f"Processing: {os.path.basename(jsx_path)}")
    with open(jsx_path, 'r', encoding='utf-8') as f:
        jsx_content = f.read()
    with open(styles_path, 'r', encoding='utf-8') as f:
        styles_content = f.read()

    # 1. Extract react-native symbols needed by styles
    rn_import_match = re.search(r"import\s*\{([^}]+)\}\s*from\s*['\"]react-native['\"];?", styles_content)
    needed_rn_symbols = set()
    if rn_import_match:
        for sym in rn_import_match.group(1).split(','):
            sym = sym.strip()
            if sym:
                needed_rn_symbols.add(sym)

    # 2. Add any missing react-native symbols to jsx_content
    jsx_rn_match = re.search(r"import\s*\{([^}]+)\}\s*from\s*['\"]react-native['\"];?", jsx_content)
    if jsx_rn_match:
        current_rn_symbols = set(s.strip() for s in jsx_rn_match.group(1).split(',') if s.strip())
        missing_symbols = needed_rn_symbols - current_rn_symbols
        if missing_symbols:
            updated_rn = jsx_rn_match.group(1).rstrip() + ',\n  ' + ',\n  '.join(sorted(missing_symbols)) + '\n'
            jsx_content = jsx_content[:jsx_rn_match.start(1)] + updated_rn + jsx_content[jsx_rn_match.end(1):]

    # 3. Remove the styles import from jsx
    styles_base = os.path.basename(styles_path).replace('.js', '')
    import_regex = re.compile(rf"import\s*\{{[^}}]*\}}\s*from\s*['\"]\.\/{re.escape(styles_base)}['\"];?\n?", re.MULTILINE)
    jsx_content = import_regex.sub("", jsx_content)

    # Also handle import * as styles, or import styles from ...
    default_import_regex = re.compile(rf"import\s+(?:styles|\*\s+as\s+styles)\s+from\s*['\"]\.\/{re.escape(styles_base)}['\"];?\n?", re.MULTILINE)
    jsx_content = default_import_regex.sub("", jsx_content)

    # 4. Clean styles_content: strip imports
    cleaned_styles = re.sub(r"import\s+[^;]+;?\n?", "", styles_content).strip()

    # Convert export const to const
    cleaned_styles = re.sub(r"export\s+const\s+", "const ", cleaned_styles)
    cleaned_styles = re.sub(r"export\s+default\s+", "", cleaned_styles)

    # 5. Check duplicate top-level declarations
    # Variables that commonly clash
    for var in ['baseColor', 'logoGreen']:
        # If jsx already has 'const var =', remove 'const var =' from cleaned_styles
        if re.search(rf"\bconst\s+{var}\s*=", jsx_content):
            cleaned_styles = re.sub(rf"const\s+{var}\s*=\s*['\"][^'\"]*['\"];?\n?", "", cleaned_styles)

    # Check Dimensions destructuring: { width: screenWidth, height: screenHeight }
    if re.search(r"\bscreenWidth\b", jsx_content) and re.search(r"const\s*\{[^}]*screenWidth[^}]*\}\s*=\s*Dimensions", cleaned_styles):
        cleaned_styles = re.sub(r"const\s*\{[^}]*screenWidth[^}]*\}\s*=\s*Dimensions\.get\(['\"]window['\"]\);?\n?", "", cleaned_styles)

    # 6. Append cleaned styles to bottom of jsx
    final_jsx = jsx_content.rstrip() + "\n\n// --- COMPONENT STYLES ---\n" + cleaned_styles.strip() + "\n"

    with open(jsx_path, 'w', encoding='utf-8') as f:
        f.write(final_jsx)

    # 7. Delete styles file
    os.remove(styles_path)
    print(f"Merged and removed: {styles_path}")

def main():
    root = r"c:\Users\Kaizer\Downloads\MacroSync-main\MacroSync-main\Frontend\src\screens"
    style_files = glob.glob(os.path.join(root, "**", "*.styles.js"), recursive=True)
    print(f"Found {len(style_files)} style files to merge.")
    for sf in style_files:
        jf = sf.replace('.styles.js', '.jsx')
        if os.path.exists(jf):
            process_screen(jf, sf)
        else:
            print(f"WARNING: No matching JSX for {sf}")

if __name__ == '__main__':
    main()
