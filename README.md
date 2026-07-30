<div align="center">

# 🏋️ MacroSync

**AI-powered fitness & nutrition tracking mobile app**

[![React Native](https://img.shields.io/badge/React%20Native-0.86.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~57.0.8-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.12-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.15.3-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

*Sync your macros. Achieve your goals.*

</div>

---

## 📖 Overview

**MacroSync** is a full-stack mobile health and fitness application that combines macro nutrient tracking, AI-driven food analysis, location-based market food radar, personalized workout logging, and an intelligent chatbot — all in one seamless experience. Built with React Native (Expo) on the frontend and a FastAPI backend deployed on Vercel, MacroSync leverages the power of Google Gemini AI to help users reach their health goals.

---

## ✨ Features

### 🤖 AI & Location-Aware Capabilities
| Feature | Description |
|---|---|
| **AI Food Scanner** | Point your camera at any food and get instant macro breakdown (calories, protein, carbs, fats) powered by Gemini Vision |
| **Interactive City Food Radar** | OpenStreetMap Leaflet location radar tailored to Northern Cebu (**San Remigio**, **Bogo City**, **Daanbantayan**) displaying fresh *palengke* catch hours & profiles |
| **Location & Allergy Recipe Generator** | Generate budget-aware Filipino recipes based on local market catch, budget tiers (*Under ₱100*, *₱100-₱300*, *Over ₱300*), and food allergies (*Peanuts*, *Dairy*, *Gluten*, *Seafood*, and custom inputs) |
| **MacroSync AI Chatbot** | Context-aware fitness assistant powered by Gemini AI that knows your profile, goals, and weight history |

### 📊 Tracking & Analytics
| Feature | Description |
|---|---|
| **Dashboard** | Real-time overview of daily nutrition, calories, water intake, step count, and workout activity |
| **Meal Logging** | Log meals with full macro breakdown; auto-calculates daily targets based on your goal |
| **Interactive Workout Player** | Step-by-step home tutorial player with progress tracking, live **45s Rest Timer**, and **Active Recovery Day** guidance |
| **Water Tracking** | Daily hydration monitoring with glass-count logging |
| **Weight Tracking** | Supports both kg and lbs; tracks progress from starting weight to goal weight |

### 👤 User Experience
| Feature | Description |
|---|---|
| **Onboarding Flow** | Personalized setup capturing age, height, weight, and fitness goal |
| **Goal-Based Macros** | Dynamic macro targets (Lose Weight / Gain Muscle / Maintain) auto-calculated per user |
| **Profile Management** | Update name, email, and profile avatar (`96px` camera badge overlay) |
| **Notifications** | In-app notification center |
| **Settings Hub** | Full control over units, preferences, dark/light themes, and account details |

### 🔐 Authentication
- Email/Password signup & login
- **Google Sign-In** (OAuth bypass via Supabase Admin API)
- OTP-based **Forgot Password** flow (email delivery via Resend)
- Secure password update

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
│       │   ├── auth/           # Login, Signup, ForgotPassword, ResetPassword
│       │   ├── main/           # Dashboard, DietRecipesScreen, WorkoutScreen, FoodScanner,
│       │   │                   # ChatbotAI, NotificationsScreen, SettingsScreen
│       │   ├── onboarding/     # Multi-step onboarding flow
│       │   └── config/         # App configuration screens
│       ├── components/         # Reusable UI components
│       ├── context/            # React Context (Theme, CustomAlert, Auth, User state)
│       ├── services/           # API service layer (Axios, OfflineStorage)
│       └── images/             # In-app image assets
│
├── Backend/                    # FastAPI Python backend
│   ├── main.py / index.py      # All API routes & business logic
│   ├── requirements.txt        # Python dependencies
│   ├── vercel.json             # Vercel deployment config
│   └── templates/              # Email templates
│
└── .agent/                     # AI agent configuration & skills
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React Native | 0.86.0 | Cross-platform mobile framework |
| Expo | ~57.0.8 | Development & build toolchain |
| React | 19.2.3 | UI library |
| Expo WebView | 13.16.1 | Leaflet OpenStreetMap integration |
| Axios | ^1.16.1 | HTTP client for API calls |
| Expo Camera | ~57.0.3 | Food scanning via device camera |
| Expo Image Picker | ~57.0.6 | Profile picture selection |
| React Native Chart Kit | ^6.12.3 | Dashboard activity charts |
| Lucide React Native | ^1.17.0 | Icon library |
| AsyncStorage | 2.2.0 | Local session & offline sync cache |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.115.12 | High-performance Python web framework |
| Pydantic | 2.11.5 | Request/response data validation |
| Supabase | 2.15.3 | Database, Auth & real-time backend |
| Google Gemini AI | 1.21.1 | AI chatbot, food vision analysis, recipe generation |
| Resend | 2.30.1 | Transactional email (OTP delivery) |
| Uvicorn | 0.34.3 | ASGI server |
| Python-dotenv | 1.1.0 | Environment variable management |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/signup` | Register a new user |
| `POST` | `/signin` | Authenticate with email & password |
| `POST` | `/auth/google-signin` | Google OAuth sign-in |
| `POST` | `/forgot-password` | Send OTP to email |
| `POST` | `/verify-reset-otp` | Validate OTP code |
| `POST` | `/update-password` | Reset user password |
| `POST` | `/save-onboarding` | Save onboarding profile data |
| `POST` | `/update-weight` | Log updated body weight |
| `POST` | `/update-profile` | Update name & email |
| `POST` | `/update-profile-picture` | Update profile avatar (base64) |
| `GET` | `/dashboard/{user_id}` | Fetch full dashboard analytics |
| `POST` | `/meals` | Log a meal entry |
| `DELETE` | `/meals/{user_id}/{meal_id}` | Remove a logged meal |
| `POST` | `/workouts` | Log a workout session |
| `POST` | `/water` | Update water intake |
| `POST` | `/chat` | Send message to MacroSync AI chatbot |
| `POST` | `/generate-recipe` | AI-generated recipe from ingredients & location |
| `POST` | `/analyze-food` | Analyze food image for macros (Vision AI) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.10
- **Expo Go App** (installed on physical iOS or Android device for live testing)
- **Supabase Account** & Project
- **Google Gemini AI API Key**
- **Resend API Key** (for OTP transactional emails)

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
   RESEND_API_KEY=re_your_resend_api_key
   GEMINI_API_KEY=AIzaSy_your_google_gemini_api_key
   ```

4. **Launch the FastAPI Server:**
   ```bash
   # Start server with live reload enabled across local network:
   uvicorn index:app --reload --host 0.0.0.0 --port 8000
   ```
   > 💡 The backend API will run live at `http://localhost:8000` (or `http://<your-local-ip>:8000`).

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

3. **Configure Local Network API Endpoint:**
   - Open `Frontend/src/config/api.js` and set your local machine's LAN IP address:
   ```javascript
   const API_URL = 'http://192.168.x.x:8000'; // Replace with your local machine's IP address
   ```

4. **Start the Expo LAN Development Server:**
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

Built with ❤️ using **React Native**, **FastAPI**, and **Google Gemini AI**

</div>
