# app/services/transaction_svc.py
"""
Transaction Service - Handles all transaction workflows.

Supports:
- Selling transactions (payment-based)
- Trading transactions (barter with approval)
- Donating transactions (with or without campaign)
"""

import logging
from typing import Optional, Tuple, Dict, List
from enum import Enum
from datetime import datetime
from sqlalchemy.orm import Session
from app.services.storage_svc import StorageService

logger = logging.getLogger(__name__)


# ========================================================================
# ENUMS (Khớp chính xác với cấu trúc Database mới)
# ========================================================================
class PosterStatus(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    DENIED = "Denied"
    READY_FOR_PICKUP = "Ready for pickup"
    SUCCESSFUL = "Successful"


class RequesterStatus(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    DENIED = "Denied"
    DEPOSITED = "Deposited"
    CLAIMED = "Claimed"
    SUCCESSFUL = "Successful"


class ProductSource(str, Enum):
    POSTER = "Poster"
    REQUESTER = "Requester"


class TransactionService:
    """
    Service for managing transactions across all types (Selling, Trading, Donating).
    """

    # ========================================================================
    # TRADING TRANSACTION METHODS
    # ========================================================================

    @staticmethod
    def create_trading_transaction(
        db: Session,
        post_id: int,
        seller_email: str,
        buyer_email: str,
        wanted_products: List[Dict],   # List of {"product_id": x, "quantity": y} lấy từ bài post
        offered_products: List[Dict],  # List of {"product_id": x, "quantity": y} đồ mang đi đổi
    ) -> Tuple[bool, Optional[Dict]]:
        """
        Tạo giao dịch trao đổi đồ mới (Chờ chủ bài đăng duyệt).
        """
        try:
            from app.models.transactions import Transactions, TransactionProducts

            # 1. Xác thực kho đồ đối ứng của người gửi lời mời đổi đồ (Requester)
            valid, error = StorageService.validate_offered_products(db, buyer_email, offered_products)
            if not valid:
                return False, {"error": error}

            # 2. Tạo bản ghi giao dịch tổng quan (Header)
            transaction = Transactions(
                post_id=post_id,
                requester_email=buyer_email,
                service_fee=0.00,  # Không thu phí đối với giao dịch đổi đồ
                Poster_status=PosterStatus.PENDING.value,
                Requester_status=RequesterStatus.PENDING.value
            )
            db.add(transaction)
            db.flush()  # Sinh tự động transaction_id để nạp vào bảng detail

            # 3. Thêm các sản phẩm muốn đổi từ bài post (Nguồn gốc: Poster)
            for item in wanted_products:
                wanted_item = TransactionProducts(
                    transaction_id=transaction.transaction_id,
                    product_id=item["product_id"],
                    quantity=item["quantity"],
                    product_source=ProductSource.POSTER.value
                )
                db.add(wanted_item)

            # 4. Thêm các sản phẩm đối ứng mang đi trao đổi (Nguồn gốc: Requester)
            for item in offered_products:
                offered_item = TransactionProducts(
                    transaction_id=transaction.transaction_id,
                    product_id=item["product_id"],
                    quantity=item["quantity"],
                    product_source=ProductSource.REQUESTER.value
                )
                db.add(offered_item)

            db.commit()
            logger.info(f"Created trading transaction {transaction.transaction_id} successfully.")

            return True, {
                "transaction_id": transaction.transaction_id,
                "Poster_status": transaction.Poster_status,
                "Requester_status": transaction.Requester_status,
                "seller_email": seller_email,
                "buyer_email": buyer_email
            }

        except Exception as e:
            db.rollback()
            logger.error(f"Error creating trading transaction: {e}")
            return False, {"error": str(e)}

    @staticmethod
    def accept_trade(
        db: Session,
        transaction_id: int,
        seller_email: str
    ) -> Tuple[bool, Optional[Dict]]:
        """
        Chủ bài đăng (Poster) chấp nhận giao dịch đổi đồ.
        Hệ thống tự động trừ kho sản phẩm của cả hai bên.
        """
        try:
            from app.models.transactions import Transactions, TransactionProducts
            from app.models.posts import Posts

            # Tìm kiếm đơn hàng hợp lệ
            transaction = db.query(Transactions).filter(
                Transactions.transaction_id == transaction_id,
                Transactions.Poster_status == PosterStatus.PENDING.value
            ).first()

            if not transaction:
                return False, {"error": "Transaction not found or not in pending state"}

            # Xác thực người bấm Accept có đúng là chủ bài đăng (Poster) không
            post = db.query(Posts).filter(Posts.post_id == transaction.post_id).first()
            if not post or post.seller_email != seller_email:
                return False, {"error": "Only the post owner can accept this trade"}

            # Lấy toàn bộ danh sách sản phẩm liên quan đến transaction này từ bảng Detail
            trade_items = db.query(TransactionProducts).filter(
                TransactionProducts.transaction_id == transaction_id
            ).all()

            # Duyệt danh sách để trừ kho tương ứng theo nguồn gốc sản phẩm
            for item in trade_items:
                if item.product_source == ProductSource.POSTER.value:
                    # Đồ của chủ post bán/đổi đi -> Trừ kho của Seller
                    success, error = StorageService.deduct_product(
                        db, seller_email, item.product_id, item.quantity
                    )
                else:
                    # Đồ của người gửi lời mời mang đến đổi -> Trừ kho của Người yêu cầu (Requester)
                    success, error = StorageService.deduct_product(
                        db, transaction.requester_email, item.product_id, item.quantity
                    )
                
                if not success:
                    db.rollback()
                    return False, {"error": f"Inventory deduction failed: {error}"}

            # Cập nhật đồng bộ trạng thái giao dịch thành công cho hai bên
            transaction.Poster_status = PosterStatus.SUCCESSFUL.value
            transaction.Requester_status = RequesterStatus.SUCCESSFUL.value
            db.commit()

            logger.info(f"Trade transaction {transaction_id} finalized and inventory updated.")
            return True, {
                "transaction_id": transaction_id,
                "Poster_status": transaction.Poster_status,
                "Requester_status": transaction.Requester_status,
                "message": "Trade accepted and items transferred successfully"
            }

        except Exception as e:
            db.rollback()
            logger.error(f"Error accepting trade: {e}")
            return False, {"error": str(e)}

    @staticmethod
    def deny_trade(
        db: Session,
        transaction_id: int,
        seller_email: str
    ) -> Tuple[bool, Optional[Dict]]:
        """
        Từ chối yêu cầu trao đổi đồ (Không ảnh hưởng đến tồn kho).
        """
        try:
            from app.models.transactions import Transactions
            from app.models.posts import Posts

            transaction = db.query(Transactions).filter(
                Transactions.transaction_id == transaction_id,
                Transactions.Poster_status == PosterStatus.PENDING.value
            ).first()

            if not transaction:
                return False, {"error": "Transaction not found or not pending"}

            post = db.query(Posts).filter(Posts.post_id == transaction.post_id).first()
            if not post or post.seller_email != seller_email:
                return False, {"error": "Only the post owner can deny this trade"}

            # Đồng bộ chuyển trạng thái của cả 2 bên về Denied
            transaction.Poster_status = PosterStatus.DENIED.value
            transaction.Requester_status = RequesterStatus.DENIED.value
            db.commit()

            return True, {
                "transaction_id": transaction_id,
                "Poster_status": transaction.Poster_status,
                "Requester_status": transaction.Requester_status,
                "message": "Trade offer rejected successfully"
            }

        except Exception as e:
            db.rollback()
            logger.error(f"Error denying trade: {e}")
            return False, {"error": str(e)}

    # ========================================================================
    # DONATION TRANSACTION METHODS
    # ========================================================================

    @staticmethod
    def create_donation_transaction(
        db: Session,
        post_id: int,
        products: List[Dict],  # List of {"product_id": x, "quantity": y}
        claimer_email: str,
        campaign_id: Optional[int] = None
    ) -> Tuple[bool, Optional[Dict]]:
        """
        Tạo yêu cầu quyên góp hoặc nhận đồ từ thiện.
        - Có campaign_id: Đơn ở dạng chờ Manager duyệt (Pending).
        - Không có campaign_id (Quyên góp tự do): Đơn thành công luôn và trừ kho ngay lập tức.
        """
        try:
            from app.models.transactions import Transactions, TransactionProducts
            from app.models.posts import Posts

            post = db.query(Posts).filter(Posts.post_id == post_id).first()
            if not post:
                return False, {"error": "Donation post not found"}

            donor_email = post.seller_email

            # 1. Khởi tạo bản ghi Header của giao dịch
            transaction = Transactions(
                post_id=post_id,
                requester_email=claimer_email,
                service_fee=0.00
            )

            # Phân luồng logic theo loại Quyên góp
            if campaign_id:
                # Luồng Chiến dịch tổ chức: Đơn cần qua khâu xét duyệt của Manager
                transaction.Poster_status = PosterStatus.PENDING.value
                transaction.Requester_status = RequesterStatus.PENDING.value
                db.add(transaction)
                db.flush()
                
                # Thêm danh sách sản phẩm (Đồ hiến tặng thuộc sở hữu của Poster)
                for item in products:
                    prod_detail = TransactionProducts(
                        transaction_id=transaction.transaction_id,
                        product_id=item["product_id"],
                        quantity=item["quantity"],
                        product_source=ProductSource.POSTER.value
                    )
                    db.add(prod_detail)
                db.commit()

                return True, {
                    "transaction_id": transaction.transaction_id,
                    "status": "Pending manager approval",
                    "campaign_id": campaign_id
                }
            else:
                # Luồng Công cộng/Tự do: Khách bấm nhận (Claimed) thành công trực tiếp luôn
                # Trừ kho của nhà hảo tâm (Donor/Poster) ngay lập tức
                for item in products:
                    success, error = StorageService.deduct_product(
                        db, donor_email, item["product_id"], item["quantity"]
                    )
                    if not success:
                        return False, {"error": f"Failed to deduct inventory from donor: {error}"}

                transaction.Poster_status = PosterStatus.SUCCESSFUL.value
                transaction.Requester_status = RequesterStatus.CLAIMED.value
                db.add(transaction)
                db.flush()

                for item in products:
                    prod_detail = TransactionProducts(
                        transaction_id=transaction.transaction_id,
                        product_id=item["product_id"],
                        quantity=item["quantity"],
                        product_source=ProductSource.POSTER.value
                    )
                    db.add(prod_detail)
                db.commit()

                return True, {
                    "transaction_id": transaction.transaction_id,
                    "Poster_status": transaction.Poster_status,
                    "Requester_status": transaction.Requester_status,
                    "message": "Donation claimed successfully"
                }

        except Exception as e:
            db.rollback()
            logger.error(f"Error creating donation transaction: {e}")
            return False, {"error": str(e)}

    @staticmethod
    def approve_donation(
        db: Session,
        transaction_id: int,
        approver_email: str
    ) -> Tuple[bool, Optional[Dict]]:
        """
        Manager của tổ chức chiến dịch bấm Duyệt nhận đơn hàng hiến tặng.
        Hệ thống tự động thực hiện trừ kho của người đi quyên góp.
        """
        try:
            from app.models.transactions import Transactions, TransactionProducts
            from app.models.posts import Posts

            transaction = db.query(Transactions).filter(
                Transactions.transaction_id == transaction_id,
                Transactions.Poster_status == PosterStatus.PENDING.value
            ).first()

            if not transaction:
                return False, {"error": "Donation transaction not found or not pending"}

            post = db.query(Posts).filter(Posts.post_id == transaction.post_id).first()
            donor_email = post.seller_email if post else None

            if not donor_email:
                return False, {"error": "Donor post data corupted"}

            # Lấy chi tiết các món đồ hiến tặng để tiến hành trừ kho người tặng (Poster)
            donation_items = db.query(TransactionProducts).filter(
                TransactionProducts.transaction_id == transaction_id
            ).all()

            for item in donation_items:
                success, error = StorageService.deduct_product(
                    db, donor_email, item.product_id, item.quantity
                )
                if not success:
                    db.rollback()
                    return False, {"error": f"Failed to deduct from donor storage: {error}"}

            # Chuyển đổi trạng thái hai bên sang đồng thuận thành công
            transaction.Poster_status = PosterStatus.SUCCESSFUL.value
            transaction.Requester_status = RequesterStatus.SUCCESSFUL.value
            db.commit()

            return True, {
                "transaction_id": transaction_id,
                "Poster_status": transaction.Poster_status,
                "Requester_status": transaction.Requester_status,
                "message": "Donation approved and inventory updated"
            }

        except Exception as e:
            db.rollback()
            logger.error(f"Error approving donation: {e}")
            return False, {"error": str(e)}

    @staticmethod
    def reject_donation(
        db: Session,
        transaction_id: int,
    ) -> Tuple[bool, Optional[Dict]]:
        """
        Từ chối nhận đồ hiến tặng vào chiến dịch (Không trừ kho).
        """
        try:
            from app.models.transactions import Transactions

            transaction = db.query(Transactions).filter(
                Transactions.transaction_id == transaction_id,
                Transactions.Poster_status == PosterStatus.PENDING.value
            ).first()

            if not transaction:
                return False, {"error": "Donation transaction not found or not pending"}

            transaction.Poster_status = PosterStatus.DENIED.value
            transaction.Requester_status = RequesterStatus.DENIED.value
            db.commit()

            return True, {
                "transaction_id": transaction_id,
                "Poster_status": transaction.Poster_status,
                "Requester_status": transaction.Requester_status,
                "message": "Donation request rejected"
            }

        except Exception as e:
            db.rollback()
            logger.error(f"Error rejecting donation: {e}")
            return False, {"error": str(e)}

    # ========================================================================
    # UTILITY METHODS (Sửa đổi trường điều kiện truy vấn SQL)
    # ========================================================================

    @staticmethod
    def get_pending_trades(
        db: Session,
        seller_email: str,
        skip: int = 0,
        limit: int = 20
    ) -> list:
        """
        Lấy danh sách các đơn hàng đổi đồ đang chờ chủ Post phê duyệt.
        """
        try:
            from app.models.transactions import Transactions
            from app.models.posts import Posts

            return db.query(Transactions).join(Posts).filter(
                Posts.seller_email == seller_email,
                Transactions.Poster_status == PosterStatus.PENDING.value
            ).order_by(Transactions.transaction_date.desc()).offset(skip).limit(limit).all()
        except Exception as e:
            logger.error(f"Error fetching pending trades: {e}")
            return []

    @staticmethod
    def get_transaction_history(
        db: Session,
        user_email: str,
        skip: int = 0,
        limit: int = 20
    ) -> list:
        """
        Truy vết lịch sử giao dịch tổng hợp của một User với vai trò là người yêu cầu.
        """
        try:
            from app.models.transactions import Transactions

            # Tìm kiếm các đơn hàng mà User này đóng vai trò đi Mua/ đi Đổi/ đi Nhận đóng góp
            return db.query(Transactions).filter(
                Transactions.requester_email == user_email
            ).order_by(Transactions.transaction_date.desc()).offset(skip).limit(limit).all()
        except Exception as e:
            logger.error(f"Error fetching transaction history: {e}")
            return []