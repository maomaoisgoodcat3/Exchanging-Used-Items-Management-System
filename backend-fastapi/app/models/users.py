from sqlalchemy import Column, String, Integer, Enum, ForeignKey, Text, TIMESTAMP
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

class OrgMemberEnum(str, enum.Enum):
    Manager = "Manager"
    Poster = "Poster"
    Member = "Member"

class Directory(Base):
    __tablename__ = "Directory"
    email = Column(String(100), primary_key=True, index=True)
    fullname = Column(String(100), nullable=False)
    member_type = Column(Enum(MemberTypeEnum), nullable=False, default=MemberTypeEnum.Student)
    
    user_info = relationship("Users", back_populates="directory_info", uselist=False)

class Locations(Base):
    __tablename__ = 'Locations'
    location_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), ForeignKey('Users.email'))
    location = Column(String(1000), nullable=False)

    user = relationship("Users", back_populates="locations")
    products = relationship("Storage", back_populates="location_rel")

class Users(Base):
    __tablename__ = "Users"
    email = Column(String(100), ForeignKey("Directory.email"), primary_key=True)
    name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(15))
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.Member)
    created_at = Column(TIMESTAMP, server_default=func.now())

    directory_info = relationship("Directory", back_populates="user_info")
    organizations = relationship("OrganizationMembers", back_populates="user")
    managed_organizations = relationship("Organizations", back_populates="representative")
    
    locations = relationship("Locations", back_populates="user")
    products_in_storage = relationship("Storage", back_populates="user")
    posts = relationship("Posts", foreign_keys="[Posts.seller_email]", back_populates="seller")
    reviewed_posts = relationship("Posts", foreign_keys="[Posts.reviewed_by]", back_populates="reviewer")
    reviewed_campaigns = relationship("Campaigns", foreign_keys="[Campaigns.reviewed_by]", back_populates="reviewer")
    transactions = relationship("Transactions", back_populates="requester")
    updated_settings = relationship("Settings", back_populates="updater")

class Organizations(Base):
    __tablename__ = "Organizations"
    org_email = Column(String(100), primary_key=True)
    org_name = Column(String(100), nullable=False)
    representative_email = Column(String(100), ForeignKey("Users.email", ondelete="CASCADE"), nullable=False)
    description = Column(Text)

    representative = relationship("Users", back_populates="managed_organizations")
    members = relationship("OrganizationMembers", back_populates="organization")
    campaigns = relationship("Campaigns", back_populates="organization")

class OrganizationMembers(Base):
    __tablename__ = "Organizations_Members"
    org_email = Column(String(100), ForeignKey("Organizations.org_email"), primary_key=True)
    mem_email = Column(String(100), ForeignKey("Users.email"), primary_key=True) 
    mem_permission = Column(Enum(OrgMemberEnum), nullable=False, default=OrgMemberEnum.Member)

    user = relationship("Users", back_populates="organizations")
    organization = relationship("Organizations", back_populates="members")