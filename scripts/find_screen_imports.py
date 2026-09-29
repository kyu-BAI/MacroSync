import glob
import re
import os

screens = [
    'ForgotPasswordScreen', 'LoginScreen', 'OtpScreen', 'ResetPasswordScreen',
    'SignUpScreen', 'SplashScreen', 'VerifyEmailScreen', 'ChatbotAIScreen',
    'DashboardScreen', 'DietRecipesScreen', 'FoodScannerScreen', 'NotificationsScreen',
    'SettingsScreen', 'WorkoutScreen', 'GeneratingPlanScreen', 'StepOneScreen',
    'StepTwoScreen', 'StepThreeScreen'
]

frontend_files = glob.glob(r'c:\Users\Kaizer\Downloads\MacroSync-main\MacroSync-main\Frontend\**\*.*', recursive=True)
found = {}
for f in frontend_files:
    if any(ignore in f for ignore in ['node_modules', '.git', '.expo', 'android']):
        continue
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        for s in screens:
            if s in content:
                found.setdefault(s, []).append(f)
    except Exception:
        pass

for s, files in found.items():
    print(f"{s} is referenced in:")
    for fl in files:
        print(f"  - {os.path.relpath(fl, r'c:\Users\Kaizer\Downloads\MacroSync-main\MacroSync-main')}")
