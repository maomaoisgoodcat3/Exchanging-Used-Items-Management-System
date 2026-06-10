"""Authentication and Account Management API"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from datetime import timedelta, datetime
import logging
import os
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.services.auth_svc import get_current_user
from app.models.users import Users, Directory

# Import Schemas từ team cho các endpoint mới
from app.schemas.user_schema import UserOTPVerify, RefreshTokenRequest, TokenResponse, UserLogin

# Tự động tìm SECRET_KEY
try:
    from app.core.security import SECRET_KEY, ALGORITHM
except ImportError:
    try:
        from app.core.config import settings
        SECRET_KEY = settings.SECRET_KEY
        ALGORITHM = settings.ALGORITHM
    except ImportError:
        SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63")
        ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication & Account"])

# ==========================================
# 1. INLINE SCHEMAS (Giữ nguyên để Frontend không bị sập)
# ==========================================
class UserRegister(BaseModel):
    user_email: EmailStr
    user_name: str
    phone: str
    password: str = Field(..., min_length=6)
    verify_password: str = Field(..., min_length=6)

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)
    verify_new_password: str = Field(..., min_length=6)

class ForgotPasswordRequest(BaseModel):
    user_email: EmailStr

class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str = Field(..., min_length=6)


# ==========================================
# 2. CORE API ENDPOINTS (Logic thật của hệ thống)
# ==========================================

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(data: UserRegister, db: Session = Depends(get_db)):
    """Đăng ký tài khoản (Yêu cầu nhập đủ trường và khớp verify_password)"""
    
    # 1. Kiểm tra mật khẩu có khớp không
    if data.password != data.verify_password:
        raise HTTPException(status_code=400, detail="Mật khẩu xác nhận không khớp!")

    # 2. Kiểm tra Email đã tồn tại trong Hệ thống (Users) chưa
    existing_user = db.query(Users).filter(Users.email == data.user_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký!")
        
    # 3. Kiểm tra Email có nằm trong danh bạ nhà trường (Directory) không
    directory_record = db.query(Directory).filter(Directory.email == data.user_email).first()
    if not directory_record:
        raise HTTPException(
            status_code=403, 
            detail="Email không thuộc danh sách nội bộ của trường. Không thể đăng ký."
        )

    # 4. Tạo tài khoản mới
    new_user = Users(
        email=data.user_email,
        name=data.user_name,
        password_hash=get_password_hash(data.password),
        phone=data.phone,
        role="Member"
    )
    
    db.add(new_user)
    db.commit()
    
    return {"message": "Đăng ký tài khoản thành công!"}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Đăng nhập lấy JWT Token và thông tin User đi kèm"""
    user = db.query(Users).filter(Users.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_access_token(data={"sub": user.email, "type": "refresh"}, expires_delta=timedelta(days=7))
    
    # Lấy giá trị chuỗi của role từ Enum hoặc thuộc tính DB
    user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
    
    # Trả về cấu trúc nested 'user' khớp hoàn toàn với kiểu dữ liệu của Frontend
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_email": user.email,
        "user": {
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
            "role": user_role
        }
    }


@router.put("/change-password")
def change_password(
    data: ChangePasswordRequest, 
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    """Đổi mật khẩu trong Tab Profile"""
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mật khẩu cũ không chính xác!")
        
    if data.new_password != data.verify_new_password:
        raise HTTPException(status_code=400, detail="Mật khẩu xác nhận không khớp!")
        
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Đổi mật khẩu thành công!"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Yêu cầu cấp lại mật khẩu (Gửi Token)"""
    user = db.query(Users).filter(Users.email == data.user_email).first()
    if not user:
        return {"message": "Nếu email tồn tại, hệ thống đã gửi link khôi phục."}
        
    reset_token = create_access_token(data={"sub": user.email, "type": "reset"}, expires_delta=timedelta(minutes=15))
    
    mock_reset_link = f"http://localhost:8000/api/v1/auth/reset-password?token={reset_token}"
    logging.warning(f" [MOCK EMAIL] Gửi tới {user.email}. Link khôi phục: {mock_reset_link}")
    
    return {"message": "Nếu email tồn tại, hệ thống đã gửi link khôi phục. Vui lòng check Terminal!"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Khôi phục mật khẩu bằng Token lấy từ Terminal"""
    try:
        payload = jwt.decode(data.reset_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if token_type != "reset" or not email:
            raise HTTPException(status_code=400, detail="Token không hợp lệ!")
            
    except JWTError:
        raise HTTPException(status_code=400, detail="Token đã hết hạn hoặc không hợp lệ!")
        
    user = db.query(Users).filter(Users.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng!")
        
    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Khôi phục mật khẩu thành công! Vui lòng đăng nhập lại."}


# ==========================================
# 3. EXTRA API ENDPOINTS (Tích hợp từ code của Team)
# ==========================================

@router.post("/refresh-token")
def refresh_access_token(data: RefreshTokenRequest):
    """Làm mới Access Token bằng Refresh Token"""
    try:
        payload = jwt.decode(data.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if token_type != "refresh" or not email:
            raise HTTPException(status_code=401, detail="Refresh token không hợp lệ")
            
        new_access_token = create_access_token(data={"sub": email})
        
        return {
            "access_token": new_access_token,
            "refresh_token": data.refresh_token,
            "token_type": "bearer"
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token đã hết hạn hoặc không hợp lệ")


@router.post("/verify-otp", response_model=dict)
def verify_otp(data: UserOTPVerify):
    """Xác thực OTP (Tính năng chờ phát triển thêm)"""
    if not data.otp or len(data.otp) != 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sai định dạng OTP"
        )
    return {
        "message": "OTP verified successfully",
        "email": data.email
    }


@router.post("/logout", response_model=dict)
def logout():
    """Đăng xuất (Xóa token phía Client)"""
    return {
        "message": "Logged out successfully"
    }


@router.post("/organization-login")
def organization_login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Đăng nhập đặc biệt dành cho Tổ chức (Tương tự login thường)"""
    user = db.query(Users).filter(Users.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác")
        
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "refresh_token": "",
        "token_type": "bearer"
    }