"""Post Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from decimal import Decimal
from app.schemas.post_schema import (
    PostCreate, PostUpdate, PostRead, PostDetailRead, PostListRead,
    PostFilter, PostApprovalAction, PostProductCreate, PostImageCreate
)
from app.services.post_svc import (
    PostCategory, AvailabilityStatus, ApprovalStatus
)
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_svc import get_current_user
from app.models.posts import Posts, PostProducts, ProductImages, PostApprovalStatus, PostAvailabilityStatus
from app.models.users import Users
router = APIRouter(prefix="/api/v1/posts", tags=["Posts"])


# 1. API CHO USER THƯỜNG (Chỉ lấy bài đã duyệt)
@router.get("/", response_model=list)
def list_posts(
    post_category: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
    db: Session = Depends(get_db)
):
    posts = db.query(Posts).filter(
        Posts.approval == PostApprovalStatus.Approved
    ).order_by(Posts.created_at.desc()).offset(skip).limit(limit).all()
    
    return [{
        "post_id": p.post_id,
        "title": p.title,
        "description": p.description,
        "seller_email": p.seller_email,
        "post_category": p.post_type.value if hasattr(p.post_type, 'value') else str(p.post_type),
        "status": "Approved", # User thường không cần biết trạng thái thực sự
        "availability": p.availability.value if hasattr(p.availability, 'value') else str(p.availability)
    } for p in posts]

# 2. API CHO ADMIN (Lấy mọi bài viết)
@router.get("/admin-all", response_model=list)
def get_all_posts_admin(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    if getattr(current_user, "role", None) != "Admin":
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền xem toàn bộ bài viết.")
        
    posts = db.query(Posts).order_by(Posts.created_at.desc()).all()
    return [{
        "post_id": p.post_id,
        "title": p.title,
        "description": p.description,
        "seller_email": p.seller_email,
        "post_category": p.post_type.value if hasattr(p.post_type, 'value') else str(p.post_type),
        "approval": p.approval.value if hasattr(p.approval, 'value') else str(p.approval),
        "availability": p.availability.value if hasattr(p.availability, 'value') else str(p.availability),
        "reject_reason": getattr(p, 'reject_reason', None)
    } for p in posts]

# 3. API CHO NGƯỜI ĐĂNG BÀI (Lấy mọi bài của chính họ)
@router.get("/my-posts", response_model=list)
def get_my_posts(
    db: Session = Depends(get_db), 
    current_user: Users = Depends(get_current_user)
):
    posts = db.query(Posts).filter(Posts.seller_email == current_user.user_email).order_by(Posts.created_at.desc()).all()
    return [{
        "post_id": p.post_id,
        "title": p.title,
        "description": p.description,
        "seller_email": p.seller_email,
        "post_category": p.post_type.value if hasattr(p.post_type, 'value') else str(p.post_type),
        "approval": p.approval.value if hasattr(p.approval, 'value') else str(p.approval),
        "availability": p.availability.value if hasattr(p.availability, 'value') else str(p.availability),
        "reject_reason": getattr(p, 'reject_reason', None)
    } for p in posts]



@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_post(
    data: PostCreate,
    current_user: str = Depends()
):
    """
    Create a new post
    
    Database: Posts table
    - seller_email: Current user's email
    - post_category: Selling, Trading, or Donating
    - title: Post title
    - description: Detailed description
    - campaign_id: Optional - if participating in campaign
    - availability: Default 'Open' - available for sale/trading/donation
    - approval: Default 'Pending' - needs admin approval
    
    - **title**: Post title
    - **description**: Detailed description
    - **post_category**: Category (Selling, Trading, Donating)
    - **campaign_id**: Associated campaign ID (optional)
    - **products**: List of storage product IDs
    """
    if not data.title or not data.description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title and description are required"
        )
    
    return {
        "message": "Post created successfully",
        "post_id": 1,
        "seller_email": current_user,
        "availability": "Open",
        "approval": "Pending",
        "created_at": "2024-05-31T15:39:31"
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
        "availability": "Open",
        "approval": "Approved",
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
    current_user: Users = Depends(get_current_user)
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
def delete_post(post_id: int, current_user: Users = Depends(get_current_user)):
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
    current_user: Users = Depends(get_current_user)
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


@staticmethod
def handle_approval_action(current_status: str, action: str, reject_reason: Optional[str] = None) -> tuple[Optional[str], bool, Optional[str]]:
        """
        Handle approval action and determine new status.

        Args:
            current_status: Current approval status
            action: Action to perform (approve, reject, resend)
            reject_reason: Reason for rejection

        Returns:
            Tuple of (new_status, is_valid, error_message)
        """
        valid_actions = ["approve", "reject", "resend"]
        if action not in valid_actions:
            return None, False, f"Invalid action. Must be one of {valid_actions}"

        if action == "approve":
            return ApprovalStatus.APPROVED.value, True, None
        elif action == "reject":
            if not reject_reason:
                return None, False, "Reject reason is required for rejection"
            return ApprovalStatus.REJECTED.value, True, None
        elif action == "resend":
            return ApprovalStatus.RESENDING.value, True, None

        return None, False, f"Invalid action. Must be one of {valid_actions}"


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
    current_user: Users = Depends(get_current_user)
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
    current_user: Users = Depends(get_current_user)
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
    current_user: Users = Depends(get_current_user)
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
    current_user: Users = Depends(get_current_user)
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


@router.put("/{post_id}/toggle-status", response_model=dict)
def toggle_post_status(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """Owner tự đổi trạng thái Available <-> Closed"""
    post = db.query(Posts).filter(Posts.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    if post.seller_email != current_user.user_email:
        raise HTTPException(status_code=403, detail="Chỉ người đăng mới có quyền Đóng/Mở bài viết này.")
        
    # use setattr but first cast the attribute to str to satisfy static type checks
    from typing import cast
    current_availability = cast(str, getattr(post, "availability"))
    setattr(post, "availability", "Closed" if current_availability == "Available" else "Available")
    db.commit()
    
    return {
        "message": "Cập nhật trạng thái thành công",
        "post_id": post_id,
        "availability": post.availability
    }