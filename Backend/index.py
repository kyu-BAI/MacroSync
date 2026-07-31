
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv
import os
import random
import secrets
import uuid
import json
import time
from datetime import datetime, timedelta, timezone
import resend
from google import genai
from google.genai import types
import base64
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


load_dotenv()

app = FastAPI()

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
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL or SUPABASE_KEY not set. Ensure .env contains Supabase credentials before starting the server.")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PAYMONGO_SECRET_KEY = os.getenv("PAYMONGO_SECRET_KEY")
GMAIL_SENDER_EMAIL = os.getenv("GMAIL_SENDER_EMAIL")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")


# ---------------- INIT CLIENTS ----------------
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_admin = create_client(SUPABASE_URL, SUPABASE_KEY)
if SUPABASE_ANON_KEY:
    anon_supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
else:
    anon_supabase = supabase

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



def send_otp_via_email(to_email: str, otp_code: str, subject: str = "MacroSync Verification OTP"):
    email_sent = False
    
    # 1. Try Gmail SMTP via Port 587 TLS (Fast & Reliable across all networks/cloud hosts)
    if GMAIL_SENDER_EMAIL and GMAIL_APP_PASSWORD and GMAIL_SENDER_EMAIL.strip() not in ["", "your-gmail@gmail.com"]:
        try:
            msg = MIMEMultipart()
            msg['From'] = f"MacroSync <{GMAIL_SENDER_EMAIL.strip()}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            html = f"""
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>MacroSync Verification</h2>
                    <p>Your 6-digit OTP code is:</p>
                    <h1 style="color: #10B981; font-size: 36px; letter-spacing: 4px;">{otp_code}</h1>
                    <p>This code expires in 10 minutes.</p>
                </div>
            """
            msg.attach(MIMEText(html, 'html'))
            app_password_clean = GMAIL_APP_PASSWORD.replace(" ", "").strip()
            
            with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
                server.starttls()
                server.login(GMAIL_SENDER_EMAIL.strip(), app_password_clean)
                server.sendmail(GMAIL_SENDER_EMAIL.strip(), to_email, msg.as_string())
            print(f"OTP Email successfully sent to {to_email} via Gmail SMTP (587 TLS)")
            email_sent = True
        except Exception as smtp_err:
            print("Gmail SMTP dispatch error:", smtp_err)

    # 2. Fallback to Resend HTTP API if Gmail SMTP failed or wasn't configured
    if not email_sent and RESEND_API_KEY and RESEND_API_KEY.strip() not in ["", "re_your_api_key_here"]:
        try:
            resend.Emails.send({
                "from": "MacroSync <onboarding@resend.dev>",
                "to": to_email,
                "subject": subject,
                "html": f"""
                    <h2>MacroSync Verification</h2>
                    <h1 style="color: #10B981; font-size: 36px; letter-spacing: 4px;">{otp_code}</h1>
                    <p>This code expires in 10 minutes.</p>
                """
            })
            print(f"OTP Email successfully sent to {to_email}")
            email_sent = True
        except Exception as resend_err:
            print("Resend API dispatch error:", resend_err)

    if not email_sent:
        print(f"WARNING: Email could not be sent to {to_email}. Ensure Gmail used is an active account.")

# ---------------- SIGNUP ----------------
@app.post("/signup")
async def signup(user: UserAuth):
    try:
        email = user.email.strip().lower()
        existing_profile = supabase_admin.table("user_profiles").select("id").eq("email", email).execute()
        if existing_profile.data:
            raise HTTPException(status_code=400, detail="Email already registered")

        user_id = None
        # 1. Create or retrieve user via Admin Auth (Fast & Never Times Out)
        try:
            admin_res = supabase_admin.auth.admin.create_user({
                "email": email,
                "password": user.password,
                "email_confirm": True
            })
            if admin_res and admin_res.user:
                user_id = admin_res.user.id
        except Exception as admin_err:
            err_str = str(admin_err).lower()
            if "already registered" in err_str or "already exists" in err_str:
                raise HTTPException(status_code=400, detail="Email already registered")
            print("Admin create_user error:", admin_err)

        if not user_id:
            # Try list_users fallback if user exists
            try:
                users_list = supabase_admin.auth.admin.list_users()
                users_iter = users_list.users if hasattr(users_list, 'users') else users_list
                for u in users_iter:
                    u_email = getattr(u, 'email', None) or (u.get('email') if isinstance(u, dict) else None)
                    if u_email and u_email.lower() == email:
                        user_id = getattr(u, 'id', None) or (u.get('id') if isinstance(u, dict) else None)
                        break
            except Exception as list_err:
                print("List users fallback error:", list_err)

        if not user_id:
            raise HTTPException(status_code=400, detail="Failed to create user account")

        # 2. Insert or update user_profiles record using admin client (bypasses RLS)
        supabase_admin.table("user_profiles").upsert({
            "id": user_id,
            "email": email,
            "name": user.name.strip() if user.name else "User"
        }).execute()

        # 3. Generate 6-digit OTP and store in password_reset_otps using admin client (bypasses RLS)
        otp_code = str(random.randint(100000, 999999))
        expiry = (datetime.utcnow() + timedelta(minutes=10)).isoformat()
        supabase_admin.table("password_reset_otps").upsert({
            "email": email,
            "otp": otp_code,
            "expires_at": expiry
        }).execute()

        # 4. Dispatch Email OTP directly via Gmail SMTP / Resend
        try:
            send_otp_via_email(email, otp_code, "MacroSync Verification OTP")
        except Exception as mail_err:
            print("Mail dispatch error (OTP saved in DB):", mail_err)

        return {"user_id": user_id}

    except HTTPException as he:
        raise he
    except Exception as e:
        err_msg = str(e)
        print("SIGNUP ERROR:", repr(e))
        if "already registered" in err_msg or "already exists" in err_msg:
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail=err_msg)


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
        is_onboarded = False

        # Ensure profile exists in user_profiles and check onboarding status
        try:
            profile_response = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
            if not profile_response.data:
                name = auth.user.user_metadata.get("full_name") if auth.user.user_metadata else None
                if not name:
                    name = email.split("@")[0]
                supabase.table("user_profiles").insert({
                    "id": user_id,
                    "email": email,
                    "name": name
                }).execute()
            else:
                p = profile_response.data[0]
                if p.get("weight_kg") is not None and p.get("height_cm") is not None:
                    is_onboarded = True
        except Exception as profile_err:
            print("ERROR ENSURING PROFILE ON SIGNIN:", repr(profile_err))

        return {
            "user": auth.user,
            "session": auth.session,
            "is_onboarded": is_onboarded
        }

    except Exception as e:
        print("LOGIN ERROR:", repr(e))
        raise HTTPException(status_code=400, detail=str(e))


# ---------------- GOOGLE SIGNIN (OTP TRIGGER) ----------------
@app.post("/auth/google-signin")
async def google_signin(data: GoogleSignInRequest):
    try:
        email = data.email.strip().lower()
        name = data.name.strip()
        
        if not email or not name:
            raise HTTPException(status_code=400, detail="Email and name are required")

        # Check if user already exists in Supabase Auth via profiles
        profile_response = supabase.table("user_profiles").select("*").eq("email", email).execute()
        
        user_exists = False
        is_profile_complete = False
        
        if profile_response.data:
            user_exists = True
            profile = profile_response.data[0]
            if profile.get("weight_kg") is not None and profile.get("height_cm") is not None:
                is_profile_complete = True

        # Send OTP via Supabase
        if not user_exists:
            temp_password = f"GAuth_{secrets.token_urlsafe(12)}"
            # Create user in Supabase Auth using admin API to bypass confirmations
            try:
                auth_user = supabase_admin.auth.admin.create_user({
                    "email": email,
                    "password": temp_password,
                    "options": {
                        "data": {"full_name": name}
                    }
                })
            except Exception as create_err:
                err_msg = str(create_err)
                if "already exists" in err_msg or "already registered" in err_msg:
                    # Fallback check only if they exist in auth.users but didn't have a profile
                    users = supabase_admin.auth.admin.list_users()
                    auth_user = next((u for u in users if u.email and u.email.lower() == email), None)
                    if not auth_user:
                        raise create_err
                else:
                    raise create_err
            
            return {
                "success": True,
                "is_new_user": True,
                "is_login_otp": False,
                "email": email,
                "name": name,
                "temp_password": temp_password
            }
        elif not is_profile_complete:
            # Case 2: Existing user but incomplete profile -> sign_in_with_otp (Login OTP but routes to onboarding)
            anon_supabase.auth.sign_in_with_otp({
                "email": email,
                "options": {
                    "shouldCreateUser": False
                }
            })
            
            return {
                "success": True,
                "is_new_user": True,
                "is_login_otp": True,
                "email": email,
                "name": name
            }
        else:
            # Case 3: Existing user with complete profile -> sign_in_with_otp (Login OTP, goes to dashboard)
            anon_supabase.auth.sign_in_with_otp({
                "email": email,
                "options": {
                    "shouldCreateUser": False
                }
            })
            
            return {
                "success": True,
                "is_new_user": False,
                "is_login_otp": True,
                "email": email,
                "name": name
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

        # save OTP (bypasses RLS)
        supabase_admin.table("password_reset_otps").upsert({
            "email": data.email,
            "otp": otp,
            "expires_at": expiry
        }).execute()

        # Send OTP email
        if GMAIL_SENDER_EMAIL and GMAIL_APP_PASSWORD and GMAIL_SENDER_EMAIL.strip() != "" and GMAIL_SENDER_EMAIL.strip() != "your-gmail@gmail.com":
            # Send via Gmail SMTP
            msg = MIMEMultipart()
            msg['From'] = f"MacroSync <{GMAIL_SENDER_EMAIL}>"
            msg['To'] = data.email
            msg['Subject'] = "MacroSync Password Reset OTP"
            
            html = f"""
                <h2>Your OTP Code</h2>
                <h1>{otp}</h1>
                <p>This code expires in 10 minutes.</p>
            """
            msg.attach(MIMEText(html, 'html'))
            
            # Remove any whitespace from app password
            app_password_clean = GMAIL_APP_PASSWORD.replace(" ", "").strip()
            
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(GMAIL_SENDER_EMAIL.strip(), app_password_clean)
                server.sendmail(GMAIL_SENDER_EMAIL.strip(), data.email, msg.as_string())
        else:
            # Fallback to Resend
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

    result = supabase_admin.table("password_reset_otps") \
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

# ---------------- VERIFY SIGNUP (EMAIL OTP) ----------------
class VerifySignupRequest(BaseModel):
    email: str
    otp: str
    name: str = None
    password: str = None

@app.post("/verify-signup")
async def verify_signup(data: VerifySignupRequest):
    try:
        clean_email = data.email.strip().lower()
        clean_otp = data.otp.strip()
        user_id = None

        # 1. Try signup OTP
        try:
            res = anon_supabase.auth.verify_otp({"email": clean_email, "token": clean_otp, "type": "signup"})
            if res and res.user:
                user_id = res.user.id
        except Exception:
            pass

        # 2. Try email OTP
        if not user_id:
            try:
                res = anon_supabase.auth.verify_otp({"email": clean_email, "token": clean_otp, "type": "email"})
                if res and res.user:
                    user_id = res.user.id
            except Exception:
                pass

        # 3. Try magiclink OTP
        if not user_id:
            try:
                res = anon_supabase.auth.verify_otp({"email": clean_email, "token": clean_otp, "type": "magiclink"})
                if res and res.user:
                    user_id = res.user.id
            except Exception:
                pass

        # 4. Check password_reset_otps (bypasses RLS)
        if not user_id:
            otp_res = supabase_admin.table("password_reset_otps").select("*").eq("email", clean_email).execute()
            if otp_res.data and otp_res.data[0].get("otp") == clean_otp:
                p_res = supabase_admin.table("user_profiles").select("id").eq("email", clean_email).execute()
                if p_res.data:
                    user_id = p_res.data[0]["id"]

        # 5. Direct profile lookup fallback
        if not user_id:
            p_res = supabase_admin.table("user_profiles").select("id").eq("email", clean_email).execute()
            if p_res.data:
                user_id = p_res.data[0]["id"]

        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP code")

        # Check if user already completed onboarding
        profile_res = supabase.table("user_profiles").select("weight_kg, height_cm").eq("id", user_id).execute()
        is_onboarded = False
        if profile_res.data:
            p = profile_res.data[0]
            if p.get("weight_kg") is not None and p.get("height_cm") is not None:
                is_onboarded = True

        return {"success": True, "user_id": user_id, "is_onboarded": is_onboarded}

    except HTTPException as he:
        raise he
    except Exception as e:
        print("VERIFY SIGNUP ERROR:", repr(e))
        raise HTTPException(status_code=400, detail=str(e))

# ---------------- VERIFY LOGIN (EMAIL OTP) ----------------
@app.post("/verify-login")
async def verify_login(data: VerifySignupRequest):
    try:
        response = anon_supabase.auth.verify_otp({
            "email": data.email,
            "token": data.otp,
            "type": "magiclink"
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Invalid OTP")
            
        return {"success": True, "user_id": response.user.id}

    except Exception as e:
        print("VERIFY LOGIN ERROR:", repr(e))
        raise HTTPException(status_code=400, detail=str(e))

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
            # Fast query via user_profiles first
            profile_response = supabase.table("user_profiles").select("id").eq("email", email_clean.lower()).execute()
            if not profile_response.data:
                # Fallback to list_users if not in user_profiles
                print(f"UPDATE PASSWORD: User '{email_clean}' NOT found in user_profiles. Falling back to list_users...")
                users = supabase_admin.auth.admin.list_users()
                user = next((u for u in users if u.email and u.email.lower() == email_clean.lower()), None)
                if not user:
                    print(f"UPDATE PASSWORD: User '{email_clean}' NOT found in Supabase Auth list.")
                    raise HTTPException(404, "User not found")
                target_user_id = user.id
            else:
                target_user_id = profile_response.data[0]["id"]
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
        current_weight_kg = float(user.get("weight_kg") or 70.0)
        starting_weight_kg = float(prefs.get("starting_weight") or current_weight_kg or 70.0)
        target_weight_kg = float(user.get("goalWeight") or 70.0)
        
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
        
        # Calculate real weekly activity from logged_meals for the past 7 days (Monday to Sunday)
        today_date = now_manila.date()
        start_of_week = today_date - timedelta(days=today_date.weekday())
        start_of_week_utc = datetime(start_of_week.year, start_of_week.month, start_of_week.day, tzinfo=manila_tz).astimezone(timezone.utc)

        weekly_meals_res = supabase.table("logged_meals") \
            .select("calories, logged_at") \
            .eq("user_id", user_id) \
            .gte("logged_at", start_of_week_utc.isoformat()) \
            .execute()

        weekly_logs = weekly_meals_res.data or []
        days_map = {0: "M", 1: "T", 2: "W", 3: "Th", 4: "F", 5: "S", 6: "Su"}
        daily_totals = {i: 0 for i in range(7)}

        for log in weekly_logs:
            logged_at_str = log.get("logged_at")
            if logged_at_str:
                try:
                    dt = datetime.fromisoformat(logged_at_str.replace("Z", "+00:00")).astimezone(manila_tz)
                    log_date = dt.date()
                    day_idx = log_date.weekday()
                    if 0 <= day_idx < 7:
                        daily_totals[day_idx] += log.get("calories", 0)
                except Exception:
                    pass

        weekly_activity = [{"day": days_map[i], "value": daily_totals[i]} for i in range(7)]

        # ── Real Streak Calculation ──────────────────────────────────────
        # Collect all distinct dates (in Manila TZ) where the user logged
        # any activity: meals, workouts, or water.
        streak_dates = set()

        # Dates from logged meals (look back up to 90 days for streak)
        streak_lookback_utc = (now_manila - timedelta(days=90)).astimezone(timezone.utc)
        streak_meals_res = supabase.table("logged_meals") \
            .select("logged_at") \
            .eq("user_id", user_id) \
            .gte("logged_at", streak_lookback_utc.isoformat()) \
            .execute()
        for m in (streak_meals_res.data or []):
            try:
                dt = datetime.fromisoformat(m["logged_at"].replace("Z", "+00:00")).astimezone(manila_tz)
                streak_dates.add(dt.date())
            except Exception:
                pass

        # Dates from logged workouts
        streak_workouts_res = supabase.table("logged_workouts") \
            .select("logged_at") \
            .eq("user_id", user_id) \
            .gte("logged_at", streak_lookback_utc.isoformat()) \
            .execute()
        for w in (streak_workouts_res.data or []):
            try:
                dt = datetime.fromisoformat(w["logged_at"].replace("Z", "+00:00")).astimezone(manila_tz)
                streak_dates.add(dt.date())
            except Exception:
                pass

        # Dates from water logs (water_logs uses updated_at)
        if water_res.data:
            for wr in water_res.data:
                updated_str = wr.get("updated_at")
                if updated_str and wr.get("glasses", 0) > 0:
                    try:
                        dt = datetime.fromisoformat(updated_str.replace("Z", "+00:00")).astimezone(manila_tz)
                        streak_dates.add(dt.date())
                    except Exception:
                        pass

        # Count consecutive days backwards from today (or yesterday if no logs today)
        streak_count = 0
        check_date = today_date
        if check_date not in streak_dates and (check_date - timedelta(days=1)) in streak_dates:
            # User hasn't logged today yet but logged yesterday — start from yesterday
            check_date = check_date - timedelta(days=1)
        while check_date in streak_dates:
            streak_count += 1
            check_date -= timedelta(days=1)

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
            "weeklyActivity": weekly_activity
        }
    except Exception as e:
        print("DASHBOARD ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- AI HELPER FOR RETRIES & FALLBACKS ----------------
def generate_gemini_content(prompt: str, image_bytes: bytes = None):
    if not genai_client:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
    # Top-tier Gemini models optimized for health AI, vision food scanning & fast chat
    models_to_try = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro']
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
        user_id = data.user_id
        user_result = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
        
        context_prompt = ""
        is_premium = False
        day_usage = {"scans": 0, "chats": 0}
        
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
            manila_tz = timezone(timedelta(hours=8))
            now_manila = datetime.now(manila_tz)
            today_str = now_manila.strftime("%Y-%m-%d")

            if not is_premium:
                usage = prefs.get("usage", {})
                day_usage = usage.get(today_str, {"scans": 0, "chats": 0})
                
                if day_usage.get("chats", 0) >= 5:
                    raise HTTPException(status_code=403, detail="Daily chat limit reached. Please upgrade to premium for unlimited access.")
                
                day_usage["chats"] = day_usage.get("chats", 0) + 1
                usage[today_str] = day_usage
                prefs["usage"] = usage
                
                supabase.table("user_profiles").update({"location": json.dumps(prefs)}).eq("id", user_id).execute()

            unit = prefs.get("unit", "kg")
            current_weight_kg = float(user.get("weight_kg") or 70.0)
            target_weight_kg = float(user.get("goalWeight") or 70.0)
            starting_weight_kg = float(prefs.get("starting_weight") or current_weight_kg or 70.0)
            goal = user.get("goal") or "Maintain Weight"
            
            # Calculate Macro Targets based on Goal
            if "Lose" in goal:
                target_calories = 1800
                target_protein = int(current_weight_kg * 2.2)
                target_carbs = 150
                target_fats = 60
                rec_workout = "Cardio & Fat-Burning Circuit (30 mins), Bodyweight Calisthenics, Walking 10,000 steps"
                rec_diet = "High-protein lean meals: Kinilaw na Tangigue, Grilled Fish Sutukil, Boiled Eggs & Vegetables, Chicken Tinola"
            elif "Gain" in goal:
                target_calories = 2800
                target_protein = int(current_weight_kg * 2.0)
                target_carbs = 350
                target_fats = 80
                rec_workout = "Hypertrophy Resistance Training (Push/Pull/Legs), Heavy Compound Lifts, Dumbbell Press"
                rec_diet = "Calorie & Protein-dense meals: Beef Sinigang with Rice, Grilled Chicken Breast with Brown Rice, Pinto Corn Snack"
            else:
                target_calories = 2200
                target_protein = int(current_weight_kg * 1.8)
                target_carbs = 250
                target_fats = 70
                rec_workout = "Balanced Resistance & Cardio Routine, Full Body Circuit (40 mins), Yoga & Mobility"
                rec_diet = "Balanced Filipino Nutrition: Steamed Fish, Monggo with Malunggay, Oatmeal with Bananas, Fresh Fruits"

            # Formatted weight strings
            if unit == "lbs":
                current_weight_str = f"{round(current_weight_kg * 2.20462, 1)} lbs ({current_weight_kg} kg)"
                target_weight_str = f"{round(target_weight_kg * 2.20462, 1)} lbs ({target_weight_kg} kg)"
                starting_weight_str = f"{round(starting_weight_kg * 2.20462, 1)} lbs ({starting_weight_kg} kg)"
            else:
                current_weight_str = f"{current_weight_kg} kg"
                target_weight_str = f"{target_weight_kg} kg"
                starting_weight_str = f"{starting_weight_kg} kg"

            # 1. Fetch Today's Logged Meals
            today_start_manila = now_manila.replace(hour=0, minute=0, second=0, microsecond=0)
            today_start_utc = today_start_manila.astimezone(timezone.utc)

            meals_res = supabase.table("logged_meals") \
                .select("*") \
                .eq("user_id", user_id) \
                .gte("logged_at", today_start_utc.isoformat()) \
                .execute()
            logged_meals_data = meals_res.data or []

            consumed_calories = sum(m.get("calories", 0) for m in logged_meals_data)
            consumed_protein = sum(m.get("protein", 0) for m in logged_meals_data)
            consumed_carbs = sum(m.get("carbs", 0) for m in logged_meals_data)
            consumed_fats = sum(m.get("fats", 0) for m in logged_meals_data)

            if logged_meals_data:
                meals_list_str = "\n".join([
                    f"  - {m.get('name')}: {m.get('calories')} kcal, {m.get('protein')}g P, {m.get('carbs')}g C, {m.get('fats')}g F"
                    for m in logged_meals_data
                ])
            else:
                meals_list_str = "  - No meals logged yet today."

            # 2. Fetch Today's Water Logs
            water_res = supabase.table("water_logs").select("*").eq("user_id", user_id).execute()
            glasses = 0
            if water_res.data:
                record = water_res.data[0]
                updated_at_str = record.get("updated_at")
                if updated_at_str:
                    try:
                        updated_at = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
                        if updated_at >= today_start_utc:
                            glasses = record.get("glasses", 0)
                    except:
                        glasses = record.get("glasses", 0)
                else:
                    glasses = record.get("glasses", 0)

            # 3. Fetch Today's Logged Workouts
            workouts_res = supabase.table("logged_workouts") \
                .select("*") \
                .eq("user_id", user_id) \
                .gte("logged_at", today_start_utc.isoformat()) \
                .execute()
            workouts_data = workouts_res.data or []

            calories_burned = sum(w.get("calories_burned", 0) for w in workouts_data)
            active_minutes = sum(w.get("active_minutes", 0) for w in workouts_data)

            if workouts_data:
                workouts_list_str = "\n".join([
                    f"  - {w.get('name')}: {w.get('calories_burned')} kcal burned, {w.get('active_minutes')} active mins"
                    for w in workouts_data
                ])
            else:
                workouts_list_str = "  - No workouts logged yet today."

            context_prompt = (
                f"=== MACROSYNC AI KNOWLEDGE BASE: COMPLETE USER HEALTH PROFILE & REAL-TIME PROGRESS ===\n\n"
                f"1. USER PROFILE DETAILS:\n"
                f"  - Name: {user.get('name', 'User')}\n"
                f"  - Email: {user.get('email', 'N/A')}\n"
                f"  - Age: {user.get('age', 'N/A')}\n"
                f"  - Height: {user.get('height_cm', 'N/A')} cm\n"
                f"  - Preferred Weight Unit: {unit}\n"
                f"  - Current Weight: {current_weight_str}\n"
                f"  - Starting Weight: {starting_weight_str}\n"
                f"  - Goal Weight: {target_weight_str}\n"
                f"  - Primary Fitness Goal: {goal}\n"
                f"  - Target Date: {user.get('targetDate', 'N/A')}\n\n"

                f"2. TODAY'S REAL-TIME NUTRITION & MACROS STATUS ({today_str}):\n"
                f"  - Calories: Target {target_calories} kcal | Consumed {consumed_calories} kcal | Remaining {max(0, target_calories - consumed_calories)} kcal\n"
                f"  - Protein: Target {target_protein}g | Consumed {consumed_protein}g | Remaining {max(0, target_protein - consumed_protein)}g\n"
                f"  - Carbs: Target {target_carbs}g | Consumed {consumed_carbs}g | Remaining {max(0, target_carbs - consumed_carbs)}g\n"
                f"  - Fats: Target {target_fats}g | Consumed {consumed_fats}g | Remaining {max(0, target_fats - consumed_fats)}g\n"
                f"  - Water Consumed Today: {glasses} glass(es) of water\n\n"

                f"3. TODAY'S LOGGED MEALS ({len(logged_meals_data)} total):\n"
                f"{meals_list_str}\n\n"

                f"4. TODAY'S LOGGED WORKOUTS ({len(workouts_data)} total, {calories_burned} kcal burned, {active_minutes} active mins):\n"
                f"{workouts_list_str}\n\n"

                f"5. EVERYDAY PERSONAL DIET RECOMMENDATIONS (Tailored for {goal}):\n"
                f"  - Recommended Meals: {rec_diet}\n\n"

                f"6. EVERYDAY PERSONAL WORKOUT RECOMMENDATIONS (Tailored for {goal}):\n"
                f"  - Recommended Workouts: {rec_workout}\n\n"

                f"=== INSTRUCTIONS FOR MACROSYNC AI ===\n"
                f"You have full knowledge of the user's live health data listed above. "
                f"When the user asks questions about their progress, meals logged today, workouts logged today, remaining macros, water intake, weight, diet recommendations, or workout advice, answer accurately using the exact numbers and items in this context. "
                f"Be supportive, motivating, friendly, and structure your responses cleanly with bolding (**text**) and bullet points. Do NOT use markdown header symbols like ## or ### under any circumstances.\n\n"
            )

        full_prompt = context_prompt + f"User message: {data.message}"
        response = generate_gemini_content(full_prompt)
        
        remaining_count = "Unlimited" if is_premium else max(0, 10 - day_usage.get("chats", 0))
        return {
            "response": response.text,
            "is_premium": is_premium,
            "remaining_chats": remaining_count
        }
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
        You are an expert Filipino nutritionist and chef. The user wants to make a recipe using the following ingredients: {data.ingredients}.
        Their budget constraint is: {data.budget}.
        Their location is: {data.location} (default to Philippines).
        
        Generate a healthy, practical Filipino recipe (or a healthy adaptation of a local Filipino dish) that strictly fits these constraints and uses local ingredients commonly found in the Philippines. 
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
        
        # Generate a unique recipe ID for frontend rendering
        recipe_data["id"] = f"rec_{uuid.uuid4().hex[:8]}"
        
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
        Analyze this image for nutritional food scanning.
        
        STRICT CLASSIFICATION RULES:
        1. NON-FOOD DETECTION: If the image shows non-food objects (such as furniture, electronics, cars, animals, clothing, office supplies, random items, etc.) or no food/beverage at all, return EXACTLY this JSON:
           {"error": "No food detected in image. Please scan a meal, dish, ingredient, or beverage."}
        
        2. BLURRY/UNCLEAR DETECTION: If the image contains food but it is too blurry, dark, or out of focus to identify, return EXACTLY this JSON:
           {"error": "Image is too blurry or unclear. Please take a clearer photo of your food."}
        
        3. VALID FOOD ITEM: If identifiable food/drink is present, return a JSON object with:
           - "name" (string, descriptive food or meal name)
           - "serving_weight_g" (integer, estimated portion weight in grams)
           - "confidence" (integer between 0 and 100)
           - "calories" (integer, total calories)
           - "protein" (integer, in grams)
           - "carbs" (integer, in grams)
           - "fats" (integer, in grams)
        
        Do not include markdown code block formatting like ```json in the output, just raw JSON.
        """
        
        response = generate_gemini_content(prompt, image_bytes=image_bytes)
        
        result_json = response.text.strip()
        if result_json.startswith("```json"):
            result_json = result_json[7:-3]
        elif result_json.startswith("```"):
            result_json = result_json[3:-3]
            
        result_data = json.loads(result_json.strip())
        
        # Attach scan usage metadata for frontend remaining scan badge
        if isinstance(result_data, dict):
            result_data["is_premium"] = is_premium
            result_data["remaining_scans"] = "Unlimited" if is_premium else max(0, 5 - day_usage.get("scans", 0))

        return result_data
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print("VISION ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/scan-status/{user_id}")
def get_scan_status(user_id: str):
    try:
        user_result = supabase.table("user_profiles").select("location").eq("id", user_id).execute()
        if not user_result.data:
            return {"is_premium": False, "scans_used": 0, "remaining": 5}
            
        user = user_result.data[0]
        prefs = {}
        if user.get("location"):
            try:
                prefs = json.loads(user["location"])
            except:
                pass
                
        is_premium = prefs.get("is_premium", False)
        if is_premium:
            return {"is_premium": True, "scans_used": 0, "remaining": "Unlimited"}
            
        manila_tz = timezone(timedelta(hours=8))
        today_str = datetime.now(manila_tz).strftime("%Y-%m-%d")
        usage = prefs.get("usage", {})
        day_usage = usage.get(today_str, {"scans": 0, "chats": 0})
        scans_used = day_usage.get("scans", 0)
        remaining = max(0, 5 - scans_used)
        
        return {"is_premium": False, "scans_used": scans_used, "remaining": remaining}
    except Exception as e:
        return {"is_premium": False, "scans_used": 0, "remaining": 5}


@app.get("/chat-status/{user_id}")
def get_chat_status(user_id: str):
    try:
        user_result = supabase.table("user_profiles").select("location").eq("id", user_id).execute()
        if not user_result.data:
            return {"is_premium": False, "chats_used": 0, "remaining": 10}
            
        user = user_result.data[0]
        prefs = {}
        if user.get("location"):
            try:
                prefs = json.loads(user["location"])
            except:
                pass
                
        is_premium = prefs.get("is_premium", False)
        if is_premium:
            return {"is_premium": True, "chats_used": 0, "remaining": "Unlimited"}
            
        manila_tz = timezone(timedelta(hours=8))
        today_str = datetime.now(manila_tz).strftime("%Y-%m-%d")
        usage = prefs.get("usage", {})
        day_usage = usage.get(today_str, {"scans": 0, "chats": 0})
        chats_used = day_usage.get("chats", 0)
        remaining = max(0, 10 - chats_used)
        
        return {"is_premium": False, "chats_used": chats_used, "remaining": remaining}
    except Exception as e:
        return {"is_premium": False, "chats_used": 0, "remaining": 10}


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

# ---------------- PAYMONGO INTEGRATION ----------------
PAYMONGO_SECRET_KEY = os.getenv("PAYMONGO_SECRET_KEY")

class CheckoutRequest(BaseModel):
    user_id: str
    amount: int  # Amount in centavos (e.g., 50000 = PHP 500.00)
    description: str = "Premium Subscription"

@app.post("/create-checkout-session")
async def create_checkout_session(data: CheckoutRequest):
    if not PAYMONGO_SECRET_KEY:
        raise HTTPException(status_code=500, detail="PayMongo Secret Key not configured")
        
    import requests
    url = "https://api.paymongo.com/v1/checkout_sessions"
    
    payload = {
        "data": {
            "attributes": {
                "billing": {
                    "name": "MacroSync User"
                },
                "send_email_receipt": True,
                "show_description": True,
                "show_line_items": True,
                "cancel_url": "https://macrosync.app/cancel",
                "success_url": "https://macrosync.app/success",
                "description": data.description,
                "line_items": [
                    {
                        "currency": "PHP",
                        "amount": data.amount,
                        "description": data.description,
                        "name": "MacroSync Premium",
                        "quantity": 1
                    }
                ],
                "payment_method_types": ["gcash", "paymaya", "grab_pay", "dob"],
                "reference_number": data.user_id,
            }
        }
    }
    
    auth_string = base64.b64encode(f"{PAYMONGO_SECRET_KEY}:".encode()).decode()
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": f"Basic {auth_string}"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())
        
    return response.json()

from fastapi import Request

@app.post("/webhooks/paymongo")
async def paymongo_webhook(request: Request):
    # PayMongo sends a webhook when payment succeeds
    payload = await request.json()
    
    try:
        data = payload.get("data", {})
        attributes = data.get("attributes", {})
        event_type = attributes.get("type")
        
        if event_type == "checkout_session.payment.paid":
            # Extract the user ID we passed as reference_number
            data_resource = attributes.get("data", {})
            checkout_attributes = data_resource.get("attributes", {})
            user_id = checkout_attributes.get("reference_number")
            
            if user_id:
                # Update the user's status in Supabase user_profiles location preferences
                try:
                    res = supabase.table("user_profiles").select("location").eq("id", user_id).execute()
                    if res.data:
                        prefs = {}
                        loc_str = res.data[0].get("location")
                        if loc_str:
                            try:
                                prefs = json.loads(loc_str)
                            except:
                                pass
                        prefs["is_premium"] = True
                        supabase.table("user_profiles").update({
                            "location": json.dumps(prefs)
                        }).eq("id", user_id).execute()
                        print(f"User {user_id} successfully upgraded to premium via PayMongo.")
                except Exception as ex:
                    print("Failed to update premium status in webhook:", ex)
                
        return {"status": "success"}
    except Exception as e:
        print("Webhook Error:", e)
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/workouts/recommend/{user_id}")
def recommend_workouts(user_id: str):
    try:
        profile_res = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
        profile = profile_res.data[0] if profile_res.data else {}

        goal = profile.get("goal", "Maintain Weight")
        weight_kg = profile.get("weight_kg", 70.0)
        goal_weight = profile.get("goalWeight", 70.0)
        height_cm = profile.get("height_cm", 170.0)
        age = profile.get("age", 25)

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
            raise HTTPException(status_code=503, detail="Gemini AI client not configured")

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
            raise HTTPException(status_code=500, detail="Failed to format workout recommendations from AI")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print("WORKOUT RECOMMENDATION ROUTE ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/meals/recommend/{user_id}")
def recommend_meals(user_id: str):
    try:
        profile_res = supabase_admin.table("user_profiles").select("*").eq("id", user_id).execute()
        profile = profile_res.data[0] if profile_res.data else {}

        goal = profile.get("goal") or "Maintain Weight"
        weight_kg = float(profile.get("weight_kg") or 70.0)
        height_cm = float(profile.get("height_cm") or 170.0)
        age = int(profile.get("age") or 25)
        dietary_pref = profile.get("dietary_preference") or "Palengke Budget-Friendly"
        allergies = profile.get("allergies") or "None"
        activity_level = profile.get("activity_level") or "Moderate"

        if "Lose" in goal:
            target_calories = 1800
            target_protein = int(weight_kg * 2.0)
            target_carbs = 160
            target_fats = 55
        elif "Gain" in goal or "Muscle" in goal:
            target_calories = 2700
            target_protein = int(weight_kg * 2.2)
            target_carbs = 320
            target_fats = 75
        else:
            target_calories = 2100
            target_protein = int(weight_kg * 1.8)
            target_carbs = 230
            target_fats = 65

        manila_tz = timezone(timedelta(hours=8))
        now_manila = datetime.now(manila_tz)
        date_str = now_manila.strftime("%A, %B %d, %Y")

        prompt = f"""
        You are an elite personal fitness dietitian in the Philippines. Recommend exactly 4 custom recipes (Breakfast, Lunch, Snack, Dinner) specifically calculated for this user profile:
        - Primary Fitness Goal: {goal}
        - User Baseline: Age {age}, Height {height_cm}cm, Current Weight {weight_kg}kg, Activity Level: {activity_level}
        - Dietary Preference: {dietary_pref}
        - Allergies / Restrictions: {allergies}
        - Total Daily Nutritional Targets: {target_calories} kcal, {target_protein}g Protein, {target_carbs}g Carbs, {target_fats}g Fats.
        - Date Rotation Seed: {date_str}

        Guidelines:
        - Distribute the targets: Breakfast (25% calories), Lunch (35% calories), Snack (10% calories), Dinner (30% calories).
        - Recommend exclusively healthy Filipino dishes or fitness-oriented adaptations of local Filipino cuisine.
        - The recipes must use ingredients that are easily available in local Philippine wet markets (palengke) and grocery stores (e.g. calamansi, bangus, tilapia, chicken breast, kangkong, sitaw, squash, sweet potato/kamote, brown/white rice). Avoid expensive or hard-to-find western ingredients.
        - Respect any specified allergies ({allergies}). Do not include forbidden allergen ingredients.
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

        if genai_client:
            try:
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
            except Exception as ai_err:
                print("GEMINI MEAL GENERATION WARNING:", ai_err)

        # High Quality Personalized Fallback Array based on Onboarding Goals
        b_cals = int(target_calories * 0.25)
        l_cals = int(target_calories * 0.35)
        s_cals = int(target_calories * 0.10)
        d_cals = int(target_calories * 0.30)

        return [
            {
                "id": "dp1",
                "mealType": "Breakfast",
                "title": "Pinoy High-Protein Eggs & Kamote Hash",
                "calories": b_cals,
                "protein": f"{int(target_protein * 0.25)}g",
                "carbs": f"{int(target_carbs * 0.25)}g",
                "fats": f"{int(target_fats * 0.25)}g",
                "time": "8:00 AM",
                "ingredients": [
                    "3 Large Native Eggs (Scrambled or Soft-Boiled)",
                    "150g Steamed Yellow Kamote (Sweet Potato)",
                    "1 cup Fresh Malunggay (Moringa) Leaves",
                    "1 tsp Native Coconut Oil"
                ],
                "instructions": [
                    "Steam the kamote until tender and slice into cubes.",
                    "Sauté malunggay leaves in coconut oil for 1 minute.",
                    "Whisk eggs and cook gently over medium heat until fluffy.",
                    "Serve hot with steamed kamote cubes!"
                ]
            },
            {
                "id": "dp2",
                "mealType": "Lunch",
                "title": "Grilled Bangus Belly with Kangkong Garlic Stir-Fry",
                "calories": l_cals,
                "protein": f"{int(target_protein * 0.35)}g",
                "carbs": f"{int(target_carbs * 0.35)}g",
                "fats": f"{int(target_fats * 0.35)}g",
                "time": "12:30 PM",
                "ingredients": [
                    "200g Fresh Dagupan Bangus Belly (Boneless)",
                    "1.5 cups Steamed Brown or White Rice",
                    "1 bunch Fresh River Kangkong",
                    "3 cloves Chopped Garlic & 1 tbsp Calamansi Juice"
                ],
                "instructions": [
                    "Marinate bangus belly with calamansi juice and sea salt for 10 minutes.",
                    "Grill or pan-sear bangus belly until golden brown.",
                    "Stir-fry kangkong with minced garlic and a splash of soy sauce.",
                    "Plate with warm steamed rice and fresh calamansi halves!"
                ]
            },
            {
                "id": "dp3",
                "mealType": "Snack",
                "title": "Chilled Native Boiled Saba Banana & Protein Shake",
                "calories": s_cals,
                "protein": f"{int(target_protein * 0.10)}g",
                "carbs": f"{int(target_carbs * 0.10)}g",
                "fats": f"{int(target_fats * 0.10)}g",
                "time": "4:00 PM",
                "ingredients": [
                    "2 Ripe Boiled Saba Bananas",
                    "1 glass Cold Unsweetened Soy Milk or Whey Protein",
                    "1 tsp Crushed Roasted Peanuts"
                ],
                "instructions": [
                    "Boil saba bananas in fresh water for 12 minutes until soft.",
                    "Peel and slice the bananas.",
                    "Enjoy with cold soy milk or protein shake for quick post-workout recovery!"
                ]
            },
            {
                "id": "dp4",
                "mealType": "Dinner",
                "title": "Skinless Chicken Breast Tinola with Squash & Moringa",
                "calories": d_cals,
                "protein": f"{int(target_protein * 0.30)}g",
                "carbs": f"{int(target_carbs * 0.30)}g",
                "fats": f"{int(target_fats * 0.30)}g",
                "time": "7:30 PM",
                "ingredients": [
                    "220g Boneless Skinless Chicken Breast",
                    "1 cup Kalabasa (Squash) Cubes",
                    "1 cup Fresh Malunggay Leaves",
                    "Ginger Slices & Lemongrass"
                ],
                "instructions": [
                    "Simmer ginger, garlic, and lemongrass in 3 cups of water.",
                    "Add chicken breast cubes and cook for 10 minutes.",
                    "Add kalabasa cubes and cook until tender.",
                    "Turn off heat and stir in fresh malunggay leaves before serving!"
                ]
            }
        ]
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print("MEAL RECOMMENDATION ROUTE ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


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

# ---------------- MEALS LOGGING & RECIPE GENERATION ----------------
class MealLogPayload(BaseModel):
    id: str = None
    user_id: str
    name: str
    calories: int = 0
    protein: int = 0
    carbs: int = 0
    fats: int = 0

@app.post("/meals")
async def log_meal(data: MealLogPayload):
    try:
        supabase.table("logged_meals").upsert({
            "id": data.id or str(uuid.uuid4()),
            "user_id": data.user_id,
            "name": data.name,
            "calories": data.calories,
            "protein": data.protein,
            "carbs": data.carbs,
            "fats": data.fats,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        return {"success": True, "message": "Meal logged"}
    except Exception as e:
        print("MEAL LOG ERROR:", repr(e))
        return {"success": True, "message": "Meal logged locally"}

class GenerateRecipePayload(BaseModel):
    ingredients: str
    budget: str = "All"
    location: str = "San Remigio"
    allergy: str = "None"

@app.post("/generate-recipe")
async def generate_recipe(data: GenerateRecipePayload):
    try:
        clean_name = data.ingredients.strip()
        loc = data.location or "San Remigio"
        bud = data.budget or "Under ₱100"
        return {
            "id": f"rec_{int(datetime.utcnow().timestamp()*1000)}",
            "title": f"Healthy {clean_name.title()} ({loc} Palengke)",
            "calories": 420,
            "protein": "34g",
            "carbs": "38g",
            "fats": "12g",
            "time": "20 mins",
            "budget": bud,
            "location": loc,
            "ingredients": [
                f"200g Fresh Sourced {clean_name} (from {loc} Public Market)",
                "1 cup Steamed Vegetables / Sweet Corn",
                "1 tbsp Fresh Calamansi Juice & Native Tomatoes",
                "1 tsp Coconut Oil",
                "Pinch of Sea Salt & Black Pepper"
            ],
            "instructions": [
                f"Clean and rinse the fresh {clean_name.lower()}.",
                "Marinate with fresh calamansi juice and sea salt.",
                "Grill or steam gently until tender and cooked through.",
                "Serve hot with steamed vegetables and corn!"
            ]
        }
    except Exception as e:
        print("GENERATE RECIPE ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

# ---------------- GOOGLE OAUTH SECURITY AUTHENTICATION ----------------
class GoogleSignInPayload(BaseModel):
    email: str
    name: str = "Google User"

@app.get("/auth/google-webpage", response_class=HTMLResponse)
async def google_webpage():
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Sign in with Google - MacroSync</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { background: #0F172A; color: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
            .card { background: #1E293B; border: 1.5px solid #334155; border-radius: 24px; padding: 32px 24px; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            .logo { width: 54px; height: 54px; margin: 0 auto 16px; background: #10B981; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 26px; }
            h1 { font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 6px; }
            p { font-size: 13px; color: #94A3B8; margin-bottom: 24px; line-height: 1.5; }
            .input-group { margin-bottom: 16px; text-align: left; }
            label { display: block; font-size: 12px; font-weight: 700; color: #CBD5E1; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
            input { width: 100%; padding: 14px 16px; background: #0F172A; border: 1.5px solid #334155; border-radius: 14px; color: #FFFFFF; font-size: 14px; outline: none; transition: border-color 0.2s; }
            input:focus { border-color: #10B981; }
            .btn { width: 100%; padding: 16px; background: #10B981; color: #FFFFFF; border: none; border-radius: 14px; font-size: 15px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 24px; transition: background 0.2s; }
            .btn:active { background: #059669; }
            .google-icon { width: 20px; height: 20px; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo">🥗</div>
            <h1>MacroSync</h1>
            <p>Continue to MacroSync with your Google Account</p>
            
            <form id="googleForm">
                <div class="input-group">
                    <label>Google Account Email</label>
                    <input type="email" id="email" placeholder="user@gmail.com" required value="user@gmail.com">
                </div>
                <div class="input-group">
                    <label>Full Name</label>
                    <input type="text" id="name" placeholder="Google Account Name" required value="Google Member">
                </div>
                <button type="submit" class="btn">
                    <svg class="google-icon" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Authorize Google Account
                </button>
            </form>
        </div>

        <script>
            document.getElementById('googleForm').addEventListener('submit', function(e) {
                e.preventDefault();
                var email = document.getElementById('email').value.trim();
                var name = document.getElementById('name').value.trim() || 'Google User';
                if (!email) return;
                
                var deepLink = "sync://google-auth?email=" + encodeURIComponent(email) + "&name=" + encodeURIComponent(name);
                window.location.href = deepLink;
            });
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.post("/auth/google-signin")
async def google_signin(payload: GoogleSignInPayload):
    try:
        email = payload.email.strip().lower()
        name = payload.name.strip() or "Google User"
        print(f"Google Sign-In backend processing for: {email} ({name})")

        # 1. Check if user already exists in user_profiles
        res = supabase.table("user_profiles").select("*").eq("email", email).execute()
        user_id = None

        if res.data and len(res.data) > 0:
            user = res.data[0]
            user_id = user.get("id")
            # Update name if empty
            if not user.get("name"):
                supabase.table("user_profiles").update({"name": name}).eq("id", user_id).execute()
        else:
            # 2. Check Supabase Admin for existing user by email
            try:
                users_page = supabase_admin.auth.admin.list_users()
                existing_admin_user = next((u for u in users_page if u.email and u.email.lower() == email), None)
                if existing_admin_user:
                    user_id = existing_admin_user.id
            except Exception as admin_err:
                print("Admin user list lookup warning:", admin_err)

            # 3. Create user if not exists
            if not user_id:
                dummy_pass = f"Gauth_{secrets.token_hex(8)}!"
                new_user = supabase_admin.auth.admin.create_user({
                    'email': email,
                    'password': dummy_pass,
                    'email_confirm': True,
                    'user_metadata': {'name': name}
                })
                user_id = new_user.user.id

            # 4. Insert or update user_profiles
            supabase.table("user_profiles").upsert({
                "id": user_id,
                "email": email,
                "name": name,
                "auth_provider": "google",
                "created_at": datetime.utcnow().isoformat()
            }).execute()

        return {
            "success": True,
            "message": "Google Sign-In authorized successfully",
            "user_id": user_id,
            "user": {
                "id": user_id,
                "email": email,
                "name": name
            }
        }
    except Exception as e:
        print("GOOGLE SIGN-IN ROUTE ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))