"""Campaign Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.services.auth_svc import get_current_user
from app.models.user import User, Organization, OrganizationMember
from app.models.campaign import Campaign, CampaignImage

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
    images: List[str] = [] # Danh sách URL ảnh (Sau này Frontend up lên Pinata IPFS rồi nhét URL vào đây)

# ==========================================
# 2. API ENDPOINTS
# ==========================================

@router.get("/")
def list_campaigns(
    org_email: Optional[str] = None,
    approval_status: Optional[str] = None, # Pending, Approved, Rejected
    availability: Optional[str] = None,    # Open, Closed
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách Campaign (Dùng chung cho cả trang chủ và khi lọc theo Tổ chức)
    """
    query = db.query(Campaign)
    
    if org_email:
        query = query.filter(Campaign.org_email == org_email)
    if approval_status:
        query = query.filter(Campaign.approval == approval_status)
    if availability:
        query = query.filter(Campaign.availability == availability)
        
    campaigns = query.order_by(Campaign.campaign_id.desc()).all()
    
    result = []
    for c in campaigns:
        # Lấy ảnh đại diện (ảnh đầu tiên trong mảng ảnh)
        first_img = db.query(CampaignImage).filter(CampaignImage.campaign_id == c.campaign_id).first()
        org = db.query(Organization).filter(Organization.org_email == c.org_email).first()
        
        result.append({
            "campaign_id": c.campaign_id,
            "org_email": c.org_email,
            "org_name": org.org_name if org else "Unknown",
            "title": c.title,
            "start_date": c.start_date,
            "end_date": c.end_date,
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
    """
    Tạo Campaign mới (Chỉ Poster hoặc Manager của Tổ chức mới được tạo)
    """
    # 1. Kiểm tra quyền hạn trong Tổ chức
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.org_email == data.org_email,
        OrganizationMember.mem_email == current_user.email
    ).first()

    if not membership or membership.mem_permission not in ["Manager", "Poster"]:
        raise HTTPException(
            status_code=403, 
            detail="Bạn không có quyền tạo Chiến dịch. Chỉ Manager hoặc Poster mới có quyền này."
        )

    # 2. Tạo Campaign (Mặc định: Pending và Closed)
    new_campaign = Campaign(
        org_email=data.org_email,
        title=data.title,
        description=data.description,
        start_date=data.start_date,
        end_date=data.end_date,
        approval="Pending",
        availability="Closed"
    )
    db.add(new_campaign)
    db.flush() # Lấy được campaign_id ngay lập tức

    # 3. Lưu danh sách link ảnh vào bảng CampaignImages
    for img_url in data.images:
        new_image = CampaignImage(
            campaign_id=new_campaign.campaign_id,
            image_url=img_url
        )
        db.add(new_image)

    db.commit()
    return {
        "message": "Đã tạo Chiến dịch thành công và đang chờ Admin duyệt!",
        "campaign_id": new_campaign.campaign_id
    }


@router.get("/{campaign_id}")
def get_campaign_detail(campaign_id: int, db: Session = Depends(get_db)):
    """
    Xem chi tiết một Chiến dịch
    """
    campaign = db.query(Campaign).filter(Campaign.campaign_id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Không tìm thấy Chiến dịch")
        
    org = db.query(Organization).filter(Organization.org_email == campaign.org_email).first()
    images = db.query(CampaignImage).filter(CampaignImage.campaign_id == campaign_id).all()

    return {
        "campaign_id": campaign.campaign_id,
        "org_email": campaign.org_email,
        "org_name": org.org_name if org else "Unknown",
        "title": campaign.title,
        "description": campaign.description,
        "start_date": campaign.start_date,
        "end_date": campaign.end_date,
        "availability": campaign.availability,
        "approval": campaign.approval,
        "reject_reason": campaign.reject_reason,
        "images": [img.image_url for img in images]
    }