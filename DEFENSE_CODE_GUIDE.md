# 🛡️ MacroSync - Final Defense Code & Debugging Guide

> **Quick Reference**: Keep this document open during your final defense. If panelists ask to see specific code, algorithms, database queries, or if you need to debug a live issue, find the exact file and function here instantly.

---

## ⚡ 1. The Panel Question Cheat Sheet ("Show me the code for...")

| Feature / Question | Frontend File | Backend File / Database |
| :--- | :--- | :--- |
| **AI Food Scanner (Gemini Vision)** | [`FoodScanner.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/main/FoodScanner.jsx) | [`Backend/index.py`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Backend/index.py) (`/food-recognition`) |
| **AI Nutrition Chatbot** | [`ChatbotAI.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/main/ChatbotAI.jsx) | [`Backend/index.py`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Backend/index.py) (`/chat`) |
| **Calorie & Macro Plan Calculation** | [`GeneratingPlan.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/onboarding/GeneratingPlan.jsx) | [`Backend/index.py`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Backend/index.py) (`/calculate-plan`) |
| **Personalized Meal & Filipino Recipe Pool** | [`DietRecipes.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/main/DietRecipes.jsx) | [`Backend/index.py`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Backend/index.py) (`/meals/recommend/{user_id}`) |
| **Interactive Map & Cebu City/Town Boundaries** | [`MapcnMap.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/components/MapcnMap.jsx) + [`cebu_boundaries.json`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/data/cebu_boundaries.json) | OpenStreetMap + GeoJSON polygons |
| **Home Workout & Exercise GIF Matching** | [`Workout.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/main/Workout.jsx) | [`exercises_index.js`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/data/exercises_index.js) (Fuzzy keyword matcher) |
| **Water Logging & Weight Progress** | [`Dashboard.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/main/Dashboard.jsx) | Supabase `water_logs` & `user_profiles` |
| **Multi-Language (English, Tagalog, Cebuano)** | [`LanguageContext.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/context/LanguageContext.jsx) | In-memory translation dictionary |
| **Dark / Light Theme** | [`ThemeContext.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/context/ThemeContext.jsx) | Dynamic color tokens |
| **Offline Storage & Caching** | [`OfflineStorage.js`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/services/OfflineStorage.js) | `@react-native-async-storage/async-storage` |
| **Data Privacy (RA 10173) & Account Deletion** | [`Settings.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/main/Settings.jsx) & [`PrivacyModal.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/components/PrivacyModal.jsx) | [`Backend/index.py`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Backend/index.py) (`/delete-account`) |

---

## 🔍 2. How to Jump to Any Code in 2 Seconds in VS Code

Instead of expanding folders during your defense:
1. Press **`Ctrl + P`** (Quick Open file by name).
2. Type 3 or 4 letters of the screen:
   - Type `dash` ➔ Opens `Dashboard.jsx`
   - Type `diet` ➔ Opens `DietRecipes.jsx`
   - Type `work` ➔ Opens `Workout.jsx`
   - Type `food` ➔ Opens `FoodScanner.jsx`
   - Type `sett` ➔ Opens `Settings.jsx`
   - Type `inde` ➔ Opens `Backend/index.py`
3. Press **`Ctrl + Shift + F`** to search text across the entire codebase if a panelist asks about a specific variable or message.

---

## 🚨 3. Live Defense Emergency Protocols

### Scenario A: "The app cannot connect to the backend / Network Error"
1. **Check the API URL**:
   - Open [`Frontend/src/screens/config/api.js`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/config/api.js).
   - Ensure it points to your live deployment (`https://macro-sync.vercel.app`) or your local server IP (`http://192.168.x.x:8000`).
2. **Check Vercel Serverless Status**:
   - Open browser at: `https://macro-sync.vercel.app/docs` or `https://macro-sync.vercel.app/`
   - If it responds `{"message": "MacroSync API is running"}`, your backend is alive.

### Scenario B: "The AI Food Recognition / Chat is slow"
- **Defense Explanation to Panel**: *"We are using Google Gemini 1.5 Flash via our FastAPI backend. Response times depend on live cloud inference latency (typically 1.5–3 seconds) and network bandwidth."*
- If internet is slow, the app displays the animated loading modal ([`LoadingModal.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/components/LoadingModal.jsx)) so the user knows processing is active.

### Scenario C: "Show me how the user's data is secured and private"
1. Open [`PrivacyModal.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/components/PrivacyModal.jsx):
   - Highlight the **Medical Scope** (informational disclaimer).
   - Highlight **RA 10173 (Philippine Data Privacy Act)** compliance.
2. Open [`SettingsScreen.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/main/SettingsScreen.jsx) (`handleDeleteAccount`):
   - Show how a user can permanently delete their account and purge all records from the database in real time.

---

## 📂 4. Project Folder Map (If Panelists Ask About Architecture)

```text
MacroSync/
├── Backend/                 # Python FastAPI REST API
│   ├── index.py             # All API endpoints, Supabase queries & Gemini AI integration
│   ├── requirements.txt     # Backend dependencies
│   └── vercel.json          # Serverless cloud deployment config
│
├── Frontend/                # Expo / React Native Mobile Application
│   ├── App.js               # Root routing, navigation stack & auth state
│   ├── assets/              # App launcher icon, splash icon
│   └── src/
│       ├── screens/
│       │   ├── auth/        # Login, SignUp, OTP, VerifyEmail, Password Reset
│       │   ├── onboarding/  # Step 1, Step 2, Step 3, Plan Generation
│       │   ├── main/        # Dashboard, Diet, Workout, Scanner, Chat, Settings
│       │   └── config/      # api.js (Dynamic API endpoint resolver)
│       ├── components/      # Modals, Navbar, Map, Custom Alerts
│       ├── context/         # Global Theme, Language, and Alert Contexts
│       ├── data/            # Cebu boundaries GeoJSON, Bodyweight exercise database
│       └── services/        # Offline storage & push notifications
│
└── scripts/                 # Utility scripts (boundary fetchers, dataset generators)
```

---

## 📋 5. Manuscript & Defense Corrections: AI Safety, Anti-Hallucination & Sugar/Salt Analysis

| Manuscript Requirement | Applied Implementation & Technical Safeguards | Code References |
| :--- | :--- | :--- |
| **Prevent AI for Unsafe Advices** | <span style="color:red">• **Zero-Tolerance Caloric Restriction Filter**: Intercepts dangerous requests (<1,200 kcal/day for women, <1,500 kcal/day for men, prolonged dry fasting, vomiting/purging, steroids, or eating disorders) and issues immediate health advisory notifications.</span><br/><span style="color:red">• **Medical Boundary Directive**: Explicitly confines Vita AI to educational wellness guidance, barring clinical diagnosis or prescription alterations, and directing medical concerns to licensed physicians.</span> | [`Backend/index.py`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Backend/index.py#L1834-L1920)<br/>[`ChatbotAI.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/main/ChatbotAI.jsx#L225-L250) |
| **Prevent AI Hallucination** | <span style="color:red">• **Nutritional Grounding Mandate**: Constrains Google Gemini inference strictly to USDA FoodData Central and DOST-FNRI Philippine Food Composition benchmarks.</span><br/><span style="color:red">• **Atwater Factor Validation Check**: Post-inference algorithmic check verifies Calories ≈ (4 × Protein) + (4 × Carbs) + (9 × Fats) ± 25% and recalibrates anomalies to eliminate hallucinated macro/calorie discrepancies.</span><br/><span style="color:red">• **Edibility Verification**: Strict rejection rule for non-food objects in camera viewfinder to prevent classifying inanimate items as dishes.</span> | [`Backend/index.py`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Backend/index.py#L1860-L1910)<br/>[`Backend/index.py`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Backend/index.py#L2790-L2835) |
| **Checking the Level of Sugar/Salt in the Dish** | <span style="color:red">• **Quantitative Extraction & Classification**: Calculates `sugar_g` and `sodium_mg` per dish portion, categorized according to WHO & AHA benchmarks into Low, Moderate, and High tiers.</span><br/><span style="color:red">• **Interactive Clinical Badges & Alerts**: Displays color-coded Sugar & Sodium level indicators with threshold alerts (e.g., >15g sugar glycemic warnings, >400mg sodium cardiovascular/blood pressure advisories) in both the Food Scanner and Recipe Modals.</span><br/><span style="color:red">• **User Alteration & Excessive Warning Guards**: Users can customize and edit their exact sugar ($g$) and sodium ($mg$) intake directly in the scanner. If excessive amounts are entered (>25g sugar or >800mg sodium), the system triggers prominent clinical notices (🚨) warning of metabolic crashes and cardiovascular strain.</span><br/><span style="color:red">• **Chatbot Proactive Nutrition Analysis**: Instructs Vita AI to explicitly report sugar and salt/sodium levels for all recommended or logged meals.</span> | [`FoodScanner.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/main/FoodScanner.jsx#L360-L510)<br/>[`useFoodScanner.js`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/hooks/useFoodScanner.js#L465-L540)<br/>[`RecipeModal.jsx`](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/components/RecipeModal.jsx#L135-L160) |

Keep this guide handy during presentation and practice sessions!
