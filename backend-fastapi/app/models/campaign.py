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

class CampaignOpenStatus(str, enum.Enum):
    Available = "Available"
    Closed = "Closed"

class Campaign(Base):
    __tablename__ = "campaigns"
    campaign_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organ_email = Column(String(100), ForeignKey("account_organization.organ_email"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    approval_status = Column(Enum(CampaignApprovalStatus), default=CampaignApprovalStatus.Pending)
    open_status = Column(Enum(CampaignOpenStatus), default=CampaignOpenStatus.Available)
    admin_reviewer = Column(String(100), ForeignKey("account_user.user_email"))
    approval_date = Column(DateTime)
    rejection_reason = Column(Text)

    posts = relationship("Post", back_populates="campaign")