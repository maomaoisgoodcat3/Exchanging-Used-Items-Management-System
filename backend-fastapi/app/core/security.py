from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
import bcrypt  # Sử dụng trực tiếp bcrypt thay vì passlib
from app.core.config import settings

# 1. Hàm băm mật khẩu trước khi lưu vào DB
def get_password_hash(password: str) -> str:
    # bcrypt yêu cầu mật khẩu phải là bytes
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_pwd = bcrypt.hashpw(pwd_bytes, salt)
    # Trả về dạng string để dễ lưu vào database
    return hashed_pwd.decode('utf-8')

# 2. Hàm kiểm tra mật khẩu user nhập vào có khớp với mã Hash trong DB không
def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Chuyển cả mật khẩu thô và hash đã lưu về dạng bytes để so sánh
    password_byte_enc = plain_password.encode('utf-8')
    hashed_pwd_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_pwd_bytes)

# 3. Hàm tạo JWT Token khi user đăng nhập thành công
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    
    # Thiết lập thời gian hết hạn của token
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    
    # Ký token bằng Secret Key
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt