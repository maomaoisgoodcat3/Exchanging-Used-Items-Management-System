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

class PostAvailabilityStatus(str, enum.Enum):
    Open = "Open"
    Closed = "Closed"

class ProductCategories(Base):
    __tablename__ = "productcategories"
    category_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_name = Column(String(100), nullable=False)

    products = relationship("Storage", back_populates="category")

class Posts(Base):
    __tablename__ = "posts"
    post_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    seller_email = Column(String(100), ForeignKey("account_user.user_email"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.campaign_id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    image_post_url = Column(String(500))
    post_type = Column(Enum(PostTypeEnum), nullable=False)
    approval = Column(Enum(PostApprovalStatus), default=PostApprovalStatus.Pending)
    availability = Column(Enum(PostAvailabilityStatus), default=PostAvailabilityStatus.Open)
    reviewed_by = Column(String(100), ForeignKey("account_user.user_email"))
    reviewed_at = Column(DateTime)
    rejection_reason = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    campaign = relationship("Campaigns", back_populates="posts")
    products = relationship("PostProducts", back_populates="post", cascade="all, delete-orphan")
    images = relationship("PostImages", back_populates="post", cascade="all, delete-orphan")

class PostProducts(Base):
    post_id = Column(Integer, ForeignKey('Posts.post_id'), primary_key=True)
    product_id = Column(Integer, ForeignKey('Storage.product_id'), primary_key=True)

    post = relationship("Posts", back_populates="products")
    product = relationship("Storage", back_populates="posts_associated")

class Storage(Base):
    __tablename__ = 'storage'
    
    email = Column(String(100), ForeignKey('Users.email'))
    product_id = Column(Integer, primary_key=True, autoincrement=True)
    product_name = Column(String(200), nullable=False)
    product_category_id = Column(Integer, ForeignKey('ProductCategories.category_id'), nullable=False)
    product_quantity = Column(Integer, nullable=False, default=1)
    product_price = Column(Numeric(15, 2), default=0.00)
    product_location_id = Column(Integer, ForeignKey('Locations.location_id'), nullable=False)

    # Relationships
    user = relationship("Users", back_populates="products_in_storage")
    category = relationship("ProductCategories", back_populates="products")
    location_rel = relationship("Locations", back_populates="products")
    images = relationship("ProductImages", back_populates="product")
    posts_associated = relationship("PostProducts", back_populates="product")
    transactions = relationship("Transactions", back_populates="product")

class ProductImages(Base):
    __tablename__ = 'productimages'
    
    image_id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('Storage.product_id'), nullable=False)
    image_url = Column(String(500))
    uploaded_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    product = relationship("Storage", back_populates="images")