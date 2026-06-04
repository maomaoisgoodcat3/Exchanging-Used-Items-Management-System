from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from enum import Enum

# ============================================================================
# ENUMS (Đồng bộ chuẩn xác với cơ sở dữ liệu mới)
# ============================================================================

class PostCategoryEnum(str, Enum):
    SELLING = "Selling"
    TRADING = "Trading"
    DONATING = "Donating"


class PosterStatusEnum(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    DENIED = "Denied"
    READY_FOR_PICKUP = "Ready for pickup"
    SUCCESSFUL = "Successful"


class RequesterStatusEnum(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    DENIED = "Denied"
    DEPOSITED = "Deposited"
    CLAIMED = "Claimed"
    SUCCESSFUL = "Successful"


class ProductSourceEnum(str, Enum):
    POSTER = "Poster"
    REQUESTER = "Requester"


# ============================================================================
# TRANSACTION PRODUCTS SCHEMAS (Bảng con chi tiết sản phẩm)
# ============================================================================

class TransactionProductBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    product_source: ProductSourceEnum


class TransactionProductCreate(TransactionProductBase):
    pass


class TransactionProductRead(TransactionProductBase):
    class Config:
        from_attributes = True


# ============================================================================
# BASE & GENERAL TRANSACTION SCHEMAS
# ============================================================================

class TransactionBase(BaseModel):
    post_id: int


class TransactionCreate(TransactionBase):
    # Khi tạo một đơn hàng/giao dịch chung, cần truyền kèm danh sách sản phẩm
    products: List[TransactionProductCreate] = Field(..., min_length=1)


class TransactionRead(TransactionBase):
    transaction_id: int
    requester_email: EmailStr  # Đổi từ buyer_email
    service_fee: Decimal
    Poster_status: PosterStatusEnum  # Đổi từ order_status
    Requester_status: RequesterStatusEnum  # Đổi từ transaction_status
    transaction_date: datetime
    updated_at: Optional[datetime] = None
    products: List[TransactionProductRead]  # Lấy kèm danh sách sản phẩm liên quan

    class Config:
        from_attributes = True


class TransactionListRead(BaseModel):
    transaction_id: int
    post_id: int
    requester_email: EmailStr
    service_fee: Decimal
    Poster_status: PosterStatusEnum
    Requester_status: RequesterStatusEnum
    transaction_date: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TransactionFilter(BaseModel):
    requester_email: Optional[EmailStr] = None
    post_id: Optional[int] = None
    Poster_status: Optional[PosterStatusEnum] = None
    Requester_status: Optional[RequesterStatusEnum] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: Optional[str] = Field(default="transaction_date", pattern="^(transaction_date|Poster_status|Requester_status)$")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=10, ge=1, le=100)


class TransactionStatusUpdate(BaseModel):
    Poster_status: Optional[PosterStatusEnum] = None
    Requester_status: Optional[RequesterStatusEnum] = None


# ============================================================================
# TRADING TRANSACTION SCHEMAS
# ============================================================================

class TradeItemInput(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class TradingTransactionCreate(BaseModel):
    """Người đi đổi tạo yêu cầu giao dịch"""
    post_id: int
    # Danh sách mặt hàng muốn lấy từ bài đăng của Poster
    wanted_products: List[TradeItemInput] = Field(..., min_length=1)
    # Danh sách mặt hàng của bản thân mang ra đối ứng (Requester)
    offered_products: List[TradeItemInput] = Field(..., min_length=1)

    class Config:
        json_schema_extra = {
            "example": {
                "post_id": 5,
                "wanted_products": [
                    {"product_id": 10, "quantity": 1}
                ],
                "offered_products": [
                    {"product_id": 20, "quantity": 2}
                ]
            }
        }


class TradeReview(BaseModel):
    """Poster bấm Accept hoặc Deny giao dịch trao đổi"""
    action: str = Field(..., pattern="^(Accept|Deny)$")
    review_notes: Optional[str] = None


class TradingTransactionRead(BaseModel):
    """Xem chi tiết đơn trao đổi đồ"""
    transaction_id: int
    post_id: int
    requester_email: EmailStr
    Poster_status: PosterStatusEnum
    Requester_status: RequesterStatusEnum
    products: List[TransactionProductRead]
    transaction_date: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# DONATION TRANSACTION SCHEMAS
# ============================================================================

class DonationTransactionCreate(BaseModel):
    """Người nhận bấm Claim nhận đồ hoặc Manager đăng ký nhận đồ quyên góp"""
    post_id: int
    products: List[TradeItemInput] = Field(..., min_length=1)


class DonationReview(BaseModel):
    """Manager của chiến dịch duyệt hoặc từ chối đơn đồ quyên góp nhận vào"""
    action: str = Field(..., pattern="^(Accept|Deny)$")
    approval_reason: Optional[str] = None


class DonationTransactionRead(BaseModel):
    """Thông tin phản hồi về đơn quyên góp/nhận đồ"""
    transaction_id: int
    post_id: int
    requester_email: EmailStr  # Người nhận (Nếu tự do) hoặc Email của Manager đứng ra nhận (Nếu campaign)
    Poster_status: PosterStatusEnum
    Requester_status: RequesterStatusEnum
    products: List[TransactionProductRead]
    transaction_date: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# TRANSACTION HISTORY & SUMMARY SCHEMAS
# ============================================================================

class TransactionHistory(BaseModel):
    transaction_id: int
    post_id: int
    post_category: PostCategoryEnum
    Poster_status: PosterStatusEnum
    Requester_status: RequesterStatusEnum
    transaction_date: datetime

    class Config:
        from_attributes = True


class UserTransactionSummary(BaseModel):
    total_sales: int = 0
    total_trades: int = 0
    successful_trades: int = 0
    pending_trades: int = 0
    total_donations_given: int = 0
    total_donations_received: int = 0
    recent_transactions: List[TransactionHistory] = []


# ============================================================================
# SETTINGS & OTHER RELATED SCHEMAS (Giữ nguyên logic của bạn)
# ============================================================================

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
    items: List[CartItemRead]
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