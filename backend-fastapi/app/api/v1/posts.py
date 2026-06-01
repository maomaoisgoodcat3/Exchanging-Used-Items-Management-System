"""Post Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from decimal import Decimal
from app.schemas.post_schema import (
    PostCreate, PostUpdate, PostRead, PostDetailRead, PostListRead,
    PostFilter, PostApprovalAction, PostProductCreate, PostImageCreate
)
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_svc import get_current_user
from app.models.post import Post, PostProduct, PostImage
from app.models.user import AccountUser
router = APIRouter(prefix="/api/v1/posts", tags=["Posts"])


# 1. API CHO USER THƯỜNG (Chỉ lấy bài đã duyệt)
@router.get("/", response_model=list)
def list_posts(
    post_category: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
    db: Session = Depends(get_db)
):
    posts = db.query(Post).filter(
        Post.approval_status == "Approved"
    ).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    
    return [{
        "post_id": p.post_id,
        "title": p.title,
        "description": p.description,
        "seller_email": p.seller_email,
        "post_category": p.post_type.value if hasattr(p.post_type, 'value') else str(p.post_type),
        "status": "Approved", # User thường không cần biết trạng thái thực sự
        "open_status": p.open_status.value if hasattr(p.open_status, 'value') else str(p.open_status)
    } for p in posts]

# 2. API CHO ADMIN (Lấy mọi bài viết)
@router.get("/admin-all", response_model=list)
def get_all_posts_admin(
    db: Session = Depends(get_db),
    current_user: AccountUser = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền xem toàn bộ bài viết.")
        
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    return [{
        "post_id": p.post_id,
        "title": p.title,
        "description": p.description,
        "seller_email": p.seller_email,
        "post_category": p.post_type.value if hasattr(p.post_type, 'value') else str(p.post_type),
        "status": p.approval_status.value if hasattr(p.approval_status, 'value') else str(p.approval_status),
        "open_status": p.open_status.value if hasattr(p.open_status, 'value') else str(p.open_status),
        "rejection_reason": getattr(p, 'rejection_reason', None)
    } for p in posts]

# 3. API CHO NGƯỜI ĐĂNG BÀI (Lấy mọi bài của chính họ)
@router.get("/my-posts", response_model=list)
def get_my_posts(
    db: Session = Depends(get_db), 
    current_user: AccountUser = Depends(get_current_user)
):
    posts = db.query(Post).filter(Post.seller_email == current_user.user_email).order_by(Post.created_at.desc()).all()
    return [{
        "post_id": p.post_id,
        "title": p.title,
        "description": p.description,
        "seller_email": p.seller_email,
        "post_category": p.post_type.value if hasattr(p.post_type, 'value') else str(p.post_type),
        "status": p.approval_status.value if hasattr(p.approval_status, 'value') else str(p.approval_status),
        "open_status": p.open_status.value if hasattr(p.open_status, 'value') else str(p.open_status),
        "rejection_reason": getattr(p, 'rejection_reason', None)
    } for p in posts]



@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db), # Thêm Dependency để gọi DB
    current_user: AccountUser = Depends(get_current_user) # Gọi hàm giải mã Token để lấy User thật
):
    """
    Create a new post
    
    Database: Posts table (LƯU THẬT VÀO MYSQL)
    """
    if not data.title or not data.description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title and description are required"
        )
    
    # 1. Tạo bảng Post chính
    new_post = Post(
        seller_email=current_user.user_email,
        campaign_id=data.campaign_id,
        title=data.title,
        description=data.description,
        post_type=data.post_category, 
        approval_status="Pending",
        open_status="Available"
    )
    db.add(new_post)
    db.flush() # Đẩy tạm xuống DB để lấy post_id sinh ra tự động

    # 2. Xử lý danh sách Products (Mô phỏng: tạo PostProduct từ ID giả định)
    # LƯU Ý: Vì chưa có bảng Storage, ta tạm lưu ID sản phẩm vào bảng PostProduct
    for prod_id in data.products:
        new_prod = PostProduct(
            post_id=new_post.post_id,
            product_category_id=prod_id, # Tạm mượn cột này để lưu ID đồ vật
            product_quantity=1
        )
        db.add(new_prod)

    # 3. Xử lý Images (nếu có)
    if data.images:
        for img in data.images:
            new_img = PostImage(
                post_id=new_post.post_id,
                image_url=img.image_url
            )
            db.add(new_img)

    # 4. Commit toàn bộ thay đổi xuống MySQL
    db.commit()
    db.refresh(new_post)
    
    return {
        "message": "Post created successfully and saved to Database!",
        "post_id": new_post.post_id,
        "seller_email": current_user.user_email,
        "status": new_post.approval_status,
        "created_at": new_post.created_at
    }

@router.get("/{post_id}", response_model=PostDetailRead)
def get_post_detail(post_id: int):
    """
    Get detailed information of a specific post
    
    Database: Posts table joined with Storage and PostImages
    - Retrieves post by post_id
    - Gets associated storage products
    - Gets associated images
    
    - **post_id**: Post ID
    """
    return {
        "post_id": post_id,
        "title": "Used Laptop",
        "description": "Excellent condition laptop for sale",
        "post_category": "Selling",
        "status": "Approved",
        "seller_email": "seller@uet.edu.vn",
        "campaign_id": None,
        "created_at": "2024-05-31T15:39:31",
        "reviewed_by": None,
        "reviewed_at": None
    }


@router.put("/{post_id}", response_model=dict)
def update_post(
    post_id: int,
    data: PostUpdate,
    current_user: AccountUser = Depends(get_current_user)
):
    """
    Update post information (owner only, if not approved)
    
    Database: Posts table
    - Can only update if status is Pending
    - seller_email must match current_user
    """
    return {
        "message": "Post updated successfully",
        "post_id": post_id
    }


@router.delete("/{post_id}", response_model=dict)
def delete_post(post_id: int, current_user: AccountUser = Depends(get_current_user)):
    """
    Delete a post (owner or admin only)
    
    Database: Posts table
    - Delete post and cascade to PostProducts and PostImages
    """
    return {
        "message": "Post deleted successfully",
        "post_id": post_id
    }


@router.post("/{post_id}/mark-sold", response_model=dict)
def mark_post_sold(
    post_id: int,
    current_user: AccountUser = Depends(get_current_user)
):
    """
    Mark post as sold
    
    Database: Posts table
    - Updates status to 'Sold'
    - Only owner can mark as sold
    """
    return {
        "message": "Post marked as sold",
        "post_id": post_id,
        "status": "Sold"
    }


@router.post("/{post_id}/approve", response_model=dict)
def approve_post(
    post_id: int,
    data: PostApprovalAction,
    db: Session = Depends(get_db),
    current_user: AccountUser = Depends(get_current_user)
):
    """Admin duyệt / từ chối bài viết"""
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền duyệt bài.")
        
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")

    if data.action == "approve":
        post.approval_status = "Approved"
        post.open_status = "Available"
        post.rejection_reason = None # Xóa lý do reject cũ nếu Admin đổi ý
    elif data.action == "reject":
        post.approval_status = "Rejected"
        post.open_status = "Closed" # Bài bị reject sẽ tự động đóng
        # Lấy lý do (nếu Schema của bạn không có trường này, nó sẽ dùng mặc định)
        post.rejection_reason = getattr(data, 'reject_reason', "Vi phạm quy định cộng đồng")

    post.reviewed_by = current_user.user_email
    db.commit()
    
    return {
        "message": f"Đã chuyển trạng thái bài viết thành {data.action}",
        "post_id": post_id,
        "status": post.approval_status
    }


@router.get("/{post_id}/products", response_model=List[dict])
def get_post_products(post_id: int):
    """
    Get products in a post
    
    Database: PostProducts table joined with Storage
    - Retrieves all products for the post_id
    """
    return [
        {
            "product_id": 1,
            "product_name": "Item",
            "quantity": 1,
            "price": Decimal("100.00")
        }
    ]


@router.post("/{post_id}/products", response_model=dict)
def add_product_to_post(
    post_id: int,
    storage_product_ids: List[int],
    current_user: AccountUser = Depends(get_current_user)
):
    """
    Add storage products to post
    
    Database: PostProducts table
    - Links storage products to post
    - storage_product_ids must exist in Storage table
    """
    return {
        "message": "Products added successfully",
        "post_id": post_id
    }


@router.delete("/{post_id}/products/{product_id}", response_model=dict)
def remove_product_from_post(
    post_id: int,
    product_id: int,
    current_user: AccountUser = Depends(get_current_user)
):
    """
    Remove product from post
    
    Database: PostProducts table
    - Removes link between post and storage product
    """
    return {
        "message": "Product removed successfully",
        "post_id": post_id,
        "product_id": product_id
    }


@router.post("/{post_id}/images", response_model=dict)
def add_image_to_post(
    post_id: int,
    data: PostImageCreate,
    current_user: AccountUser = Depends(get_current_user)
):
    """
    Add image to post
    
    Database: PostImages table
    - Adds image_url and uploaded_at timestamp
    """
    return {
        "message": "Image added successfully",
        "post_id": post_id,
        "image_id": 1
    }


@router.delete("/{post_id}/images/{image_id}", response_model=dict)
def remove_image_from_post(
    post_id: int,
    image_id: int,
    current_user: AccountUser = Depends(get_current_user)
):
    """
    Remove image from post
    
    Database: PostImages table
    - Deletes image record
    """
    return {
        "message": "Image removed successfully",
        "post_id": post_id,
        "image_id": image_id
    }


@router.get("/{post_id}/similar", response_model=List[PostRead])
def get_similar_posts(post_id: int, limit: int = 10):
    """
    Get similar posts (same post_category)
    
    Database: Posts table
    - Filters by same post_category
    - Excludes the current post
    """
    return [
        {
            "post_id": 2,
            "title": "Used Computer",
            "post_category": "Selling",
            "status": "Approved"
        }
    ]
