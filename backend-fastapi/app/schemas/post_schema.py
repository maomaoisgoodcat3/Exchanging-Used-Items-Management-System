import logging
from typing import Optional, List, Dict, Tuple
from datetime import datetime
from enum import Enum


logger = logging.getLogger(__name__)


class PostStatus(str, Enum):
    """Post status enumeration."""

    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    SOLD = "Sold"
    CLOSED = "Closed"


class PostCategory(str, Enum):
    """Post category enumeration."""

    SELLING = "Selling"
    TRADING = "Trading"
    DONATING = "Donating"


class ApprovalStatus(str, Enum):
    """Approval status enumeration."""

    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    RESENDING = "Resending"


class PostService:
    """
    Service for managing post operations including:
    - Post creation and modification
    - Post approval workflow
    - Post status transitions
    - Product and image management
    """

    @staticmethod
    def validate_post_category(category: str) -> bool:
        """
        Validate post category.

        Args:
            category: Post category

        Returns:
            True if valid category, False otherwise
        """
        return category in [c.value for c in PostCategory]

    @staticmethod
    def validate_post_for_campaign(post_category: str, campaign_id: Optional[int]) -> bool:
        """
        Validate if post can be associated with campaign.

        Args:
            post_category: Post category
            campaign_id: Campaign ID

        Returns:
            True if valid association, False otherwise
        """
        if post_category == PostCategory.DONATING.value:
            return campaign_id is not None
        return True

    @staticmethod
    def can_edit_post(current_status: str) -> bool:
        """
        Check if post can be edited based on current status.

        Args:
            current_status: Current post status

        Returns:
            True if post can be edited, False otherwise
        """
        editable_statuses = [PostStatus.PENDING.value, PostStatus.REJECTED.value]
        return current_status in editable_statuses

    @staticmethod
    def calculate_new_status_after_edit(current_status: str) -> str:
        """
        Calculate new status after post edit.

        Args:
            current_status: Current post status

        Returns:
            New status after edit
        """
        if current_status == PostStatus.PENDING.value:
            return PostStatus.PENDING.value
        elif current_status == PostStatus.REJECTED.value:
            return ApprovalStatus.RESENDING.value
        else:
            return current_status

    @staticmethod
    def validate_product_data(post_category: str, products: List[Dict]) -> bool:
        """
        Validate product data based on post category.

        Args:
            post_category: Post category
            products: List of product data

        Returns:
            True if all products are valid, False otherwise
        """
        if not products:
            return False

        for product in products:
            if not isinstance(product, dict):
                return False

            required_fields = ["product_name", "product_category_id", "product_quantity"]
            if not all(field in product for field in required_fields):
                return False

            if post_category == PostCategory.SELLING.value:
                if "product_price" not in product or product["product_price"] <= 0:
                    return False

            if product["product_quantity"] <= 0:
                return False

        return True

    @staticmethod
    def validate_images(images: Optional[List[Dict]]) -> bool:
        """
        Validate image data.

        Args:
            images: List of image data

        Returns:
            True if all images are valid, False otherwise
        """
        if images is None:
            return True

        max_images = 10
        if len(images) > max_images:
            return False

        for image in images:
            if not isinstance(image, dict):
                return False
            if "image_url" not in image or not image["image_url"]:
                return False

        return True

    @staticmethod
    def handle_approval_action(current_status: str, action: str, reject_reason: Optional[str] = None) -> Tuple[Optional[str], bool, Optional[str]]:
        """
        Handle approval action and determine new status.

        Args:
            current_status: Current approval status
            action: Action to perform (approve, reject, resend)
            reject_reason: Reason for rejection

        Returns:
            Tuple of (new_status, is_valid, error_message)
        """
        valid_actions = ["approve", "reject", "resend"]
        if action not in valid_actions:
            return None, False, f"Invalid action. Must be one of {valid_actions}"

        if action == "approve":
            return ApprovalStatus.APPROVED.value, True, None
        elif action == "reject":
            if not reject_reason:
                return None, False, "Reject reason is required for rejection"
            return ApprovalStatus.REJECTED.value, True, None
        elif action == "resend":
            return ApprovalStatus.RESENDING.value, True, None

        return None, False, f"Invalid action. Must be one of {valid_actions}"

    @staticmethod
    def can_mark_as_sold(current_status: str) -> bool:
        """
        Check if post can be marked as sold.

        Args:
            current_status: Current post status

        Returns:
            True if post can be marked as sold, False otherwise
        """
        return current_status == PostStatus.APPROVED.value

    @staticmethod
    def can_close_post(current_status: str) -> bool:
        """
        Check if post can be closed.

        Args:
            current_status: Current post status

        Returns:
            True if post can be closed, False otherwise
        """
        non_closeable_statuses = [PostStatus.SOLD.value, PostStatus.CLOSED.value]
        return current_status not in non_closeable_statuses

    @staticmethod
    def filter_posts_for_user(posts: List[Dict], role: str, include_approval_status: bool = False) -> List[Dict]:
        """
        Filter posts based on user role and visibility rules.

        Args:
            posts: List of posts
            role: User role (Member or Admin)
            include_approval_status: Whether to include approval status fields

        Returns:
            Filtered list of posts
        """
        filtered_posts = []

        for post in posts:
            if role == "Admin":
                filtered_posts.append(post)
            else:
                if post.get("status") in [PostStatus.APPROVED.value]:
                    post_copy = post.copy()
                    if not include_approval_status:
                        post_copy.pop("reviewed_by", None)
                        post_copy.pop("reviewed_at", None)
                        post_copy.pop("approval_status", None)
                    filtered_posts.append(post_copy)

        return filtered_posts

    @staticmethod
    def apply_post_search_filters(posts: List[Dict], search_query: str, filters: Dict) -> List[Dict]:
        """
        Apply search and filter logic to posts.

        Args:
            posts: List of posts
            search_query: Search query string
            filters: Dictionary of filter criteria

        Returns:
            Filtered list of posts
        """
        filtered = posts

        if search_query:
            query_lower = search_query.lower()
            filtered = [
                p
                for p in filtered
                if query_lower in p.get("title", "").lower()
                or query_lower in p.get("post_id", "")
                or query_lower in p.get("seller_email", "").lower()
            ]

        if filters.get("post_category"):
            filtered = [p for p in filtered if p.get("post_category") == filters["post_category"]]

        if filters.get("status"):
            filtered = [p for p in filtered if p.get("status") == filters["status"]]

        if filters.get("campaign_id"):
            filtered = [p for p in filtered if p.get("campaign_id") == filters["campaign_id"]]

        sort_by = filters.get("sort_by", "created_at")
        sort_order = filters.get("sort_order", "desc")

        reverse = sort_order == "desc"
        filtered = sorted(
            filtered,
            key=lambda x: x.get(sort_by, ""),
            reverse=reverse,
        )

        return filtered

    @staticmethod
    def validate_post_for_transaction(post: Dict, post_category: str, transaction_type: str) -> tuple:
        """
        Validate if post is eligible for transaction type.

        Args:
            post: Post data
            post_category: Post category
            transaction_type: Type of transaction (buy, trade, donate)

        Returns:
            Tuple of (is_valid, error_message)
        """
        if post_category == PostCategory.SELLING.value and transaction_type != "buy":
            return False, "Only buying transactions allowed for Selling posts"

        if post_category == PostCategory.TRADING.value and transaction_type != "trade":
            return False, "Only trading transactions allowed for Trading posts"

        if post_category == PostCategory.DONATING.value and transaction_type != "donate":
            return False, "Only donation transactions allowed for Donating posts"

        if post.get("status") != PostStatus.APPROVED.value:
            return False, "Post is not approved for transactions"

        return True, None

    @staticmethod
    def calculate_quantity_available(product_quantity: int, already_sold: int) -> int:
        """
        Calculate remaining quantity available for purchase.

        Args:
            product_quantity: Total quantity
            already_sold: Already sold quantity

        Returns:
            Remaining available quantity
        """
        return max(0, product_quantity - already_sold)
