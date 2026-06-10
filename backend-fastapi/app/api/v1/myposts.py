"""MyPosts Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_svc import get_current_user

from app.models.users import Users
from app.models.posts import Posts, PostProducts
# Nếu bạn có PostResponse trong posts.py thì giữ nguyên, nếu không thì tạm comment lại
# from app.api.v1.posts import PostResponse

router = APIRouter(prefix="/api/v1/my-posts", tags=["MyPosts"])

# ==========================================
# 1. SCHEMAS ĐẶC CHẾ CHO MY-POSTS
# ==========================================
class MyProductItem(BaseModel):
    product_id: int
    product_name: Optional[str] = None  # Tên sản phẩm có thể không cần thiết, nhưng nếu muốn hiển thị thì có thể thêm vào
    product_quantity: int = 1

class MyPostCreate(BaseModel):
    title: str
    post_category: str
    description: str
    thumbnail_url: Optional[str] = None
    campaign_id: Optional[int] = None
    products: List[MyProductItem]  # Chỉ cần ID và số lượng là đủ

# ==========================================
# 2. CORE API ENDPOINTS
# ==========================================

@router.get("/")
def get_my_posts(
    db: Session = Depends(get_db), 
    current_user: Users = Depends(get_current_user)
):
    """API Lấy danh sách toàn bộ bài đăng của chính user đang đăng nhập"""
    posts = (
        db.query(Posts)
        .filter(Posts.seller_email == current_user.email)
        .order_by(Posts.created_at.desc())
        .all()
    )
    return posts


@router.post("/")
def create_my_post(
    payload: MyPostCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """API Tạo bài đăng mới: Tự động khóa chặt seller_email bằng Token bảo mật"""
    
    # 1. Tạo bản ghi Bài đăng chính
    new_post = Posts(
        seller_email=current_user.email,  # Tự động lấy từ Token, hacker không thể fake!
        title=payload.title,
        description=payload.description,
        post_category=payload.post_category,
        thumbnail_url=payload.thumbnail_url,
        campaign_id=payload.campaign_id,
        approval="Pending",      # Luôn phải qua kiểm duyệt
        availability="Open"      # Đang mở giao dịch
    )
    db.add(new_post)
    db.flush() # Lưu tạm vào DB để lấy post_id sinh tự động

    # 2. Cắt các sản phẩm đính kèm và lưu vào bảng trung gian (PostProducts)
    for prod in payload.products:
        new_post_product = PostProducts(
            post_id=new_post.post_id,
            product_id=prod.product_id,
            product_quantity=prod.product_quantity
        )
        db.add(new_post_product)

    # 3. Chốt dữ liệu
    db.commit()
    db.refresh(new_post)

    return {
        "message": "Tạo bài đăng thành công!",
        "post_id": new_post.post_id,
        "title": new_post.title
    }