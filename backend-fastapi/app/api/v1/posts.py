"""Post Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

from app.schemas.post_schema import (
    PostCreate, PostUpdate, PostRead, PostDetailRead, PostListRead,
    PostFilter, PostApprovalAction, PostProductCreate, PostImageCreate
)
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_svc import get_current_user

# Sử dụng Models chuẩn xác của chúng ta
from app.models.user import User
from app.models.post import Post, PostProduct, ProductImage, Storage, PostImage

router = APIRouter(prefix="/api/v1/posts", tags=["Posts"])

# ==========================================
# 1. API LẤY DANH SÁCH BÀI VIẾT
# ==========================================

@router.get("/", response_model=list)
def list_posts(
    post_type: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
    db: Session = Depends(get_db)
):
    """API CHO USER THƯỜNG (Chỉ lấy bài đã duyệt)"""
    query = db.query(Post).filter(Post.approval == "Approved")
    if post_type:
        query = query.filter(Post.post_type == post_type)
        
    posts = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    
    return [{
        "post_id": p.post_id,
        "title": p.title,
        "description": p.description,
        "seller_email": p.seller_email,
        "post_type": p.post_type.value if hasattr(p.post_type, 'value') else str(p.post_type),
        "approval": "Approved", 
        "availability": p.availability.value if hasattr(p.availability, 'value') else str(p.availability)
    } for p in posts]


@router.get("/admin-all", response_model=list)
def get_all_posts_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """API CHO ADMIN (Lấy mọi bài viết, kể cả Pending/Rejected)"""
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if "Admin" not in role_val:
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền xem toàn bộ bài viết.")
        
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    return [{
        "post_id": p.post_id,
        "title": p.title,
        "description": p.description,
        "seller_email": p.seller_email,
        "post_type": p.post_type.value if hasattr(p.post_type, 'value') else str(p.post_type),
        "approval": p.approval.value if hasattr(p.approval, 'value') else str(p.approval),
        "availability": p.availability.value if hasattr(p.availability, 'value') else str(p.availability),
        "reject_reason": getattr(p, 'reject_reason', None)
    } for p in posts]


@router.get("/my-posts", response_model=list)
def get_my_posts(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """API CHO NGƯỜI ĐĂNG BÀI (Lấy mọi bài của chính họ)"""
    posts = db.query(Post).filter(Post.seller_email == current_user.email).order_by(Post.created_at.desc()).all()
    return [{
        "post_id": p.post_id,
        "title": p.title,
        "description": p.description,
        "seller_email": p.seller_email,
        "post_type": p.post_type.value if hasattr(p.post_type, 'value') else str(p.post_type),
        "approval": p.approval.value if hasattr(p.approval, 'value') else str(p.approval),
        "availability": p.availability.value if hasattr(p.availability, 'value') else str(p.availability),
        "reject_reason": getattr(p, 'reject_reason', None)
    } for p in posts]


# ==========================================
# 2. API THAO TÁC (TẠO, SỬA, XÓA, DUYỆT)
# ==========================================

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tạo bài đăng mới & Tự động lưu sản phẩm vào Kho đồ (Storage)"""
    if not data.title or not data.description:
        raise HTTPException(status_code=400, detail="Title and description are required")
    
    # 1. Tạo bảng Post chính
    new_post = Post(
        seller_email=current_user.email,
        campaign_id=data.campaign_id,
        title=data.title,
        description=data.description,
        post_type=data.post_type, 
        approval="Pending",
        availability="Open"
    )
    db.add(new_post)
    db.flush() # Để lấy post_id

    # 2. Xử lý Sản phẩm: Lưu vào Storage (Kho đồ) trước, sau đó Link vào PostProduct
    if data.products:
        for prod in data.products:
            new_storage_item = Storage(
                email=current_user.email,
                product_name=prod.product_name,
                product_category_id=prod.product_category_id,
                product_quantity=prod.product_quantity,
                product_price=prod.product_price,
                product_location_id=1 # Mặc định tạm thời, cần nối với Location thực tế sau
            )
            db.add(new_storage_item)
            db.flush() # Để lấy product_id vừa sinh ra
            
            # Tạo liên kết vào bảng trung gian
            new_prod_link = PostProduct(
                post_id=new_post.post_id,
                product_id=new_storage_item.product_id
            )
            db.add(new_prod_link)

    # 3. Xử lý Images
    if data.images:
        for img in data.images:
            new_img = PostImage(
                post_id=new_post.post_id,
                image_url=img.image_url
            )
            db.add(new_img)

    db.commit()
    
    return {
        "message": "Post created successfully!",
        "post_id": new_post.post_id,
        "status": new_post.approval
    }


@router.post("/{post_id}/approve", response_model=dict)
def approve_post(
    post_id: int,
    data: PostApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin duyệt / từ chối bài viết"""
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if "Admin" not in role_val:
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền duyệt bài.")
        
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")

    if data.action == "approve":
        post.approval = "Approved"
        post.availability = "Open"
        post.reject_reason = None 
    elif data.action == "reject":
        post.approval = "Rejected"
        post.availability = "Closed" 
        post.reject_reason = data.reject_reason or "Vi phạm quy định cộng đồng"
    elif data.action == "resend":
        post.approval = "Resending"

    post.reviewed_by = current_user.email
    post.reviewed_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": f"Đã chuyển trạng thái bài viết thành {data.action}",
        "post_id": post_id,
        "status": post.approval
    }


@router.put("/{post_id}/toggle-status", response_model=dict)
def toggle_post_status(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Owner tự đổi trạng thái Available <-> Closed"""
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    if post.seller_email != current_user.email:
        raise HTTPException(status_code=403, detail="Chỉ người đăng mới có quyền Đóng/Mở bài viết này.")
        
    current_avail = post.availability.value if hasattr(post.availability, 'value') else str(post.availability)
    post.availability = "Closed" if current_avail == "Open" else "Open"
    db.commit()
    
    return {
        "message": "Cập nhật trạng thái thành công",
        "post_id": post_id,
        "availability": post.availability
    }


@router.post("/{post_id}/mark-sold", response_model=dict)
def mark_post_sold(
    post_id: int,
    current_user: User = Depends(get_current_user)
):
    """Mark post as sold (Giữ nguyên Mock Data)"""
    return {
        "message": "Post marked as sold",
        "post_id": post_id,
        "status": "Sold"
    }


@router.put("/{post_id}", response_model=dict)
def update_post(
    post_id: int,
    data: PostUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update post information (Giữ nguyên Mock Data)"""
    return {
        "message": "Post updated successfully",
        "post_id": post_id
    }


@router.delete("/{post_id}", response_model=dict)
def delete_post(post_id: int, current_user: User = Depends(get_current_user)):
    """Delete a post (Giữ nguyên Mock Data)"""
    return {
        "message": "Post deleted successfully",
        "post_id": post_id
    }


# ==========================================
# 3. API CHI TIẾT VÀ TÀI NGUYÊN (MOCK DATA)
# ==========================================

@router.get("/{post_id}", response_model=PostDetailRead)
def get_post_detail(post_id: int):
    """Get detailed information of a specific post (Mock data bổ sung field)"""
    return {
        "post_id": post_id,
        "title": "Used Laptop",
        "description": "Excellent condition laptop for sale",
        "post_type": "Selling",
        "availability": "Open",
        "approval": "Approved",
        "seller_email": "seller@uet.edu.vn",
        "campaign_id": None,
        "created_at": "2024-05-31T15:39:31",
        "reviewed_by": None,
        "reviewed_at": None,
        "reject_reason": None,
        "products": [],
        "images": []
    }


@router.get("/{post_id}/products", response_model=List[dict])
def get_post_products(post_id: int):
    return [{
        "product_id": 1,
        "product_name": "Item",
        "quantity": 1,
        "price": Decimal("100.00")
    }]


@router.post("/{post_id}/products", response_model=dict)
def add_product_to_post(
    post_id: int,
    storage_product_ids: List[int],
    current_user: User = Depends(get_current_user)
):
    return {"message": "Products added successfully", "post_id": post_id}


@router.delete("/{post_id}/products/{product_id}", response_model=dict)
def remove_product_from_post(
    post_id: int,
    product_id: int,
    current_user: User = Depends(get_current_user)
):
    return {"message": "Product removed successfully", "post_id": post_id, "product_id": product_id}


@router.post("/{post_id}/images", response_model=dict)
def add_image_to_post(
    post_id: int,
    data: PostImageCreate,
    current_user: User = Depends(get_current_user)
):
    return {"message": "Image added successfully", "post_id": post_id, "image_id": 1}


@router.delete("/{post_id}/images/{image_id}", response_model=dict)
def remove_image_from_post(
    post_id: int,
    image_id: int,
    current_user: User = Depends(get_current_user)
):
    return {"message": "Image removed successfully", "post_id": post_id, "image_id": image_id}


@router.get("/{post_id}/similar", response_model=list)
def get_similar_posts(post_id: int, limit: int = 10):
    return [{
        "post_id": 2,
        "title": "Used Computer",
        "post_type": "Selling",
        "approval": "Approved",
        "availability": "Open"
    }]