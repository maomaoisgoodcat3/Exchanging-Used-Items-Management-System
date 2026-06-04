from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text, DECIMAL, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

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

class Transactions(Base):
    __tablename__ = "Transactions"
    transaction_id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("Posts.post_id"), nullable=False)
    requester_email = Column(String(100), ForeignKey("Users.email"), nullable=False)
    service_fee = Column(DECIMAL(15, 2), default=0.00)
    poster_status = Column(Enum(PosterStatusEnum), default=PosterStatusEnum.Pending, nullable=False)
    requester_status = Column(Enum(RequesterStatusEnum), default=RequesterStatusEnum.Pending, nullable=False)
    transaction_date = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, onupdate=func.now())

    requester = relationship("Users", back_populates="transactions")
    post = relationship("Posts", back_populates="transactions")
    products = relationship("TransactionProducts", back_populates="transaction", cascade="all, delete-orphan")

class TransactionProducts(Base):
    __tablename__ = "TransactionProducts"
    # Đã cập nhật theo Database của team: Dùng ID tự tăng thay vì khóa kép
    transaction_product_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(Integer, ForeignKey("Transactions.transaction_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("Storage.product_id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    product_source = Column(Enum(ProductSourceEnum), nullable=False)

    transaction = relationship("Transactions", back_populates="products")
    product = relationship("Storage", back_populates="transaction_links")

class Settings(Base):
    __tablename__ = "Settings"
    setting_id = Column(Integer, primary_key=True, autoincrement=True)
    setting_name = Column(String(100), nullable=False)
    setting_value = Column(DECIMAL(15, 2), nullable=False)
    description = Column(Text)
    # Đã sửa lại lỗi khóa ngoại của team bạn
    updated_by = Column(String(100), ForeignKey("Users.email"))
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    updater = relationship("Users", back_populates="updated_settings")