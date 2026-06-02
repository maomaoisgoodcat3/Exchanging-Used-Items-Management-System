# app/models/user.py
from sqlalchemy import Column, String, Enum, ForeignKey, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

# ==========================================
# ENUMS
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
    
    # Quan hệ 1:1 với User
    user_info = relationship("User", back_populates="directory_info", uselist=False)


class User(Base):
    __tablename__ = "Users"
    email = Column(String(100), ForeignKey("Directory.email"), primary_key=True)
    name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(15))
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.Member)
    created_at = Column(TIMESTAMP, server_default=func.now())

    directory_info = relationship("Directory", back_populates="user_info")
    
    # Danh sách các tổ chức mà user này tham gia (vai trò thành viên)
    organizations = relationship("OrganizationMember", back_populates="user")
    
    # Tổ chức mà user này làm người đại diện (Manager)
    managed_organizations = relationship("Organization", back_populates="representative")
    
    # Quan hệ sẽ được nối ở các file khác: Posts, Campaigns, Transactions, Locations, Storage


class Organization(Base):
    __tablename__ = "Organizations"
    org_email = Column(String(100), primary_key=True)
    org_name = Column(String(100), nullable=False)
    representative_email = Column(String(100), ForeignKey("Users.email", ondelete="CASCADE"), nullable=False)
    description = Column(Text)

    # Người đại diện
    representative = relationship("User", back_populates="managed_organizations")
    
    # Danh sách thành viên
    members = relationship("OrganizationMember", back_populates="organization")
    
    # Quan hệ sẽ được nối ở file khác: Campaigns
    campaigns = relationship("Campaign", back_populates="organization")


class OrganizationMember(Base):
    __tablename__ = "Organizations_Members"
    org_email = Column(String(100), ForeignKey("Organizations.org_email"), primary_key=True)
    mem_email = Column(String(100), ForeignKey("Users.email"), primary_key=True)
    mem_permission = Column(Enum(OrganMemberEnum), nullable=False, default=OrganMemberEnum.Member)

    user = relationship("User", back_populates="organizations")
    organization = relationship("Organization", back_populates="members")