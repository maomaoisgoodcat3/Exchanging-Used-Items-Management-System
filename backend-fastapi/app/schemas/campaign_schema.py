from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class CampaignBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CampaignFilter(BaseModel):
    org_email: Optional[EmailStr] = None
    approval: Optional[str] = None
    availability: Optional[str] = None
    start_date_from: Optional[datetime] = None
    start_date_to: Optional[datetime] = None
    end_date_from: Optional[datetime] = None
    end_date_to: Optional[datetime] = None
    search_query: Optional[str] = None
    sort_by: Optional[str] = Field(default="start_date", pattern="^(start_date|end_date|title)$")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=10, ge=1, le=100)

class CampaignApprovalAction(BaseModel):
    action: str = Field(pattern="^(approve|reject|resend)$")
    reject_reason: Optional[str] = None

class CampaignRead(CampaignBase):
    campaign_id: int
    org_email: EmailStr
    approval: str
    availability: str
    reviewed_by: Optional[EmailStr] = None
    reviewed_at: Optional[datetime] = None
    reject_reason: Optional[str] = None

    class Config:
        from_attributes = True

class CampaignDetailRead(CampaignRead):
    pass

class CampaignListRead(BaseModel):
    campaign_id: int
    title: str
    org_email: EmailStr
    approval: str
    availability: str
    start_date: datetime
    end_date: datetime
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class CampaignPostsRead(BaseModel):
    campaign_id: int
    title: str
    description: Optional[str]
    org_email: EmailStr
    start_date: datetime
    end_date: datetime
    approval: str
    availability: str

    class Config:
        from_attributes = True