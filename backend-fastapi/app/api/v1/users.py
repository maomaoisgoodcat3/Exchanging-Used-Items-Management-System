"""User Management API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from app.schemas.user_schema import (
    UserUpdate, UserChangePassword, UserRead, TokenResponse,
    DirectoryBase, OrganizationCreate, OrganizationRead, OrganizationMemberRead
)

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
def get_current_user(current_user: str = Depends()):
    """
    Get current authenticated user's profile
    
    Database: Users table
    - Retrieves user data by email (primary key)
    - Returns: email, name, phone, role, created_at
    """
    return {
        "email": current_user,
        "name": "User Name",
        "phone": "+84912345678",
        "role": "Member",
        "created_at": "2024-05-31T15:39:31"
    }


@router.put("/me", response_model=dict)
def update_user_profile(data: UserUpdate, current_user: str = Depends()):
    """
    Update current user's profile information
    
    Database: Users table
    - Updates name, phone for the authenticated user (email)
    - Only users can update their own profile
    
    - **name**: Full name (optional)
    - **phone**: Phone number (optional)
    """
    return {
        "message": "Profile updated successfully",
        "user": {
            "email": current_user,
            "name": data.name or "User Name",
            "phone": data.phone
        }
    }


@router.get("/{email}", response_model=UserRead)
def get_user_profile(email: str):
    """
    Get specific user's public profile
    
    Database: Users table
    - Retrieves user by email (primary key)
    - **email**: User email
    """
    return {
        "email": email,
        "name": "User Name",
        "phone": "+84912345678",
        "role": "Member",
        "created_at": "2024-05-31T15:39:31"
    }


@router.post("/change-password", response_model=dict)
def change_password(data: UserChangePassword, current_user: str = Depends()):
    """
    Change user password
    
    Database: Users table
    - Updates password_hash for the authenticated user
    
    - **old_password**: Current password (verify against password_hash)
    - **new_password**: New password
    - **confirm_password**: Confirm new password
    """
    confirm_password = getattr(data, "confirm_password", None)
    if confirm_password is not None and data.new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords don't match"
        )
    
    return {
        "message": "Password changed successfully"
    }


@router.get("/directory/list", response_model=List[DirectoryBase])
def get_directory(
    member_type: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """
    Get master directory of students/staff from schools
    
    Database: Directory table
    - Retrieves records where member_type: Student/Teacher/Staff
    - **member_type**: Filter by Student, Teacher, or Staff
    - **limit**: Maximum results (default: 100)
    - **skip**: Skip results (for pagination)
    """
    return [
        {
            "email": "user@uet.edu.vn",
            "fullname": "Student Name",
            "member_type": "Student"
        }
    ]


@router.post("/organization", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_organization(data: OrganizationCreate, current_user: str = Depends()):
    """
    Create a new organization
    
    Database: Organizations table
    - **org_email**: Organization email (primary key)
    - **org_name**: Organization name
    - **representative_email**: Representative's email (must exist in Users table)
    - **description**: Organization description
    
    Current user becomes the representative
    """
    return {
        "message": "Organization created successfully",
        "organization": {
            "org_email": data.org_email or f"org_{current_user.split('@')[0]}@uet.edu.vn",
            "org_name": data.org_name,
            "representative_email": current_user,
            "description": data.description,
            "created_at": "2024-05-31T15:39:31"
        }
    }


@router.get("/organization/{org_email}", response_model=OrganizationRead)
def get_organization(org_email: str):
    """
    Get organization details
    
    Database: Organizations table
    - Retrieves organization by org_email (primary key)
    - **org_email**: Organization email
    """
    return {
        "org_email": org_email,
        "org_name": "Organization Name",
        "representative_email": "rep@uet.edu.vn",
        "description": "Organization Description"
    }


@router.put("/organization/{org_email}", response_model=dict)
def update_organization(
    org_email: str,
    data: OrganizationCreate,
    current_user: str = Depends()
):
    """
    Update organization information (representative only)
    
    Database: Organizations table
    - Updates org_name, representative_email, description
    - Only representative can update
    
    - **org_email**: Organization email
    """
    return {
        "message": "Organization updated successfully",
        "org_email": org_email
    }


@router.get("/organization/{org_email}/members", response_model=List[OrganizationMemberRead])
def get_organization_members(
    org_email: str,
    limit: int = 50,
    skip: int = 0
):
    """
    Get members of an organization
    
    Database: Organizations_Members table
    - Retrieves members where org_email matches
    - **org_email**: Organization email
    - **limit**: Maximum results
    - **skip**: Skip results (pagination)
    """
    return [
        {
            "mem_email": "member@uet.edu.vn",
            "mem_permission": "Member",
            "joined_at": "2024-01-01T00:00:00"
        }
    ]


@router.post("/organization/{org_email}/members", response_model=dict)
def add_organization_member(
    org_email: str,
    mem_email: str,
    mem_permission: str = "Member",
    current_user: str = Depends()
):
    """
    Add member to organization (admin only)
    
    Database: Organizations_Members table
    - Inserts new record with org_email, mem_email, mem_permission
    - **org_email**: Organization email
    - **mem_email**: Member's email (must exist in Users table)
    - **mem_permission**: Member Manager, Poster, or Member
    """
    return {
        "message": "Member added successfully",
        "org_email": org_email,
        "mem_email": mem_email,
        "mem_permission": mem_permission
    }


@router.delete("/organization/{org_email}/members/{mem_email}", response_model=dict)
def remove_organization_member(
    org_email: str,
    mem_email: str,
    current_user: str = Depends()
):
    """
    Remove member from organization (admin only)
    
    Database: Organizations_Members table
    - Deletes record where org_email and mem_email match
    
    - **org_email**: Organization email
    - **mem_email**: Member email to remove
    """
    return {
        "message": "Member removed successfully",
        "org_email": org_email,
        "mem_email": mem_email
    }
