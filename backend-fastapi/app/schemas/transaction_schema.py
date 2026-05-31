from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class TransactionBase(BaseModel):
    post_id: int
    product_id: int
    quantity: int = Field(..., gt=0)


class TransactionCreate(TransactionBase):
    pass


class TransactionRead(TransactionBase):
    transaction_id: int
    buyer_email: EmailStr
    service_fee: Decimal
    order_status: str
    transaction_status: str
    transaction_date: datetime

    class Config:
        from_attributes = True


class TransactionListRead(BaseModel):
    transaction_id: int
    post_id: int
    product_id: int
    buyer_email: EmailStr
    quantity: int
    service_fee: Decimal
    order_status: str
    transaction_status: str
    transaction_date: datetime

    class Config:
        from_attributes = True


class TransactionFilter(BaseModel):
    buyer_email: Optional[EmailStr] = None
    post_id: Optional[int] = None
    order_status: Optional[str] = None
    transaction_status: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: Optional[str] = Field(default="transaction_date", pattern="^(transaction_date|order_status)$")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=10, ge=1, le=100)


class TransactionStatusUpdate(BaseModel):
    order_status: Optional[str] = Field(None, pattern="^(Pending|Ready for pickup|Successful)$")
    transaction_status: Optional[str] = Field(None, pattern="^(Pending|Deposited|Successful)$")


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
    post_id: int
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
