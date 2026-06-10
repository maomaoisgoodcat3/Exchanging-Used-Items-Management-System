"""MyPosts Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_svc import get_current_user

from app.models.users import Users
from app.models.posts import Posts
from app.api.v1.posts import PostResponse
router = APIRouter(prefix="/api/v1/my-posts", tags=["MyPosts"])



# ==========================================
# 2. CORE API ENDPOINTS
# ==========================================
@router.get("/", response_model=list[PostResponse])
def get_my_posts(
    db: Session = Depends(get_db), 
    current_user: Users = Depends(get_current_user)
):
    """API CHO NGƯỜI ĐĂNG BÀI (Lấy mọi bài của chính họ)"""
    return (
        db.query(Posts)
        .filter(Posts.seller_email == current_user.email)
        .order_by(Posts.created_at.desc())
        .all()
    )