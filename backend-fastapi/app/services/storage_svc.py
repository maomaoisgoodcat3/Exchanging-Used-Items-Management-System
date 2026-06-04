# app/services/storage_svc.py
"""
Storage Service - Handles inventory management and product quantity operations.

Provides methods for:
- Adding products to user storage
- Removing products from storage
- Checking availability
- Transferring products between users
"""

import logging
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.posts import Storage

logger = logging.getLogger(__name__)


class StorageService:
    """
    Service for managing user storage (inventory).
    
    Handles product quantity operations with validation.
    """

    @staticmethod
    def get_user_product(
        db: Session,
        user_email: str,
        product_id: int
    ) -> Optional[Storage]:
        """
        Get a specific product from user's storage.

        Args:
            db: Database session
            user_email: User's email
            product_id: Product ID

        Returns:
            Storage object if found, None otherwise
        """
        try:
            return db.query(Storage).filter(
                Storage.email == user_email,
                Storage.product_id == product_id
            ).first()
        except Exception as e:
            logger.error(f"Error fetching product: {e}")
            return None

    @staticmethod
    def get_user_products(
        db: Session,
        user_email: str,
        skip: int = 0,
        limit: int = 100
    ) -> list:
        """
        Get all products from user's storage.

        Args:
            db: Database session
            user_email: User's email
            skip: Skip this many results
            limit: Return at most this many results

        Returns:
            List of Storage objects
        """
        try:
            return db.query(Storage).filter(
                Storage.email == user_email
            ).offset(skip).limit(limit).all()
        except Exception as e:
            logger.error(f"Error fetching user products: {e}")
            return []

    @staticmethod
    def check_availability(
        db: Session,
        user_email: str,
        product_id: int,
        required_quantity: int
    ) -> Tuple[bool, Optional[int]]:
        """
        Check if user has sufficient quantity of a product.

        Args:
            db: Database session
            user_email: User's email
            product_id: Product ID
            required_quantity: Quantity needed

        Returns:
            Tuple of (has_sufficient_quantity, available_quantity)
        """
        product = StorageService.get_user_product(db, user_email, product_id)
        
        if not product:
            return False, 0
        
        available = product.product_quantity
        return available >= required_quantity, available

    @staticmethod
    def deduct_product(
        db: Session,
        user_email: str,
        product_id: int,
        quantity: int
    ) -> Tuple[bool, Optional[str]]:
        """
        Deduct product quantity from user's storage (for completed transactions).

        Args:
            db: Database session
            user_email: User's email
            product_id: Product ID
            quantity: Quantity to deduct

        Returns:
            Tuple of (success, error_message)
        """
        try:
            product = StorageService.get_user_product(db, user_email, product_id)
            
            if not product:
                return False, f"Product {product_id} not found in storage"
            
            if product.product_quantity < quantity:
                return False, f"Insufficient quantity. Available: {product.product_quantity}, Required: {quantity}"
            
            product.product_quantity -= quantity
            
            # If quantity becomes 0, optionally delete the product
            if product.product_quantity == 0:
                db.delete(product)
                logger.info(f"Deleted product {product_id} from {user_email} storage (quantity reached 0)")
            
            db.commit()
            logger.info(f"Deducted {quantity} units of product {product_id} from {user_email}")
            return True, None
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error deducting product: {e}")
            return False, f"Error updating storage: {str(e)}"

    @staticmethod
    def add_product(
        db: Session,
        user_email: str,
        product_id: int,
        product_name: str,
        product_category_id: int,
        product_location_id: int,
        quantity: int = 1,
        product_price: float = 0.0
    ) -> Tuple[bool, Optional[str]]:
        """
        Add product to user's storage or increment existing product.

        Args:
            db: Database session
            user_email: User's email
            product_id: Product ID (if 0, auto-generate)
            product_name: Product name
            product_category_id: Category ID
            product_location_id: Location ID
            quantity: Quantity to add
            product_price: Product price (optional)

        Returns:
            Tuple of (success, error_message)
        """
        try:
            # Check if product already exists for user
            existing_product = db.query(Storage).filter(
                Storage.email == user_email,
                Storage.product_id == product_id
            ).first()
            
            if existing_product:
                # Increment quantity
                existing_product.product_quantity += quantity
                logger.info(f"Incremented product {product_id} for {user_email} by {quantity}")
            else:
                # Create new product
                new_product = Storage(
                    email=user_email,
                    product_id=product_id if product_id > 0 else None,
                    product_name=product_name,
                    product_category_id=product_category_id,
                    product_quantity=quantity,
                    product_price=product_price,
                    product_location_id=product_location_id
                )
                db.add(new_product)
                logger.info(f"Added new product {product_name} to {user_email} storage (qty: {quantity})")
            
            db.commit()
            return True, None
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error adding product: {e}")
            return False, f"Error adding product: {str(e)}"

    @staticmethod
    def transfer_product(
        db: Session,
        from_email: str,
        to_email: str,
        product_id: int,
        quantity: int
    ) -> Tuple[bool, Optional[str]]:
        """
        Transfer product from one user to another (atomic operation).

        Args:
            db: Database session
            from_email: Sender's email
            to_email: Recipient's email
            product_id: Product ID
            quantity: Quantity to transfer

        Returns:
            Tuple of (success, error_message)
        """
        try:
            # Check if sender has sufficient quantity
            has_sufficient, available = StorageService.check_availability(
                db, from_email, product_id, quantity
            )
            
            if not has_sufficient:
                return False, f"Insufficient quantity from {from_email}. Available: {available}, Required: {quantity}"
            
            # Get product details for recipient
            sender_product = StorageService.get_user_product(db, from_email, product_id)
            
            # Deduct from sender
            success, error = StorageService.deduct_product(db, from_email, product_id, quantity)
            if not success:
                return False, f"Failed to deduct from sender: {error}"
            
            # Add to recipient
            success, error = StorageService.add_product(
                db=db,
                user_email=to_email,
                product_id=product_id,
                product_name=sender_product.product_name,
                product_category_id=sender_product.product_category_id,
                product_location_id=sender_product.product_location_id,
                quantity=quantity,
                product_price=float(sender_product.product_price) if sender_product.product_price else 0.0
            )
            
            if not success:
                db.rollback()
                return False, f"Failed to add to recipient: {error}"
            
            logger.info(f"Transferred {quantity} units of product {product_id} from {from_email} to {to_email}")
            return True, None
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error transferring product: {e}")
            return False, f"Error transferring product: {str(e)}"

    @staticmethod
    def get_storage_summary(
        db: Session,
        user_email: str
    ) -> dict:
        """
        Get summary of user's storage.

        Args:
            db: Database session
            user_email: User's email

        Returns:
            Dictionary with storage summary
        """
        try:
            products = StorageService.get_user_products(db, user_email, limit=1000)
            
            total_items = sum(p.product_quantity for p in products)
            total_value = sum(
                float(p.product_price or 0) * p.product_quantity 
                for p in products
            )
            
            return {
                "user_email": user_email,
                "total_items": total_items,
                "total_value": total_value,
                "product_count": len(products),
                "products": [
                    {
                        "product_id": p.product_id,
                        "product_name": p.product_name,
                        "quantity": p.product_quantity,
                        "price": float(p.product_price or 0)
                    }
                    for p in products
                ]
            }
        except Exception as e:
            logger.error(f"Error getting storage summary: {e}")
            return {
                "user_email": user_email,
                "error": str(e)
            }

    @staticmethod
    def validate_offered_products(
        db: Session,
        user_email: str,
        offered_products: list
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate that user has all offered products with sufficient quantities.

        Args:
            db: Database session
            user_email: User's email
            offered_products: List of {product_id, quantity}

        Returns:
            Tuple of (valid, error_message)
        """
        try:
            for item in offered_products:
                product_id = item.get("product_id")
                quantity = item.get("quantity")
                
                if not product_id or not quantity:
                    return False, "Invalid product format in offered products"
                
                has_sufficient, available = StorageService.check_availability(
                    db, user_email, product_id, quantity
                )
                
                if not has_sufficient:
                    return False, f"Insufficient quantity for product {product_id}. Available: {available}, Offering: {quantity}"
            
            return True, None
            
        except Exception as e:
            logger.error(f"Error validating offered products: {e}")
            return False, f"Validation error: {str(e)}"
