from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Vercel Python Function Working"}

@app.post("/auth/google-signin")
def test_google():
    return {"status": "ok"}
