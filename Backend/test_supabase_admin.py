import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print("Initializing Supabase client...")
supabase = create_client(url, key)

try:
    print("Testing list_users()...")
    users = supabase.auth.admin.list_users()
    print("Users found:", len(users))
    for u in users[:3]:
        print(f"- {u.email} (id: {u.id})")
except Exception as e:
    print("Error during list_users():", repr(e))
