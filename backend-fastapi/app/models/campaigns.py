from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class CampaignApprovalEnum(str, enum.Enum):
    Pending = "Pending"
    Approved = "Approved"
    Resending = "Resending"
    Rejected = "Rejected"

class CampaignAvailabilityEnum(str, enum.Enum):
    Open = "Open"
    Closed = "Closed"

class Campaigns(Base):
    __tablename__ = "Campaigns"
    campaign_id = Column(Integer, primary_key=True, autoincrement=True)
    org_email = Column(String(100), ForeignKey("Organizations.org_email", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    reviewed_by = Column(String(100), ForeignKey("Users.email"))
    reviewed_at = Column(TIMESTAMP, onupdate=func.now())
    availability = Column(Enum(CampaignAvailabilityEnum), nullable=False, default=CampaignAvailabilityEnum.Closed)
    approval = Column(Enum(CampaignApprovalEnum), nullable=False, default=CampaignApprovalEnum.Pending)
    reject_reason = Column(Text)

    organization = relationship("Organizations", back_populates="campaigns")
    posts = relationship("Posts", back_populates="campaign")
    images = relationship("CampaignImages", back_populates="campaign", cascade="all, delete-orphan")
    reviewer = relationship("Users", back_populates="reviewed_campaigns")

class CampaignImages(Base):
    __tablename__ = "CampaignImages"
    image_id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_id = Column(Integer, ForeignKey("Campaigns.campaign_id"), nullable=False)
    image_url = Column(String(500))
    uploaded_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    campaign = relationship("Campaigns", back_populates="images")