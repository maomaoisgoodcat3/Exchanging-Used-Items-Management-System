# app/models/campaign.py
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class CampaignApprovalStatus(str, enum.Enum):
    Pending = "Pending"
    Approved = "Approved"
    Rejected = "Rejected"
    Resending = "Resending"

class CampaignAvailabilityStatus(str, enum.Enum):
    Open = "Open"
    Closed = "Closed"

class Campaign(Base):
    __tablename__ = "campaigns"
    campaign_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    org_email = Column(String(100), ForeignKey("Organizations.organ_email"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    approval = Column(Enum(CampaignApprovalStatus), default=CampaignApprovalStatus.Pending)
    availability = Column(Enum(CampaignAvailabilityStatus), default=CampaignAvailabilityStatus.Open)
    reviewed_by = Column(String(100), ForeignKey("account_user.user_email"))
    reviewed_at = Column(DateTime)
    reject_reason = Column(Text)

    posts = relationship("Posts", back_populates="campaign")
    organization = relationship("Organizations", back_populates="campaigns")
    reviewer = relationship("Users", back_populates="reviewed_campaigns")
    images = relationship("CampaignImages", back_populates="campaign")

class CampaignImages(Base):
    __tablename__ = 'CampaignImages'
    
    image_id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_id = Column(Integer, ForeignKey('Campaigns.campaign_id'), nullable=False)
    image_url = Column(String(500))
    uploaded_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    campaign = relationship("Campaigns", back_populates="images")