# app/models/campaign.py
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

# ==========================================
# ENUMS
# ==========================================

class CampaignApprovalEnum(str, enum.Enum):
    Pending = "Pending"
    Approved = "Approved"
    Rejected = "Rejected"
    Resending = "Resending"

class CampaignAvailabilityEnum(str, enum.Enum):
    Open = "Open"
    Closed = "Closed"

# ==========================================
# MODELS
# ==========================================

class Campaigns(Base):
    __tablename__ = "campaigns"
    campaign_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    org_email = Column(String(100), ForeignKey("Organizations.org_email"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    approval = Column(Enum(CampaignApprovalEnum), default=CampaignApprovalEnum.Pending)
    availability = Column(Enum(CampaignAvailabilityEnum), default=CampaignAvailabilityEnum.Open)
    reviewed_by = Column(String(100), ForeignKey("Users.email"))
    reviewed_at = Column(DateTime)
    reject_reason = Column(Text)

    r_campaigns_posts = relationship("Posts", back_populates="r_posts_campaigns")
    r_campaigns_organizations = relationship("Organizations", back_populates="r_organizations_campaigns")
    r_campaigns_users = relationship("Users", back_populates="r_users_campaigns")
    r_campaigns_campaignimages = relationship("CampaignImages", back_populates="r_campaignimages_campaigns")

class CampaignImages(Base):
    __tablename__ = 'campaignimages'
    
    image_id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_id = Column(Integer, ForeignKey('Campaigns.campaign_id'), nullable=False)
    image_url = Column(String(500))
    uploaded_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    r_campaignimages_campaigns = relationship("Campaigns", back_populates="images")