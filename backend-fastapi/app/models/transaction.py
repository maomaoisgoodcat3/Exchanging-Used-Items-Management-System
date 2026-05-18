# app/models/transaction.py
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class TransactionStatusEnum(str, enum.Enum):
    Pending = "Pending"
    Deposited = "Deposited"
    Successful = "Successful"
    Cancelled = "Cancelled"

class OrderStatusEnum(str, enum.Enum):
    Pending = "Pending"
    Ready_for_pickup = "Ready_for_pickup"
    Cancelled = "Cancelled"
    Successful = "Successful"

class Transaction(Base):
    __tablename__ = "transactions"
    transaction_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("posts.post_id"), nullable=False)
    buyer_email = Column(String(100), ForeignKey("account_user.user_email"), nullable=False)
    quantity = Column(Integer, default=1)
    service_fee = Column(Numeric(15, 2), default=0.00)
    transaction_date = Column(DateTime, server_default=func.now())
    order_status = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.Pending)
    transaction_status = Column(Enum(TransactionStatusEnum), default=TransactionStatusEnum.Pending)

class Setting(Base):
    __tablename__ = "settings"
    setting_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    setting_name = Column(String(100), nullable=False)
    setting_value = Column(Numeric(15, 2), nullable=False)
    description = Column(Text)
    last_update = Column(DateTime, server_default=func.now(), onupdate=func.now())
    updated_by = Column(String(100), ForeignKey("account_user.user_email"))