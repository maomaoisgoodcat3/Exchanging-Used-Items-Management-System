# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import upload
from fastapi.staticfiles import StaticFiles
# ==========================================
# KHỞI TẠO TOÀN BỘ MODELS ĐỂ TRÁNH LỖI RELATIONSHIP
# Dù có dùng Router hay không, Models vẫn phải được nạp vào bộ nhớ
# ==========================================
import app.models.user
import app.models.campaign
import app.models.post
import app.models.transaction

from app.api.v1 import auth, users, campaigns

app = FastAPI(title="UET Marketplace API")

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")
# Nạp các Router đang hoạt động
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(campaigns.router)
app.include_router(upload.router)
# Các Router đang tạm ẩn chờ nâng cấp
# app.include_router(posts.router)
# app.include_router(transactions.router)
# app.include_router(admin.router)