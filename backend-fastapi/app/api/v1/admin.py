"""Admin Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from decimal import Decimal
from schemas.post_schema import PostApprovalAction
from schemas.campaign_schema import CampaignApprovalAction

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


@router.get("/dashboard", response_model=dict)
def get_admin_dashboard(current_user: str = Depends()):
    """
    Get admin dashboard statistics
    
    Database: Posts, Campaigns, Transactions, Users tables
    - Counts pending posts and campaigns
    - Calculates total revenue from service_fee
    - Tracks active transactions
    """
    return {
        "total_users": 1500,
        "total_posts": 350,
        "total_campaigns": 12,
        "total_transactions": 280,
        "total_revenue": Decimal("50000.00"),
        "pending_posts": 15,
        "pending_campaigns": 3
    }


@router.get("/posts/pending", response_model=List[dict])
def get_pending_posts(
    limit: int = 20,
    skip: int = 0,
    current_user: str = Depends()
):
    """
    Get pending posts awaiting approval
    
    Database: Posts table
    - Retrieves posts where status = 'Pending'
    - Joins with Users table to get seller info
    """
    return [
        {
            "post_id": 1,
            "title": "Used Laptop",
            "seller_email": "seller@uet.edu.vn",
            "post_category": "Selling",
            "status": "Pending",
            "created_at": "2024-05-31T15:39:31"
        }
    ]


@router.post("/posts/{post_id}/approve", response_model=dict)
def approve_post_admin(
    post_id: int,
    data: PostApprovalAction,
    current_user: str = Depends()
):
    """
    Approve or reject a pending post
    
    Database: Posts table
    - Updates status (Approved/Rejected)
    - Sets reviewed_by and reviewed_at
    - Sets reject_reason if rejected
    """
    return {
        "message": f"Post {data.action}",
        "post_id": post_id,
        "status": data.action,
        "reviewed_by": current_user
    }


@router.get("/campaigns/pending", response_model=List[dict])
def get_pending_campaigns(
    limit: int = 20,
    skip: int = 0,
    current_user: str = Depends()
):
    """
    Get pending campaigns awaiting approval
    
    Database: Campaigns table
    - Retrieves campaigns where status = 'Pending'
    - Joins with Organizations table to get org info
    """
    return [
        {
            "campaign_id": 1,
            "title": "Summer Campaign",
            "org_email": "org@uet.edu.vn",
            "status": "Pending",
            "created_at": "2024-05-31T15:39:31"
        }
    ]


@router.post("/campaigns/{campaign_id}/approve", response_model=dict)
def approve_campaign_admin(
    campaign_id: int,
    data: CampaignApprovalAction,
    current_user: str = Depends()
):
    """
    Approve or reject a pending campaign
    
    Database: Campaigns table
    - Updates status (Approved/Rejected)
    - Sets reviewed_by and reviewed_at
    - Sets reject_reason if rejected
    """
    return {
        "message": f"Campaign {data.action}",
        "campaign_id": campaign_id,
        "status": data.action,
        "reviewed_by": current_user
    }


@router.put("/settings/service-fee", response_model=dict)
def update_service_fee(
    percentage: Decimal,
    current_user: str = Depends()
):
    """
    Update global service fee percentage
    
    Database: Settings table
    - Updates setting_value for service fee
    - Records updated_by and updated_at
    
    - **percentage**: Service fee percentage (e.g., 5.0)
    """
    return {
        "message": "Service fee updated",
        "service_fee_percentage": percentage,
        "updated_by": current_user
    }


@router.get("/users", response_model=List[dict])
def list_all_users(
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    current_user: str = Depends()
):
    """
    List all users (admin only)
    
    Database: Users table
    - Retrieves all users from Users table
    - Optional search by email or name
    """
    return [
        {
            "email": "user@uet.edu.vn",
            "name": "User Name",
            "phone": "+84912345678",
            "role": "Member",
            "created_at": "2024-01-01T00:00:00"
        }
    ]


@router.post("/users/{email}/role", response_model=dict)
def update_user_role(
    email: str,
    role: str,
    current_user: str = Depends()
):
    """
    Update user role (admin to Member or vice versa)
    
    Database: Users table
    - Updates role (Member, Admin)
    
    - **email**: User email
    - **role**: New role (Member or Admin)
    """
    return {
        "message": "User role updated",
        "email": email,
        "role": role
    }


@router.get("/reports", response_model=dict)
def get_system_reports(
    report_type: str = "daily",
    current_user: str = Depends()
):
    """
    Get system reports
    
    Database: Transactions, Posts, Campaigns tables
    - Daily/Weekly/Monthly statistics
    - Revenue reports
    - Activity reports
    
    - **report_type**: Report type (daily, weekly, monthly)
    """
    return {
        "period": "2024-05-31",
        "report_type": report_type,
        "new_users": 25,
        "new_posts": 120,
        "new_transactions": 50,
        "total_revenue": Decimal("8500.00"),
        "active_campaigns": 5
    }
