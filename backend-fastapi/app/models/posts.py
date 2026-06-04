# app/models/post.py
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

# ==========================================
# ENUMS
# ==========================================

class PostCategoryEnum(str, enum.Enum):
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
    Sold = "Sold"
    Closed = "Closed"

# ==========================================
# MODELS
# ==========================================

class ProductCategories(Base):
    __tablename__ = "productcategories"
    category_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_name = Column(String(100), nullable=False)

    r_productcategories_storage = relationship("Storage", back_populates="r_storage_productcategores")

class Posts(Base):
    __tablename__ = "posts"
    post_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    seller_email = Column(String(100), ForeignKey("Users.email"), nullable=False)
    post_category = Column(Enum(PostCategoryEnum), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.campaign_id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    thumbnail_url = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())
    approval = Column(Enum(PostApprovalStatus), default=PostApprovalStatus.Pending)
    availability = Column(Enum(PostAvailabilityStatus), default=PostAvailabilityStatus.Open)
    reviewed_by = Column(String(100), ForeignKey("Users.email"))
    reviewed_at = Column(DateTime)
    reject_reason = Column(Text)

    r_posts_campaigns = relationship("Campaigns", back_populates="r_campaigns_posts")
    r_posts_postproducts = relationship("PostProducts", back_populates="r_postproducts_posts", cascade="all, delete-orphan")
    r_posts_postimages = relationship("PostImages", back_populates="r_postimages_posts", cascade="all, delete-orphan")

class PostProducts(Base):
    __tablename__ = "postproducts"
    post_id = Column(Integer, ForeignKey('Posts.post_id'), primary_key=True)
    product_id = Column(Integer, ForeignKey('Storage.product_id'), primary_key=True)
    product_quantity = Column(Integer, nullable=False)

    r_postproducts_posts = relationship("Posts", back_populates="r_posts_postproducts")
    r_postproducts_storage = relationship("Storage", back_populates="r_storage_postproducts")

class Storage(Base):
    __tablename__ = 'storage'
    
    email = Column(String(100), ForeignKey('Users.email'))
    product_id = Column(Integer, primary_key=True, autoincrement=True)
    product_name = Column(String(200), nullable=False)
    product_category_id = Column(Integer, ForeignKey('ProductCategories.category_id'), nullable=False)
    product_quantity = Column(Integer, nullable=False, default=1)
    product_price = Column(Numeric(15, 2), default=0.00)
    product_location_id = Column(Integer, ForeignKey('Locations.location_id'), nullable=False)

    r_storage_users = relationship("Users", back_populates="r_users_storage")
    r_storage_productcategories = relationship("ProductCategories", back_populates="r_productcategories_storage")
    r_storage_locations = relationship("Locations", back_populates="r_locations_storage")
    r_storage_productimages = relationship("ProductImages", back_populates="r_productimages_storage")
    r_storage_postproducts = relationship("PostProducts", back_populates="r_postproducts_storage")
    r_storage_transactions = relationship("Transactions", back_populates="r_transactions_storage")

class ProductImages(Base):
    __tablename__ = 'productimages'
    
    image_id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('Storage.product_id'), nullable=False)
    image_url = Column(String(500))
    uploaded_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    r_productimages_storage = relationship("Storage", back_populates="r_storage_productimages")