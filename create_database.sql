-- Tạo Database
drop database UETMarketplace;
create database UETMarketplace character set utf8mb4 collate utf8mb4_unicode_ci;
use UETMarketplace;

-- 1. Bảng Danh sách nội bộ nhà trường (Master List)
CREATE TABLE Directory (
    email VARCHAR(100) PRIMARY KEY, -- Email trường cấp
    fullname VARCHAR(100) NOT NULL,
    member_type ENUM('Student', 'Teacher', 'Staff') NOT NULL DEFAULT ('Student')
);

-- 2. Bảng Tài khoản ứng dụng
CREATE TABLE Users (
    email VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    role ENUM('Member', 'Admin') NOT NULL DEFAULT 'Member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email) REFERENCES Directory(email)
);

-- 3. Bảng Tổ chức (Nhà trường, Hội học sinh, CLB)
CREATE TABLE Organizations (
    org_email VARCHAR(100) PRIMARY KEY,
    org_name VARCHAR(100) NOT NULL,
    representative_email VARCHAR(100) NOT NULL, -- Email thành viên chịu trách nhiệm
    description TEXT,
    
    FOREIGN KEY (representative_email) REFERENCES Users(email) ON DELETE CASCADE
);

-- 4. Bảng thành viên trong tổ chức
CREATE TABLE Organizations_Members (
	org_email VARCHAR(100) NOT NULL,
    mem_email VARCHAR(100) NOT NULL,
    mem_permission ENUM('Manager', 'Poster', 'Member') NOT NULL DEFAULT ('Member'),
    
    FOREIGN KEY (org_email) REFERENCES Organizations(org_email),
    FOREIGN KEY (mem_email) REFERENCES Users(email)
);

-- 5. Bảng Chiến dịch (Hoạt động gây quỹ, quyên góp)
CREATE TABLE Campaigns (
    campaign_id INT AUTO_INCREMENT PRIMARY KEY,
    org_email VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATETIME,
    end_date DATETIME,
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    availability ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',
    approval ENUM('Pending', 'Approved', 'Resending', 'Rejected') NOT NULL DEFAULT 'Pending',
    reject_reason TEXT,
    
    FOREIGN KEY (org_email) REFERENCES Organizations(org_email) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES Users(email)
);

-- 6. Bảng Danh mục sản phẩm
CREATE TABLE ProductCategories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL -- Dụng cụ học tập, Quần áo, Đồ dùng, Khác
);

-- 7. Bảng lưu địa chỉ của người dùng
CREATE TABLE Locations (
	email VARCHAR(100),
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(1000) NOT NULL,
    
    FOREIGN KEY (email) REFERENCES Users(email)
);

-- 8. Bảng lưu kho sản phẩm của người dùng
CREATE TABLE Storage (
	email VARCHAR(100),
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    product_category_id INT NOT NULL,
    product_quantity INT NOT NULL DEFAULT 1,
    product_price DECIMAL(15, 2) DEFAULT 0.00, -- 0 nếu là quyên góp hoặc trao đổi
    product_location_id INT NOT NULL,
    
    FOREIGN KEY (email) REFERENCES Users(email),
    FOREIGN KEY (product_category_id) REFERENCES ProductCategories(category_id),
    FOREIGN KEY (product_location_id) REFERENCES Locations(location_id)
);

-- 9. Bảng hình ảnh sản phẩm
CREATE TABLE ProductImages (
	image_id INT AUTO_INCREMENT PRIMARY KEY,
	product_id INT NOT NULL,
    image_url VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES Storage(product_id)
);

-- 10. Bảng Bài đăng cá nhân
CREATE TABLE Posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    seller_email VARCHAR(100) NOT NULL,
    post_category ENUM('Selling', 'Trading', 'Donating') NOT NULL,
    campaign_id INT DEFAULT NULL, -- Nếu NULL là bán cá nhân, nếu có ID là tham gia chiến dịch
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    availability ENUM('Open', 'Sold', 'Closed') NOT NULL DEFAULT 'Open',
    approval ENUM('Pending', 'Approved', 'Resending', 'Rejected') NOT NULL DEFAULT 'Pending',
    reject_reason TEXT,
    
    FOREIGN KEY (seller_email) REFERENCES Users(email),
    FOREIGN KEY (campaign_id) REFERENCES Campaigns(campaign_id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES Users(email)
);

-- 11. Bảng sản phẩm trong bài đăng
CREATE TABLE PostProducts (
	post_id INT NOT NULL,
	product_id INT NOT NULL,
    product_quantity INT NOT NULL DEFAULT 1, -- Số lượng sản phẩm bán trong một post, có thể khác với Storage(product_quantity)
    
    FOREIGN KEY (post_id) REFERENCES Posts(post_id),
    FOREIGN KEY (product_id) REFERENCES Storage(product_id)
);

-- Điều kiện PostProducts(product_quantity) không được vượt quá Storage(product_quantity)
DELIMITER $$
CREATE TRIGGER check_post_product_quantity_insert
BEFORE INSERT ON PostProducts
FOR EACH ROW
BEGIN
    DECLARE available_quantity INT;
    SELECT product_quantity INTO available_quantity
    FROM Storage
    WHERE product_id = NEW.product_id;

    IF NEW.product_quantity > available_quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Post\'s product quantity cannot exceed available storage quantity.';
    END IF;
END$$

CREATE TRIGGER check_post_product_quantity_update
BEFORE UPDATE ON PostProducts
FOR EACH ROW
BEGIN
    DECLARE available_quantity INT;
    SELECT product_quantity INTO available_quantity
    FROM Storage
    WHERE product_id = NEW.product_id;

    IF NEW.product_quantity > available_quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Post\'s product quantity cannot exceed available storage quantity.';
    END IF;
END$$
DELIMITER ;

-- 12. Bảng hình ảnh trong bài đăng
CREATE TABLE CampaignImages (
	image_id INT AUTO_INCREMENT PRIMARY KEY,
	campaign_id INT NOT NULL,
    image_url VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES Campaigns(campaign_id)
);

-- 13. Bảng setting hệ thống (VD: phí trung gian, số lượng bài đăng active để tránh spam,...)
CREATE TABLE Settings (
	setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_name VARCHAR(100) NOT NULL,
    setting_value DECIMAL(15, 2) NOT NULL,
    description TEXT,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_admin_update FOREIGN KEY (updated_by) REFERENCES Users(email)
);

-- 14. Bảng Giao dịch (Lưu vết mua bán & Phí trung gian)
CREATE TABLE Transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    requester_email VARCHAR(100) NOT NULL,
    service_fee DECIMAL(15, 2) DEFAULT 0.00, -- Phí trung gian trích vào quỹ chung
    Poster_status ENUM('Pending', 'Accepted', 'Denied', 'Ready for pickup', 'Successful') DEFAULT 'Pending', -- Theo dõi tiến độ người đăng bài
    -- Pending = Hệ thống đã thụ lý đơn hàng nhưng người đăng chưa phản hồi
    -- Accepted = Người đăng xác nhận đơn hàng
    -- Denied = Người đăng từ chối đơn hàng
    -- Ready for pickup = đã sẵn sàng giao hàng (để 1 trong 2 tự đặt đơn vị vận chuyển/người mua tự đến lấy)
    -- Successful = đã giao hàng (cho đơn vị vận chuyển/người mua nếu họ tự đến lấy)
    -- Mua bán: Pending, Accepted, Denied, Ready for pickup, Successful
    -- Trao đổi: Pending, Accepted, Denied, Ready for pickup, Successful
    -- Quyên góp: Pending, Ready for pickup, Successful
    Requester_status ENUM('Pending', 'Accepted', 'Denied', 'Deposited', 'Successful', 'Unsuccessful') DEFAULT 'Pending', -- Theo dõi tiến độ người yêu cầu
    -- Pending = Hệ thống đã thụ lý đơn hàng nhưng người yêu cầu chưa phản hồi (mua bán)/chờ phản hồi (trao đổi)
    -- Accepted = Người nhận yêu cầu nhận hàng thành công (nhận quyên góp)
    -- Denied = Người nhận từ chối nhận hàng (từ chối nhận quyên góp)
    -- Deposited = Người nhận chuyển tiền thành công (mua bán)
    -- Successful = Người nhận đã nhận được hàng
    -- Unsuccessful = Người nhận bị từ chối
    -- Mua bán: Pending, Deposited, Successful, Unsuccessful
    -- Trao đổi: Pending, Successful, Unsuccessful
    -- Quyên góp: Accepted, Denied, Successful, Unsuccessful
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (post_id) REFERENCES Posts(post_id),
    FOREIGN KEY (requester_email) REFERENCES Users(email)
);

-- 15. Bảng các sản phẩm liên quan tới các giao dịch
CREATE TABLE TransactionProducts (
	transaction_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    product_source ENUM('Poster', 'Requester') NOT NULL,
    
    PRIMARY KEY (transaction_id, product_id, product_source),
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id),
    FOREIGN KEY (product_id) REFERENCES Storage(product_id)
);