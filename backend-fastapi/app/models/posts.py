from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text, DECIMAL, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base
from app.models.campaigns import CampaignApprovalEnum, CampaignAvailabilityEnum

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

class ProductCategories(Base):
    __tablename__ = "ProductCategories"
    category_id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(100), nullable=False)

    products = relationship("Storage", back_populates="category")

class Storage(Base):
    __tablename__ = "Storage"
    product_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), ForeignKey("Users.email"))
    product_name = Column(String(200), nullable=False)
    product_category_id = Column(Integer, ForeignKey("ProductCategories.category_id"), nullable=False)
    product_quantity = Column(Integer, nullable=False, default=1)
    product_price = Column(DECIMAL(15, 2), default=0.00)
    product_location_id = Column(Integer, ForeignKey("Locations.location_id"), nullable=False)

    user = relationship("Users", back_populates="products_in_storage")
    category = relationship("ProductCategories", back_populates="products")
    location_rel = relationship("Locations", back_populates="products")
    images = relationship("ProductImages", back_populates="product", cascade="all, delete-orphan")
    posts_associated = relationship("PostProducts", back_populates="product")
    transaction_links = relationship("TransactionProducts", back_populates="product")

class ProductImages(Base):
    __tablename__ = "ProductImages"
    image_id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("Storage.product_id"), nullable=False)
    image_url = Column(String(500))
    uploaded_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    product = relationship("Storage", back_populates="images")

class Posts(Base):
    __tablename__ = "Posts"
    post_id = Column(Integer, primary_key=True, autoincrement=True)
    seller_email = Column(String(100), ForeignKey("Users.email"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("Campaigns.campaign_id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    thumbnail_url = Column(String(500))
    post_category = Column(Enum(PostCategoryEnum), nullable=False)
    approval = Column(Enum(PostApprovalStatus), default=PostApprovalStatus.Pending)
    availability = Column(Enum(PostAvailabilityStatus), default=PostAvailabilityStatus.Open)
    reviewed_by = Column(String(100), ForeignKey("Users.email"))
    reviewed_at = Column(TIMESTAMP, onupdate=func.now())
    reject_reason = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    campaign = relationship("Campaigns", back_populates="posts")
    products = relationship("PostProducts", back_populates="post", cascade="all, delete-orphan")
    seller = relationship("Users", foreign_keys=[seller_email], back_populates="posts")
    reviewer = relationship("Users", foreign_keys=[reviewed_by], back_populates="reviewed_posts")
    transactions = relationship("Transactions", back_populates="post")

class PostProducts(Base):
    __tablename__ = "PostProducts"
    post_id = Column(Integer, ForeignKey("Posts.post_id"), primary_key=True)
    product_id = Column(Integer, ForeignKey("Storage.product_id"), primary_key=True)
    product_quantity = Column(Integer, nullable=False, default=1)

    post = relationship("Posts", back_populates="products")
    product = relationship("Storage", back_populates="posts_associated")