"""Admin Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

from app.core.database import get_db
from app.services.auth_svc import get_current_user
from app.models.user import AccountUser, RoleEnum
from app.models.post import Post
from app.models.campaign import Campaign
from app.schemas.post_schema import PostApprovalAction
from app.schemas.campaign_schema import CampaignApprovalAction

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

# ==========================================
# DEPENDENCY: KIỂM TRA QUYỀN ADMIN
# ==========================================
def get_admin_user(current_user: AccountUser = Depends(get_current_user)):
    """Vệ sĩ: Chặn tất cả những ai không phải Admin"""
    if current_user.role != RoleEnum.Admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Quyền truy cập bị từ chối. Chỉ Admin mới thực hiện được hành động này."
        )
    return current_user

# ==========================================
# API ENDPOINTS
# ==========================================

@router.get("/dashboard", response_model=dict)
def get_admin_dashboard(admin: AccountUser = Depends(get_admin_user)):
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
    admin: AccountUser = Depends(get_admin_user)
):
    """
    Lấy danh sách các bài đăng đang chờ duyệt (KẾT NỐI DB THẬT)
    """
    posts = db.query(Post).filter(Post.approval_status == "Pending").offset(skip).limit(limit).all()
    result = []
    for p in posts:
        result.append({
            "post_id": p.post_id,
            "title": p.title,
            "seller_email": p.seller_email,
            "post_category": p.post_type if hasattr(p, 'post_type') else "Unknown",
            "status": p.approval_status,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    return result


@router.post("/posts/{post_id}/approve", response_model=dict)
def approve_post_admin(
    post_id: int,
    data: PostApprovalAction,
    db: Session = Depends(get_db),
    admin: AccountUser = Depends(get_admin_user)
):
    """
    Duyệt hoặc từ chối bài đăng (KẾT NỐI DB THẬT)
    """
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")

    if data.action == "approve":
        post.approval_status = "Approved"
        post.open_status = "Available"
    elif data.action == "reject":
        post.approval_status = "Rejected"
        post.rejection_reason = data.reject_reason
        post.open_status = "Closed"

    post.reviewed_by = admin.user_email
    post.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(post)

    return {
        "message": f"Post {data.action} successfully",
        "post_id": post.post_id,
        "status": post.approval_status,
        "reviewed_by": admin.user_email
    }


@router.get("/campaigns/pending", response_model=List[dict])
def get_pending_campaigns(
    limit: int = 20,
    skip: int = 0,
    db: Session = Depends(get_db),
    admin: AccountUser = Depends(get_admin_user)
):
    """
    Lấy danh sách các chiến dịch đang chờ duyệt (KẾT NỐI DB THẬT)
    """
    campaigns = db.query(Campaign).filter(Campaign.approval_status == "Pending").offset(skip).limit(limit).all()
    result = []
    for c in campaigns:
        result.append({
            "campaign_id": c.campaign_id,
            "title": c.title,
            "org_email": c.organ_email,
            "status": c.approval_status,
            "created_at": c.start_date.isoformat() if c.start_date else None
        })
    return result


@router.post("/campaigns/{campaign_id}/approve", response_model=dict)
def approve_campaign_admin(
    campaign_id: int,
    data: CampaignApprovalAction,
    db: Session = Depends(get_db),
    admin: AccountUser = Depends(get_admin_user)
):
    """
    Duyệt hoặc từ chối chiến dịch (KẾT NỐI DB THẬT)
    """
    campaign = db.query(Campaign).filter(Campaign.campaign_id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Không tìm thấy chiến dịch")

    if data.action == "approve":
        campaign.approval_status = "Approved"
        campaign.open_status = "Available"
    elif data.action == "reject":
        campaign.approval_status = "Rejected"
        campaign.rejection_reason = data.reject_reason
        campaign.open_status = "Closed"

    campaign.admin_reviewer = admin.user_email
    campaign.approval_date = datetime.utcnow()
    
    db.commit()
    db.refresh(campaign)

    return {
        "message": f"Campaign {data.action} successfully",
        "campaign_id": campaign.campaign_id,
        "status": campaign.approval_status,
        "reviewed_by": admin.user_email
    }


@router.put("/settings/service-fee", response_model=dict)
def update_service_fee(
    percentage: Decimal,
    admin: AccountUser = Depends(get_admin_user)
):
    """
    Update global service fee percentage (Giữ nguyên Mock Data tạm thời)
    """
    return {
        "message": "Service fee updated",
        "service_fee_percentage": percentage,
        "updated_by": admin.user_email
    }


@router.get("/users", response_model=List[dict])
def list_all_users(
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    db: Session = Depends(get_db),
    admin: AccountUser = Depends(get_admin_user)
):
    """
    Lấy danh sách người dùng (KẾT NỐI DB THẬT)
    """
    query = db.query(AccountUser)
    if search:
        query = query.filter(AccountUser.user_email.contains(search) | AccountUser.user_name.contains(search))
    
    users = query.offset(skip).limit(limit).all()
    result = []
    for u in users:
        result.append({
            "email": u.user_email,
            "name": u.user_name,
            "phone": u.phone,
            "role": u.role,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return result


@router.post("/users/{email}/role", response_model=dict)
def update_user_role(
    email: str,
    role: str,
    db: Session = Depends(get_db),
    admin: AccountUser = Depends(get_admin_user)
):
    """
    Cập nhật quyền người dùng (KẾT NỐI DB THẬT)
    """
    if role not in ["Member", "Admin"]:
        raise HTTPException(status_code=400, detail="Role không hợp lệ (Chỉ nhận Member hoặc Admin)")
        
    user = db.query(AccountUser).filter(AccountUser.user_email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
    user.role = role
    db.commit()
    db.refresh(user)

    return {
        "message": "User role updated successfully",
        "email": user.user_email,
        "role": user.role
    }


@router.get("/reports", response_model=dict)
def get_system_reports(
    report_type: str = "daily",
    admin: AccountUser = Depends(get_admin_user)
):
    """
    Get system reports (Giữ nguyên Mock Data tạm thời)
    """
    return {
        "period": datetime.utcnow().strftime("%Y-%m-%d"),
        "report_type": report_type,
        "new_users": 25,
        "new_posts": 120,
        "new_transactions": 50,
        "total_revenue": Decimal("8500.00"),
        "active_campaigns": 5
    }