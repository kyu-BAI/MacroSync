# 🚀 MacroSync Backend Integration & Hand-Off Guide

This document outlines the current state of the **MacroSync** codebase, including the frontend mock configurations, the existing backend FastAPI endpoints, and the next steps required to fully connect the frontend to the backend.

---

## 🗺️ Supabase Database Schema

To support the existing FastAPI endpoints, your Supabase database must have the following tables:

### 1. `user_profiles`
Stores profile configurations, baseline metrics, goals, and user metadata.
*   `id`: `uuid` (Primary Key, references Supabase Auth User ID)
*   `email`: `text` (Unique)
*   `name`: `text`
*   `age`: `int` (Nullable)
*   `weight_kg`: `float` (Nullable)
*   `height_cm`: `float` (Nullable)
*   `goal`: `text` (Nullable)
*   `goalWeight`: `float` (Nullable)
*   `targetDate`: `text` (Nullable)
*   `location`: `text` (Used to store unit preferences and starting weight serialized as JSON)

### 2. `password_reset_otps`
Handles temporary OTP codes for password recovery.
*   `email`: `text` (Primary Key / Unique)
*   `otp`: `text`
*   `expires_at`: `timestampz` (10 minutes expiry)

---

## 📂 Current Frontend Mock Configurations (Dev Mode)

To allow offline UI/UX development without needing active server connections, the frontend uses **mocking & bypass logic**. To integrate the backend, these bypasses need to be switched over to actual API calls.

Here are the specific locations of the mock configurations:

| Feature | Screen File | Current Mock / Bypass Behavior | Integration Task |
| :--- | :--- | :--- | :--- |
| **Login Auth** | [LoginScreen.jsx](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/auth/LoginScreen.jsx#L42-L87) | Bypasses `/signin` endpoint and routes directly to the Dashboard. Original `fetch` call is commented out. | Uncomment the `fetch` block and wire up `setCurrentUserId` and `onLoginSuccess`. |
| **Signup Auth** | [SignUpScreen.jsx](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/auth/SignUpScreen.jsx#L45-L80) | Bypasses `/signup` endpoint and directly calls `onSignUpSuccess` with mock IDs. | Wire up the `POST /signup` call to register users. |
| **Password Reset** | [ForgotPasswordScreen.jsx](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/auth/ForgotPasswordScreen.jsx) <br> [OtpScreen.jsx](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/auth/OtpScreen.jsx) <br> [ResetPasswordScreen.jsx](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/auth/ResetPasswordScreen.jsx) | Simulated inputs and transitions for requesting OTP, verifying, and resetting passwords. | Connect to `/forgot-password`, `/verify-reset-otp`, and `/update-password` endpoints. |
| **Onboarding Save** | [GeneratingPlanScreen.jsx](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/onboarding/GeneratingPlanScreen.jsx#L79-L108) | Log message says `"Frontend Dev Mode: Bypassing backend save onboarding."`. Saves parameters locally. | Send user onboarding data to `POST /save-onboarding`. |
| **Dynamic Dashboard** | [App.js](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/App.js#L42-L69) | Dashboard states (macros, targets, calorie metrics) are initial local React states. | Fetch baseline configuration metrics dynamically from `GET /dashboard/{user_id}` on app launch. |
| **Food Scanner** | [FoodScannerScreen.jsx](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/main/FoodScannerScreen.jsx#L113-L151) | Simulates camera capture and returns a mock Grilled Chicken & Rice macro card after 1.5 seconds. | Convert captured base64 image and send it to `POST /analyze-food`. |
| **AI Chatbot** | [ChatbotAIScreen.jsx](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/main/ChatbotAIScreen.jsx#L53-L78) | Locally matches keywords (*hello, calorie, workout, diet*) and returns simulated responses. | Call `POST /chat` to get real AI answers based on user profile context. |
| **Recipes Explore** | [DietRecipesScreen.jsx](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/main/DietRecipesScreen.jsx#L82-L151) | Statically loads preset local Cebuano recipe options (*Kinilaw, Pintos, Sutukil*). | Connect to `POST /generate-recipe` to allow Gemini-powered customized recipes. |

---

## 🛠️ Environment Configuration (.env)

Ensure these variables are correctly set on both ends before starting the integration testing:

### Backend `.env`
Create a `.env` in the `Backend/` directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_email_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend Environment
The frontend points to the backend using [api.js](file:///c:/Users/Kaizer/Downloads/MacroSync-main/MacroSync-main/Frontend/src/screens/config/api.js):
```javascript
const API_URL = "http://<YOUR_LOCAL_IP_ADDRESS>:8000";
export default API_URL;
```
> [!IMPORTANT]
> When testing on physical mobile devices or emulators, avoid using `localhost` or `127.0.0.1`. Instead, specify the **host machine's local network IP address** (e.g. `http://192.168.1.100:8000`) so the device can access the server over local Wi-Fi.

---

## 🔄 Running the Services Locally

1.  **Start Backend**:
    From the `Backend/` directory, run the FastAPI server:
    ```bash
    pip install fastapi pydantic supabase python-dotenv resend google-genai uvicorn
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```
2.  **Start Frontend**:
    From the `Frontend/` directory, start Expo:
    ```bash
    npm install
    npx expo start
    ```
