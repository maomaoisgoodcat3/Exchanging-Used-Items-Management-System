from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel # Import thêm cái này

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token
# Sửa UserResponse thành UserRead, tạm bỏ Token
from app.schemas.user_schema import UserCreate, UserRead 
from app.services import auth_svc

router = APIRouter()

# Khai báo lại class Token ở ngay đây để xài tạm, đỡ phải sửa file schema
class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Đăng ký tài khoản mới (Yêu cầu email phải có trong danh sách Directory)"""
    db_user = auth_svc.create_user(db=db, user_in=user_in)
    
    # Manually map the DB model attributes to the schema's expected fields
    return {
        "email": db_user.user_email,
        "name": db_user.user_name,
        "phone": db_user.phone,
        "role": db_user.role,
        "created_at": db_user.created_at
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Đăng nhập để lấy JWT Token"""
    user = auth_svc.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Tạo Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.user_email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}