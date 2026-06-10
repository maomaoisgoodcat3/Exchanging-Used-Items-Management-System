from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class ProductCategoryBase(BaseModel):
    category_id: int
    category_name: str

class ProductCategoryRead(ProductCategoryBase):
    class Config:
        from_attributes = True

class StorageProductBase(BaseModel):
    product_name: str
    product_category_id: int
    product_quantity: int = Field(..., gt=0)
    product_price: Decimal = Field(default=Decimal("0.00"), ge=0)

class StorageProductCreate(StorageProductBase):
    email: EmailStr

class StorageProductUpdate(BaseModel):
    product_name: Optional[str] = None
    product_category_id: Optional[int] = None
    product_quantity: Optional[int] = Field(None, gt=0)
    product_price: Optional[Decimal] = Field(None, ge=0)

class StorageProductRead(StorageProductBase):
    product_id: int
    email: EmailStr

    class Config:
        from_attributes = True

class PostProductBase(BaseModel):
    post_id: int
    product_id: int

class PostProductCreate(PostProductBase):
    pass

class PostProductRead(PostProductBase):
    class Config:
        from_attributes = True

class PostProductDetailRead(BaseModel):
    post_id: int
    product_id: int
    product_name: str
    product_category_id: int
    product_quantity: int
    product_price: Decimal

    class Config:
        from_attributes = True

class PostImageBase(BaseModel):
    image_url: str

class PostImageCreate(PostImageBase):
    pass

class PostImageRead(PostImageBase):
    image_id: int
    post_id: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Đã dời Class này lên trước PostCreate để tránh lỗi NameError
class ProductItemCreate(BaseModel):
    product_category_id: int
    product_name: str
    product_quantity: int = Field(default=1, gt=0)
    product_price: Decimal = Field(default=Decimal("0.00"), ge=0)

class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    post_type: str = Field(pattern="^(Selling|Trading|Donating)$")
    campaign_id: Optional[int] = None
    thumbnail_url: Optional[str] = None

class PostCreate(PostBase):
    seller_email: EmailStr
    products: List[ProductItemCreate] = Field(..., description="List of detailed products")
    images: Optional[List[PostImageCreate]] = []

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    products: Optional[List[int]] = None
    images: Optional[List[PostImageCreate]] = None

class PostFilter(BaseModel):
    post_type: Optional[str] = None
    approval: Optional[str] = None
    availability: Optional[str] = None
    seller_email: Optional[EmailStr] = None
    campaign_id: Optional[int] = None
    search_query: Optional[str] = None
    sort_by: Optional[str] = Field(default="created_at", pattern="^(created_at|title)$")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=10, ge=1, le=100)

class PostApprovalAction(BaseModel):
    action: str = Field(pattern="^(approve|reject|resend)$")
    reject_reason: Optional[str] = None

class PostRead(PostBase):
    post_id: int
    seller_email: EmailStr
    created_at: datetime
    approval: str
    availability: str
    reviewed_by: Optional[EmailStr] = None
    reviewed_at: Optional[datetime] = None
    reject_reason: Optional[str] = None
    products: List[PostProductRead]
    images: List[PostImageRead]

    class Config:
        from_attributes = True

class PostDetailRead(PostRead):
    products: List[PostProductDetailRead]
    images: List[PostImageRead]

class PostListRead(BaseModel):
    post_id: int
    title: str
    post_type: str
    approval: str
    availability: str
    seller_email: EmailStr
    created_at: datetime
    thumbnail_url: Optional[str] = None
    campaign_id: Optional[int] = None

    class Config:
        from_attributes = True