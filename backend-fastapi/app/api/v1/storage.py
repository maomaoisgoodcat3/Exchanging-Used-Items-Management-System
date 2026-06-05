from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from decimal import Decimal

from app.core.database import get_db
from app.services.auth_svc import get_current_user
from app.models.users import Users, Locations  # ĐÃ THÊM: Import model Locations
from app.models.posts import Storage 

router = APIRouter(prefix="/api/v1/storage", tags=["Storage"])

# ==========================================
# 1. PYDANTIC SCHEMAS (Định dạng dữ liệu)
# ==========================================
class StorageItemBase(BaseModel):
    product_name: str
    product_category_id: int
    product_quantity: int = 1
    product_price: float = 0.0
    # Bỏ product_location_id ở đây vì user không nhập ID mà nhập text location

class StorageItemCreate(StorageItemBase):
    location: str  # MỚI: Người dùng gửi tên vị trí (kho) lên từ Frontend

class StorageItemUpdate(BaseModel):
    product_name: str | None = None
    product_category_id: int | None = None
    product_quantity: int | None = None
    product_price: float | None = None

class StorageItemResponse(StorageItemBase):
    product_id: int
    email: str
    product_location_id: int  # Trả về ID vị trí sau khi đã lưu xong

    class Config:
        from_attributes = True


# ==========================================
# 2. CORE API ENDPOINTS
# ==========================================

@router.get("/", response_model=List[StorageItemResponse])
def get_my_storage(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    """Lấy danh sách tất cả vật phẩm trong kho của người dùng đang đăng nhập"""
    items = db.query(Storage).filter(Storage.email == current_user.email).all()
    return items


@router.post("/", response_model=StorageItemResponse, status_code=status.HTTP_201_CREATED)
def add_storage_item(
    item: StorageItemCreate, 
    db: Session = Depends(get_db), 
    current_user: Users = Depends(get_current_user)
):
    """Thêm một vật phẩm mới vào kho lưu trữ và quản lý vị trí (Location)"""
    
    # 1. TÌM/TẠO LOCATION: Kiểm tra xem user này đã tạo tên kho này chưa
    loc = db.query(Locations).filter(
        Locations.location == item.location,
        Locations.email == current_user.email
    ).first()
    
    # Nếu chưa có, hệ thống sẽ tự động tạo một dòng mới trong bảng Locations
    if not loc:
        loc = Locations(
            location=item.location, 
            email=current_user.email
        )
        db.add(loc)
        db.flush() # Flush để SQLAlchemy cập nhật loc.location_id từ MySQL
        
    # 2. TẠO VẬT PHẨM STORAGE: Gắn ID vị trí vừa tìm/tạo được vào sản phẩm
    new_item = Storage(
        email=current_user.email,
        product_name=item.product_name,
        product_category_id=item.product_category_id,
        product_quantity=item.product_quantity,
        product_price=item.product_price,
        product_location_id=loc.location_id # Trỏ khóa ngoại an toàn
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.put("/{product_id}", response_model=StorageItemResponse)
def update_storage_item(
    product_id: int, 
    item_data: StorageItemUpdate, 
    db: Session = Depends(get_db), 
    current_user: Users = Depends(get_current_user)
):
    """Cập nhật thông tin vật phẩm trong kho"""
    item = db.query(Storage).filter(
        Storage.product_id == product_id, 
        Storage.email == current_user.email
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Vật phẩm không tồn tại hoặc không thuộc quyền sở hữu của bạn")
    
    # Cập nhật các trường được truyền vào
    update_data = item_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
        
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_storage_item(
    product_id: int, 
    db: Session = Depends(get_db), 
    current_user: Users = Depends(get_current_user)
):
    """Xóa một vật phẩm khỏi kho lưu trữ"""
    item = db.query(Storage).filter(
        Storage.product_id == product_id, 
        Storage.email == current_user.email
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Vật phẩm không tồn tại hoặc không thuộc quyền sở hữu của bạn")
    
    db.delete(item)
    db.commit()
    return None