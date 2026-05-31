"""Post Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from decimal import Decimal
from schemas.post_schema import (
    PostCreate, PostUpdate, PostRead, PostDetailRead, PostListRead,
    PostFilter, PostApprovalAction, PostProductCreate, PostImageCreate
)

router = APIRouter(prefix="/api/v1/posts", tags=["Posts"])


@router.get("/", response_model=PostListRead)
def list_posts(
    post_category: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    limit: int = 20,
    skip: int = 0
):
    """
    List all posts with filtering and sorting
    
    Database: Posts table
    - Filters by post_category (Selling, Trading, Donating)
    - Filters by status (Pending, Approved, Rejected, Sold, Closed)
    - Searches in title and description
    
    - **post_category**: Selling, Trading, Donating
    - **search**: Search by title or description
    - **status**: Filter by status
    - **sort_by**: created_at, title
    - **sort_order**: asc, desc
    - **limit**: Results per page (max 100)
    - **skip**: Pagination offset
    """
    return {
        "data": [
            {
                "post_id": 1,
                "title": "Used Laptop",
                "post_category": "Selling",
                "price": Decimal("500.00"),
                "status": "Approved",
                "seller_email": "seller@uet.edu.vn",
                "created_at": "2024-05-31T15:39:31"
            }
        ],
        "total": 100,
        "limit": limit,
        "skip": skip
    }


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_post(
    data: PostCreate,
    current_user: str = Depends()
):
    """
    Create a new post
    
    Database: Posts table
    - seller_email: Current user's email
    - post_category: Selling, Trading, or Donating
    - title: Post title
    - description: Detailed description
    - campaign_id: Optional - if participating in campaign
    - status: Default 'Pending' - needs admin approval
    
    - **title**: Post title
    - **description**: Detailed description
    - **post_category**: Category (Selling, Trading, Donating)
    - **campaign_id**: Associated campaign ID (optional)
    - **products**: List of storage product IDs
    """
    if not data.title or not data.description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title and description are required"
        )
    
    return {
        "message": "Post created successfully",
        "post_id": 1,
        "seller_email": current_user,
        "status": "Pending",
        "created_at": "2024-05-31T15:39:31"
    }


@router.get("/{post_id}", response_model=PostDetailRead)
def get_post_detail(post_id: int):
    """
    Get detailed information of a specific post
    
    Database: Posts table joined with Storage and PostImages
    - Retrieves post by post_id
    - Gets associated storage products
    - Gets associated images
    
    - **post_id**: Post ID
    """
    return {
        "post_id": post_id,
        "title": "Used Laptop",
        "description": "Excellent condition laptop for sale",
        "post_category": "Selling",
        "status": "Approved",
        "seller_email": "seller@uet.edu.vn",
        "campaign_id": None,
        "created_at": "2024-05-31T15:39:31",
        "reviewed_by": None,
        "reviewed_at": None
    }


@router.put("/{post_id}", response_model=dict)
def update_post(
    post_id: int,
    data: PostUpdate,
    current_user: str = Depends()
):
    """
    Update post information (owner only, if not approved)
    
    Database: Posts table
    - Can only update if status is Pending
    - seller_email must match current_user
    """
    return {
        "message": "Post updated successfully",
        "post_id": post_id
    }


@router.delete("/{post_id}", response_model=dict)
def delete_post(post_id: int, current_user: str = Depends()):
    """
    Delete a post (owner or admin only)
    
    Database: Posts table
    - Delete post and cascade to PostProducts and PostImages
    """
    return {
        "message": "Post deleted successfully",
        "post_id": post_id
    }


@router.post("/{post_id}/mark-sold", response_model=dict)
def mark_post_sold(
    post_id: int,
    current_user: str = Depends()
):
    """
    Mark post as sold
    
    Database: Posts table
    - Updates status to 'Sold'
    - Only owner can mark as sold
    """
    return {
        "message": "Post marked as sold",
        "post_id": post_id,
        "status": "Sold"
    }


@router.post("/{post_id}/approve", response_model=dict)
def approve_post(
    post_id: int,
    data: PostApprovalAction,
    current_user: str = Depends()
):
    """
    Approve/Reject post (admin only)
    
    Database: Posts table
    - Updates status (Approved/Rejected)
    - Sets reviewed_by and reviewed_at
    - Sets reject_reason if rejected
    """
    return {
        "message": f"Post {data.action}",
        "post_id": post_id,
        "status": data.action
    }


@router.get("/{post_id}/products", response_model=List[dict])
def get_post_products(post_id: int):
    """
    Get products in a post
    
    Database: PostProducts table joined with Storage
    - Retrieves all products for the post_id
    """
    return [
        {
            "product_id": 1,
            "product_name": "Item",
            "quantity": 1,
            "price": Decimal("100.00")
        }
    ]


@router.post("/{post_id}/products", response_model=dict)
def add_product_to_post(
    post_id: int,
    storage_product_ids: List[int],
    current_user: str = Depends()
):
    """
    Add storage products to post
    
    Database: PostProducts table
    - Links storage products to post
    - storage_product_ids must exist in Storage table
    """
    return {
        "message": "Products added successfully",
        "post_id": post_id
    }


@router.delete("/{post_id}/products/{product_id}", response_model=dict)
def remove_product_from_post(
    post_id: int,
    product_id: int,
    current_user: str = Depends()
):
    """
    Remove product from post
    
    Database: PostProducts table
    - Removes link between post and storage product
    """
    return {
        "message": "Product removed successfully",
        "post_id": post_id,
        "product_id": product_id
    }


@router.post("/{post_id}/images", response_model=dict)
def add_image_to_post(
    post_id: int,
    data: PostImageCreate,
    current_user: str = Depends()
):
    """
    Add image to post
    
    Database: PostImages table
    - Adds image_url and uploaded_at timestamp
    """
    return {
        "message": "Image added successfully",
        "post_id": post_id,
        "image_id": 1
    }


@router.delete("/{post_id}/images/{image_id}", response_model=dict)
def remove_image_from_post(
    post_id: int,
    image_id: int,
    current_user: str = Depends()
):
    """
    Remove image from post
    
    Database: PostImages table
    - Deletes image record
    """
    return {
        "message": "Image removed successfully",
        "post_id": post_id,
        "image_id": image_id
    }


@router.get("/{post_id}/similar", response_model=List[PostRead])
def get_similar_posts(post_id: int, limit: int = 10):
    """
    Get similar posts (same post_category)
    
    Database: Posts table
    - Filters by same post_category
    - Excludes the current post
    """
    return [
        {
            "post_id": 2,
            "title": "Used Computer",
            "post_category": "Selling",
            "status": "Approved"
        }
    ]
