import logging
from typing import Dict, Optional, Tuple
from decimal import Decimal
from enum import Enum


logger = logging.getLogger(__name__)


class PaymentMethod(str, Enum):
    """Payment method enumeration."""

    COD = "COD"  # Cash on Delivery
    QR = "QR"  # Bank transfer with QR


class PaymentStatus(str, Enum):
    """Payment status enumeration."""

    PENDING = "Pending"
    DEPOSITED = "Deposited"
    SUCCESSFUL = "Successful"


class OrderStatus(str, Enum):
    """Order status enumeration."""

    PENDING = "Pending"
    READY_FOR_PICKUP = "Ready for pickup"
    SUCCESSFUL = "Successful"


class PaymentService:
    """
    Service for managing payment operations including:
    - Service fee calculation
    - Payment method handling
    - Transaction amount calculation
    - Payment validation
    """

    def __init__(self, default_service_fee_percentage: Decimal = Decimal("5.0")):
        """
        Initialize payment service.

        Args:
            default_service_fee_percentage: Default service fee percentage
        """
        self.default_service_fee_percentage = default_service_fee_percentage

    def calculate_service_fee(
        self,
        total_amount: Decimal,
        service_fee_setting: Optional[Decimal] = None,
        fee_type: str = "percentage",
    ) -> Decimal:
        """
        Calculate service fee for a transaction.

        Args:
            total_amount: Total transaction amount
            service_fee_setting: Service fee setting from Settings table (percentage or fixed amount)
            fee_type: Type of fee ('percentage' or 'fixed')

        Returns:
            Calculated service fee
        """
        if service_fee_setting is None:
            service_fee_setting = self.default_service_fee_percentage

        if fee_type == "percentage":
            return (total_amount * service_fee_setting) / Decimal("100")
        elif fee_type == "fixed":
            return service_fee_setting
        else:
            logger.warning(f"Unknown fee type: {fee_type}. Using percentage.")
            return (total_amount * service_fee_setting) / Decimal("100")

    def calculate_seller_payout(self, total_amount: Decimal, service_fee: Decimal) -> Decimal:
        """
        Calculate seller payout after service fee.

        Args:
            total_amount: Total transaction amount
            service_fee: Service fee

        Returns:
            Seller payout amount
        """
        payout = total_amount - service_fee
        return max(Decimal("0"), payout)

    def validate_payment_amount(self, amount: Decimal, min_amount: Decimal = Decimal("1000")) -> Tuple[bool, Optional[str]]:
        """
        Validate if payment amount is acceptable.

        Args:
            amount: Payment amount
            min_amount: Minimum acceptable amount

        Returns:
            Tuple of (is_valid, error_message)
        """
        if amount <= Decimal("0"):
            return False, "Payment amount must be greater than 0"

        if amount < min_amount:
            return False, f"Payment amount must be at least {min_amount:,.0f} VND"

        return True, None

    def calculate_transaction_total(
        self,
        product_price: Decimal,
        quantity: int,
        service_fee_percentage: Optional[Decimal] = None,
    ) -> Dict[str, Decimal]:
        """
        Calculate transaction totals including service fee.

        Args:
            product_price: Unit price of product
            quantity: Quantity purchased
            service_fee_percentage: Service fee percentage

        Returns:
            Dictionary with subtotal, service_fee, and total
        """
        if service_fee_percentage is None:
            service_fee_percentage = self.default_service_fee_percentage

        subtotal = product_price * Decimal(str(quantity))
        service_fee = self.calculate_service_fee(subtotal, service_fee_percentage, fee_type="percentage")
        total = subtotal + service_fee

        return {
            "subtotal": subtotal,
            "service_fee": service_fee,
            "total": total,
            "seller_payout": self.calculate_seller_payout(subtotal, service_fee),
        }

    def handle_cod_payment(self, transaction_id: int, buyer_email: str, seller_email: str, amount: Decimal) -> Dict:
        """
        Handle Cash on Delivery payment.

        Args:
            transaction_id: Transaction ID
            buyer_email: Buyer email
            seller_email: Seller email
            amount: Payment amount

        Returns:
            Payment confirmation data
        """
        return {
            "transaction_id": transaction_id,
            "payment_method": PaymentMethod.COD.value,
            "status": PaymentStatus.PENDING.value,
            "amount": amount,
            "buyer_email": buyer_email,
            "seller_email": seller_email,
            "note": "Payment will be collected when item is delivered",
        }

    def handle_qr_payment(self, transaction_id: int, buyer_email: str, seller_email: str, amount: Decimal) -> Dict:
        """
        Handle QR code bank transfer payment.

        Args:
            transaction_id: Transaction ID
            buyer_email: Buyer email
            seller_email: Seller email
            amount: Payment amount

        Returns:
            Payment confirmation data with QR code
        """
        return {
            "transaction_id": transaction_id,
            "payment_method": PaymentMethod.QR.value,
            "status": PaymentStatus.PENDING.value,
            "amount": amount,
            "buyer_email": buyer_email,
            "seller_email": seller_email,
            "deposit_account": "School Fund Account",
            "note": "Amount will be held by school until item is confirmed received",
        }

    def validate_refund_eligibility(
        self,
        order_status: str,
        transaction_status: str,
        days_since_purchase: int,
        return_policy_days: int = 7,
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate if transaction is eligible for refund/return.

        Args:
            order_status: Current order status
            transaction_status: Current transaction status
            days_since_purchase: Days elapsed since purchase
            return_policy_days: Return policy days

        Returns:
            Tuple of (is_eligible, reason)
        """
        if order_status != OrderStatus.SUCCESSFUL.value:
            return False, "Order has not been successfully completed"

        if transaction_status not in [PaymentStatus.SUCCESSFUL.value, PaymentStatus.DEPOSITED.value]:
            return False, "Payment has not been completed"

        if days_since_purchase > return_policy_days:
            return False, f"Return period ({return_policy_days} days) has expired"

        return True, None

    def calculate_refund_amount(
        self,
        transaction_total: Decimal,
        service_fee: Decimal,
        refund_reason: str,
    ) -> Decimal:
        """
        Calculate refund amount based on refund reason.

        Args:
            transaction_total: Original transaction total
            service_fee: Original service fee
            refund_reason: Reason for refund

        Returns:
            Refund amount
        """
        if refund_reason.lower() in ["damaged", "defective", "not as described"]:
            return transaction_total - service_fee
        elif refund_reason.lower() == "buyer_request":
            return transaction_total - service_fee
        elif refund_reason.lower() == "seller_unable":
            return transaction_total
        else:
            return transaction_total - service_fee

    def update_service_fee_setting(
        self,
        setting_value: Decimal,
        fee_type: str = "percentage",
        min_value: Decimal = Decimal("0"),
        max_value: Optional[Decimal] = None,
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate and update service fee setting.

        Args:
            setting_value: New setting value
            fee_type: Type of fee
            min_value: Minimum allowed value
            max_value: Maximum allowed value

        Returns:
            Tuple of (is_valid, error_message)
        """
        if setting_value < min_value:
            return False, f"Setting value must be at least {min_value}"

        if max_value and setting_value > max_value:
            return False, f"Setting value cannot exceed {max_value}"

        if fee_type == "percentage" and (setting_value < Decimal("0") or setting_value > Decimal("100")):
            return False, "Percentage must be between 0 and 100"

        return True, None

    def calculate_bulk_transaction_fees(self, transactions: list[Dict]) -> Dict:
        """
        Calculate fees for multiple transactions.

        Args:
            transactions: List of transaction data

        Returns:
            Summary of fees and totals
        """
        total_revenue = Decimal("0")
        total_service_fees = Decimal("0")
        total_seller_payouts = Decimal("0")

        for transaction in transactions:
            amount = transaction.get("amount", Decimal("0"))
            total_revenue += amount

            fees = self.calculate_transaction_total(
                amount,
                1,
                transaction.get("service_fee_percentage", self.default_service_fee_percentage),
            )
            total_service_fees += fees["service_fee"]
            total_seller_payouts += fees["seller_payout"]

        return {
            "transaction_count": len(transactions),
            "total_revenue": total_revenue,
            "total_service_fees": total_service_fees,
            "total_seller_payouts": total_seller_payouts,
            "average_service_fee": (
                total_service_fees / Decimal(len(transactions)) if transactions else Decimal("0")
            ),
        }

    def format_currency(self, amount: Decimal, currency: str = "VND") -> str:
        """
        Format amount as currency string.

        Args:
            amount: Amount to format
            currency: Currency code

        Returns:
            Formatted currency string
        """
        if currency == "VND":
            return f"{amount:,.0f} ₫"
        else:
            return f"{amount:,.2f} {currency}"
