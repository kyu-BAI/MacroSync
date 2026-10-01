<div align="center">

# 🏋️ MacroSync

**AI-powered fitness & nutrition tracking mobile app**

[![React Native](https://img.shields.io/badge/React%20Native-0.86.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~57.0.11-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.12-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.15.3-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

*Sync your macros. Achieve your goals.*

</div>

---

## 📖 Overview

**MacroSync** is a full-stack mobile health and fitness application that combines macro nutrient tracking, AI-driven food analysis, location-based market food radar, personalized workout logging, intelligent chatbot assistance, and premium subscription features — all in one seamless experience. Built with **React Native (Expo)** on the frontend and a **FastAPI** backend deployed on **Vercel**, MacroSync leverages Google Gemini AI, Supabase, and PayMongo to help users reach their health and fitness goals.

---

## ✨ Features

### 🤖 AI & Location-Aware Capabilities
| Feature | Description |
|---|---|
| **AI Food Scanner** | Point your camera at any meal to receive an instant macro breakdown (calories, protein, carbs, fats) powered by Gemini Vision AI |
| **Interactive City Food Radar** | MapLibre GL & CARTO vector map location radar tailored to Northern Cebu (**San Remigio**, **Bogo City**, **Daanbantayan**) displaying fresh *palengke* catch hours & profiles |
| **Location & Allergy Recipe Generator** | Generate budget-aware Filipino recipes based on local market catch, budget tiers (*Under ₱100*, *₱100-₱300*, *Over ₱300*), and food allergies (*Peanuts*, *Dairy*, *Gluten*, *Seafood*, and custom inputs) |
| **MacroSync AI Chatbot** | Context-aware fitness assistant powered by Gemini AI that factors in your profile, fitness goals, and weight history |
| **Multi-Language Support** | In-app dynamic localization (English, Tagalog, Cebuano/Bisaya) |

### 📊 Tracking & Analytics
| Feature | Description |
|---|---|
| **Dashboard** | Real-time overview of daily nutrition, calories, water intake, step count, and workout activity |
| **Meal Logging** | Log meals with full macro breakdown; auto-calculates daily targets based on your goal |
| **Interactive Workout Player** | Step-by-step home tutorial player with progress tracking, live **45s Rest Timer**, and **Active Recovery Day** guidance |
| **Water Tracking** | Daily hydration monitoring with glass-count logging |
| **Weight Tracking** | Supports both kg and lbs; tracks progress from starting weight to goal weight with trend charts |

### 👤 User Experience & Premium Features
| Feature | Description |
|---|---|
| **Onboarding Flow** | Personalized 5-step setup capturing age, height, weight, fitness goals, allergies, and location |
| **Goal-Based Macros** | Dynamic macro targets (Lose Weight / Gain Muscle / Maintain) auto-calculated per user |
| **Profile Management** | Update name, email, weight, and profile avatar |
| **Notification Center** | In-app notification center for hydration alerts, streak tracking, and daily reminders |
| **Settings Hub** | Full control over units (metric/imperial), theme mode, language, and account security |
| **Subscription & PayMongo** | Upgrade to MacroSync Premium via PayMongo Checkout (GCash, Maya, cards) with live webhook sync |

### 🔐 Authentication & Security
- Email/Password signup & login with OTP verification
- **Google Sign-In** (OAuth flow via Supabase Admin API)
- OTP-based **Forgot Password** & Reset Password (dual delivery via Gmail SMTP & Resend)
- Account deletion & secure credential updates

---

## 🗂️ Project Structure

```
MacroSync/
├── Frontend/                   # React Native (Expo) mobile app
│   ├── App.js                  # Root navigator & screen configuration
│   ├── app.json                # Expo app configuration
│   ├── index.js                # App entry point
│   ├── assets/                 # Images, icons, splash screens
│   └── src/
│       ├── screens/
│       │   ├── auth/           # Login, SignUp, Otp, ForgotPassword, ResetPassword, VerifyEmail
│       │   ├── main/           # Dashboard, DietRecipes, Workout, FoodScanner,
│       │   │                   # ChatbotAI, Notifications, Settings, Subscription
│       │   ├── onboarding/     # 5-step onboarding flow & GeneratingPlan screen
│       │   └── config/         # App configuration & API URL (api.js)
│       ├── components/         # Reusable UI components (NavBar, Modals, Cards, Maps)
│       ├── context/            # React Context (Theme, CustomAlert, Auth, User state)
│       ├── services/           # API service layer (Axios, OfflineStorage, Geocoding)
│       ├── hooks/              # Custom React hooks (auth, onboarding, workouts, dashboard)
│       └── data/               # Local exercise databases & nutrition assets
│
├── Backend/                    # FastAPI Python backend
│   ├── index.py                # All API routes, Gemini AI, & Supabase business logic
│   ├── translations_data.py    # Multi-language dictionary dataset
│   ├── requirements.txt        # Python dependencies
│   ├── vercel.json             # Vercel deployment config
│   └── templates/              # Email templates
│
├── api/                        # Vercel Serverless entry point
│   └── index.py                # Bridges Vercel serverless requests to Backend
│
└── .agent/                     # AI agent configuration & skills
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React Native | 0.86.2 | Cross-platform mobile framework |
| Expo | ~57.0.11 | Development & build toolchain |
| React | 19.2.3 | UI library |
| React Native WebView | 13.16.1 | MapLibre GL & CARTO Vector Map integration |
| Axios | ^1.16.1 | HTTP client for API calls |
| Expo Camera | ~57.0.3 | Food scanning via device camera |
| Expo Image Picker | ~57.0.8 | Profile picture selection |
| React Native Chart Kit | ^6.12.3 | Dashboard activity & weight trend charts |
| Lucide React Native | ^1.17.0 | Icon library |
| AsyncStorage | 2.2.0 | Local session & offline sync cache |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.115.12 | High-performance Python web framework |
| Pydantic | 2.11.5 | Request/response data validation |
| Supabase | 2.15.3 | Database, Auth & storage backend |
| Google Gemini AI | 1.21.1 | AI chatbot, food vision analysis, recipe generation |
| PayMongo | API v1 | Payment gateway (GCash, Maya, cards, webhooks) |
| Resend & Gmail SMTP | 2.30.1 | Dual-engine transactional OTP email delivery |
| Uvicorn | 0.34.3 | ASGI server for local development |
| Python-dotenv | 1.1.0 | Environment variable management |

---

## 📡 API Endpoints

### 🔐 Authentication & Account Management
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/signup` | Register a new user |
| `POST` | `/verify-signup` | Verify OTP code during registration |
| `POST` | `/signin` | Authenticate with email & password |
| `POST` | `/verify-login` | Verify 2FA/login OTP |
| `POST` | `/auth/google-signin` | Google OAuth sign-in |
| `GET` | `/auth/google-webpage` | Google OAuth browser authorization page |
| `POST` | `/forgot-password` | Send password reset OTP |
| `POST` | `/resend-otp` | Re-send OTP to user's email |
| `POST` | `/verify-reset-otp` | Validate password reset OTP |
| `POST` | `/update-password` | Set new password |
| `POST` | `/update-email` | Update user email address |
| `POST` | `/delete-account` | Delete user account and profile |
| `DELETE` | `/delete-account/{user_id}` | Admin/user account removal |

### 👤 Profile & Onboarding
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/save-onboarding` | Save 5-step onboarding profile data |
| `POST` | `/update-profile` | Update name and personal details |
| `POST` | `/update-profile-picture` | Update profile avatar (base64) |
| `POST` | `/update-weight` | Log updated body weight |
| `GET` | `/dashboard/{user_id}` | Fetch full dashboard analytics and macro progress |

### 🥗 Nutrition & Fitness Tracking
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/meals` | Log a meal entry (calories, protein, carbs, fats) |
| `DELETE` | `/meals/{user_id}/{meal_id}` | Remove a logged meal |
| `GET` | `/meals/recommend/{user_id}` | Get personalized meal recommendations |
| `POST` | `/workouts` | Log a completed workout session |
| `GET` | `/workouts/recommend/{user_id}` | Get recommended workout routines |
| `POST` | `/water` | Log and update water glass count |

### 🤖 AI Capabilities (Gemini)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat` | Send message to context-aware Gemini AI chatbot |
| `GET` | `/chat-status/{user_id}` | Get remaining AI chat quota / cooldown |
| `POST` | `/analyze-food` | Vision AI analysis for uploaded food image |
| `GET` | `/scan-status/{user_id}` | Check remaining scan quota |
| `POST` | `/generate-recipe` | AI recipe generation tailored to budget & allergies |

### 💳 Subscriptions & Payments (PayMongo)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/create-checkout-session` | Create PayMongo payment session (GCash/Maya/Card) |
| `POST` | `/webhooks/paymongo` | Webhook handler to activate premium access |
| `POST` | `/update-subscription` | Manually toggle subscription status |

### 📍 Local Market Radar & Localization
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/city-food` | Get Northern Cebu palengke market profiles |
| `GET` | `/api/city-food/markers` | Get Leaflet radar coordinates and market hours |
| `POST` | `/api/city-food/seed` | Seed default Cebu market profile data |
| `GET` | `/translations/{language}` | Fetch translation dictionary for UI localization |
| `POST` | `/translate/meal-title` | Translate meal titles dynamically |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.10
- **Expo Go App** (installed on physical iOS or Android device for live testing)
- **Supabase Account** & Project
- **Google Gemini AI API Key**
- **Resend API Key** & Gmail App Password (for OTP transactional emails)

---

### 🐍 Backend Setup (FastAPI)

1. **Navigate to the Backend directory:**
   ```bash
   cd Backend
   ```

2. **Create a virtual environment & install dependencies:**
   ```bash
   python -m venv venv

   # On Windows (PowerShell / Command Prompt):
   venv\Scripts\activate

   # On macOS / Linux:
   source venv/bin/activate

   # Install required Python packages:
   pip install -r requirements.txt
   ```

3. **Create the environment configuration file (`Backend/.env`):**
   ```env
   SUPABASE_URL=https://your-supabase-project-id.supabase.co
   SUPABASE_KEY=your_supabase_service_role_key
   SUPABASE_ANON_KEY=your_supabase_anon_key
   RESEND_API_KEY=re_your_resend_api_key
   GEMINI_API_KEY=AIzaSy_your_google_gemini_api_key
   PAYMONGO_SECRET_KEY=sk_test_your_paymongo_key
   GMAIL_SENDER_EMAIL=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_16_digit_app_password
   ```

4. **Launch the FastAPI Server:**
   ```bash
   # Start server with live reload enabled across local network:
   uvicorn index:app --reload --host 0.0.0.0 --port 8000
   ```
   > 💡 The local backend API will run live at `http://localhost:8000` (or `http://<your-local-ip>:8000`).

---

### 📱 Frontend Setup (React Native / Expo)

1. **Navigate to the Frontend directory:**
   ```bash
   cd Frontend
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure API Endpoint:**
   - The app defaults to the live deployed Vercel backend (`https://macro-sync.vercel.app`) in `Frontend/src/screens/config/api.js`.
   - To point to your local development backend, you can set the `EXPO_PUBLIC_API_URL` environment variable or modify `Frontend/src/screens/config/api.js`:
   ```javascript
   const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.x.x:8000";
   export default API_URL;
   ```

4. **Start the Expo Development Server:**
   ```bash
   # Run Expo server in LAN mode with cache clear:
   npx expo start --lan -c
   ```

5. **Test on Device / Emulator:**
   - **Physical Mobile Device:** Open **Expo Go** and scan the QR code displayed in your terminal.
   - **Android Emulator:** Press `a` in the terminal.
   - **iOS Simulator:** Press `i` in the terminal.
   - **Reload App:** Press `r` in the terminal anytime to do a quick bundle refresh.

---

<div align="center">

Built with ❤️ using **React Native**, **FastAPI**, **Google Gemini AI**, and **Supabase**

</div>

