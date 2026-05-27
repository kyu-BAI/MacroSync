from fastapi import FastAPI
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv
import os
from fastapi import HTTPException

load_dotenv()

app = FastAPI()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


class UserAuth(BaseModel):
    name:str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str


@app.post("/signup")
async def signup(user: UserAuth): 
    try:
        # 1. Create the account in Supabase auth.users
        auth_response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password
        })
        
        # 2. Grab the unique ID Supabase generated for this new user
        new_user_id = auth_response.user.id

        # 3. Insert their extra details into YOUR custom table
        # (Replace "profiles" with your actual table name)
        db_response = supabase.table("UserInformation").insert({
            "id": new_user_id,   # This links your table to the auth table!
            "name": user.name,   # The name sent from your Expo frontend
            "email": user.email
        }).execute()

        return {"message": "User created successfully!", "data": db_response.data}

    except Exception as e:
      
        print(f"SUPABASE ERROR: {str(e)}") 
        
     
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/signin")
def signin(user: UserLogin):
    response = supabase.auth.sign_in_with_password({
        "email": user.email,
        "password": user.password
    })

    return response
