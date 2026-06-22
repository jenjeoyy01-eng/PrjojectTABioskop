from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import random
import time

app = FastAPI(title="SAMS Cinema API")

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database tiruan di RAM
users_db = {}
otp_db = {}

# Pydantic Models
class RegisterModel(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginModel(BaseModel):
    username: str
    password: str

class OtpVerifyModel(BaseModel):
    email: EmailStr
    otp_code: str

class ForgotPasswordModel(BaseModel):
    email: EmailStr

@app.get("/")
def home():
    return {"status": "Backend SAMS Cinema Aktif!"}

# 1. API REGISTRASI
@app.post("/api/auth/register")
def register(user: RegisterModel):
    if user.username in users_db:
        raise HTTPException(status_code=400, detail="Username sudah terdaftar!")
    
    users_db[user.username] = {
        "username": user.username,
        "email": user.email,
        "password": user.password,
        "is_verified": False
    }
    
    generated_otp = str(random.randint(1000, 9999))
    otp_db[user.email] = {
        "code": generated_otp,
        "timestamp": time.time(),
        "purpose": "register"
    }
    
    print(f"\n==========================================")
    print(f" [REGISTER] Email: {user.email}")
    print(f"🔑 [KODE OTP]: {generated_otp}")
    print(f"==========================================\n")
    
    return {
        "message": "Registrasi berhasil! Kode OTP telah dicetak di Terminal.",
        "email": user.email
    }

# 2. API LOGIN (BARU!)
@app.post("/api/auth/login")
def login(user: LoginModel):
    if user.username not in users_db:
        raise HTTPException(status_code=401, detail="Username tidak terdaftar!")
    
    user_data = users_db[user.username]
    
    if user_data["password"] != user.password:
        raise HTTPException(status_code=401, detail="Password salah!")
    
    if not user_data["is_verified"]:
        raise HTTPException(status_code=403, detail="Email belum diverifikasi!")
    
    return {
        "message": "Login berhasil!",
        "username": user.username,
        "email": user_data["email"]
    }

# 3. API LUPA KATA SANDI
@app.post("/api/auth/forgot-password")
def forgot_password(data: ForgotPasswordModel):
    user_found = None
    for username, profile in users_db.items():
        if profile["email"] == data.email:
            user_found = profile
            break
            
    if not user_found:
        raise HTTPException(status_code=404, detail="Email tidak terdaftar!")
    
    generated_otp = str(random.randint(1000, 9999))
    otp_db[data.email] = {
        "code": generated_otp,
        "timestamp": time.time(),
        "purpose": "forgot-password"
    }
    
    print(f"\n==========================================")
    print(f"🔒 [LUPA PASSWORD] Email: {data.email}")
    print(f"🔑 [KODE OTP BARU]: {generated_otp}")
    print(f"==========================================\n")
    
    return {
        "message": "OTP ganti sandi telah dicetak di Terminal!",
        "email": data.email
    }

# 4. API VERIFIKASI OTP
@app.post("/api/auth/verify-otp")
def verify_otp(data: OtpVerifyModel):
    if data.email not in otp_db:
        raise HTTPException(status_code=404, detail="Sesi OTP habis atau email tidak ditemukan!")
    
    otp_data = otp_db[data.email]
    
    if time.time() - otp_data["timestamp"] > 300:
        del otp_db[data.email]
        raise HTTPException(status_code=400, detail="OTP sudah expired!")
    
    if otp_data["code"] != data.otp_code:
        raise HTTPException(status_code=400, detail="Kode OTP salah!")
    
    for username, profile in users_db.items():
        if profile["email"] == data.email:
            users_db[username]["is_verified"] = True
            break
    
    del otp_db[data.email]
    
    return {"message": "Verifikasi OTP berhasil!"}

class UpdatePasswordModel(BaseModel):
    email: EmailStr
    new_password: str

@app.post("/api/auth/update-password")
def update_password(data: UpdatePasswordModel):
    # Cari user berdasarkan email
    user_found = None
    for username, profile in users_db.items():
        if profile["email"] == data.email:
            user_found = username
            break
    
    if not user_found:
        raise HTTPException(status_code=404, detail="User tidak ditemukan!")
    
    # Update password
    users_db[user_found]["password"] = data.new_password
    
    return {
        "message": "Password berhasil diubah!",
        "email": data.email
    }