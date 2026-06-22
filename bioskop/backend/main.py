from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import random

# ============================================
# INITIALIZATION
# ============================================
app = FastAPI(title="Bioskop 7 API")

# CORS Middleware (untuk frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Di production, ganti dengan domain frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# DATA MODELS
# ============================================
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class VerifyOtpRequest(BaseModel):
    email: str
    otp_code: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str

class BookingRequest(BaseModel):
    order_id: str
    user_id: int
    film_title: str
    film_poster: str
    tanggal: str
    jam: str
    seats: list
    total_price: int
    payment_method: str

# ============================================
# STORAGE (Simulasi Database)
# ============================================
users_db = {}  # {email: {username, password}}
otp_storage = {}  # {email: otp_code}
bookings_db = []  # List of bookings

# ============================================
# ROOT ENDPOINT
# ============================================
@app.get("/")
async def root():
    return {
        "message": "Bioskop 7 API is running!",
        "version": "1.0.0",
        "status": "active"
    }

# ============================================
# AUTH ENDPOINTS
# ============================================
@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    """Register user baru"""
    
    # Cek apakah email sudah terdaftar
    if request.email in users_db:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    
    # Simpan user
    users_db[request.email] = {
        "username": request.username,
        "password": request.password,
        "email": request.email,
        "user_id": len(users_db) + 1
    }
    
    # Generate OTP
    otp_code = str(random.randint(1000, 9999))
    otp_storage[request.email] = otp_code
    
    # Print OTP ke terminal
    print("=" * 60)
    print(f"📧 KODE OTP REGISTER UNTUK: {request.email}")
    print(f"🔐 KODE OTP: {otp_code}")
    print("=" * 60)
    
    return {
        "message": "Registrasi berhasil! Silakan cek email untuk verifikasi OTP.",
        "email": request.email
    }

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    """Login user"""
    
    # Cari user by username
    user = None
    for email, data in users_db.items():
        if data["username"] == request.username:
            user = data
            break
    
    if not user:
        raise HTTPException(status_code=401, detail="Username tidak ditemukan")
    
    if user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Password salah")
    
    return {
        "message": "Login berhasil",
        "username": user["username"],
        "email": user["email"],
        "user_id": user["user_id"]
    }

@app.post("/api/auth/verify-otp")
async def verify_otp(request: VerifyOtpRequest):
    """Verifikasi kode OTP"""
    
    stored_otp = otp_storage.get(request.email)
    
    if not stored_otp:
        raise HTTPException(status_code=400, detail="OTP tidak ditemukan atau sudah expired")
    
    if request.otp_code != stored_otp:
        raise HTTPException(status_code=400, detail="Kode OTP salah")
    
    # Hapus OTP setelah berhasil diverifikasi
    del otp_storage[request.email]
    
    print(f"✅ OTP berhasil diverifikasi untuk: {request.email}")
    
    return {
        "message": "OTP berhasil diverifikasi!"
    }

# ============================================
# ✅ ENDPOINT BARU: LUPA PASSWORD
# ============================================
@app.post("/api/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Kirim OTP untuk lupa password"""
    
    # Cek apakah email terdaftar
    if request.email not in users_db:
        raise HTTPException(status_code=404, detail="Email tidak terdaftar")
    
    # Generate OTP
    otp_code = str(random.randint(1000, 9999))
    otp_storage[request.email] = otp_code
    
    # Print ke terminal
    print("=" * 60)
    print(f"📧 KODE OTP LUPA PASSWORD UNTUK: {request.email}")
    print(f"🔐 KODE OTP: {otp_code}")
    print("=" * 60)
    
    return {
        "message": "Kode OTP telah dikirim ke email Anda",
        "email": request.email
    }

# ============================================
# ✅ ENDPOINT BARU: RESET PASSWORD
# ============================================
@app.post("/api/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Update password baru"""
    
    # Cek apakah email terdaftar
    if request.email not in users_db:
        raise HTTPException(status_code=404, detail="Email tidak terdaftar")
    
    # Update password
    users_db[request.email]["password"] = request.new_password
    
    print("=" * 60)
    print(f"✅ PASSWORD BERHASIL DIPERBARUI")
    print(f"📧 Email: {request.email}")
    print(f"🔑 Password Baru: {request.new_password}")
    print("=" * 60)
    
    return {
        "message": "Password berhasil diperbarui"
    }

# ============================================
# FILM & JADWAL ENDPOINTS
# ============================================
@app.get("/api/today-date")
async def get_today_date():
    """Get tanggal hari ini dan 7 hari ke depan"""
    
    hari_arr = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']
    bulan_arr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    
    dates = []
    for i in range(7):
        from datetime import timedelta
        d = datetime.now() + timedelta(days=i)
        
        dates.append({
            "day_offset": i,
            "label": "HARI INI" if i == 0 else "BESOK" if i == 1 else f"H+{i}",
            "day_name": hari_arr[d.weekday()],
            "date": d.day,
            "month": bulan_arr[d.month - 1],
            "year": d.year,
            "full_date": f"{d.day} {bulan_arr[d.month - 1]} {d.year}",
            "is_active": i <= 1
        })
    
    return {"dates": dates}

@app.get("/api/films/{film_id}")
async def get_film_details(film_id: int):
    """Get detail film"""
    
    # Mock data
    films = {
        1: {
            "judul": "Sekawan Limo",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300",
            "deskripsi": "Lima sekawan yang selalu bersama menghadapi petualangan seru.",
            "durasi": 118,
            "rating": "13+",
            "genre": "Komedi, Drama",
            "bahasa": "Indonesia",
            "aktor": "Aktor A, Aktor B, Aktor C"
        }
    }
    
    film = films.get(film_id)
    if not film:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan")
    
    return {"film": film}

@app.get("/api/jadwal/{film_id}/{tanggal}")
async def get_jadwal(film_id: int, tanggal: str):
    """Get jadwal film berdasarkan tanggal"""
    
    # Mock jadwal
    jadwal = [
        {"jam": "10:30", "studio": "STUDIO 01", "harga": 35000},
        {"jam": "13:15", "studio": "STUDIO 02", "harga": 35000},
        {"jam": "15:50", "studio": "STUDIO 01", "harga": 40000},
        {"jam": "18:45", "studio": "STUDIO 03", "harga": 45000},
        {"jam": "21:30", "studio": "STUDIO 02", "harga": 45000}
    ]
    
    return {"jadwal": jadwal}

# ============================================
# BOOKING ENDPOINTS
# ============================================
@app.post("/api/bookings")
async def create_booking(request: BookingRequest):
    """Create booking baru"""
    
    booking = {
        "order_id": request.order_id,
        "user_id": request.user_id,
        "title": request.film_title,
        "poster": request.film_poster,
        "tanggal": request.tanggal,
        "jam": request.jam,
        "seats": request.seats,
        "total_price": request.total_price,
        "payment_method": request.payment_method,
        "created_at": datetime.now().isoformat()
    }
    
    bookings_db.append(booking)
    
    print(f"✅ Booking berhasil: {request.order_id}")
    
    return {"message": "Booking berhasil", "booking": booking}

@app.get("/api/bookings/{user_id}")
async def get_user_bookings(user_id: int):
    """Get semua booking user"""
    
    user_bookings = [b for b in bookings_db if b["user_id"] == user_id]
    
    return {"bookings": user_bookings}

# ============================================
# RUN SERVER
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)