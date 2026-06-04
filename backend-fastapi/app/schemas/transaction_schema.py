from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# ==========================================
# 1. TRANSACTION PRODUCTS (Sản phẩm giao dịch)
# ==========================================
class TransactionProductBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    product_source: str = Field(pattern="^(Poster|Requester)$")

class TransactionProductCreate(TransactionProductBase):
    pass

class TransactionProductRead(TransactionProductBase):
    class Config:
        from_attributes = True

# ==========================================
# 2. TRANSACTIONS (Giao dịch chính)
# ==========================================
class TransactionBase(BaseModel):
    post_id: int
    requester_email: EmailStr

class TransactionCreate(TransactionBase):
    products: List[TransactionProductCreate] = Field(..., min_length=1, description="List of products in this transaction")

class TransactionRead(TransactionBase):
    transaction_id: int
    service_fee: Decimal
    poster_status: str
    requester_status: str
    transaction_date: datetime

    class Config:
        from_attributes = True

class TransactionDetailRead(TransactionRead):
    products: List[TransactionProductRead]

# CLASS BỊ THIẾU ĐÃ ĐƯỢC THÊM LẠI
class TransactionListRead(TransactionRead):
    pass

class TransactionFilter(BaseModel):
    requester_email: Optional[EmailStr] = None
    post_id: Optional[int] = None
    poster_status: Optional[str] = None
    requester_status: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: Optional[str] = Field(default="transaction_date", pattern="^(transaction_date|service_fee)$")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=10, ge=1, le=100)

class TransactionStatusUpdate(BaseModel):
    poster_status: Optional[str] = Field(None, pattern="^(Pending|Accepted|Denied|Ready for pickup|Successful)$")
    requester_status: Optional[str] = Field(None, pattern="^(Pending|Accepted|Denied|Deposited|Successful|Unsuccessful)$")

# ==========================================
# 3. SETTINGS
# ==========================================
class SettingsBase(BaseModel):
    setting_name: str
    setting_value: Decimal = Field(..., ge=0)
    description: Optional[str] = None

class SettingsCreate(SettingsBase):
    pass

class SettingsUpdate(BaseModel):
    setting_value: Decimal = Field(..., ge=0)
    description: Optional[str] = None

class SettingsRead(SettingsBase):
    setting_id: int
    updated_by: Optional[EmailStr] = None
    updated_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# 4. PAYMENT, CART & RETURN (Của team bạn)
# ==========================================
class PaymentMethodBase(BaseModel):
    payment_type: str = Field(pattern="^(COD|QR)$")

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentInitiate(BaseModel):
    transaction_id: int
    payment_type: str = Field(pattern="^(COD|QR)$")

class PaymentConfirm(BaseModel):
    transaction_id: int
    payment_reference: Optional[str] = None

class CartItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0)

class CartItemRead(CartItemBase):
    product_name: str
    product_price: Decimal

    class Config:
        from_attributes = True

class CartRead(BaseModel):
    items: list[CartItemRead]
    total_amount: Decimal

    class Config:
        from_attributes = True

class ReturnRequestBase(BaseModel):
    transaction_id: int
    reason: str

class ReturnRequestCreate(ReturnRequestBase):
    pass

class ReturnRequestRead(ReturnRequestBase):
    return_id: int
    status: str
    requested_at: datetime
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True