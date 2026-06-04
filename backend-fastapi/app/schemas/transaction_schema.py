from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

# ============================================================================
# ENUMS (Từ nhánh của team)
# ============================================================================
class TransactionTypeEnum(str):
    SELLING = "Selling"
    TRADING = "Trading"
    DONATING = "Donating"

class TransactionResultEnum(str):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    DENIED = "Denied"
    SUCCESSFUL = "Successful"

# ==========================================
# 1. TRANSACTION PRODUCTS (Sản phẩm giao dịch đa luồng - TỪ HEAD)
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
# 2. TRANSACTIONS (Giao dịch chính - TỪ HEAD)
# ==========================================
class TransactionBase(BaseModel):
    post_id: int
    requester_email: EmailStr

class TransactionCreate(TransactionBase):
    products: List[TransactionProductCreate] = Field(..., min_length=1, description="List of products in this transaction")

class TransactionRead(TransactionBase):
    transaction_id: int
    requester_email: EmailStr
    service_fee: Decimal
    poster_status: str
    requester_status: str
    transaction_date: datetime

    class Config:
        from_attributes = True

class TransactionDetailRead(TransactionRead):
    products: List[TransactionProductRead]

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

# ============================================================================
# 3. TRADING TRANSACTION SCHEMAS (Từ nhánh Team - Đã chuẩn hóa DB)
# ============================================================================
class TradeProductOffer(BaseModel):
    """Product offered in a trade"""
    product_id: int
    quantity: int = Field(..., gt=0)

class TradingTransactionCreate(BaseModel):
    """Create a trading transaction"""
    post_id: int
    trading_product_id: int
    trading_quantity: int = Field(..., gt=0)
    offered_products: List[TradeProductOffer] = Field(..., min_items=1)

class TradeReview(BaseModel):
    """Accept or deny a trade offer"""
    action: str = Field(..., pattern="^(Accept|Deny)$")
    review_notes: Optional[str] = None

class TradingTransactionRead(BaseModel):
    """Trading transaction response"""
    transaction_id: int
    post_id: int
    requester_email: EmailStr 
    offered_products: List[Dict[str, Any]] = []
    poster_status: str 
    requester_status: str
    reviewed_at: Optional[datetime] = None
    transaction_date: datetime

    class Config:
        from_attributes = True

class TradeOrderCreate(BaseModel):
    """Create a trade order for a Trading post"""
    post_id: int
    trading_post_product_id: int
    trading_post_quantity: int = Field(..., gt=0)
    offered_products: List[TradeProductOffer] = Field(..., min_items=1, description="Items trader wants to offer")

class TradeOrderRead(BaseModel):
    """Trade order response"""
    transaction_id: int
    post_id: int
    requester_email: EmailStr
    trading_items: dict = {}
    offered_items: dict = {}
    poster_status: str
    requester_status: str
    transaction_date: datetime

    class Config:
        from_attributes = True

# ============================================================================
# 4. DONATION TRANSACTION SCHEMAS (Từ nhánh Team - Đã chuẩn hóa DB)
# ============================================================================
class DonationTransactionCreate(BaseModel):
    """Claim a donation"""
    post_id: int
    product_id: int
    quantity: int = Field(..., gt=0)
    campaign_id: Optional[int] = None

class DonationReview(BaseModel):
    """Approve or reject a campaign donation"""
    action: str = Field(..., pattern="^(Approve|Reject)$")
    approval_reason: Optional[str] = None

class DonationTransactionRead(BaseModel):
    """Donation transaction response"""
    transaction_id: int
    post_id: int
    requester_email: EmailStr
    campaign_id: Optional[int] = None
    poster_status: str 
    requester_status: str
    reviewed_by: Optional[EmailStr] = None
    reviewed_at: Optional[datetime] = None
    transaction_date: datetime

    class Config:
        from_attributes = True

# ============================================================================
# 5. TRANSACTION HISTORY & SUMMARY SCHEMAS (Từ nhánh Team - Đã chuẩn hóa DB)
# ============================================================================
class TransactionHistory(BaseModel):
    """User's transaction history"""
    transaction_id: int
    post_id: int
    transaction_type: str = "Unknown"
    requester_email: EmailStr 
    poster_status: str
    requester_status: str
    transaction_date: datetime

    class Config:
        from_attributes = True

class UserTransactionSummary(BaseModel):
    """Summary of user's transactions"""
    total_sales: int = 0
    total_trades: int = 0
    successful_trades: int = 0
    pending_trades: int = 0
    total_donations_given: int = 0
    total_donations_received: int = 0
    recent_transactions: List[TransactionHistory] = []

# ==========================================
# 6. SETTINGS
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
# 7. PAYMENT, CART & RETURN
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