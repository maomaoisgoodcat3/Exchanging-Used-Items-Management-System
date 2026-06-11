"""Post Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, computed_field

from app.schemas.post_schema import (
    PostUpdate, PostRead, PostDetailRead, PostListRead,
    PostFilter, PostApprovalAction, PostImageCreate
)
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.services.auth_svc import get_current_user

# Sử dụng Models chuẩn xác của chúng ta
from app.models.users import Users
from app.models.posts import Posts, PostCategoryEnum, PostApprovalStatus, PostAvailabilityStatus, PostProducts, ProductImages, Storage, ProductImages

router = APIRouter(prefix="/api/v1/posts", tags=["Posts"])

# ==========================================
# 1. PYDANTIC SCHEMAS (Định dạng dữ liệu)
# ==========================================

class PostResponse(BaseModel):
    post_id: int
    title: str
    description: str | None = None
    campaign_id: int | None = None
    seller_email: str
    thumbnail_url: str | None = None
    created_at: datetime | None = None

    post_category: PostCategoryEnum
    approval: PostApprovalStatus
    availability: PostAvailabilityStatus
    
    reviewed_at: datetime | None = None
    reviewed_by: str | None = None
    reject_reason: str | None = None

    class Config:
        from_attributes = True

# Định nghĩa Sub-Model đại diện cho cấu trúc của bảng PostProducts
class PostProductCreate(BaseModel):
    product_id: int
    product_quantity: int = 1

# Model chính đại diện cho toàn bộ dữ liệu bài đăng mới
class PostCreate(BaseModel):
    title: str
    post_category: str  # Hoặc PostCategoryEnum nếu bạn có sẵn Enum
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    campaign_id: Optional[int] = None
    
    # Danh sách các sản phẩm đính kèm bài viết này
    products: List[PostProductCreate]

    class Config:
            from_attributes = True

class StorageInPostRead(BaseModel):
    product_id: int
    product_name: str
    product_price: float

    class Config:
        from_attributes = True

# Schema hiển thị thông tin sản phẩm đi kèm bài đăng
class PostProductRead(BaseModel):
    product_id: int
    product_quantity: int
    product: Optional[StorageInPostRead] = None

    class Config:
        from_attributes = True # Pydantic v2 (Nếu dùng Pydantic v1 thì đổi thành orm_mode = True)

    # Trích xuất dữ liệu động từ quan hệ `product` (bảng Storage gốc)
    # @computed_field
    # def product_name(self) -> str:
    #     return self.product.product_name if self.product else "Vật phẩm không tồn tại trong kho"

    # @computed_field
    # def product_price(self) -> float:
    #     return self.product.product_price if self.product else 0.0

# Schema hiển thị chi tiết bài đăng
class PostDetailRead(BaseModel):
    post_id: int
    title: str
    description: Optional[str] = None
    post_category: str
    approval: str
    seller_email: str
    thumbnail_url: Optional[str] = None
    campaign_id: Optional[int] = None
    created_at: Optional[datetime] = None

    products: List[PostProductRead] = []

    class Config:
        from_attributes = True

# ==========================================
# 2. CORE API ENDPOINTS
# ==========================================

@router.get("/", response_model=list[PostResponse])
def list_posts(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    return (
        db.query(Posts)
        .filter(Posts.approval == PostApprovalStatus.Approved)
        .order_by(Posts.created_at.desc())
        .all()
    )


@router.get("/admin-all", response_model=list[PostResponse])
def get_all_posts_admin(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """API CHO ADMIN (Lấy mọi bài viết, kể cả Pending/Rejected)"""
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if "Admin" not in role_val:
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền xem toàn bộ bài viết.")
        
    return (
        db.query(Posts)
        .order_by(Posts.created_at.desc())
        .all()
    )

# ==========================================
# 2. API THAO TÁC (TẠO, SỬA, XÓA, DUYỆT)
# ==========================================

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    try:
        """Tạo bài đăng mới & Tự động lưu sản phẩm vào Kho đồ (Storage)"""
        if not data.title or not data.description:
            raise HTTPException(status_code=400, detail="Title and description are required")
        
        # 1. Tạo bảng Post chính
        new_post = Posts(
            seller_email=current_user.email,
            campaign_id=data.campaign_id,
            title=data.title,
            description=data.description,
            post_category=data.post_category, 
            approval="Pending",
            availability="Open"
        )
        db.add(new_post)
        db.flush() # Để lấy post_id

        # 2. Xử lý Sản phẩm: Lưu vào Storage (Kho đồ) trước, sau đó Link vào PostProduct
        if data.products:
            for prod in data.products:
                post_product = PostProducts(
                    post_id=new_post.post_id,         # Lấy ID vừa được sinh từ bước 1
                    product_id=prod.product_id,
                    product_quantity=prod.product_quantity
                )
                db.add(post_product)
                db.flush() # Để lấy product_id vừa sinh ra
                
                # Tạo liên kết vào bảng trung gian
                # new_prod_link = PostProducts(
                #     post_id=new_post.post_id,
                #     product_id=post_product.product_id
                # )
                # db.add(new_prod_link)

        # 3. Xử lý Images
        # if data.images:
        #     for img in data.images:
        #         new_img = ProductImages(
        #             post_id=new_post.post_id,
        #             image_url=img.image_url
        #         )
        #         db.add(new_img)

        db.commit()
        db.refresh(new_post)
        
        return {
            "post_id": new_post.post_id,
            "title": new_post.title,
            "description": new_post.description,
            "thumbnail_url": new_post.thumbnail_url,
            "post_category": new_post.post_category,
            "approval": new_post.approval,
            "availability": new_post.availability,
            "reject_reason": new_post.reject_reason,
            "created_at": new_post.created_at.isoformat() if new_post.created_at is not None else None
        }
    
    except Exception as e:
        db.rollback() # Hoàn tác (Xóa bỏ) mọi thứ đã làm nếu xảy ra bất kỳ lỗi nào trong quá trình chạy
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Lỗi hệ thống khi phân tách dữ liệu: {str(e)}"
        )

@router.post("/{post_id}/approve", response_model=dict)
def approve_post(
    post_id: int,
    data: PostApprovalAction,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """Admin duyệt / từ chối bài viết"""
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if "Admin" not in role_val:
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền duyệt bài.")
        
    post = db.query(Posts).filter(Posts.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")

    if data.action == "approve":
        post.approval = PostApprovalStatus.Approved
        post.availability = PostAvailabilityStatus.Open
        post.reject_reason = None 
    elif data.action == "reject":
        post.approval = PostApprovalStatus.Rejected
        post.availability = PostAvailabilityStatus.Closed
        post.reject_reason = data.reject_reason or "Vi phạm quy định cộng đồng"
    elif data.action == "resend":
        post.approval = PostApprovalStatus.Resending

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
    current_user: Users = Depends(get_current_user)
):
    """Owner tự đổi trạng thái Available <-> Closed"""
    post = db.query(Posts).filter(Posts.post_id == post_id).first()
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


@router.post("/{post_id}/mark-closed", response_model=dict)
def mark_post_closed(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """Mark post as closed"""
    post = db.query(Posts)\
    .filter(Posts.post_id == post_id)\
    .first()

    if not post:
        raise HTTPException(status_code=404)

    post.availability = "Closed"

    db.commit()
    db.refresh(post)

    return post


@router.put("/{post_id}", response_model=dict)
def update_post(
    post_id: int,
    data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    post = db.query(Posts)\
    .filter(Posts.post_id == post_id)\
    .first()

    if not post:
        raise HTTPException(status_code=404)

    if post.seller_email != current_user.email:
        raise HTTPException(status_code=403)

    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(post, field, value)

    db.commit()
    db.refresh(post)

    return post


@router.delete("/{post_id}", response_model=dict)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """Delete a post"""
    post = db.query(Posts)\
    .filter(Posts.post_id == post_id)\
    .first()

    if not post:
        raise HTTPException(status_code=404)

    if post.seller_email != current_user.email:
        raise HTTPException(status_code=403)

    db.delete(post)
    db.commit()

    return {
        "message": "Deleted successfully",
        "post_id": post_id
    }


# ==========================================
# 3. API CHI TIẾT
# ==========================================

@router.get("/{post_id}", response_model=PostDetailRead)
def get_post_detail(
    post_id: int,
    db: Session = Depends(get_db)
):
    post = (
        db.query(Posts)
        .options(
            joinedload(Posts.products)         # Nạp bảng trung gian PostProducts
            .joinedload(PostProducts.product)  # Từ bảng trung gian nạp tiếp sang bảng Storage
        )
        .filter(Posts.post_id == post_id)
        .first()
    )

    if not post:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy bài viết"
        )
    
    if post.products:
        for p in post.products:
            print(f"--> Kiểm tra liên kết: ID={p.product_id}, Quan hệ product={p.product}")
            if p.product:
                print(f"----> Tên sản phẩm thật trong DB: {p.product.product_name}")

    return post


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
    current_user: Users = Depends(get_current_user)
):
    return {"message": "Products added successfully", "post_id": post_id}


@router.delete("/{post_id}/products/{product_id}", response_model=dict)
def remove_product_from_post(
    post_id: int,
    product_id: int,
    current_user: Users = Depends(get_current_user)
):
    return {"message": "Product removed successfully", "post_id": post_id, "product_id": product_id}


@router.post("/{post_id}/images", response_model=dict)
def add_image_to_post(
    post_id: int,
    data: PostImageCreate,
    current_user: Users = Depends(get_current_user)
):
    return {"message": "Image added successfully", "post_id": post_id, "image_id": 1}


@router.delete("/{post_id}/images/{image_id}", response_model=dict)
def remove_image_from_post(
    post_id: int,
    image_id: int,
    current_user: Users = Depends(get_current_user)
):
    return {"message": "Image removed successfully", "post_id": post_id, "image_id": image_id}
