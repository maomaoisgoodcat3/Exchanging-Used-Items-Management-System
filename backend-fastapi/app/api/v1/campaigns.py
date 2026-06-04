"""Campaign Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, List
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import os
from jose import jwt

from app.core.database import get_db
from app.services.auth_svc import get_current_user
from app.models.users import Users, Organizations, OrganizationMembers
from app.models.campaigns import Campaigns

try:
    from app.core.security import SECRET_KEY, ALGORITHM
except ImportError:
    SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter(prefix="/api/v1/campaigns", tags=["Campaigns"])

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_optional_user(token: str = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    if not token: return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email: return db.query(Users).filter(Users.email == email).first()
    except: return None
    return None

class CampaignCreate(BaseModel):
    org_email: str
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    image_url: Optional[str] = None 

class CampaignApprovalAction(BaseModel):
    action: str 
    reject_reason: Optional[str] = None


@router.get("/")
def list_campaigns(request: Request, org_email: Optional[str] = None, db: Session = Depends(get_db), current_user: Optional[Users] = Depends(get_optional_user)):
    query = db.query(Campaigns)
    if org_email: query = query.filter(Campaigns.org_email == org_email)
    campaigns = query.order_by(Campaigns.campaign_id.desc()).all()
    result = []
    
    for c in campaigns:
        is_visible = False
        approval_val = c.approval.value if hasattr(c.approval, 'value') else str(c.approval)
        
        # LOGIC BẢO MẬT HIỂN THỊ
        if "Approved" in approval_val: is_visible = True
        elif current_user:
            if "Admin" in str(current_user.role): is_visible = True
            else:
                membership = db.query(OrganizationMembers).filter(
                    OrganizationMembers.org_email == c.org_email, OrganizationMembers.mem_email == current_user.email
                ).first()
                if membership and any(role in str(membership.mem_permission) for role in ["Manager", "Poster"]):
                    is_visible = True
                    
        if not is_visible: continue

        # Tách Link ảnh ra khỏi Description
        desc = c.description or ""
        img_url = None
        if "||IMG:" in desc:
            parts = desc.split("||IMG:")
            desc = parts[0]
            img_url = parts[1].replace("||", "")

        org = db.query(Organizations).filter(Organizations.org_email == c.org_email).first()
        reason = getattr(c, 'reject_reason', getattr(c, 'rejection_reason', None))
        
        result.append({
            "campaign_id": c.campaign_id, "org_email": c.org_email, "org_name": org.org_name if org else "Unknown",
            "title": c.title, "description": desc,
            "start_date": c.start_date.isoformat() if c.start_date else None,
            "end_date": c.end_date.isoformat() if hasattr(c, 'end_date') and c.end_date else None,
            "approval": approval_val, "availability": getattr(c, 'availability', 'Closed'),
            "thumbnail_url": img_url, "reject_reason": reason
        })
    return result


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_campaign(data: CampaignCreate, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    membership = db.query(OrganizationMembers).filter(OrganizationMembers.org_email == data.org_email, OrganizationMembers.mem_email == current_user.email).first()
    if not membership or not any(role in str(membership.mem_permission) for role in ["Manager", "Poster"]):
        raise HTTPException(status_code=403, detail="Chỉ Manager/Poster mới có quyền!")

    final_desc = data.description
    if data.image_url: final_desc += f"||IMG:{data.image_url}||"

    new_campaign = Campaigns(
        org_email=data.org_email, title=data.title, description=final_desc,
        start_date=data.start_date, end_date=data.end_date,
        approval="Pending", availability="Closed"
    )
    db.add(new_campaign)
    db.commit()
    return {"message": "Đã tạo Chiến dịch, chờ duyệt!", "campaign_id": new_campaign.campaign_id}


@router.put("/{campaign_id}")
def update_campaign(campaign_id: int, data: CampaignCreate, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    """Chỉnh sửa và Gửi lại chiến dịch bị Reject"""
    campaign = db.query(Campaigns).filter(Campaigns.campaign_id == campaign_id).first()
    if not campaign: raise HTTPException(status_code=404, detail="Không tìm thấy")
    
    membership = db.query(OrganizationMembers).filter(OrganizationMembers.org_email == campaign.org_email, OrganizationMembers.mem_email == current_user.email).first()
    if not membership or not any(role in str(membership.mem_permission) for role in ["Manager", "Poster"]):
        raise HTTPException(status_code=403, detail="Không có quyền chỉnh sửa!")

    final_desc = data.description
    if data.image_url: final_desc += f"||IMG:{data.image_url}||"

    campaign.title = data.title
    campaign.description = final_desc
    campaign.start_date = data.start_date
    campaign.end_date = data.end_date
    
    # Logic: Bị Reject mà sửa lại thì tự thành Resending
    approval_val = campaign.approval.value if hasattr(campaign.approval, 'value') else str(campaign.approval)
    if "Rejected" in approval_val:
        campaign.approval = "Resending"
        
    db.commit()
    return {"message": "Đã cập nhật và Gửi lại cho Admin!"}


@router.put("/{campaign_id}/approve")
def approve_campaign(campaign_id: int, data: CampaignApprovalAction, db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    if "Admin" not in str(current_user.role): raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền duyệt!")
    campaign = db.query(Campaigns).filter(Campaigns.campaign_id == campaign_id).first()
    if not campaign: raise HTTPException(status_code=404, detail="Không tìm thấy")
        
    if data.action == "approve":
        campaign.approval = "Approved"
        campaign.availability = "Open"
        if hasattr(campaign, 'rejection_reason'): campaign.rejection_reason = None
        if hasattr(campaign, 'reject_reason'): campaign.reject_reason = None
    elif data.action == "reject":
        campaign.approval = "Rejected"
        campaign.availability = "Closed"
        if hasattr(campaign, 'rejection_reason'): campaign.rejection_reason = data.reject_reason
        if hasattr(campaign, 'reject_reason'): campaign.reject_reason = data.reject_reason
        
    campaign.reviewed_by = current_user.email
    db.commit()
    return {"message": "Thành công!", "status": campaign.approval}