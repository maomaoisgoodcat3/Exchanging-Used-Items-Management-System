from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


# ============================================================================
# ENUMS
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


# ============================================================================
# BASE & EXISTING SCHEMAS (Selling)
# ============================================================================

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


# ============================================================================
# TRADING TRANSACTION SCHEMAS
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

    class Config:
        schema_extra = {
            "example": {
                "post_id": 5,
                "trading_product_id": 10,
                "trading_quantity": 1,
                "offered_products": [
                    {"product_id": 20, "quantity": 2}
                ]
            }
        }


class TradeReview(BaseModel):
    """Accept or deny a trade offer"""
    action: str = Field(..., pattern="^(Accept|Deny)$")
    review_notes: Optional[str] = None


class TradingTransactionRead(BaseModel):
    """Trading transaction response"""
    transaction_id: int
    post_id: int
    product_id: int
    quantity: int
    buyer_email: EmailStr
    seller_email: EmailStr
    offered_products: List[Dict[str, Any]]
    result: str
    reviewed_at: Optional[datetime] = None
    transaction_date: datetime

    class Config:
        from_attributes = True


# ============================================================================
# DONATION TRANSACTION SCHEMAS
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
    product_id: int
    quantity: int
    donor_email: EmailStr
    claimer_email: EmailStr
    campaign_id: Optional[int] = None
    result: str
    reviewed_by: Optional[EmailStr] = None
    reviewed_at: Optional[datetime] = None
    transaction_date: datetime

    class Config:
        from_attributes = True


# ============================================================================
# TRANSACTION HISTORY & SUMMARY SCHEMAS
# ============================================================================

class TransactionHistory(BaseModel):
    """User's transaction history"""
    transaction_id: int
    post_id: int
    transaction_type: str
    quantity: int
    other_party_email: EmailStr
    result: str
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


# Trading-specific schemas
class TradeProductOffer(BaseModel):
    """Product offered in trade"""
    product_id: int
    quantity: int = Field(..., gt=0)


class TradeOrderCreate(BaseModel):
    """Create a trade order for a Trading post"""
    post_id: int
    trading_post_product_id: int
    trading_post_quantity: int = Field(..., gt=0)
    offered_products: List[TradeProductOffer] = Field(..., min_items=1, description="Items trader wants to offer")

    class Config:
        schema_extra = {
            "example": {
                "post_id": 5,
                "trading_post_product_id": 10,
                "trading_post_quantity": 1,
                "offered_products": [
                    {"product_id": 20, "quantity": 2}
                ]
            }
        }


class TradeOrderRead(BaseModel):
    """Trade order response"""
    transaction_id: int
    post_id: int
    buyer_email: EmailStr
    trading_items: dict  # Products being traded
    offered_items: dict  # Products offered in return
    order_status: str
    transaction_date: datetime

    class Config:
        from_attributes = True


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
