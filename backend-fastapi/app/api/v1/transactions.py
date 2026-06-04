"""Transaction & Payment API Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

from app.schemas.transaction_schema import (
    TransactionCreate, TransactionRead, TransactionFilter, TransactionStatusUpdate,
    PaymentInitiate, PaymentConfirm, CartItemCreate, CartRead, ReturnRequestCreate,
    SettingsCreate, SettingsRead, TransactionDetailRead
)
from app.services.auth_svc import get_current_user
from app.models.users import Users

router = APIRouter(prefix="/api/v1/transactions", tags=["Transactions & Payments"])

@router.get("/", response_model=List[TransactionRead])
def list_transactions(
    poster_status: Optional[str] = None,
    requester_status: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
    current_user: Users = Depends(get_current_user)
):
    """
    List transactions for current user
    
    Database: Transactions table
    - Retrieves transactions where requester_email matches current user
    - poster_status: Pending, Accepted, Denied, Ready for pickup, Successful
    - requester_status: Pending, Accepted, Denied, Deposited, Successful, Unsuccessful
    """
    return [
        {
            "transaction_id": 1,
            "post_id": 1,
            "requester_email": current_user.email,
            "service_fee": Decimal("25.00"),
            "poster_status": poster_status or "Pending",
            "requester_status": requester_status or "Pending",
            "transaction_date": datetime.utcnow()
        }
    ]


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_transaction(
    data: TransactionCreate,
    current_user: Users = Depends(get_current_user)
):
    """
    Create a new transaction (purchase/trade/donate)
    
    Database: Transactions & TransactionProducts table
    """
    return {
        "message": "Transaction created successfully",
        "transaction_id": 1,
        "post_id": data.post_id,
        "requester_email": current_user.email,
        "service_fee": Decimal("25.00"),
        "poster_status": "Pending",
        "requester_status": "Pending"
    }


@router.get("/{transaction_id}", response_model=TransactionDetailRead)
def get_transaction_detail(
    transaction_id: int,
    current_user: Users = Depends(get_current_user)
):
    """
    Get transaction details including list of products
    """
    return {
        "transaction_id": transaction_id,
        "post_id": 1,
        "requester_email": current_user.email,
        "service_fee": Decimal("25.00"),
        "poster_status": "Pending",
        "requester_status": "Pending",
        "transaction_date": datetime.utcnow(),
        "products": [
            {
                "product_id": 1,
                "quantity": 1,
                "product_source": "Poster"
            }
        ]
    }


@router.post("/{transaction_id}/status", response_model=dict)
def update_transaction_status(
    transaction_id: int,
    data: TransactionStatusUpdate,
    current_user: Users = Depends(get_current_user)
):
    """
    Update transaction status
    
    Database: Transactions table
    """
    return {
        "message": "Transaction status updated",
        "transaction_id": transaction_id,
        "poster_status": data.poster_status,
        "requester_status": data.requester_status
    }


@router.post("/payment/initiate", response_model=dict)
def initiate_payment(
    data: PaymentInitiate,
    current_user: Users = Depends(get_current_user)
):
    """
    Initiate payment for a transaction
    """
    return {
        "message": "Payment initiated",
        "transaction_id": data.transaction_id,
        "payment_id": 1
    }


@router.post("/payment/confirm", response_model=dict)
def confirm_payment(
    data: PaymentConfirm,
    current_user: Users = Depends(get_current_user)
):
    """
    Confirm payment completion
    """
    return {
        "message": "Payment confirmed",
        "transaction_id": data.transaction_id,
        "transaction_status": "Successful"
    }


@router.get("/statistics/summary", response_model=dict)
def get_transaction_statistics(current_user: Users = Depends(get_current_user)):
    """
    Get transaction statistics for current user
    """
    return {
        "total_transactions": 10,
        "pending": 2,
        "successful": 8,
        "total_spent": Decimal("1000.00")
    }


@router.get("/settings/system", response_model=SettingsRead)
def get_settings():
    """
    Get system settings
    """
    return {
        "setting_id": 1,
        "setting_name": "service_fee_percentage",
        "setting_value": Decimal("5.0"),
        "description": "System default fee",
        "updated_at": datetime.utcnow(),
        "updated_by": None
    }


@router.put("/settings/system", response_model=dict)
def update_settings(
    data: SettingsCreate,
    current_user: Users = Depends(get_current_user)
):
    """
    Update system settings (admin only)
    """
    return {
        "message": "Settings updated successfully",
        "updated_by": current_user.email
    }