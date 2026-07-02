<div align="center">

# 🏋️ MacroSync

**AI-powered fitness & nutrition tracking mobile app**

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.12-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.15.3-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

*Sync your macros. Achieve your goals.*

</div>

---

## 📖 Overview

**MacroSync** is a full-stack mobile health and fitness application that combines macro nutrient tracking, AI-driven food analysis, personalized workout logging, and an intelligent chatbot — all in one seamless experience. Built with React Native (Expo) on the frontend and a FastAPI backend deployed on Vercel, MacroSync leverages the power of Google Gemini AI to help users reach their fitness goals.

---

## ✨ Features

### 🤖 AI-Powered
| Feature | Description |
|---|---|
| **AI Food Scanner** | Point your camera at any food and get instant macro breakdown (calories, protein, carbs, fats) powered by Gemini Vision |
| **AI Recipe Generator** | Generate healthy, budget-aware recipes from available ingredients tailored to your location |
| **MacroSync AI Chatbot** | Context-aware fitness assistant that knows your profile, goals, and weight history |

### 📊 Tracking & Analytics
| Feature | Description |
|---|---|
| **Dashboard** | Real-time overview of daily nutrition, calories, water intake, and workout activity |
| **Meal Logging** | Log meals with full macro breakdown; auto-calculates daily targets based on your goal |
| **Workout Logging** | Track exercises with calories burned and active minutes |
| **Water Tracking** | Daily hydration monitoring with glass-count logging |
| **Weight Tracking** | Supports both kg and lbs; tracks progress from starting weight to goal weight |

### 👤 User Experience
| Feature | Description |
|---|---|
| **Onboarding Flow** | Personalized setup capturing age, height, weight, and fitness goal |
| **Goal-Based Macros** | Dynamic macro targets (Lose Weight / Gain Muscle / Maintain) auto-calculated per user |
| **Profile Management** | Update name, email, and profile picture |
| **Notifications** | In-app notification center |
| **Settings** | Full control over units, preferences, and account details |

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
│       │   ├── main/           # Dashboard, Diet/Recipes, Workout, FoodScanner,
│       │   │                   # ChatbotAI, Notifications, Settings
│       │   ├── onboarding/     # Multi-step onboarding flow
│       │   └── config/         # App configuration screens
│       ├── components/         # Reusable UI components
│       ├── context/            # React Context (Auth, User state)
│       ├── services/           # API service layer (Axios)
│       ├── data/               # Static data (exercises, meal presets)
│       └── images/             # In-app image assets
│
├── Backend/                    # FastAPI Python backend
│   ├── main.py                 # All API routes & business logic
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
| React Native | 0.81.5 | Cross-platform mobile framework |
| Expo | ~54.0.0 | Development & build toolchain |
| Expo Router | ~6.0.24 | File-based navigation |
| Axios | ^1.16.1 | HTTP client for API calls |
| Expo Camera | ~17.0.10 | Food scanning via device camera |
| Expo Image Picker | ~17.0.11 | Profile picture selection |
| React Native Chart Kit | ^6.12.3 | Dashboard activity charts |
| Lucide React Native | ^1.17.0 | Icon library |
| AsyncStorage | 2.2.0 | Local session persistence |

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

### Infrastructure
| Service | Purpose |
|---|---|
| **Supabase** | PostgreSQL database, user authentication, file storage |
| **Vercel** | Backend serverless deployment |
| **EAS (Expo Application Services)** | Mobile app builds & OTA updates |
| **Resend** | Email delivery service |

---

## 🗄️ Database Schema (Supabase)

| Table | Key Columns | Description |
|---|---|---|
| `user_profiles` | `id`, `name`, `email`, `age`, `weight_kg`, `height_cm`, `goal`, `goalWeight`, `targetDate`, `profile_image`, `location` | Extended user profile & fitness data |
| `logged_meals` | `id`, `user_id`, `name`, `calories`, `protein`, `carbs`, `fats`, `logged_at` | Daily meal log entries |
| `logged_workouts` | `id`, `user_id`, `name`, `calories_burned`, `active_minutes`, `logged_at` | Daily workout log entries |
| `water_logs` | `user_id`, `glasses`, `updated_at` | Daily water intake tracker |
| `password_reset_otps` | `email`, `otp`, `expires_at` | OTP codes for password resets |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.10
- **Expo CLI** (`npm install -g expo-cli`)
- A **Supabase** project
- A **Google Gemini** API key
- A **Resend** API key

---

### Backend Setup

1. **Navigate to the Backend directory:**
   ```bash
   cd Backend
   ```

2. **Create a virtual environment and install dependencies:**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate

   pip install -r requirements.txt
   ```

3. **Create the `.env` file:**
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_service_role_key
   RESEND_API_KEY=your_resend_api_key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The API will be available at `http://localhost:8000`.

---

### Frontend Setup

1. **Navigate to the Frontend directory:**
   ```bash
   cd Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create the `.env` file:**
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:8000
   ```
   > 💡 Replace with your deployed Vercel backend URL for production.

4. **Start the Expo development server:**
   ```bash
   npm start
   ```

5. **Run on your device:**
   - **Android:** Press `a` in the terminal, or scan the QR code with the Expo Go app
   - **iOS:** Press `i` in the terminal (requires macOS with Xcode)
   - **Web:** Press `w` in the terminal

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
| `POST` | `/generate-recipe` | AI-generated recipe from ingredients |
| `POST` | `/analyze-food` | Analyze food image for macros (Vision AI) |

---

## ☁️ Deployment

### Backend (Vercel)

The backend is pre-configured for Vercel serverless deployment:

```bash
cd Backend
vercel --prod
```

> The `vercel.json` routes all requests to `main.py` via `@vercel/python`.

### Frontend (EAS Build)

```bash
cd Frontend

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Submit to stores
eas submit
```

---

## 🔑 Environment Variables Reference

### Backend (`Backend/.env`)
| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_KEY` | ✅ | Supabase **service_role** key (admin access) |
| `RESEND_API_KEY` | ✅ | Resend API key for email delivery |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for AI features |

### Frontend (`Frontend/.env`)
| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | ✅ | Base URL of the deployed FastAPI backend |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](Frontend/LICENSE) file for details.

---

<div align="center">

Built with ❤️ using **React Native**, **FastAPI**, and **Google Gemini AI**

</div>
