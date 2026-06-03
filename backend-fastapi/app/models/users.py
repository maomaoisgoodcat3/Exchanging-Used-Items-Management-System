# app/models/user.py
from sqlalchemy import Column, String, Integer, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class MemberTypeEnum(str, enum.Enum):
    Student = "Student"
    Teacher = "Teacher"
    Staff = "Staff"

class RoleEnum(str, enum.Enum):
    Member = "Member"
    Admin = "Admin"

class OrganMemberEnum(str, enum.Enum):
    Member_Manager = "Manager"
    Poster = "Poster"
    Member = "Member"

class Directory(Base):
    __tablename__ = "directory"
    email = Column(String(100), primary_key=True)
    fullname = Column(String(100), nullable=False)
    member_type = Column(Enum(MemberTypeEnum), nullable=False, default=MemberTypeEnum.Student)
    
    # Quan hệ 1:1 với AccountUser
    account = relationship("Users", back_populates="directory_info", uselist=False)

class Users(Base):
    __tablename__ = "users"
    email = Column(String(100), ForeignKey('Directory.email'), primary_key=True)
    name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(15))
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.Member)
    created_at = Column(DateTime, server_default=func.current_timestamp())

    directory_info = relationship("Directory", back_populates="account")
    organizations = relationship("OrganizationMember", back_populates="buyer")
    locations = relationship("Locations", back_populates="user")
    products_in_storage = relationship("Storage", back_populates="user")
    posts = relationship("Posts", foreign_keys="[Posts.seller_email]", back_populates="seller")
    reviewed_posts = relationship("Posts", foreign_keys="[Posts.reviewed_by]", back_populates="reviewer")
    reviewed_campaigns = relationship("Campaigns", foreign_keys="[Campaigns.reviewed_by]", back_populates="reviewer")
    transactions = relationship("Transactions", back_populates="buyer")
    updated_settings = relationship("Settings", back_populates="updater")

class Organizations(Base):
    __tablename__ = "organizations"
    org_email = Column(String(100), primary_key=True)
    org_name = Column(String(100), nullable=False)
    representative_email = Column(String(100), ForeignKey('Users.email', ondelete='CASCADE'), nullable=False)
    description = Column(Text)

    members = relationship("OrganizationMember", back_populates="organization")
    campaigns = relationship("Campaigns", back_populates="organization")

class OrganizationMembers(Base):
    __tablename__ = "organization_members"
    user_email = Column(String(100), ForeignKey("Users.email"), primary_key=True)
    org_email = Column(String(100), ForeignKey("Organizations.org_email"), primary_key=True)
    mem_permission = Column(Enum(OrganMemberEnum), default=OrganMemberEnum.Member)

    user = relationship("Users", back_populates="organizations")
    organization = relationship("Organizations", back_populates="members")

class Locations(Base):
    __tablename__ = 'locations'
    
    email = Column(String(100), ForeignKey('Users.email'))
    location_id = Column(Integer, primary_key=True, autoincrement=True)
    location = Column(String(1000), nullable=False)

    # Relationships
    user = relationship("Users", back_populates="locations")
    products = relationship("Storage", back_populates="location_rel")