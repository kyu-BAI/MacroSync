from fastapi import FastAPI
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv
import os
from fastapi import HTTPException
from fastapi import Request
from fastapi.templating import Jinja2Templates
import random
from datetime import datetime, timedelta
import resend

load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")

app = FastAPI()

templates = Jinja2Templates(directory="templates")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


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


@app.post("/signup")
@app.post("/signup")
async def signup(user: UserAuth):
    try:
        auth_response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password
        })

        print("AUTH RESPONSE:", auth_response)

        new_user_id = auth_response.user.id

        db_response = supabase.table("UserInformation").insert({
            "id": new_user_id,
            "name": user.name,
            "email_address": user.email
        }).execute()

        return {
            "success": True,
            "data": db_response.data
        }

    except Exception as e:
        print("SIGNUP ERROR:", repr(e))

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@app.post("/signin")
def signin(user: UserLogin):
    response = supabase.auth.sign_in_with_password({
        "email": user.email,
        "password": user.password
    })

    return response

# FORGOT PASSWORD FUNCTION


class UpdatePasswordRequest(BaseModel):
    access_token: str
    password: str


@app.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):

    otp = str(random.randint(100000, 999999))

    expiry = (
        datetime.utcnow() +
        timedelta(minutes=10)
    ).isoformat()

    supabase.table(
        "password_reset_otps"
    ).upsert({
        "email": data.email,
        "otp": otp,
        "expires_at": expiry
    }).execute()

    resend.Emails.send({
        "from": "onboarding@resend.dev",
        "to": data.email,
        "subject": "MacroSync Password Reset",
        "html": f"""
        <h2>Your OTP Code</h2>
        <p>{otp}</p>
        <p>Valid for 10 minutes.</p>
        """
    })

    return {
        "success": True,
        "message": "OTP sent"
    }


@app.post("/verify-reset-otp")
async def verify_reset_otp(
    data: VerifyOTPRequest
):

    result = (
        supabase.table(
            "password_reset_otps"
        )
        .select("*")
        .eq("email", data.email)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            400,
            "OTP not found"
        )

    record = result.data[0]

    if record["otp"] != data.otp:
        raise HTTPException(
            400,
            "Invalid OTP"
        )

    if (
        datetime.utcnow() >
        datetime.fromisoformat(
            record["expires_at"]
        )
    ):
        raise HTTPException(
            400,
            "OTP expired"
        )

    return {
        "success": True
    }


@app.post("/update-password")
async def update_password(
    data: UpdatePasswordRequest
):

    users = (
        supabase.auth.admin
        .list_users()
    )

    user = next(
        (
            u for u in users
            if u.email == data.email
        ),
        None
    )

    if not user:
        raise HTTPException(
            404,
            "User not found"
        )

    supabase.auth.admin.update_user_by_id(
        user.id,
        {
            "password":
            data.new_password
        }
    )

    supabase.table(
        "password_reset_otps"
    ).delete().eq(
        "email",
        data.email
    ).execute()

    return {
        "success": True
    }
