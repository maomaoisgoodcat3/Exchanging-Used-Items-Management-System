from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class DirectoryBase(BaseModel):
    email: EmailStr
    fullname: str
    member_type: str = Field(default="Student", pattern="^(Student|Teacher|Staff)$")


class DirectoryCreate(DirectoryBase):
    pass


class DirectoryRead(DirectoryBase):
    class Config:
        from_attributes = True


class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str = Field(default="Member", pattern="^(Member|Admin)$")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)


class UserChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


class UserRead(UserBase):
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    member_type: str = Field(default="Student", pattern="^(Student|Teacher|Staff)$")


class UserOTPVerify(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class OrganizationBase(BaseModel):
    org_email: EmailStr
    org_name: str
    representative_email: EmailStr
    description: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    org_name: Optional[str] = None
    representative_email: Optional[EmailStr] = None
    description: Optional[str] = None


class OrganizationRead(OrganizationBase):
    class Config:
        from_attributes = True


class OrganizationMemberBase(BaseModel):
    org_email: EmailStr
    mem_email: EmailStr
    mem_permission: str = Field(default="Member", pattern="^(Member Manager|Poster|Member)$")


class OrganizationMemberCreate(OrganizationMemberBase):
    pass


class OrganizationMemberUpdate(BaseModel):
    mem_permission: str = Field(pattern="^(Member Manager|Poster|Member)$")


class OrganizationMemberRead(OrganizationMemberBase):
    class Config:
        from_attributes = True


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)
