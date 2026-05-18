# app/models/post.py
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class PostTypeEnum(str, enum.Enum):
    Selling = "Selling"
    Trading = "Trading"
    Donating = "Donating"

class PostApprovalStatus(str, enum.Enum):
    Pending = "Pending"
    Approved = "Approved"
    Rejected = "Rejected"
    Resending = "Resending"

class PostOpenStatus(str, enum.Enum):
    Available = "Available"
    Closed = "Closed"

class ProductCategory(Base):
    __tablename__ = "product_categories"
    category_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_name = Column(String(100), nullable=False)

class Post(Base):
    __tablename__ = "posts"
    post_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    seller_email = Column(String(100), ForeignKey("account_user.user_email"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.campaign_id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    image_post_url = Column(String(500))
    post_type = Column(Enum(PostTypeEnum), nullable=False)
    approval_status = Column(Enum(PostApprovalStatus), default=PostApprovalStatus.Pending)
    open_status = Column(Enum(PostOpenStatus), default=PostOpenStatus.Available)
    reviewed_by = Column(String(100), ForeignKey("account_user.user_email"))
    reviewed_at = Column(DateTime)
    rejection_reason = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    campaign = relationship("Campaign", back_populates="posts")
    products = relationship("PostProduct", back_populates="post", cascade="all, delete-orphan")
    images = relationship("PostImage", back_populates="post", cascade="all, delete-orphan")

class PostProduct(Base):
    __tablename__ = "post_products"
    product_id = Column(Integer, primary_key=True, index=True, autoincrement=True) # Đã bổ sung PK
    post_id = Column(Integer, ForeignKey("posts.post_id"), nullable=False)
    product_name = Column(String(200))
    product_category_id = Column(Integer, ForeignKey("product_categories.category_id"), nullable=False)
    product_quantity = Column(Integer, nullable=False)
    product_price = Column(Numeric(15, 2), default=0.00)

    post = relationship("Post", back_populates="products")

class PostImage(Base):
    __tablename__ = "post_images"
    image_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("posts.post_id"), nullable=False)
    image_url = Column(String(500))
    uploaded_at = Column(DateTime, server_default=func.now())

    post = relationship("Post", back_populates="images")