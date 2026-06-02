# app/models/transaction.py
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text, DECIMAL, TIMESTAMP
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class OrderStatusEnum(str, enum.Enum):
    Pending = "Pending"
    Ready_for_pickup = "Ready for pickup"
    Successful = "Successful"

class TransactionStatusEnum(str, enum.Enum):
    Pending = "Pending"
    Deposited = "Deposited"
    Successful = "Successful"

class Setting(Base):
    __tablename__ = "Settings"
    setting_id = Column(Integer, primary_key=True, autoincrement=True)
    setting_name = Column(String(100), nullable=False)
    setting_value = Column(DECIMAL(15, 2), nullable=False)
    description = Column(Text)
    updated_by = Column(String(100), ForeignKey("Users.email"))
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

class Transaction(Base):
    __tablename__ = "Transactions"
    transaction_id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("PostProducts.product_id"), nullable=False)
    buyer_email = Column(String(100), ForeignKey("Users.email"), nullable=False)
    quantity = Column(Integer, nullable=False)
    service_fee = Column(DECIMAL(15, 2), default=0.00)
    order_status = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.Pending)
    transaction_status = Column(Enum(TransactionStatusEnum), default=TransactionStatusEnum.Pending)
    transaction_date = Column(TIMESTAMP, server_default=func.now())