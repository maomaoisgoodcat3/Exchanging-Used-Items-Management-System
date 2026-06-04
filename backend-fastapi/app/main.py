# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# ==========================================
# KHỞI TẠO MODELS
# ==========================================
import app.models.users
import app.models.campaigns
import app.models.posts
import app.models.transactions

# Import Routers
from app.api.v1 import upload, auth, users, campaigns, posts, transactions, admin

app = FastAPI(title="UET Marketplace API")

# ==========================================
# CẤU HÌNH CORS (Cho phép Next.js gọi API)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    # Chỉ định đích danh cổng 3000 của Next.js
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thư mục static dùng để chứa ảnh upload local mà chúng ta đã làm
app.mount("/static", StaticFiles(directory="static"), name="static")

# ==========================================
# NẠP CÁC ROUTER API
# ==========================================
app.include_router(upload.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(campaigns.router)
app.include_router(posts.router)
app.include_router(transactions.router)
app.include_router(admin.router)

@app.get("/")
def root_check():
    return {"message": "UET Marketplace API is running! Frontend is at http://localhost:3000"}