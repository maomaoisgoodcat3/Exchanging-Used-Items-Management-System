# app/models/campaign.py
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class ApprovalEnum(str, enum.Enum):
    Pending = "Pending"
    Approved = "Approved"
    Resending = "Resending"
    Rejected = "Rejected"

class AvailabilityEnum(str, enum.Enum):
    Open = "Open"
    Closed = "Closed"

class Campaign(Base):
    __tablename__ = "Campaigns"
    campaign_id = Column(Integer, primary_key=True, autoincrement=True)
    org_email = Column(String(100), ForeignKey("Organizations.org_email", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    reviewed_by = Column(String(100), ForeignKey("Users.email"))
    reviewed_at = Column(TIMESTAMP, onupdate=func.now())
    availability = Column(Enum(AvailabilityEnum), nullable=False, default=AvailabilityEnum.Closed)
    approval = Column(Enum(ApprovalEnum), nullable=False, default=ApprovalEnum.Pending)
    reject_reason = Column(Text)

    # Relationships
    organization = relationship("Organization", back_populates="campaigns")
    posts = relationship("Post", back_populates="campaign")
    images = relationship("CampaignImage", back_populates="campaign", cascade="all, delete-orphan")


class CampaignImage(Base):
    __tablename__ = "CampaignImages"
    image_id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_id = Column(Integer, ForeignKey("Campaigns.campaign_id"), nullable=False)
    image_url = Column(String(500))
    uploaded_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    campaign = relationship("Campaign", back_populates="images")