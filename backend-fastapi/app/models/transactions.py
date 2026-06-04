# app/models/transaction.py
import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

# ============================================================================
# ENUMS
# ============================================================================

class PosterStatusEnum(str, enum.Enum):
    Pending = "Pending"
    Accepted = "Accepted"
    Denied = "Denied"
    Ready_for_pickup = "Ready for pickup"
    Successful = "Successful"


class RequesterStatusEnum(str, enum.Enum):
    Pending = "Pending"
    Accepted = "Accepted"
    Denied = "Denied"
    Deposited = "Deposited"
    Claimed = "Claimed"
    Successful = "Successful"


class ProductSourceEnum(str, enum.Enum):
    Poster = "Poster"
    Requester = "Requester"


# ============================================================================
# HEADER TABLE: TRANSACTIONS
# ============================================================================

class Transactions(Base):
    __tablename__ = "transactions"
    
    transaction_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("posts.post_id"), nullable=False)
    requester_email = Column(String(100), ForeignKey("users.email"), nullable=False)  # Đổi từ buyer_email
    service_fee = Column(Numeric(15, 2), default=0.00)
    
    # Sử dụng hệ thống trạng thái song hành mới thay cho order_status và transaction_status cũ
    Poster_status = Column(Enum(PosterStatusEnum), default=PosterStatusEnum.Pending, nullable=False)
    Requester_status = Column(Enum(RequesterStatusEnum), default=RequesterStatusEnum.Pending, nullable=False)
    
    transaction_date = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


    requester = relationship("Users", back_populates="transactions")

    transaction_products = relationship("TransactionProducts", back_populates="transaction", cascade="all, delete-orphan")


# ============================================================================
# DETAIL TABLE: TRANSACTION PRODUCTS (Bảng mới để hỗ trợ nhiều sản phẩm)
# ============================================================================

class TransactionProducts(Base):
    __tablename__ = "transactionproducts"

    transaction_product_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(Integer, ForeignKey("transactions.transaction_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("Storage.product_id"), nullable=False)  # Giữ nguyên liên kết Storage cũ của bạn
    quantity = Column(Integer, default=1, nullable=False)
    product_source = Column(Enum(ProductSourceEnum), nullable=False)  # Phân biệt đồ của Poster hay Requester đem đổi

    transaction = relationship("Transactions", back_populates="transactionproducts")
    product = relationship("Storage", back_populates="transactionproducts")


# ============================================================================
# SETTINGS TABLE
# ============================================================================

class Settings(Base):
    __tablename__ = "settings"
    
    setting_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    setting_name = Column(String(100), nullable=False)
    setting_value = Column(Numeric(15, 2), nullable=False)
    description = Column(Text)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    updated_by = Column(String(100), ForeignKey("users.user_email"))

    updater = relationship("Users", back_populates="updated_settings")