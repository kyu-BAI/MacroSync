import os
import re

dir_path = r'c:\Users\Kaizer\Downloads\MacroSync-main\MacroSync-main\Frontend\src\screens\main'
screens = [
    'DashboardScreen.jsx',
    'DietRecipesScreen.jsx',
    'WorkoutScreen.jsx',
    'SettingsScreen.jsx',
    'ChatbotAIScreen.jsx'
]

for screen in screens:
    path = os.path.join(dir_path, screen)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove import
    content = re.sub(r"import BottomNavBar from '../../components/BottomNavBar';\n?", "", content)
    
    # Remove component (multiline or single line)
    content = re.sub(r"\s*<BottomNavBar[^>]+/>\n?", "\n", content)
    
    # Remove floating chatbot fab if it overlaps with BottomNavBar on Dashboard?
    # Wait, the user just wants the nav bar consistent. I will only touch BottomNavBar.
    
    if screen == 'ChatbotAIScreen.jsx':
        # Adjust marginBottom for chatInputFormCard
        content = re.sub(
            r"(marginBottom:\s*)12(\s*,)",
            r"\1Platform.OS === 'ios' ? 120 : 100\2",
            content
        )
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Refactored screens successfully")
