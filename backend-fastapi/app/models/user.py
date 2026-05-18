# app/models/user.py
from sqlalchemy import Column, String, Enum, DateTime, ForeignKey, Text
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
    Member_Manager = "Member_Manager"
    Poster = "Poster"
    Member = "Member"

class Directory(Base):
    __tablename__ = "directory"
    school_id = Column(String(20), primary_key=True, index=True)
    school_email = Column(String(100), unique=True, nullable=False, index=True)
    fullname = Column(String(100), nullable=False)
    member_type = Column(Enum(MemberTypeEnum), default=MemberTypeEnum.Student)
    
    # Quan hệ 1:1 với AccountUser
    account = relationship("AccountUser", back_populates="directory_info", uselist=False)

class AccountUser(Base):
    __tablename__ = "account_user"
    user_email = Column(String(100), ForeignKey("directory.school_email"), primary_key=True)
    user_name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(15))
    role = Column(Enum(RoleEnum), default=RoleEnum.Member)
    created_at = Column(DateTime, server_default=func.now())

    directory_info = relationship("Directory", back_populates="account")
    organizations = relationship("OrganizationMember", back_populates="user")
    # Các relationship khác sẽ được kết nối ở các model tương ứng

class AccountOrganization(Base):
    __tablename__ = "account_organization"
    organ_email = Column(String(100), primary_key=True)
    organ_name = Column(String(100), nullable=False)
    representative_email = Column(String(100), ForeignKey("account_user.user_email"), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    members = relationship("OrganizationMember", back_populates="organization")

class OrganizationMember(Base):
    __tablename__ = "organization_members"
    user_email = Column(String(100), ForeignKey("account_user.user_email"), primary_key=True)
    organ_email = Column(String(100), ForeignKey("account_organization.organ_email"), primary_key=True)
    mem_permission = Column(Enum(OrganMemberEnum), default=OrganMemberEnum.Member)

    user = relationship("AccountUser", back_populates="organizations")
    organization = relationship("AccountOrganization", back_populates="members")