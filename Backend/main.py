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

app = FastAPI()

# ---------------- ENV ----------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ---------------- INIT CLIENTS ----------------
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

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
    email: str
    password: str


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


class UpdateProfileRequest(BaseModel):
    user_id: str
    name: str
    email: str


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

        return {
            "user": auth.user,
            "session": auth.session
        }

    except Exception as e:
        print("LOGIN ERROR:", repr(e))
        raise HTTPException(status_code=400, detail=str(e))


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
        users = supabase.auth.admin.list_users()

        user = next((u for u in users if u.email and u.email.lower() == data.email.lower()), None)

        if not user:
            raise HTTPException(404, "User not found")

        supabase.auth.admin.update_user_by_id(
            user.id,
            {"password": data.password}
        )

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

        # For fresh days, consumed calories starts at 0
        consumed_calories = 0
        
        # Premium status mocked to false for free tier UI demonstration
        is_premium = False
        
        return {
            "profile": {
                "name": user.get("name", "User"),
                "email": user.get("email", ""),
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
                "protein": {"current": 0, "target": target_protein},
                "carbs": {"current": 0, "target": target_carbs},
                "fats": {"current": 0, "target": target_fats}
            },
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
    models_to_try = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
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
                    
    raise last_error


# ---------------- AI CHATBOT ----------------
@app.post("/chat")
async def chat_with_ai(data: ChatMessageRequest):
    try:
        # Fetch user profile for context
        user_result = supabase.table("user_profiles").select("*").eq("id", data.user_id).execute()
        context_prompt = ""
        if user_result.data:
            user = user_result.data[0]
            context_prompt = f"User Profile Context: You are MacroSync AI, a health and fitness assistant. The user is {user.get('name', 'a user')}. Age: {user.get('age')}, Current Weight: {user.get('weight_kg')} kg, Goal: {user.get('goal')}, Target Weight: {user.get('goal_weight')} kg. Respond concisely and helpfully to their fitness and nutrition queries based on this profile.\n\n"
        
        full_prompt = context_prompt + f"User message: {data.message}"
        
        response = generate_gemini_content(full_prompt)
        
        return {"response": response.text}
    except Exception as e:
        print("CHAT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- AI RECIPE GENERATOR ----------------
@app.post("/generate-recipe")
async def generate_recipe(data: RecipeRequest):
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
async def analyze_food(data: AnalyzeFoodRequest):
    try:
        image_bytes = base64.b64decode(data.image_base64)
        
        prompt = """
        Analyze this food image. 
        IMPORTANT: If the image is blurry, unclear, or you cannot confidently identify the food, you MUST return exactly this JSON:
        {"error": "Image is too blurry or unclear"}
        
        Otherwise, return a JSON object with the following keys:
        - "name" (string, the name of the food)
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
        
    except Exception as e:
        print("VISION ERROR:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to analyze image. Please try again.")


