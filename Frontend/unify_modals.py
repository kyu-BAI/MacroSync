import re

def update_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = re.sub(old, new, content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Shared styles
# Make it simple and consistent
shared_styles = """
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: baseColor, borderRadius: 20, padding: 24, shadowColor: softGreenShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: logoGreen, marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#7FA293', textAlign: 'center', marginBottom: 20 },
  modalInput: { width: '100%', backgroundColor: clearWhiteHighlight, borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '600', color: '#1A2B23', marginBottom: 16, borderWidth: 1, borderColor: '#D4E2DC' },
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 8 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: clearWhiteHighlight, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#D4E2DC' },
  modalCancelText: { color: '#7FA293', fontWeight: '700', fontSize: 14 },
  modalSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: logoGreen, alignItems: 'center', marginLeft: 8 },
  modalSaveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
"""

dashboard_path = r'c:\Users\Kaizer\Downloads\MacroSync-main\MacroSync-main\Frontend\src\screens\main\DashboardScreen.jsx'
settings_path = r'c:\Users\Kaizer\Downloads\MacroSync-main\MacroSync-main\Frontend\src\screens\main\SettingsScreen.jsx'

# For DashboardScreen
update_file(dashboard_path, [
    (r"  modalOverlay:\s*\{[^}]+\},[\s\S]*?modalSaveText:\s*\{[^}]+\},", shared_styles.strip())
])

# For SettingsScreen
update_file(settings_path, [
    (r"  modalOverlay:\s*\{[\s\S]*?modalSaveText:\s*\{[^}]+\},", shared_styles.strip())
])

print("Modals unified")
