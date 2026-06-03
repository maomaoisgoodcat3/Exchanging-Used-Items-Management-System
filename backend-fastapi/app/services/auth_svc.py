from typing import cast
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.users import Users, Directory
from app.schemas.user_schema import UserCreate
from app.core.security import get_password_hash, verify_password

def create_user(db: Session, user_in: UserCreate):
    # 1. Kiểm tra xem email có tồn tại trong danh sách nội bộ của trường không
    directory_record = db.query(Directory).filter(Directory.school_email == user_in.email).first()
    if not directory_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email không thuộc danh sách nhà trường. Đăng ký bị từ chối."
        )

    # 2. Kiểm tra xem email này đã từng tạo tài khoản trên App chưa
    existing_user = db.query(Users).filter(Users.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email này đã được đăng ký tài khoản."
        )

    # 3. Tạo tài khoản mới (Nhớ băm mật khẩu ra trước khi lưu)
    db_user = Users(
        user_email=user_in.email,
        user_name=user_in.name,
        password_hash=get_password_hash(user_in.password),
        phone=user_in.phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    # 1. Tìm user theo email
    user = db.query(Users).filter(Users.email == email).first()
    if not user:
        return False
    
    # 2. Lấy mật khẩu người dùng nhập vào, đối chiếu với mã hash trong DB
    if not verify_password(password, cast(str, user.password_hash)):
        return False
        
    return user

def get_current_user(db: Session, email: str):
    return db.query(Users).filter(Users.email == email).first()