from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.user import RoleEnum

# 1. Schema dùng để nhận dữ liệu từ Frontend khi Đăng ký
class UserCreate(BaseModel):
    user_email: EmailStr = Field(..., description="Email định dạng chuẩn của trường")
    user_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6, description="Mật khẩu ít nhất 6 ký tự")
    phone: Optional[str] = None

# 2. Schema dùng để nhận dữ liệu khi Đăng nhập
class UserLogin(BaseModel):
    user_email: EmailStr
    password: str

# 3. Schema dùng để trả dữ liệu về cho Frontend (Giấu mật khẩu đi)
class UserResponse(BaseModel):
    user_email: EmailStr
    user_name: str
    phone: Optional[str]
    role: RoleEnum
    created_at: datetime

    class Config:
        from_attributes = True # Cho phép Pydantic đọc data trực tiếp từ SQLAlchemy Model

# 4. Schema chuẩn cho JWT Token
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None