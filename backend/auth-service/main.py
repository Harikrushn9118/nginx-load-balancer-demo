from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import os
import json

app = FastAPI()

INSTANCE = os.getenv("INSTANCE_ID", "1")
DB_PATH = "/app/data/db.json"

def get_users():
    if not os.path.exists(DB_PATH):
        return {}
    try:
        with open(DB_PATH, "r") as f:
            return json.load(f)
    except:
        return {}

def save_users(users):
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with open(DB_PATH, "w") as f:
        json.dump(users, f)

@app.post("/auth/register")
async def register(request: Request):
    print(f"🔐 [AUTH-{INSTANCE}] POST /auth/register")
    try:
        body = await request.json()
        username = body.get("username", "").strip()
        
        if not username:
            return JSONResponse(status_code=400, content={"message": "username required"})
            
        users = get_users()
        
        if username in users:
            return {"message": "already exists", "instance": INSTANCE}
            
        users[username] = {"registered_by": f"auth-{INSTANCE}"}
        save_users(users)
        
        return {"message": "added in database", "instance": INSTANCE}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/auth/health")
async def health():
    return {"service": "AUTH", "instance": INSTANCE, "status": "ok"}
