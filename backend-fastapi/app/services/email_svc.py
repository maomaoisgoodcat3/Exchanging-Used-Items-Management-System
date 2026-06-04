import smtplib
import threading
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from queue import Queue


logger = logging.getLogger(__name__)


class EmailService:
    """
    Service for sending emails asynchronously using multi-threading.
    Handles OTP emails and system notifications.
    """

    def __init__(self, smtp_host: str, smtp_port: int, sender_email: str, sender_password: str):
        """
        Initialize email service with SMTP configuration.

        Args:
            smtp_host: SMTP server host
            smtp_port: SMTP server port
            sender_email: Sender email address
            sender_password: Sender email password or app token
        """
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_password = sender_password
        self.queue: Queue = Queue()
        self.worker_thread = threading.Thread(target=self._worker, daemon=True)
        self.worker_thread.start()

    def _worker(self) -> None:
        """Background worker thread that processes email queue."""
        while True:
            try:
                email_data = self.queue.get()
                if email_data is None:
                    break
                self._send_email(
                    recipient=email_data["recipient"],
                    subject=email_data["subject"],
                    body=email_data["body"],
                    is_html=email_data.get("is_html", False),
                )
                self.queue.task_done()
            except Exception as e:
                logger.error(f"Error sending email: {str(e)}")
                self.queue.task_done()

    def _send_email(self, recipient: str, subject: str, body: str, is_html: bool = False) -> None:
        """
        Send email via SMTP.

        Args:
            recipient: Recipient email address
            subject: Email subject
            body: Email body content
            is_html: Whether body is HTML format
        """
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = recipient

            mime_type = "html" if is_html else "plain"
            message.attach(MIMEText(body, mime_type))

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient, message.as_string())

            logger.info(f"Email sent successfully to {recipient}")
        except Exception as e:
            logger.error(f"Failed to send email to {recipient}: {str(e)}")
            raise

    def send_otp_email(self, recipient: str, otp: str) -> None:
        """
        Queue OTP email to be sent asynchronously.

        Args:
            recipient: Recipient email address
            otp: One-Time Password
        """
        subject = "[UET Marketplace] Mã OTP xác thực tài khoản"
        body = f"""
        <html>
            <body>
                <h2>Xác thực tài khoản UET Marketplace</h2>
                <p>Mã OTP của bạn là: <strong>{otp}</strong></p>
                <p>Mã này có hiệu lực trong 10 phút.</p>
                <p>Nếu bạn không yêu cầu này, vui lòng bỏ qua email.</p>
            </body>
        </html>
        """
        self.queue.put(
            {
                "recipient": recipient,
                "subject": subject,
                "body": body,
                "is_html": True,
            }
        )

    def send_password_reset_email(self, recipient: str, reset_token: str, reset_link: str) -> None:
        """
        Queue password reset email.

        Args:
            recipient: Recipient email address
            reset_token: Password reset token
            reset_link: Full reset link URL
        """
        subject = "[UET Marketplace] Đặt lại mật khẩu"
        body = f"""
        <html>
            <body>
                <h2>Đặt lại mật khẩu UET Marketplace</h2>
                <p>Nhấp vào liên kết dưới đây để đặt lại mật khẩu:</p>
                <p><a href="{reset_link}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a></p>
                <p>Hoặc sao chép token này: <code>{reset_token}</code></p>
                <p>Liên kết này sẽ hết hạn trong 1 giờ.</p>
            </body>
        </html>
        """
        self.queue.put(
            {
                "recipient": recipient,
                "subject": subject,
                "body": body,
                "is_html": True,
            }
        )

    def send_campaign_approval_notification(
        self, recipient: str, campaign_title: str, approval_status: str, reject_reason: Optional[str] = None
    ) -> None:
        """
        Queue campaign approval notification email.

        Args:
            recipient: Recipient email address
            campaign_title: Campaign title
            approval_status: Approval status (Approved, Rejected, etc.)
            reject_reason: Reason for rejection if applicable
        """
        status_text = "Đã phê duyệt" if approval_status == "Approved" else "Từ chối"
        status_color = "#28a745" if approval_status == "Approved" else "#dc3545"

        reason_section = f"<p><strong>Lý do:</strong> {reject_reason}</p>" if reject_reason else ""

        subject = f"[UET Marketplace] Chiến dịch {status_text}: {campaign_title}"
        body = f"""
        <html>
            <body>
                <h2>Thông báo về Chiến dịch</h2>
                <p>Chiến dịch <strong>{campaign_title}</strong> đã được <span style="color: {status_color}; font-weight: bold;">{status_text}</span></p>
                {reason_section}
                <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết.</p>
            </body>
        </html>
        """
        self.queue.put(
            {
                "recipient": recipient,
                "subject": subject,
                "body": body,
                "is_html": True,
            }
        )

    def send_post_approval_notification(
        self, recipient: str, post_title: str, approval_status: str, reject_reason: Optional[str] = None
    ) -> None:
        """
        Queue post approval notification email.

        Args:
            recipient: Recipient email address
            post_title: Post title
            approval_status: Approval status
            reject_reason: Reason for rejection if applicable
        """
        status_text = "Đã phê duyệt" if approval_status == "Approved" else "Từ chối"
        status_color = "#28a745" if approval_status == "Approved" else "#dc3545"

        reason_section = f"<p><strong>Lý do:</strong> {reject_reason}</p>" if reject_reason else ""

        subject = f"[UET Marketplace] Bài đăng {status_text}: {post_title}"
        body = f"""
        <html>
            <body>
                <h2>Thông báo về Bài đăng</h2>
                <p>Bài đăng <strong>{post_title}</strong> đã được <span style="color: {status_color}; font-weight: bold;">{status_text}</span></p>
                {reason_section}
                <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết.</p>
            </body>
        </html>
        """
        self.queue.put(
            {
                "recipient": recipient,
                "subject": subject,
                "body": body,
                "is_html": True,
            }
        )

    def send_transaction_notification(
        self, recipient: str, post_title: str, buyer_email: str, quantity: int, total_amount: float
    ) -> None:
        """
        Queue transaction notification email.

        Args:
            recipient: Recipient email address
            post_title: Post title
            buyer_email: Buyer email
            quantity: Quantity purchased
            total_amount: Total transaction amount
        """
        subject = f"[UET Marketplace] Đơn hàng mới: {post_title}"
        body = f"""
        <html>
            <body>
                <h2>Thông báo Đơn hàng Mới</h2>
                <p>Bạn có một đơn hàng mới từ <strong>{buyer_email}</strong></p>
                <p><strong>Bài đăng:</strong> {post_title}</p>
                <p><strong>Số lượng:</strong> {quantity}</p>
                <p><strong>Tổng tiền:</strong> {total_amount:,.0f} VND</p>
                <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết đơn hàng.</p>
            </body>
        </html>
        """
        self.queue.put(
            {
                "recipient": recipient,
                "subject": subject,
                "body": body,
                "is_html": True,
            }
        )

    def shutdown(self) -> None:
        """Shutdown email service and wait for queue to complete."""
        self.queue.join()
        self.queue.put(None)
        self.worker_thread.join()
