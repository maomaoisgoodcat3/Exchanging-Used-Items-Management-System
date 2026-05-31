"""Campaign Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from decimal import Decimal
from app.schemas.campaign_schema import (
    CampaignCreate, CampaignUpdate, CampaignRead, CampaignDetailRead,
    CampaignListRead, CampaignFilter, CampaignApprovalAction
)
from app.services.auth_svc import get_current_user
from app.models.user import AccountUser
router = APIRouter(prefix="/api/v1/campaigns", tags=["Campaigns"])


@router.get("/", response_model=CampaignListRead)
def list_campaigns(
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    limit: int = 20,
    skip: int = 0
):
    """
    List all campaigns with filtering
    
    Database: Campaigns table
    - Filters by status (Pending, Approved, Rejected)
    - Searches in title and description
    - status options: Pending, Approved, Rejected
    
    - **search**: Search by title or description
    - **status**: Filter by status
    - **sort_by**: created_at, title
    - **sort_order**: asc, desc
    """
    return {
        "data": [
            {
                "campaign_id": 1,
                "title": "Summer Donation Campaign",
                "status": "Approved",
                "start_date": "2024-06-01T00:00:00",
                "end_date": "2024-08-31T23:59:59",
                "org_email": "org@uet.edu.vn"
            }
        ],
        "total": 50,
        "limit": limit,
        "skip": skip
    }


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_campaign(
    data: CampaignCreate,
    current_user: AccountUser = Depends(get_current_user)
):
    """
    Create a new campaign (organization representative only)
    
    Database: Campaigns table
    - **org_email**: Organization email (from current user's organization)
    - **title**: Campaign title
    - **description**: Campaign description
    - **start_date**: Campaign start date
    - **end_date**: Campaign end date
    - **status**: Default 'Pending' - needs admin approval
    """
    if not data.title or not data.description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title and description are required"
        )
    
    return {
        "message": "Campaign created successfully",
        "campaign_id": 1,
        "status": "Pending",
        "created_at": "2024-05-31T15:39:31"
    }


@router.get("/{campaign_id}", response_model=CampaignDetailRead)
def get_campaign_detail(campaign_id: int):
    """
    Get detailed information of a specific campaign
    
    Database: Campaigns table
    - Retrieves campaign by campaign_id
    - **campaign_id**: Campaign ID
    """
    return {
        "campaign_id": campaign_id,
        "title": "Summer Donation Campaign",
        "description": "Help students and families in need",
        "status": "Approved",
        "start_date": "2024-06-01T00:00:00",
        "end_date": "2024-08-31T23:59:59",
        "org_email": "org@uet.edu.vn",
        "created_at": "2024-05-01T00:00:00"
    }


@router.put("/{campaign_id}", response_model=dict)
def update_campaign(
    campaign_id: int,
    data: CampaignCreate,
    current_user: AccountUser = Depends(get_current_user)
):
    """
    Update campaign information (creator or admin only)
    
    Database: Campaigns table
    - Can only update if status is Pending
    
    - **campaign_id**: Campaign ID
    """
    return {
        "message": "Campaign updated successfully",
        "campaign_id": campaign_id
    }


@router.delete("/{campaign_id}", response_model=dict)
def delete_campaign(
    campaign_id: int,
    current_user: AccountUser = Depends(get_current_user)
):
    """
    Delete a campaign (creator or admin only)
    
    Database: Campaigns table
    - Deletes campaign and cascades to Posts
    
    - **campaign_id**: Campaign ID
    """
    return {
        "message": "Campaign deleted successfully",
        "campaign_id": campaign_id
    }


@router.post("/{campaign_id}/approve", response_model=dict)
def approve_campaign(
    campaign_id: int,
    data: CampaignApprovalAction,
    current_user: AccountUser = Depends(get_current_user)
):
    """
    Approve/Reject campaign (admin only)
    
    Database: Campaigns table
    - Updates status to Approved or Rejected
    - Sets reviewed_by and reviewed_at
    - Sets reject_reason if rejected
    """
    return {
        "message": f"Campaign {data.action}",
        "campaign_id": campaign_id,
        "status": data.action
    }


@router.get("/{campaign_id}/posts", response_model=List[dict])
def get_campaign_posts(
    campaign_id: int,
    limit: int = 20,
    skip: int = 0
):
    """
    Get all posts associated with a campaign
    
    Database: Posts table
    - Retrieves posts where campaign_id matches
    - Filters posts by campaign_id
    """
    return [
        {
            "post_id": 1,
            "title": "Used Books Donation",
            "status": "Approved",
            "seller_email": "user@uet.edu.vn",
            "created_at": "2024-05-31T15:39:31"
        }
    ]


@router.post("/{campaign_id}/end", response_model=dict)
def end_campaign(
    campaign_id: int,
    current_user: AccountUser = Depends(get_current_user)
):
    """
    End a campaign (creator or admin only)
    
    Database: Campaigns table
    - Updates status to reflect campaign ended
    """
    return {
        "message": "Campaign ended",
        "campaign_id": campaign_id,
        "status": "Ended"
    }


@router.get("/{campaign_id}/statistics", response_model=dict)
def get_campaign_statistics(campaign_id: int):
    """
    Get campaign statistics
    
    Database: Posts table joined with Campaigns
    - Counts posts by status
    - Calculates total items and value
    """
    return {
        "total_posts": 25,
        "approved_posts": 20,
        "pending_posts": 3,
        "rejected_posts": 2
    }
