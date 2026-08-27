# AGENTS.md - Workspace Agent Rules

## 🤖 APK Build Determination Rule (MANDATORY AUTOMATION)

- **APK BUILD DETERMINATION RULE**: After EVERY fix or modification in this project:
  1. Carefully evaluate if the fix requires a new APK build to work on the user's phone.
  2. **If the fix does NOT require a new APK** (e.g. Backend, API, Database, Server, ENV, Vercel fixes): DO NOT build a new APK. Simply push to GitHub/Vercel and confirm to the user that their existing installed APK works live.
  3. **If the fix strictly REQUIRES a new APK** (e.g. Native Expo/React Native JS bundle changes, native packages, structural mobile UI updates): Verify Metro compilation locally (`npx expo export --platform android`), and **IMMEDIATELY & AUTOMATICALLY** generate a new EAS Cloud preview APK build (`npx eas-cli build -p android --profile preview`). DO NOT ask for confirmation—execute it automatically.
