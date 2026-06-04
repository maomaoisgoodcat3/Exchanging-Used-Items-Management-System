# app/models/user.py
from sqlalchemy import Column, String, Integer, Enum, DateTime, ForeignKey, Text
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

class OrgMemberEnum(str, enum.Enum):
    Manager = "Manager"
    Poster = "Poster"
    Member = "Member"

# ==========================================
# MODELS
# ==========================================

class Directory(Base):
    __tablename__ = "directory"
    email = Column(String(100), primary_key=True)
    fullname = Column(String(100), nullable=False)
    member_type = Column(Enum(MemberTypeEnum), nullable=False, default=MemberTypeEnum.Student)
    
    r_directory_users = relationship("Users", back_populates="r_users_directory", uselist=False)

class Users(Base):
    __tablename__ = "users"
    email = Column(String(100), ForeignKey('Directory.email'), primary_key=True)
    name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(15))
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.Member)
    created_at = Column(DateTime, server_default=func.now())

    r_users_directory = relationship("Directory", back_populates="r_directory_users")
    
    r_users_organizationmembers = relationship("OrganizationMembers", back_populates="r_organizationmembers_users")
    r_users_locations = relationship("Locations", back_populates="r_locations_users")
    r_users_storage = relationship("Storage", back_populates="r_storage_users")
    r_users_posts_seller = relationship("Posts", foreign_keys="[Posts.seller_email]", back_populates="r_posts_users_seller")
    r_users_posts_reviewer = relationship("Posts", foreign_keys="[Posts.reviewed_by]", back_populates="r_posts_users_reviewer")
    r_users_campaigns = relationship("Campaigns", foreign_keys="[Campaigns.reviewed_by]", back_populates="r_campaigns_users")
    r_users_transactions = relationship("Transactions", back_populates="r_transactions_users")
    r_users_settings = relationship("Settings", back_populates="r_settings_users")

class Organizations(Base):
    __tablename__ = "organizations"
    org_email = Column(String(100), primary_key=True)
    org_name = Column(String(100), nullable=False)
    representative_email = Column(String(100), ForeignKey('Users.email', ondelete='CASCADE'), nullable=False)
    description = Column(Text)

    r_organizations_organizationmembers = relationship("OrganizationMembers", back_populates="r_organizationmembers_organizations")
    
    r_organizations_campaigns = relationship("Campaigns", back_populates="r_campaigns_organizations")

class OrganizationMembers(Base):
    __tablename__ = "organization_members"
    mem_email = Column(String(100), ForeignKey("Users.email"), primary_key=True)
    org_email = Column(String(100), ForeignKey("Organizations.org_email"), primary_key=True)
    mem_permission = Column(Enum(OrgMemberEnum), default=OrgMemberEnum.Member)

    r_organizationmembers_users = relationship("Users", back_populates="r_users_organizationmembers")
    r_organizationmembers_organizations = relationship("Organizations", back_populates="r_organizations_organizationmembers")

class Locations(Base):
    __tablename__ = 'locations'
    
    email = Column(String(100), ForeignKey('Users.email'))
    location_id = Column(Integer, primary_key=True, autoincrement=True)
    location = Column(String(1000), nullable=False)

    r_locations_users = relationship("Users", back_populates="r_users_locations")
    
    r_locations_storage = relationship("Storage", back_populates="r_storage_locations")