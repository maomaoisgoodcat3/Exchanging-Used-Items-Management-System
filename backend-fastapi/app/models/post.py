# app/models/post.py
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text, DECIMAL, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base
from app.models.campaign import ApprovalEnum # Tái sử dụng Enum duyệt bài

class PostCategoryEnum(str, enum.Enum):
    Selling = "Selling"
    Trading = "Trading"
    Donating = "Donating"

class PostAvailabilityEnum(str, enum.Enum):
    Open = "Open"
    Sold = "Sold"
    Closed = "Closed"

class ProductCategory(Base):
    __tablename__ = "ProductCategories"
    category_id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(100), nullable=False)

class Location(Base):
    __tablename__ = "Locations"
    location_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), ForeignKey("Users.email"))
    location = Column(String(1000), nullable=False)

class Storage(Base):
    __tablename__ = "Storage"
    product_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), ForeignKey("Users.email"))
    product_name = Column(String(200), nullable=False)
    product_category_id = Column(Integer, ForeignKey("ProductCategories.category_id"), nullable=False)
    product_quantity = Column(Integer, nullable=False, default=1)
    product_price = Column(DECIMAL(15, 2), default=0.00)
    product_location_id = Column(Integer, ForeignKey("Locations.location_id"), nullable=False)

    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    post_links = relationship("PostProduct", back_populates="product")

class ProductImage(Base):
    __tablename__ = "ProductImages"
    image_id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("Storage.product_id"), nullable=False)
    image_url = Column(String(500))
    uploaded_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    product = relationship("Storage", back_populates="images")

class Post(Base):
    __tablename__ = "Posts"
    post_id = Column(Integer, primary_key=True, autoincrement=True)
    seller_email = Column(String(100), ForeignKey("Users.email"), nullable=False)
    post_category = Column(Enum(PostCategoryEnum), nullable=False)
    campaign_id = Column(Integer, ForeignKey("Campaigns.campaign_id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    thumbnail_url = Column(String(500))
    created_at = Column(TIMESTAMP, server_default=func.now())
    reviewed_by = Column(String(100), ForeignKey("Users.email"))
    reviewed_at = Column(TIMESTAMP, onupdate=func.now())
    availability = Column(Enum(PostAvailabilityEnum), nullable=False, default=PostAvailabilityEnum.Closed)
    approval = Column(Enum(ApprovalEnum), nullable=False, default=ApprovalEnum.Pending)
    reject_reason = Column(Text)

    campaign = relationship("Campaign", back_populates="posts")
    products = relationship("PostProduct", back_populates="post", cascade="all, delete-orphan")

class PostProduct(Base):
    __tablename__ = "PostProducts"
    # Dùng Composite Primary Key (Khóa chính kép) vì bảng trung gian SQL không có khóa chính độc lập
    post_id = Column(Integer, ForeignKey("Posts.post_id"), primary_key=True)
    product_id = Column(Integer, ForeignKey("Storage.product_id"), primary_key=True)

    post = relationship("Post", back_populates="products")
    product = relationship("Storage", back_populates="post_links")