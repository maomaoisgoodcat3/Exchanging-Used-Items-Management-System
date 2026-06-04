"""Admin Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

from app.core.database import get_db
from app.services.auth_svc import get_current_user

# Sử dụng chuẩn tên Model mới nhất của chúng ta
from app.models.users import Users, RoleEnum
from app.models.posts import Posts
from app.models.campaigns import Campaigns

from app.schemas.post_schema import PostApprovalAction
from app.schemas.campaign_schema import CampaignApprovalAction

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

# ==========================================
# DEPENDENCY: KIỂM TRA QUYỀN ADMIN
# ==========================================
def get_admin_user(current_user: Users = Depends(get_current_user)):
    """Vệ sĩ: Chặn tất cả những ai không phải Admin"""
    # Dùng cách kiểm tra linh hoạt để tránh lỗi Enum
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if "Admin" not in role_val:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Quyền truy cập bị từ chối. Chỉ Admin mới thực hiện được hành động này."
        )
    return current_user

# ==========================================
# API ENDPOINTS
# ==========================================

@router.get("/dashboard", response_model=dict)
def get_admin_dashboard(admin: Users = Depends(get_admin_user)):
    """
    Get admin dashboard statistics (Giữ nguyên Mock Data tạm thời)
    """
    return {
        "total_users": 1500,
        "total_posts": 350,
        "total_campaigns": 12,
        "total_transactions": 280,
        "total_revenue": Decimal("50000.00"),
        "pending_posts": 15,
        "pending_campaigns": 3
    }


@router.get("/posts/pending", response_model=List[dict])
def get_pending_posts(
    limit: int = 20,
    skip: int = 0,
    db: Session = Depends(get_db),
    admin: Users = Depends(get_admin_user)
):
    """
    Lấy danh sách các bài đăng đang chờ duyệt (KẾT NỐI DB THẬT)
    """
    # Đã sửa thành cột approval theo Database chuẩn
    posts = db.query(Posts).filter(Posts.approval == "Pending").offset(skip).limit(limit).all()
    result = []
    for p in posts:
        result.append({
            "post_id": p.post_id,
            "title": p.title,
            "seller_email": p.seller_email,
            "post_category": p.post_type.value if hasattr(p.post_type, 'value') else str(p.post_type),
            "status": p.approval.value if hasattr(p.approval, 'value') else str(p.approval),
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    return result


@router.post("/posts/{post_id}/approve", response_model=dict)
def approve_post_admin(
    post_id: int,
    data: PostApprovalAction,
    db: Session = Depends(get_db),
    admin: Users = Depends(get_admin_user)
):
    """
    Duyệt hoặc từ chối bài đăng (KẾT NỐI DB THẬT)
    """
    post = db.query(Posts).filter(Posts.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")

    if data.action == "approve":
        post.approval = "Approved"
        post.availability = "Open"
        post.reject_reason = None
    elif data.action == "reject":
        post.approval = "Rejected"
        post.reject_reason = data.reject_reason
        post.availability = "Closed"

    # Lưu vết người duyệt
    post.reviewed_by = admin.email
    post.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(post)

    return {
        "message": f"Post {data.action} successfully",
        "post_id": post.post_id,
        "status": post.approval,
        "reviewed_by": admin.email
    }


@router.get("/campaigns/pending", response_model=List[dict])
def get_pending_campaigns(
    limit: int = 20,
    skip: int = 0,
    db: Session = Depends(get_db),
    admin: Users = Depends(get_admin_user)
):
    """
    Lấy danh sách các chiến dịch đang chờ duyệt (KẾT NỐI DB THẬT)
    """
    campaigns = db.query(Campaigns).filter(Campaigns.approval == "Pending").offset(skip).limit(limit).all()
    result = []
    for c in campaigns:
        result.append({
            "campaign_id": c.campaign_id,
            "title": c.title,
            "org_email": c.org_email,
            "status": c.approval.value if hasattr(c.approval, 'value') else str(c.approval),
            "created_at": c.start_date.isoformat() if c.start_date else None
        })
    return result


@router.post("/campaigns/{campaign_id}/approve", response_model=dict)
def approve_campaign_admin(
    campaign_id: int,
    data: CampaignApprovalAction,
    db: Session = Depends(get_db),
    admin: Users = Depends(get_admin_user)
):
    """
    Duyệt hoặc từ chối chiến dịch (KẾT NỐI DB THẬT)
    """
    campaign = db.query(Campaigns).filter(Campaigns.campaign_id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Không tìm thấy chiến dịch")

    if data.action == "approve":
        campaign.approval = "Approved"
        campaign.availability = "Open"
        campaign.reject_reason = None
    elif data.action == "reject":
        campaign.approval = "Rejected"
        campaign.reject_reason = data.reject_reason
        campaign.availability = "Closed"

    # Chuẩn hóa tên cột người duyệt
    campaign.reviewed_by = admin.email
    campaign.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(campaign)

    return {
        "message": f"Campaign {data.action} successfully",
        "campaign_id": campaign.campaign_id,
        "status": campaign.approval,
        "reviewed_by": admin.email
    }


@router.put("/settings/service-fee", response_model=dict)
def update_service_fee(
    percentage: Decimal,
    admin: Users = Depends(get_admin_user)
):
    """
    Update global service fee percentage (Giữ nguyên Mock Data tạm thời)
    """
    return {
        "message": "Service fee updated",
        "service_fee_percentage": percentage,
        "updated_by": admin.email
    }


@router.get("/users", response_model=List[dict])
def list_all_users(
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    db: Session = Depends(get_db),
    admin: Users = Depends(get_admin_user)
):
    """
    Lấy danh sách người dùng (KẾT NỐI DB THẬT)
    """
    query = db.query(Users)
    if search:
        # Cập nhật tên cột (email, name)
        query = query.filter(Users.email.contains(search) | Users.name.contains(search))
    
    users = query.offset(skip).limit(limit).all()
    result = []
    for u in users:
        result.append({
            "email": u.email,
            "name": u.name,
            "phone": u.phone,
            "role": u.role.value if hasattr(u.role, 'value') else str(u.role),
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return result


@router.post("/users/{email}/role", response_model=dict)
def update_user_role(
    email: str,
    role: str,
    db: Session = Depends(get_db),
    admin: Users = Depends(get_admin_user)
):
    """
    Cập nhật quyền người dùng (KẾT NỐI DB THẬT)
    """
    if role not in ["Member", "Admin"]:
        raise