# app/models/transaction.py
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

# ==========================================
# ENUMS
# ==========================================

class TransactionStatusEnum(str, enum.Enum):
    Pending = "Pending"
    Deposited = "Deposited"
    Successful = "Successful"
    Cancelled = "Cancelled"

class OrderStatusEnum(str, enum.Enum):
    Pending = "Pending"
    Ready_for_pickup = "Ready for pickup"
    Cancelled = "Cancelled"
    Successful = "Successful"

# ==========================================
# MODELS
# ==========================================

class Transactions(Base):
    __tablename__ = "transactions"
    transaction_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("Posts.post_id"), nullable=False)
    product_id = Column(Integer, ForeignKey('Storage.product_id'), nullable=False)
    buyer_email = Column(String(100), ForeignKey("Users.email"), nullable=False)
    quantity = Column(Integer, default=1)
    service_fee = Column(Numeric(15, 2), default=0.00)
    order_status = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.Pending)
    transaction_status = Column(Enum(TransactionStatusEnum), default=TransactionStatusEnum.Pending)
    transaction_date = Column(DateTime, server_default=func.now())

    r_transactions_users = relationship("Users", back_populates="r_users_transactions")
    r_transactions_storage = relationship("Storage", back_populates="r_storage_transactions")
    r_transactions_posts = relationship("Posts", back_populates="r_posts_transactions")
    

class Settings(Base):
    __tablename__ = "settings"
    setting_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    setting_name = Column(String(100), nullable=False)
    setting_value = Column(Numeric(15, 2), nullable=False)
    description = Column(Text)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    updated_by = Column(String(100), ForeignKey("users.user_email"))

    r_settings_users = relationship("Users", back_populates="r_users_settings")