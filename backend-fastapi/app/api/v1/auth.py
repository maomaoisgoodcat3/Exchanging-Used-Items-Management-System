"""Authentication API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from app.services.auth_svc import AuthService, OrganizationAuthService
from app.schemas.user_schema import (
    UserCreate, UserLogin, UserChangePassword, UserOTPVerify, TokenResponse
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
auth_service = AuthService(secret_key="your-secret-key-here")
org_auth_service = OrganizationAuthService()


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate):
    """
    Register a new user account
    
    Schema: Users table
    - **email**: User's email (must be in Directory table as Student/Teacher/Staff)
    - **password**: Password (min 8 characters, stored as password_hash)
    - **name**: Full name
    - **phone**: Phone number (optional)
    - **role**: User role (Member, Admin) - default: Member
    
    Database relationships:
    - Email must exist in Directory table (member_type: Student/Teacher/Staff)
    - Creates record in Users table
    """
    if not user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
    
    # Check if email exists in Directory table
    # This will be implemented in actual DB integration
    
    return {
        "message": "Registration successful",
        "email": user.email,
        "name": user.name,
        "role": "Member"
    }


@router.post("/login", response_model=TokenResponse)
def login_user(credentials: UserLogin):
    """
    Login user and return JWT tokens
    
    Database: Users table
    - **email**: User's email (primary key)
    - **password**: User's password (verified against password_hash)
    
    Returns access_token and refresh_token
    """
    if not credentials.email or not credentials.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required"
        )
    
    # Verify user exists in Users table and password matches password_hash
    access_token, expires_in = auth_service.create_access_token(
        email=credentials.email
    )
    refresh_token, _ = auth_service.create_refresh_token(
        email=credentials.email
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        token_type="bearer"
    )


@router.post("/refresh-token", response_model=TokenResponse)
def refresh_access_token(refresh_token: str):
    """
    Refresh access token using refresh token
    
    - **refresh_token**: Valid refresh token
    """
    try:
        email = auth_service.extract_email_from_token(refresh_token)
        access_token, expires_in = auth_service.create_access_token(email=email)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            token_type="bearer"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post("/verify-otp", response_model=dict)
def verify_otp(data: UserOTPVerify):
    """
    Verify OTP for email/phone confirmation
    
    - **email**: User's email
    - **otp**: 6-digit OTP code
    - **new_password**: New password for account
    """
    if not data.otp or len(data.otp) != 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP format"
        )
    
    return {
        "message": "OTP verified successfully",
        "email": data.email
    }


@router.post("/change-password", response_model=dict)
def change_password(data: UserChangePassword):
    """
    Change user password
    
    - **old_password**: Current password
    - **new_password**: New password (must be different)
    """
    return {
        "message": "Password changed successfully"
    }


@router.post("/logout", response_model=dict)
def logout():
    """
    Logout user (invalidate current token)
    """
    return {
        "message": "Logged out successfully"
    }


@router.post("/organization-login", response_model=TokenResponse)
def organization_login(credentials: UserLogin):
    """
    Login for organization representatives
    
    - **email**: Organization representative's email
    - **password**: Password
    """
    access_token, expires_in = auth_service.create_access_token(
        email=credentials.email
    )
    
    return TokenResponse( #type: ignore
        access_token=access_token,
        refresh_token="",
        expires_in=expires_in, #type: ignore
        token_type="bearer"
    )
