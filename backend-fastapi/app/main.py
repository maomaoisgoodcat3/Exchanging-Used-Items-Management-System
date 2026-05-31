from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, posts, campaigns, users, transactions, admin
import app.models.user
import app.models.post
import app.models.campaign
import app.models.transaction
app = FastAPI(title="UET Marketplace API")

# Bắt buộc phải có đoạn này để UI không bị chặn
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(posts.router)
app.include_router(campaigns.router)
app.include_router(users.router)
app.include_router(transactions.router)
app.include_router(admin.router)