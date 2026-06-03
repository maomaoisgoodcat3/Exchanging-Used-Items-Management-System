"""Campaign Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import Optional, List
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import os

from app.core.database import get_db
from app.services.auth_svc import get_current_user
from app.models.user import User, Organization, OrganizationMember
from app.models.campaign import Campaign, CampaignImage

# Tự động tìm SECRET_KEY
try:
    from app.core.security import SECRET_KEY, ALGORITHM
except ImportError:
    SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter(prefix="/api/v1/campaigns", tags=["Campaigns"])

# ==========================================
# 1. PYDANTIC SCHEMAS
# ==========================================
class CampaignCreate(BaseModel):
    org_email: str
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    images: List[str] = [] 

class CampaignApprovalAction(BaseModel):
    action: str 
    reject_reason: Optional[str] = None

# ==========================================
# 2. API ENDPOINTS
# ==========================================

@router.get("/")
def list_campaigns(
    request: Request,
    org_email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lấy danh sách Campaign (Bảo mật tùy biến)"""
    current_user = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            from jose import jwt
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
            if email:
                current_user = db.query(User).filter(User.email == email).first()
        except Exception:
            pass

    query = db.query(Campaign)
    if org_email:
        query = query.filter(Campaign.org_email == org_email)
        
    campaigns = query.order_by(Campaign.campaign_id.desc()).all()
    result = []
    
    for c in campaigns:
        is_visible = False
        approval_val = c.approval.value if hasattr(c.approval, 'value') else str(c.approval)
        
        # Logic Hiển thị
        if "Approved" in approval_val:
            is_visible = True
        elif current_user:
            role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
            if "Admin" in role_val:
                is_visible = True
            else:
                membership = db.query(OrganizationMember).filter(
                    OrganizationMember.org_email == c.org_email,
                    OrganizationMember.mem_email == current_user.email
                ).first()
                if membership:
                    perm_val = membership.mem_permission.value if hasattr(membership.mem_permission, 'value') else str(membership.mem_permission)
                    if "Manager" in perm_val or "Poster" in perm_val:
                        is_visible = True
                        
        if not is_visible:
            continue

        first_img = db.query(CampaignImage).filter(CampaignImage.campaign_id == c.campaign_id).first()
        org = db.query(Organization).filter(Organization.org_email == c.org_email).first()
        
        result.append({
            "campaign_id": c.campaign_id,
            "org_email": c.org_email,
            "org_name": org.org_name if org else "Unknown",
            "title": c.title,
            "start_date": c.start_date.isoformat() if c.start_date else None,
            "end_date": c.end_date.isoformat() if hasattr(c, 'end_date') and c.end_date else None,
            "availability": c.availability,
            "approval": c.approval,
            "thumbnail_url": first_img.image_url if first_img else None
        })
        
    return result


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_campaign(
    data: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tạo Campaign mới"""
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.org_email == data.org_email,
        OrganizationMember.mem_email == current_user.email
    ).first()

    is_authorized = False
    if membership:
        perm_val = membership.mem_permission.value if hasattr(membership.mem_permission, 'value') else str(membership.mem_permission)
        if "Manager" in perm_val or "Poster" in perm_val:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(status_code=403, detail="Chỉ Manager hoặc Poster mới có quyền tạo Chiến dịch.")

    new_campaign = Campaign(
        org_email=data.org_email, title=data.title, description=data.description,
        start_date=data.start_date, end_date=data.end_date,
        approval="Pending", availability="Closed"
    )
    db.add(new_campaign)
    db.flush() 

    for img_url in data.images:
        new_image = CampaignImage(campaign_id=new_campaign.campaign_id, image_url=img_url)
        db.add(new_image)

    db.commit()
    return {"message": "Đã tạo Chiến dịch thành công và đang chờ duyệt!", "campaign_id": new_campaign.campaign_id}


@router.put("/{campaign_id}/approve")
def approve_campaign(
    campaign_id: int,
    data: CampaignApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin duyệt hoặc từ chối Chiến dịch"""
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if "Admin" not in role_val:
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền duyệt Chiến dịch!")
        
    campaign = db.query(Campaign).filter(Campaign.campaign_id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Không tìm thấy Chiến dịch")
        
    if data.action == "approve":
        campaign.approval = "Approved"
        campaign.availability = "Open"
        campaign.reject_reason = None
    elif data.action == "reject":
        campaign.approval = "Rejected"
        campaign.availability = "Closed"
        campaign.reject_reason = data.reject_reason
        
    campaign.reviewed_by = current_user.email
    db.commit()
    return {"message": f"Đã {data.action} chiến dịch", "status": campaign.approval}