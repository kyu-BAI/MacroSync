from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv
import os
import random
import json
import time
from datetime import datetime, timedelta, timezone
import resend
from google import genai
from google.genai import types
import base64


load_dotenv()

# Verify that the service role key is set for admin operations (checked below after dotenv load)

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- ENV ----------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
if not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_KEY not set. Ensure .env contains the service role key before starting the server.")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ---------------- INIT CLIENTS ----------------
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_admin = create_client(SUPABASE_URL, SUPABASE_KEY)

resend.api_key = RESEND_API_KEY

if GEMINI_API_KEY:
    genai_client = genai.Client(api_key=GEMINI_API_KEY)
else:
    genai_client = None

    
# ---------------- MODELS ----------------
class UserAuth(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


class UpdatePasswordRequest(BaseModel):
    email: str = None
    user_id: str = None
    password: str


class GoogleSignInRequest(BaseModel):
    email: str
    name: str
    id_token: str = None


class UpdateWeightData(BaseModel):
    user_id: str
    new_weight: float
    unit: str = "kg"


class OnboardingData(BaseModel):
    user_id: str
    age: int
    weight_kg: float
    height_cm: float
    goal: str
    goal_weight: float
    target_date: str
    weight_unit: str = "kg"
    starting_weight: float = None


class ChatMessageRequest(BaseModel):
    user_id: str
    message: str


class RecipeRequest(BaseModel):
    ingredients: str
    budget: str = "All"
    location: str = "Any"


class AnalyzeFoodRequest(BaseModel):
    image_base64: str
    user_id: str = None


class UpdateSubscriptionRequest(BaseModel):
    user_id: str
    is_premium: bool


class UpdateProfileRequest(BaseModel):
    user_id: str
    name: str
    email: str


class MealLog(BaseModel):
    id: str
    user_id: str
    name: str
    calories: int
    protein: int
    carbs: int
    fats: int


class WorkoutLog(BaseModel):
    id: str
    user_id: str
    name: str
    calories_burned: int
    active_minutes: int


class WaterLog(BaseModel):
    user_id: str
    glasses: int


class ProfilePictureUpdate(BaseModel):
    user_id: str
    profile_image: str



# ---------------- SIGNUP ----------------
@app.post("/signup")
async def signup(user: UserAuth):
    try:
        auth = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password
        })

        user_id = auth.user.id

        supabase.table("user_profiles").insert({
            "id": user_id,
            "email": user.email,
            "name": user.name
        }).execute()

        return {"user_id": user_id}

    except Exception as e:
        print("SIGNUP ERROR:", repr(e))
        raise HTTPException(status_code=400, detail=str(e))


# ---------------- SIGNIN ----------------
@app.post("/signin")
def signin(user: UserLogin):
    try:
        auth = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })

        user_id = auth.user.id
        email = auth.user.email
        # Ensure profile exists in user_profiles
        try:
            profile_response = supabase.table("user_profiles").select("id").eq("id", user_id).execute()
            if not profile_response.data:
                name = auth.user.user_metadata.get("full_name") if auth.user.user_metadata else None
                if not name:
                    name = email.split("@")[0]
                supabase.table("user_profiles").insert({
                    "id": user_id,
                    "email": email,
                    "name": name
                }).execute()
        except Exception as profile_err:
            print("ERROR ENSURING PROFILE ON SIGNIN:", repr(profile_err))

        return {
            "user": auth.user,
            "session": auth.session
        }

    except Exception as e:
        print("LOGIN ERROR:", repr(e))
        raise HTTPException(status_code=400, detail=str(e))


# ---------------- GOOGLE SIGNIN (BYPASS/PRODUCTION) ----------------
@app.post("/auth/google-signin")
async def google_signin(data: GoogleSignInRequest):
    try:
        email = data.email.strip().lower()
        name = data.name.strip()
        
        if not email or not name:
            raise HTTPException(status_code=400, detail="Email and name are required")

        # Check if user already exists in Supabase Auth via Admin Client
        users = supabase_admin.auth.admin.list_users()
        user = next((u for u in users if u.email and u.email.lower() == email), None)

        if not user:
            # Create user in Supabase Auth using admin API to bypass confirmations
            auth_user = supabase_admin.auth.admin.create_user({
                "email": email,
                "email_confirm": True,
                "user_metadata": {"full_name": name}
            })
            user_id = auth_user.user.id
            
            # Create corresponding user_profiles row
            supabase.table("user_profiles").insert({
                "id": user_id,
                "email": email,
                "name": name
            }).execute()
        else:
            user_id = user.id
            # Ensure the profile exists in user_profiles
            profile_response = supabase.table("user_profiles").select("id").eq("id", user_id).execute()
            if not profile_response.data:
                supabase.table("user_profiles").insert({
                    "id": user_id,
                    "email": email,
                    "name": name
                }).execute()

        return {
            "success": True,
            "user_id": user_id,
            "user": {
                "id": user_id,
                "email": email,
                "name": name
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print("GOOGLE SIGNIN ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- FORGOT PASSWORD (FIXED) ----------------
@app.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):

    try:
        otp = str(random.randint(100000, 999999))
        expiry = (datetime.utcnow() + timedelta(minutes=10)).isoformat()

        # save OTP
        supabase.table("password_reset_otps").upsert({
            "email": data.email,
            "otp": otp,
            "expires_at": expiry
        }).execute()

        # send email via Resend (CORRECT SDK USAGE)
        resend.Emails.send({
            "from": "MacroSync <onboarding@resend.dev>",
            "to": data.email,
            "subject": "MacroSync Password Reset OTP",
            "html": f"""
                <h2>Your OTP Code</h2>
                <h1>{otp}</h1>
                <p>This code expires in 10 minutes.</p>
            """
        })

        return {
            "success": True,
            "message": "OTP sent"
        }

    except Exception as e:
        print("FORGOT PASSWORD ERROR:", repr(e))
        raise HTTPException(
            status_code=500, detail=f"Failed to send OTP: {str(e)}")


# ---------------- VERIFY OTP ----------------
@app.post("/verify-reset-otp")
async def verify_reset_otp(data: VerifyOTPRequest):

    result = supabase.table("password_reset_otps") \
        .select("*") \
        .eq("email", data.email) \
        .execute()

    if not result.data:
        raise HTTPException(400, "OTP not found")

    record = result.data[0]

    if record["otp"] != data.otp:
        raise HTTPException(400, "Invalid OTP")

    expires_at = datetime.fromisoformat(record["expires_at"])
    current_time = datetime.now(timezone.utc) if expires_at.tzinfo is not None else datetime.utcnow()

    if current_time > expires_at:
        raise HTTPException(400, "OTP expired")

    return {"success": True}


# ---------------- UPDATE PASSWORD ----------------
@app.post("/update-password")
async def update_password(data: UpdatePasswordRequest):

    try:
        target_user_id = None
        if data.user_id:
            target_user_id = data.user_id
            print(f"UPDATE PASSWORD: Using user_id '{target_user_id}'")
        elif data.email:
            email_clean = data.email.strip()
            print(f"UPDATE PASSWORD: Cleaned email is '{email_clean}'")
            users = supabase_admin.auth.admin.list_users()
            user = next((u for u in users if u.email and u.email.lower() == email_clean.lower()), None)
            if not user:
                print(f"UPDATE PASSWORD: User '{email_clean}' NOT found in Supabase Auth list.")
                raise HTTPException(404, "User not found")
            target_user_id = user.id
        else:
            raise HTTPException(400, "Either email or user_id must be provided")

        supabase_admin.auth.admin.update_user_by_id(
            target_user_id,
            {"password": data.password}
        )

        # Clean up reset OTP if lookup was email-based
        if data.email:
            supabase.table("password_reset_otps") \
                .delete() \
                .eq("email", data.email) \
                .execute()

        return {"success": True, "message": "Password updated"}

    except HTTPException as he:
        raise he
    except Exception as e:
        print("UPDATE PASSWORD ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- UPDATE EMAIL ----------------
class UpdateEmailRequest(BaseModel):
    user_id: str
    new_email: str
    current_password: str

@app.post("/update-email")
async def update_email(data: UpdateEmailRequest):
    try:
        # Update email in Supabase Auth
        supabase_admin.auth.admin.update_user_by_id(
            data.user_id,
            {"email": data.new_email.strip().lower()}
        )

        # Update email in user_profiles table
        supabase.table("user_profiles") \
            .update({"email": data.new_email.strip().lower()}) \
            .eq("id", data.user_id) \
            .execute()

        return {"success": True, "message": "Email updated successfully"}

    except Exception as e:
        print("UPDATE EMAIL ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- ONBOARDING ----------------
@app.post("/save-onboarding")
async def save_onboarding(data: OnboardingData):
    prefs = json.dumps({
        "unit": data.weight_unit,
        "starting_weight": data.starting_weight if data.starting_weight is not None else data.weight_kg
    })

    supabase.table("user_profiles").update({
        "age": data.age,
        "weight_kg": data.weight_kg,
        "height_cm": data.height_cm,
        "goal": data.goal,
        "goalWeight": data.goal_weight,
        "targetDate": data.target_date,
        "location": prefs
    }).eq("id", data.user_id).execute()

    return {"success": True}


@app.post("/update-weight")
async def update_weight(data: UpdateWeightData):
    try:
        # Convert to kg if user operates in lbs
        weight_kg = data.new_weight
        if data.unit == "lbs":
            weight_kg = data.new_weight / 2.20462

        # Update the specific user's weight_kg column
        supabase.table("user_profiles").update({
            "weight_kg": weight_kg
        }).eq("id", data.user_id).execute()
        
        return {"success": True, "message": "Weight logged successfully"}
    except Exception as e:
        print("UPDATE WEIGHT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to log weight")


@app.post("/update-profile")
async def update_profile(data: UpdateProfileRequest):
    try:
        supabase.table("user_profiles").update({
            "name": data.name,
            "email": data.email
        }).eq("id", data.user_id).execute()
        return {"success": True}
    except Exception as e:
        print("UPDATE PROFILE ERROR:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to update profile info")


@app.post("/update-subscription")
async def update_subscription(data: UpdateSubscriptionRequest):
    try:
        # Fetch existing profile location/preferences JSON to preserve other keys
        res = supabase.table("user_profiles").select("location").eq("id", data.user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        prefs = {}
        loc_str = res.data[0].get("location")
        if loc_str:
            try:
                prefs = json.loads(loc_str)
            except:
                pass
                
        prefs["is_premium"] = data.is_premium
        
        supabase.table("user_profiles").update({
            "location": json.dumps(prefs)
        }).eq("id", data.user_id).execute()
        
        return {"success": True, "is_premium": data.is_premium}
    except HTTPException as he:
        raise he
    except Exception as e:
        print("UPDATE SUBSCRIPTION ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- MEALS LOGGING ----------------
@app.post("/meals")
async def log_meal(data: MealLog):
    try:
        supabase.table("logged_meals").upsert({
            "id": data.id,
            "user_id": data.user_id,
            "name": data.name,
            "calories": data.calories,
            "protein": data.protein,
            "carbs": data.carbs,
            "fats": data.fats,
            "logged_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        return {"success": True}
    except Exception as e:
        print("LOG MEAL ERROR:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to log meal")


@app.delete("/meals/{user_id}/{meal_id}")
async def delete_meal(user_id: str, meal_id: str):
    try:
        supabase.table("logged_meals").delete().eq("user_id", user_id).eq("id", meal_id).execute()
        return {"success": True}
    except Exception as e:
        print("DELETE MEAL ERROR:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to delete logged meal")


# ---------------- WORKOUTS LOGGING ----------------
@app.post("/workouts")
async def log_workout(data: WorkoutLog):
    try:
        supabase.table("logged_workouts").upsert({
            "id": data.id,
            "user_id": data.user_id,
            "name": data.name,
            "calories_burned": data.calories_burned,
            "active_minutes": data.active_minutes,
            "logged_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        return {"success": True}
    except Exception as e:
        print("LOG WORKOUT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to log workout")


# ---------------- WATER LOGGING ----------------
@app.post("/water")
async def log_water(data: WaterLog):
    try:
        supabase.table("water_logs").upsert({
            "user_id": data.user_id,
            "glasses": data.glasses,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        return {"success": True}
    except Exception as e:
        print("LOG WATER ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=f"Failed to log water: {repr(e)}")


# ---------------- PROFILE PICTURE UPDATE ----------------
@app.post("/update-profile-picture")
async def update_profile_picture(data: ProfilePictureUpdate):
    try:
        supabase.table("user_profiles").update({
            "profile_image": data.profile_image
        }).eq("id", data.user_id).execute()
        return {"success": True}
    except Exception as e:
        print("UPDATE PROFILE IMAGE ERROR:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to update profile picture")


# ---------------- DASHBOARD ANALYTICS ----------------
@app.get("/dashboard/{user_id}")
async def get_dashboard_data(user_id: str):
    try:
        user_result = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        user = user_result.data[0]
        
        # Parse Preferences from location JSON
        prefs = {}
        if user.get("location"):
            try:
                prefs = json.loads(user["location"])
            except:
                pass
                
        unit = prefs.get("unit", "kg")
        
        # Raw kg values
        current_weight_kg = user.get("weight_kg") or 70.0
        starting_weight_kg = prefs.get("starting_weight") or current_weight_kg
        target_weight_kg = user.get("goalWeight") or 70.0
        
        # Calculate dynamic macros based on goals using kg
        goal = user.get("goal") or "Maintain Weight"
        
        if "Lose" in goal:
            target_calories = 1800
            target_protein = int(current_weight_kg * 2.2) # High protein to preserve muscle
            target_carbs = 150
            target_fats = 60
        elif "Gain" in goal:
            target_calories = 2800
            target_protein = int(current_weight_kg * 2.0)
            target_carbs = 350
            target_fats = 80
        else:
            target_calories = 2200
            target_protein = int(current_weight_kg * 1.8)
            target_carbs = 250
            target_fats = 70
            
        # Convert to lbs if user operates in lbs
        if unit == "lbs":
            current_weight = round(current_weight_kg * 2.20462, 1)
            starting_weight = round(starting_weight_kg * 2.20462, 1)
            target_weight = round(target_weight_kg * 2.20462, 1)
        else:
            current_weight = round(current_weight_kg, 1)
            starting_weight = round(starting_weight_kg, 1)
            target_weight = round(target_weight_kg, 1)

        # Calculate start of today in Manila time (UTC+8) to filter today's logs
        manila_tz = timezone(timedelta(hours=8))
        now_manila = datetime.now(manila_tz)
        today_start_manila = now_manila.replace(hour=0, minute=0, second=0, microsecond=0)
        today_start_utc = today_start_manila.astimezone(timezone.utc)

        # 1. Fetch meals logged today
        meals_res = supabase.table("logged_meals") \
            .select("*") \
            .eq("user_id", user_id) \
            .gte("logged_at", today_start_utc.isoformat()) \
            .execute()
        
        logged_meals_data = meals_res.data or []
        logged_meal_ids = [m["id"] for m in logged_meals_data]
        
        consumed_calories = sum(m["calories"] for m in logged_meals_data)
        consumed_protein = sum(m["protein"] for m in logged_meals_data)
        consumed_carbs = sum(m["carbs"] for m in logged_meals_data)
        consumed_fats = sum(m["fats"] for m in logged_meals_data)

        # 2. Fetch water logs
        water_res = supabase.table("water_logs") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()
        
        glasses = 0
        if water_res.data:
            record = water_res.data[0]
            updated_at_str = record.get("updated_at")
            if updated_at_str:
                try:
                    updated_at = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
                    if updated_at >= today_start_utc:
                        glasses = record.get("glasses", 0)
                except Exception as ex:
                    print("Error parsing water updated_at timestamp:", ex)
                    glasses = record.get("glasses", 0)
            else:
                glasses = record.get("glasses", 0)

        # 3. Fetch workouts logged today
        workouts_res = supabase.table("logged_workouts") \
            .select("*") \
            .eq("user_id", user_id) \
            .gte("logged_at", today_start_utc.isoformat()) \
            .execute()
            
        workouts_data = workouts_res.data or []
        calories_burned = sum(w["calories_burned"] for w in workouts_data)
        active_minutes = sum(w["active_minutes"] for w in workouts_data)
        recent_exercise = workouts_data[-1]["name"] if workouts_data else "None"

        # Premium status from user preferences JSON
        is_premium = prefs.get("is_premium", False)
        
        return {
            "profile": {
                "name": user.get("name", "User"),
                "email": user.get("email", ""),
                "profileImage": user.get("profile_image"),
                "goal": goal,
                "currentWeight": current_weight,
                "targetWeight": target_weight,
                "startingWeight": starting_weight,
                "unit": unit,
                "age": user.get("age"),
                "height": user.get("height_cm")
            },
            "nutrition": {
                "isPremium": is_premium,
                "targetCalories": target_calories,
                "consumedCalories": consumed_calories,
                "protein": {"current": consumed_protein, "target": target_protein},
                "carbs": {"current": consumed_carbs, "target": target_carbs},
                "fats": {"current": consumed_fats, "target": target_fats}
            },
            "water": {
                "glasses": glasses
            },
            "exercise": {
                "caloriesBurned": calories_burned,
                "activeMinutes": active_minutes,
                "recentExercise": recent_exercise
            },
            "loggedMealIds": logged_meal_ids,
            "weeklyActivity": [
                {"day": "M", "value": random.randint(300, 800)},
                {"day": "T", "value": random.randint(300, 800)},
                {"day": "W", "value": random.randint(300, 800)},
                {"day": "Th", "value": random.randint(300, 800)},
                {"day": "F", "value": random.randint(300, 800)},
                {"day": "S", "value": random.randint(300, 800)},
                {"day": "Su", "value": random.randint(300, 800)},
            ]
        }
    except Exception as e:
        print("DASHBOARD ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- AI HELPER FOR RETRIES & FALLBACKS ----------------
def generate_gemini_content(prompt: str, image_bytes: bytes = None):
    if not genai_client:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
    # Try multiple models to fallback under high demand
    models_to_try = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']
    last_error = None
    
    for model_name in models_to_try:
        for attempt in range(3):
            try:
                if image_bytes:
                    contents = [
                        types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg'),
                        prompt
                    ]
                else:
                    contents = prompt
                
                response = genai_client.models.generate_content(
                    model=model_name,
                    contents=contents
                )
                return response
            except Exception as e:
                last_error = e
                err_msg = str(e)
                print(f"Gemini API attempt {attempt+1} failed on {model_name}: {err_msg}")
                # Retry on typical transient failures
                if any(x in err_msg.lower() for x in ["503", "429", "resource_exhausted", "unavailable", "overloaded", "demand", "limit"]):
                    time.sleep(1 + attempt)
                    continue
                else:
                    break # Structural failure, don't retry, go to fallback model
                    
    raise last_error or HTTPException(status_code=503, detail="Gemini API failed on all models with no captured exception")


# ---------------- AI CHATBOT ----------------
@app.post("/chat")
def chat_with_ai(data: ChatMessageRequest):
    try:
        # Fetch user profile for context
        user_result = supabase.table("user_profiles").select("*").eq("id", data.user_id).execute()
        context_prompt = ""
        if user_result.data:
            user = user_result.data[0]
            
            # Parse preferences from location column
            prefs = {}
            if user.get("location"):
                try:
                    prefs = json.loads(user["location"])
                except:
                    pass
            
            is_premium = prefs.get("is_premium", False)
            if not is_premium:
                manila_tz = timezone(timedelta(hours=8))
                today_str = datetime.now(manila_tz).strftime("%Y-%m-%d")
                usage = prefs.get("usage", {})
                day_usage = usage.get(today_str, {"scans": 0, "chats": 0})
                
                if day_usage.get("chats", 0) >= 10:
                    raise HTTPException(status_code=403, detail="Daily chat limit reached. Please upgrade to premium for unlimited access.")
                
                day_usage["chats"] = day_usage.get("chats", 0) + 1
                usage[today_str] = day_usage
                prefs["usage"] = usage
                
                # Save incremented count back to database
                supabase.table("user_profiles").update({"location": json.dumps(prefs)}).eq("id", data.user_id).execute()

            unit = prefs.get("unit", "kg")
            current_weight_kg = user.get("weight_kg")
            target_weight_kg = user.get("goalWeight")
            starting_weight_kg = prefs.get("starting_weight")
            
            current_weight_str = f"{current_weight_kg} kg" if current_weight_kg else "Not logged"
            target_weight_str = f"{target_weight_kg} kg" if target_weight_kg else "Not set"
            starting_weight_str = f"{starting_weight_kg} kg" if starting_weight_kg else "Not logged"
            
            if unit == "lbs":
                if current_weight_kg:
                    current_weight_str = f"{round(current_weight_kg * 2.20462, 1)} lbs ({current_weight_kg} kg)"
                if target_weight_kg:
                    target_weight_str = f"{round(target_weight_kg * 2.20462, 1)} lbs ({target_weight_kg} kg)"
                if starting_weight_kg:
                    starting_weight_str = f"{round(starting_weight_kg * 2.20462, 1)} lbs ({starting_weight_kg} kg)"
            
            context_prompt = (
                f"User Profile Context:\n"
                f"- User Name: {user.get('name', 'User')}\n"
                f"- Email: {user.get('email', 'N/A')}\n"
                f"- Age: {user.get('age', 'N/A')}\n"
                f"- Height: {user.get('height_cm', 'N/A')} cm\n"
                f"- Preferred Unit: {unit}\n"
                f"- Current Weight: {current_weight_str}\n"
                f"- Starting Weight: {starting_weight_str}\n"
                f"- Goal Weight: {target_weight_str}\n"
                f"- Goal Type: {user.get('goal', 'N/A')}\n"
                f"- Target Date for Goal: {user.get('targetDate', 'N/A')}\n\n"
                f"You are MacroSync AI, a health and fitness assistant. Use this profile context when responding to the user. "
                f"If the user asks about their weight, name, height, or progress, answer accurately using the values above in their preferred unit ({unit}). "
                f"Respond concisely, friendly, and helpfully.\n\n"
            )
        
        full_prompt = context_prompt + f"User message: {data.message}"
        
        response = generate_gemini_content(full_prompt)
        
        return {"response": response.text}
    except HTTPException as he:
        raise he
    except Exception as e:
        print("CHAT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- AI RECIPE GENERATOR ----------------
@app.post("/generate-recipe")
def generate_recipe(data: RecipeRequest):
    try:
        prompt = f"""
        You are an expert local nutritionist and chef. The user wants to make a recipe using the following ingredients: {data.ingredients}.
        Their budget constraint is: {data.budget}.
        Their location is: {data.location}.
        
        Generate a healthy, practical recipe that strictly fits these constraints. 
        Format your response as a valid JSON object with the following exact keys:
        - "title" (string, the name of the recipe)
        - "calories" (integer)
        - "protein" (string, e.g., "30g")
        - "carbs" (string, e.g., "40g")
        - "fats" (string, e.g., "15g")
        - "time" (string, e.g., "20 mins")
        - "budget" (string, matching their budget)
        - "location" (string, matching their location)
        - "ingredients" (list of strings, the specific measurements and ingredients)
        - "instructions" (list of strings, step by step instructions)
        
        Do not include markdown code block formatting like ```json in the output, just the raw JSON object.
        """
        
        response = generate_gemini_content(prompt)
        
        recipe_json = response.text.strip()
        if recipe_json.startswith("```json"):
            recipe_json = recipe_json[7:-3]
        elif recipe_json.startswith("```"):
            recipe_json = recipe_json[3:-3]
            
        recipe_data = json.loads(recipe_json.strip())
        
        # Add a mock ID so the frontend can render it
        import random
        recipe_data["id"] = random.randint(1000, 9999)
        
        return recipe_data
        
    except Exception as e:
        print("RECIPE GENERATOR ERROR:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to generate recipe. Please try again.")


# ---------------- AI VISION FOOD ANALYSIS ----------------
@app.post("/analyze-food")
def analyze_food(data: AnalyzeFoodRequest):
    try:
        if data.user_id:
            user_result = supabase.table("user_profiles").select("*").eq("id", data.user_id).execute()
            if user_result.data:
                user = user_result.data[0]
                prefs = {}
                if user.get("location"):
                    try:
                        prefs = json.loads(user["location"])
                    except:
                        pass
                
                is_premium = prefs.get("is_premium", False)
                if not is_premium:
                    manila_tz = timezone(timedelta(hours=8))
                    today_str = datetime.now(manila_tz).strftime("%Y-%m-%d")
                    usage = prefs.get("usage", {})
                    day_usage = usage.get(today_str, {"scans": 0, "chats": 0})
                    
                    if day_usage.get("scans", 0) >= 5:
                        raise HTTPException(status_code=403, detail="Daily food scanner limit reached. Please upgrade to premium for unlimited access.")
                    
                    day_usage["scans"] = day_usage.get("scans", 0) + 1
                    usage[today_str] = day_usage
                    prefs["usage"] = usage
                    
                    supabase.table("user_profiles").update({"location": json.dumps(prefs)}).eq("id", data.user_id).execute()

        image_bytes = base64.b64decode(data.image_base64)
        
        prompt = """
        Analyze this food image. 
        IMPORTANT: If the image is blurry, unclear, or you cannot confidently identify the food, you MUST return exactly this JSON:
        {"error": "Image is too blurry or unclear"}
        
        Otherwise, return a JSON object with the following keys:
        - "name" (string, the name of the food)
        - "serving_weight_g" (integer, the estimated portion size/weight in grams)
        - "confidence" (integer between 0 and 100)
        - "calories" (integer)
        - "protein" (integer, in grams)
        - "carbs" (integer, in grams)
        - "fats" (integer, in grams)
        
        Do not include markdown code block formatting like ```json in the output, just the raw JSON object.
        """
        
        response = generate_gemini_content(prompt, image_bytes=image_bytes)
        
        result_json = response.text.strip()
        if result_json.startswith("```json"):
            result_json = result_json[7:-3]
        elif result_json.startswith("```"):
            result_json = result_json[3:-3]
            
        result_data = json.loads(result_json.strip())
        
        return result_data
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print("VISION ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


def get_static_fallback_workouts(goal: str):
    goal_lower = goal.lower() if goal else ""
    if "muscle" in goal_lower or "gain" in goal_lower:
        return [
            {
                "id": 1,
                "title": "Home Calisthenics Push & Core Mass",
                "intensity": "Intense",
                "duration": "25 mins",
                "targetGains": "Muscle Growth",
                "caloriesBurn": 290,
                "description": "Decline push-ups, explosive push-ups, chair dips, planks, and leg raises for upper body muscle development.",
                "tutorials": [
                    {
                        "name": "Decline Bodyweight Push-Ups",
                        "target": "3 Sets x 12 Reps",
                        "setup": "Elevate feet on a chair or couch. Place hands slightly wider than shoulders.",
                        "form": "Lower your chest with control, keeping your body in a straight line, then push up explosively."
                    },
                    {
                        "name": "Tricep Chair Dips",
                        "target": "3 Sets x 15 Reps",
                        "setup": "Sit on edge of a chair, place palms next to hips, slide glutes forward off the seat.",
                        "form": "Bend elbows to 90 degrees to lower hips. Press firmly through palms to lock out."
                    },
                    {
                        "name": "Strict Isometric Floor Plank",
                        "target": "3 Sets x 45 Seconds",
                        "setup": "Place forearms on the floor, elbows aligned under shoulders.",
                        "form": "Squeeze core, glutes, and thighs. Maintain a perfectly flat table posture."
                    }
                ]
            },
            {
                "id": 2,
                "title": "Lower Body & Legs Hypertrophy",
                "intensity": "Moderate",
                "duration": "20 mins",
                "targetGains": "Leg Strength",
                "caloriesBurn": 210,
                "description": "Slow tempo air squats, bulgarian split squats, and calf raises to build lower body muscle mass.",
                "tutorials": [
                    {
                        "name": "Air Squats (Slow Tempo)",
                        "target": "4 Sets x 15 Reps",
                        "setup": "Feet shoulder-width apart, toes pointing slightly out.",
                        "form": "Lower down slowly for 3 seconds, pause at parallel, then drive back up in 1 second."
                    },
                    {
                        "name": "Bulgarian Split Squats",
                        "target": "3 Sets x 10 Reps per leg",
                        "setup": "Place one foot behind you on a chair, standard stance with the forward foot.",
                        "form": "Lower your hips until your back knee is just above the floor. Drive through front heel."
                    },
                    {
                        "name": "Single-Leg Calf Raises",
                        "target": "3 Sets x 20 Reps per leg",
                        "setup": "Stand on one foot near a wall or chair for balance.",
                        "form": "Raise up onto your toes as high as possible, pause at top, lower slowly."
                    }
                ]
            },
            {
                "id": 3,
                "title": "Core Sculpt & Stability",
                "intensity": "Light",
                "duration": "15 mins",
                "targetGains": "Abdominal Strength",
                "caloriesBurn": 90,
                "description": "Bicycle crunches, lying leg raises, and bird-dogs for absolute core stabilization.",
                "tutorials": [
                    {
                        "name": "Lying Leg Raises",
                        "target": "3 Sets x 12 Reps",
                        "setup": "Lie flat on your back, hands placed under your glutes for lower back support.",
                        "form": "Keep legs straight, lift them to 90 degrees, then lower slowly without touching the floor."
                    },
                    {
                        "name": "Bicycle Crunches",
                        "target": "3 Sets x 20 Reps",
                        "setup": "Lie on back, hands behind head, knees bent at 90 degrees.",
                        "form": "Alternately bring elbow to opposite knee while extending the other leg straight."
                    },
                    {
                        "name": "Isometric Bird-Dog",
                        "target": "3 Sets x 10 Reps per side",
                        "setup": "All fours position with knees under hips and hands under shoulders.",
                        "form": "Reach right arm forward and left leg backward simultaneously. Hold for 2 seconds."
                    }
                ]
            }
        ]
    elif "loss" in goal_lower or "lost" in goal_lower or "fat" in goal_lower:
        return [
            {
                "id": 1,
                "title": "Fat-Burning Metabolic HIIT",
                "intensity": "Intense",
                "duration": "20 mins",
                "targetGains": "Fat Loss & Endurance",
                "caloriesBurn": 320,
                "description": "High-intensity burpees, mountain climbers, and jumping lunges to trigger the afterburn effect.",
                "tutorials": [
                    {
                        "name": "Full Body Burpees",
                        "target": "4 Sets x 12 Reps",
                        "setup": "Stand tall, feet shoulder-width apart.",
                        "form": "Drop to squat, kick feet back to plank, perform pushup, snap feet back, and jump up explosively."
                    },
                    {
                        "name": "Jumping Lunges",
                        "target": "3 Sets x 30 Seconds",
                        "setup": "Step into a lunge stance, core tight.",
                        "form": "Explode upward and switch leg positions in the air, landing softly into a lunge."
                    },
                    {
                        "name": "High-Speed Mountain Climbers",
                        "target": "3 Sets x 45 Seconds",
                        "setup": "High push-up plank, shoulders stacked over wrists.",
                        "form": "Drive knees to chest as fast as possible while maintaining flat hips."
                    }
                ]
            },
            {
                "id": 2,
                "title": "Full-Body Conditioning",
                "intensity": "Moderate",
                "duration": "18 mins",
                "targetGains": "Cardio Stamina",
                "caloriesBurn": 220,
                "description": "Jumping jacks, air squats, and push-up rotations for steady calorie expenditure.",
                "tutorials": [
                    {
                        "name": "Jumping Jacks",
                        "target": "3 Sets x 60 Seconds",
                        "setup": "Stand with feet together, arms at your sides.",
                        "form": "Jump feet out while swinging arms overhead. Return to start quickly."
                    },
                    {
                        "name": "Air Squats (Paced)",
                        "target": "3 Sets x 20 Reps",
                        "setup": "Feet shoulder-width apart, arms extended forward.",
                        "form": "Squat down until thighs are parallel to ground, maintaining a steady, fast pace."
                    },
                    {
                        "name": "Push-up to Side Plank Rotation",
                        "target": "3 Sets x 10 Reps",
                        "setup": "Start in a standard push-up position.",
                        "form": "Do a push-up, then rotate your body open into a side plank. Alternate sides."
                    }
                ]
            },
            {
                "id": 3,
                "title": "Core Burn & Cardio Flow",
                "intensity": "Light",
                "duration": "15 mins",
                "targetGains": "Toning & Agility",
                "caloriesBurn": 120,
                "description": "Plank taps, flutter kicks, and dynamic cat-cow for low impact cardio and core toning.",
                "tutorials": [
                    {
                        "name": "Plank Shoulder Taps",
                        "target": "3 Sets x 20 Reps",
                        "setup": "High push-up position, feet slightly wider than usual for balance.",
                        "form": "Tap left shoulder with right hand, then right shoulder with left hand. Keep hips stable."
                    },
                    {
                        "name": "Flutter Kicks",
                        "target": "3 Sets x 40 Seconds",
                        "setup": "Lying on back, lift head/shoulders slightly, raise heels 6 inches off ground.",
                        "form": "Kick legs up and down in a small, rapid fluttering motion. Keep lower back flat."
                    },
                    {
                        "name": "Dynamic Cat-Cow Flow",
                        "target": "2 Sets x 12 Cycles",
                        "setup": "On all fours, knees under hips, hands under shoulders.",
                        "form": "Inhale to arch back down and look up; exhale to round spine and look at navel."
                    }
                ]
            }
        ]
    else:
        return [
            {
                "id": 1,
                "title": "Functional Full-Body Integration",
                "intensity": "Intense",
                "duration": "22 mins",
                "targetGains": "Strength & Agility",
                "caloriesBurn": 260,
                "description": "Walkout pushups, speed air squats, and plank jacks to build balanced strength.",
                "tutorials": [
                    {
                        "name": "Inchworm Walkout to Push-up",
                        "target": "3 Sets x 10 Reps",
                        "setup": "Stand straight, bend at hips, place hands on floor near feet.",
                        "form": "Walk hands forward to plank, perform a pushup, then walk hands back and stand tall."
                    },
                    {
                        "name": "Plank Jacks",
                        "target": "3 Sets x 45 Seconds",
                        "setup": "Low forearm plank position, body in straight line.",
                        "form": "Jump feet out wide, then jump them back together, maintaining plank height."
                    },
                    {
                        "name": "Jumping Squats",
                        "target": "3 Sets x 12 Reps",
                        "setup": "Standard squat stance.",
                        "form": "Squat down, then explode upwards into a vertical jump. Land softly."
                    }
                ]
            },
            {
                "id": 2,
                "title": "Steady Mobility & Strength",
                "intensity": "Moderate",
                "duration": "20 mins",
                "targetGains": "Joint Mobility & Tone",
                "caloriesBurn": 180,
                "description": "Reverse lunges, pushups, and bird-dog sequence for whole-body mobility.",
                "tutorials": [
                    {
                        "name": "Standard Bodyweight Pushups",
                        "target": "3 Sets x 12 Reps",
                        "setup": "Plank position, hands shoulder-width apart.",
                        "form": "Lower chest to ground, elbows tucked at 45 degrees, push up fully."
                    },
                    {
                        "name": "Reverse Lunges (Alternating)",
                        "target": "3 Sets x 16 Reps",
                        "setup": "Stand tall, hands on hips.",
                        "form": "Step back, drop knee to 90 degrees, return to start. Alternate legs."
                    },
                    {
                        "name": "Alternating Bird-Dog Flow",
                        "target": "3 Sets x 12 Reps",
                        "setup": "On all fours, knees under hips.",
                        "form": "Extend opposite arm and leg, hold for 1 second. Swap sides."
                    }
                ]
            },
            {
                "id": 3,
                "title": "Living Room Mobility & Posture Alignment",
                "intensity": "Light",
                "duration": "15 mins",
                "targetGains": "Flexibility & Health",
                "caloriesBurn": 85,
                "description": "Dynamic stretching sequences, yoga-inspired spinal decompression, and core stability activation patterns.",
                "tutorials": [
                    {
                        "name": "Quadruped Cat-Cow Flow",
                        "target": "2 Sets x 10 Cycles",
                        "setup": "All fours, knees under hips.",
                        "form": "Arch back down looking up (inhale), round spine looking down (exhale)."
                    },
                    {
                        "name": "Deep Yogi Squat Hold",
                        "target": "2 Sets x 45 Seconds",
                        "setup": "Stand with feet slightly wider than shoulder-width, toes flared.",
                        "form": "Sit deep into a full squat. Press elbows against inside of knees to stretch hips."
                    },
                    {
                        "name": "Plank Knee-to-Elbow Taps",
                        "target": "2 Sets x 12 Reps",
                        "setup": "High push-up plank position.",
                        "form": "Bring right knee to touch right elbow. Return and bring left knee to left elbow."
                    }
                ]
            }
        ]


@app.get("/workouts/recommend/{user_id}")
def recommend_workouts(user_id: str):
    # Default goal fallback
    fallback_goal = "Maintain Weight"
    try:
        # Fetch user profiles from supabase
        profile_res = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
        if not profile_res.data:
            return get_static_fallback_workouts(fallback_goal)

        profile = profile_res.data[0]
        goal = profile.get("goal", "Maintain Weight")
        fallback_goal = goal
        weight_kg = profile.get("weight_kg", 70.0)
        goal_weight = profile.get("goalWeight", 70.0)
        height_cm = profile.get("height_cm", 170.0)
        age = profile.get("age", 25)

        # Manila timezone for seed date string so rotation changes daily
        manila_tz = timezone(timedelta(hours=8))
        now_manila = datetime.now(manila_tz)
        date_str = now_manila.strftime("%A, %B %d, %Y")

        prompt = f"""
        You are an elite personal fitness trainer. Recommend exactly 3 custom bodyweight home workout routines (one Light, one Moderate, one Intense) specifically tailored to the user's goal to achieve their target weight:
        - User Baseline: Age {age}, Height {height_cm}cm, Current Weight {weight_kg}kg
        - User Target Weight: {goal_weight}kg
        - Primary Fitness Goal: {goal}
        
        Generate safe, effective routines that require no gym equipment.
        To maintain daily variety, today's date rotation seed is: {date_str}. Recommend a unique combination of exercises for this specific date, different from typical recommendations.

        Return ONLY a JSON array of 3 objects (no markdown blocks, no backticks, just raw JSON).
        Each object must have the following keys:
        - "id" (integer: 1, 2, or 3)
        - "title" (string, descriptive title of the workout)
        - "intensity" (string: "Light", "Moderate", or "Intense")
        - "duration" (string, e.g. "15 mins", "20 mins", "25 mins")
        - "targetGains" (string, the main benefit, e.g. "Fat Loss & Conditioning", "Hypertrophy")
        - "caloriesBurn" (integer, estimated calorie burn)
        - "description" (string, brief summary of the routine)
        - "tutorials" (a list of exactly 3 exercise objects, each containing:
            - "name" (string, exercise name)
            - "target" (string, reps/sets or duration, e.g. "3 Sets x 12 Reps")
            - "setup" (string, starting position setup guide)
            - "form" (string, key movement and safety tips)
          )
        """

        if not genai_client:
            return get_static_fallback_workouts(goal)

        response = generate_gemini_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        workouts = json.loads(text)
        if isinstance(workouts, list) and len(workouts) == 3:
            return workouts
        else:
            print("Gemini response was not a list of 3 items, falling back.")
            return get_static_fallback_workouts(goal)
            
    except Exception as e:
        print("WORKOUT RECOMMENDATION ROUTE ERROR:", repr(e))
        return get_static_fallback_workouts(fallback_goal)


def get_static_fallback_meals(goal: str, targetCalories: int, targetProtein: int, targetCarbs: int, targetFats: int):
    return [
        {
            "id": "dp1",
            "mealType": "Breakfast",
            "title": "Local Eggs & Pandesal",
            "calories": int(round(targetCalories * 0.25)),
            "protein": f"{int(round(targetProtein * 0.25))}g",
            "carbs": f"{int(round(targetCarbs * 0.25))}g",
            "fats": f"{int(round(targetFats * 0.25))}g",
            "time": "8:00 AM",
            "ingredients": [
                "2 fresh local eggs",
                "2 pieces whole-wheat or regular pandesal bread",
                "1 tsp oil or butter for frying",
                "Pinch of salt and black pepper"
            ],
            "instructions": [
                "Heat oil or butter in a non-stick pan over medium heat.",
                "Crack the eggs in and cook scrambled or sunny-side-up as preferred.",
                "Toast your pandesal slices lightly in a toaster or pan.",
                "Plate the hot toasted pandesal, serve with the cooked eggs, and optionally season with salt and pepper."
            ]
        },
        {
            "id": "dp2",
            "mealType": "Lunch",
            "title": "Chicken Adobo & Rice",
            "calories": int(round(targetCalories * 0.35)),
            "protein": f"{int(round(targetProtein * 0.35))}g",
            "carbs": f"{int(round(targetCarbs * 0.35))}g",
            "fats": f"{int(round(targetFats * 0.35))}g",
            "time": "12:30 PM",
            "ingredients": [
                "150g skinless chicken thigh or breast, chopped",
                "1 cup cooked white or brown rice",
                "2 tbsp soy sauce",
                "1 tbsp vinegar",
                "2 cloves garlic, crushed",
                "1 dried bay leaf",
                "1/2 tsp whole black peppercorns"
            ],
            "instructions": [
                "Combine chicken, soy sauce, garlic, and peppercorns in a bowl. Marinate for 10-15 minutes.",
                "Heat a pot over medium-high heat and sear the chicken pieces until lightly browned.",
                "Pour in the marinade, vinegar, and add the bay leaf. Bring to a boil, then cover and lower the heat to simmer for 20 minutes.",
                "Serve hot chicken adobo with its savory sauce over a cup of steamed rice."
            ]
        },
        {
            "id": "dp3",
            "mealType": "Snack",
            "title": "Banana & Peanut Butter",
            "calories": int(round(targetCalories * 0.10)),
            "protein": f"{int(round(targetProtein * 0.10))}g",
            "carbs": f"{int(round(targetCarbs * 0.10))}g",
            "fats": f"{int(round(targetFats * 0.10))}g",
            "time": "4:00 PM",
            "ingredients": [
                "1 medium local banana (Lakatan or Latundan)",
                "1.5 tbsp natural unsweetened peanut butter"
            ],
            "instructions": [
                "Peel the banana and slice it horizontally or into bite-sized coins.",
                "Spread the natural unsweetened peanut butter evenly across the banana slices.",
                "Enjoy immediately as a high-potassium, healthy-fat pre-workout snack."
            ]
        },
        {
            "id": "dp4",
            "mealType": "Dinner",
            "title": "Grilled Fish & Veggies",
            "calories": int(round(targetCalories * 0.30)),
            "protein": f"{int(round(targetProtein * 0.30))}g",
            "carbs": f"{int(round(targetCarbs * 0.30))}g",
            "fats": f"{int(round(targetFats * 0.30))}g",
            "time": "7:30 PM",
            "ingredients": [
                "150g fresh local fish fillet (like Tilapia or Bangus)",
                "1 cup steamed mixed local vegetables (like Okra, Squash, Eggplant)",
                "1 tsp olive or coconut oil",
                "1 squeeze of fresh calamansi juice",
                "Salt, pepper, and garlic powder to taste"
            ],
            "instructions": [
                "Season the fish fillet with salt, pepper, garlic powder, and a squeeze of calamansi juice.",
                "Heat oil in a grill pan or skillet over medium-high heat and cook the fish for 3-4 minutes per side until flaky.",
                "Steam your mixed vegetables in a separate pot until tender but crisp.",
                "Serve the grilled fish hot alongside the steamed fresh vegetables."
            ]
        }
    ]


@app.get("/meals/recommend/{user_id}")
def recommend_meals(user_id: str):
    # Default macros fallback
    fallback_goal = "Maintain Weight"
    target_calories = 2200
    target_protein = 126
    target_carbs = 250
    target_fats = 70
    try:
        # Fetch user profiles from supabase
        profile_res = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
        if not profile_res.data:
            return get_static_fallback_meals(fallback_goal, target_calories, target_protein, target_carbs, target_fats)

        profile = profile_res.data[0]
        goal = profile.get("goal", "Maintain Weight")
        fallback_goal = goal
        weight_kg = profile.get("weight_kg", 70.0)

        # Calculate macros
        if "Lose" in goal:
            target_calories = 1800
            target_protein = int(weight_kg * 2.2)
            target_carbs = 150
            target_fats = 60
        elif "Gain" in goal:
            target_calories = 2800
            target_protein = int(weight_kg * 2.0)
            target_carbs = 350
            target_fats = 80
        else:
            target_calories = 2200
            target_protein = int(weight_kg * 1.8)
            target_carbs = 250
            target_fats = 70

        # Manila timezone for seed date string so rotation changes daily
        manila_tz = timezone(timedelta(hours=8))
        now_manila = datetime.now(manila_tz)
        date_str = now_manila.strftime("%A, %B %d, %Y")

        prompt = f"""
        You are an elite personal fitness dietitian. Recommend exactly 4 custom recipes (Breakfast, Lunch, Snack, Dinner) for this user profile:
        - Primary Fitness Goal: {goal}
        - Total Daily Nutritional Targets: {target_calories} kcal, {target_protein}g Protein, {target_carbs}g Carbs, {target_fats}g Fats.
        - Date Rotation Seed: {date_str}

        Guidelines:
        - Distribute the targets: Breakfast (25% calories), Lunch (35% calories), Snack (10% calories), Dinner (30% calories).
        - Recommend distinct healthy recipes with clear, easy to procure ingredients and easy cooking instructions.
        - Do not use any currency symbols other than the Philippine Peso sign (₱).

        Return ONLY a JSON array of exactly 4 objects (no markdown blocks, no backticks, just raw JSON).
        Each object must have the following keys:
        - "id" (string: "dp1", "dp2", "dp3", or "dp4")
        - "mealType" (string: "Breakfast", "Lunch", "Snack", or "Dinner")
        - "title" (string, recipe name)
        - "calories" (integer, calories in kcal)
        - "protein" (string, e.g. "30g")
        - "carbs" (string, e.g. "50g")
        - "fats" (string, e.g. "15g")
        - "time" (string, e.g. "8:00 AM", "12:30 PM", "4:00 PM", "7:30 PM")
        - "ingredients" (list of strings, ingredient items)
        - "instructions" (list of strings, cooking instructions)
        """

        if not genai_client:
            return get_static_fallback_meals(goal, target_calories, target_protein, target_carbs, target_fats)

        response = generate_gemini_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        meals = json.loads(text)
        if isinstance(meals, list) and len(meals) == 4:
            return meals
        else:
            print("Gemini response was not a list of 4 items, falling back.")
            return get_static_fallback_meals(goal, target_calories, target_protein, target_carbs, target_fats)
            
    except Exception as e:
        print("MEAL RECOMMENDATION ROUTE ERROR:", repr(e))
        return get_static_fallback_meals(fallback_goal, target_calories, target_protein, target_carbs, target_fats)


@app.get("/debug-key")
def debug_key():
    try:
        if not SUPABASE_KEY:
            return {"error": "SUPABASE_KEY is missing"}
        parts = SUPABASE_KEY.split(".")
        if len(parts) != 3:
            return {"error": "Invalid JWT format"}
        payload_b64 = parts[1]
        payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
        payload_json = json.loads(base64.b64decode(payload_b64).decode())
        return {
            "role": payload_json.get("role"),
            "ref": payload_json.get("ref"),
            "iss": payload_json.get("iss"),
            "key_length": len(SUPABASE_KEY)
        }
    except Exception as e:
        return {"error": f"Failed to parse key: {str(e)}"}