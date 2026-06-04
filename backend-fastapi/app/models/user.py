# app/models/user.py
from sqlalchemy import Column, String, Integer, Enum, ForeignKey, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

# ==========================================
# ENUMS (Giữ chuẩn của hệ thống hiện tại)
# ==========================================
class MemberTypeEnum(str, enum.Enum):
    Student = "Student"
    Teacher = "Teacher"
    Staff = "Staff"

class RoleEnum(str, enum.Enum):
    Member = "Member"
    Admin = "Admin"

class OrganMemberEnum(str, enum.Enum):
    Manager = "Manager"
    Poster = "Poster"
    Member = "Member"

# ==========================================
# MODELS
# ==========================================
class Directory(Base):
    __tablename__ = "Directory"
    email = Column(String(100), primary_key=True, index=True)
    fullname = Column(String(100), nullable=False)
    member_type = Column(Enum(MemberTypeEnum), nullable=False, default=MemberTypeEnum.Student)
    
    user_info = relationship("User", back_populates="directory_info", uselist=False)

class Location(Base):
    __tablename__ = 'Locations'
    location_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), ForeignKey('Users.email'))
    location = Column(String(1000), nullable=False)

    user = relationship("User", back_populates="locations")
    products = relationship("Storage", back_populates="location_rel")

class User(Base):
    __tablename__ = "Users"
    email = Column(String(100), ForeignKey("Directory.email"), primary_key=True)
    name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(15))
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.Member)
    created_at = Column(TIMESTAMP, server_default=func.now())

    directory_info = relationship("Directory", back_populates="user_info")
    organizations = relationship("OrganizationMember", back_populates="user")
    managed_organizations = relationship("Organization", back_populates="representative")
    
    locations = relationship("Location", back_populates="user")
    products_in_storage = relationship("Storage", back_populates="user")
    posts = relationship("Post", foreign_keys="[Post.seller_email]", back_populates="seller")
    reviewed_posts = relationship("Post", foreign_keys="[Post.reviewed_by]", back_populates="reviewer")
    reviewed_campaigns = relationship("Campaign", foreign_keys="[Campaign.reviewed_by]", back_populates="reviewer")
    
    # ĐÃ SỬA: Đổi back_populates thành requester thay vì buyer
    transactions = relationship("Transaction", back_populates="requester")
    updated_settings = relationship("Setting", back_populates="updater")


class Organization(Base):
    __tablename__ = "Organizations"
    org_email = Column(String(100), primary_key=True)
    org_name = Column(String(100), nullable=False)
    representative_email = Column(String(100), ForeignKey("Users.email", ondelete="CASCADE"), nullable=False)
    description = Column(Text)

    representative = relationship("User", back_populates="managed_organizations")
    members = relationship("OrganizationMember", back_populates="organization")
    campaigns = relationship("Campaign", back_populates="organization")


class OrganizationMember(Base):
    __tablename__ = "Organizations_Members"
    org_email = Column(String(100), ForeignKey("Organizations.org_email"), primary_key=True)
    mem_email = Column(String(100), ForeignKey("Users.email"), primary_key=True) 
    mem_permission = Column(Enum(OrganMemberEnum), nullable=False, default=OrganMemberEnum.Member)

    user = relationship("User", back_populates="organizations")
    organization = relationship("Organization", back_populates="members")