import subprocess
import os

renames = [
    ("Frontend/src/screens/auth/ForgotPasswordScreen.jsx", "Frontend/src/screens/auth/ForgotPassword.jsx"),
    ("Frontend/src/screens/auth/LoginScreen.jsx", "Frontend/src/screens/auth/Login.jsx"),
    ("Frontend/src/screens/auth/OtpScreen.jsx", "Frontend/src/screens/auth/Otp.jsx"),
    ("Frontend/src/screens/auth/ResetPasswordScreen.jsx", "Frontend/src/screens/auth/ResetPassword.jsx"),
    ("Frontend/src/screens/auth/SignUpScreen.jsx", "Frontend/src/screens/auth/SignUp.jsx"),
    ("Frontend/src/screens/auth/SplashScreen.jsx", "Frontend/src/screens/auth/Splash.jsx"),
    ("Frontend/src/screens/auth/VerifyEmailScreen.jsx", "Frontend/src/screens/auth/VerifyEmail.jsx"),
    ("Frontend/src/screens/main/ChatbotAIScreen.jsx", "Frontend/src/screens/main/ChatbotAI.jsx"),
    ("Frontend/src/screens/main/DashboardScreen.jsx", "Frontend/src/screens/main/Dashboard.jsx"),
    ("Frontend/src/screens/main/DietRecipesScreen.jsx", "Frontend/src/screens/main/DietRecipes.jsx"),
    ("Frontend/src/screens/main/FoodScannerScreen.jsx", "Frontend/src/screens/main/FoodScanner.jsx"),
    ("Frontend/src/screens/main/NotificationsScreen.jsx", "Frontend/src/screens/main/Notifications.jsx"),
    ("Frontend/src/screens/main/SettingsScreen.jsx", "Frontend/src/screens/main/Settings.jsx"),
    ("Frontend/src/screens/main/WorkoutScreen.jsx", "Frontend/src/screens/main/Workout.jsx"),
    ("Frontend/src/screens/onboarding/GeneratingPlanScreen.jsx", "Frontend/src/screens/onboarding/GeneratingPlan.jsx"),
    ("Frontend/src/screens/onboarding/StepOneScreen.jsx", "Frontend/src/screens/onboarding/StepOne.jsx"),
    ("Frontend/src/screens/onboarding/StepTwoScreen.jsx", "Frontend/src/screens/onboarding/StepTwo.jsx"),
    ("Frontend/src/screens/onboarding/StepThreeScreen.jsx", "Frontend/src/screens/onboarding/StepThree.jsx"),
]

root_dir = r"c:\Users\Kaizer\Downloads\MacroSync-main\MacroSync-main"

for src, dst in renames:
    src_path = os.path.join(root_dir, src.replace("/", "\\"))
    dst_path = os.path.join(root_dir, dst.replace("/", "\\"))
    if os.path.exists(src_path):
        cmd = ["git", "mv", src_path, dst_path]
        res = subprocess.run(cmd, cwd=root_dir, capture_output=True, text=True)
        if res.returncode != 0:
            # Fallback to os.rename if git mv complains
            print(f"git mv failed for {src}: {res.stderr}. Using os.rename.")
            os.rename(src_path, dst_path)
        else:
            print(f"Renamed: {src} -> {dst}")
    else:
        print(f"Skipping (not found): {src}")

# Now update App.js
app_js_path = os.path.join(root_dir, "Frontend", "App.js")
with open(app_js_path, "r", encoding="utf-8") as f:
    app_content = f.read()

for src, dst in renames:
    old_base = os.path.basename(src).replace(".jsx", "")
    new_base = os.path.basename(dst).replace(".jsx", "")
    app_content = app_content.replace(f"/{old_base}\"", f"/{new_base}\"")
    app_content = app_content.replace(f"/{old_base}'", f"/{new_base}'")

with open(app_js_path, "w", encoding="utf-8") as f:
    f.write(app_content)

print("Updated imports in Frontend/App.js successfully!")
