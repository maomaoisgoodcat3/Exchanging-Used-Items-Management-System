"""Authentication and Account Management API"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from datetime import timedelta
import logging, os
from jose import jwt, JWTError
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.services.auth_svc import get_current_user
from app.models.user import User, Directory # Import theo Model mới
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
# 1. PYDANTIC SCHEMAS (Định nghĩa cấu trúc dữ liệu)
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
# 2. API ENDPOINTS
# ==========================================

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(data: UserRegister, db: Session = Depends(get_db)):
    """Đăng ký tài khoản (Yêu cầu nhập đủ trường và khớp verify_password)"""
    
    # 1. Kiểm tra mật khẩu có khớp không
    if data.password != data.verify_password:
        raise HTTPException(status_code=400, detail="Mật khẩu xác nhận không khớp!")

    # 2. Kiểm tra Email đã tồn tại trong Hệ thống (Users) chưa
    existing_user = db.query(User).filter(User.email == data.user_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký!")
        
    # 3. Kiểm tra Email có nằm trong danh bạ nhà trường (Directory) không
    directory_record = db.query(Directory).filter(Directory.email == data.user_email).first()
    if not directory_record:
        raise HTTPException(
            status_code=403, 
            detail="Email không thuộc danh sách nội bộ của trường. Không thể đăng ký."
        )

    # 4. Tạo tài khoản mới (SQL Mới: Bảng Users)
    new_user = User(
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
    """Đăng nhập lấy JWT Token"""
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.put("/change-password")
def change_password(
    data: ChangePasswordRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Đổi mật khẩu trong Tab Profile"""
    # 1. Kiểm tra mật khẩu cũ
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mật khẩu cũ không chính xác!")
        
    # 2. Kiểm tra mật khẩu mới và xác nhận
    if data.new_password != data.verify_new_password:
        raise HTTPException(status_code=400, detail="Mật khẩu xác nhận không khớp!")
        
    # 3. Cập nhật
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Đổi mật khẩu thành công!"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Yêu cầu cấp lại mật khẩu (Gửi Token)"""
    user = db.query(User).filter(User.email == data.user_email).first()
    if not user:
        # Trả về success kể cả khi không thấy email để chống Hacker dò quét email
        return {"message": "Nếu email tồn tại, hệ thống đã gửi link khôi phục."}
        
    # Tạo reset token (Dùng tạm hàm access_token, set hạn 15 phút)
    reset_token = create_access_token(data={"sub": user.email, "type": "reset"}, expires_delta=timedelta(minutes=15))
    
    # MOCKUP GỬI EMAIL: Thay vì gửi thật, ta in ra Terminal để Test
    mock_reset_link = f"http://localhost:8000/api/v1/auth/reset-password?token={reset_token}"
    logging.warning(f" [MOCK EMAIL] Gửi tới {user.email}. Link khôi phục: {mock_reset_link}")
    
    return {"message": "Nếu email tồn tại, hệ thống đã gửi link khôi phục. Vui lòng check Terminal!"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Khôi phục mật khẩu bằng Token lấy từ Terminal"""
    try:
        # Giải mã Token
        payload = jwt.decode(data.reset_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        # Kiểm tra xem có đúng là Token loại "reset" không
        if token_type != "reset" or not email:
            raise HTTPException(status_code=400, detail="Token không hợp lệ!")
            
    except JWTError:
        raise HTTPException(status_code=400, detail="Token đã hết hạn hoặc không hợp lệ!")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng!")
        
    # Cập nhật mật khẩu mới (Mã hóa Hash)
    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Khôi phục mật khẩu thành công! Vui lòng đăng nhập lại."}