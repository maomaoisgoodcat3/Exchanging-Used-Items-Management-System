# app/models/transaction.py
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text, DECIMAL, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

# ==========================================
# ENUMS
# ==========================================

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
    Successful = "Successful"
    Unsuccessful = "Unsuccessful"

class ProductSourceEnum(str, enum.Enum):
    Poster = "Poster"
    Requester = "Requester"

# ==========================================
# MODELS
# ==========================================

class Transaction(Base):
    __tablename__ = "Transactions"
    transaction_id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("Posts.post_id"), nullable=False)
    requester_email = Column(String(100), ForeignKey("Users.email"), nullable=False)
    service_fee = Column(DECIMAL(15, 2), default=0.00)
    poster_status = Column(Enum(PosterStatusEnum), default=PosterStatusEnum.Pending)
    requester_status = Column(Enum(RequesterStatusEnum), default=RequesterStatusEnum.Pending)
    transaction_date = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    requester = relationship("User", back_populates="transactions")
    post = relationship("Post", back_populates="transactions")
    products = relationship("TransactionProduct", back_populates="transaction", cascade="all, delete-orphan")


class TransactionProduct(Base):
    __tablename__ = "TransactionProducts"
    # Dùng Composite Primary Key cho bảng trung gian
    transaction_id = Column(Integer, ForeignKey("Transactions.transaction_id"), primary_key=True)
    product_id = Column(Integer, ForeignKey("Storage.product_id"), primary_key=True)
    quantity = Column(Integer, nullable=False)
    product_source = Column(Enum(ProductSourceEnum), nullable=False)

    transaction = relationship("Transaction", back_populates="products")
    product = relationship("Storage", back_populates="transaction_links")


class Setting(Base):
    __tablename__ = "Settings"
    setting_id = Column(Integer, primary_key=True, autoincrement=True)
    setting_name = Column(String(100), nullable=False)
    setting_value = Column(DECIMAL(15, 2), nullable=False)
    description = Column(Text)
    updated_by = Column(String(100), ForeignKey("Users.email"))
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    updater = relationship("User", back_populates="updated_settings")