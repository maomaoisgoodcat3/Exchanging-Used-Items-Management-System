from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.models.user import User, Directory
from app.schemas.user_schema import UserCreate
from app.core.security import get_password_hash, verify_password
from app.core.config import settings
from app.core.database import get_db

def create_user(db: Session, user_in: UserCreate):
    # 1. Kiểm tra danh sách nhà trường
    directory_record = db.query(Directory).filter(Directory.school_email == user_in.email).first()
    if not directory_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email không thuộc danh sách nhà trường. Đăng ký bị từ chối."
        )

    # 2. Kiểm tra trùng lặp
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email này đã được đăng ký tài khoản."
        )

    # 3. Tạo user mới
    db_user = User(
        email=user_in.email,
        name=user_in.name,
        password_hash=get_password_hash(user_in.password),
        phone=user_in.phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

# --- PHẦN BỊ THIẾU: HÀM GIẢI MÃ TOKEN ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Giải mã JWT để lấy email
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Tìm user trong Database
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user