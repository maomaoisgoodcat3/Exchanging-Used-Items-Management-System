USE UETMarketplace;
-- !!! CHÚ Ý: Insert theo từng bước một, KHÔNG insert nhiều bước một lúc !!!

-- B1. Thêm vào directory
-- INSERT INTO directory (email, fullname, member_type) 
-- VALUES ('test1@vnu.edu.vn', 'Thanh Hiền', 'Student');
-- INSERT INTO directory (email, fullname, member_type) 
-- VALUES ('test2@vnu.edu.vn', 'Manhfarm', 'Student');
-- INSERT INTO directory (email, fullname, member_type) 
-- VALUES ('test3@vnu.edu.vn', 'Hà Đỗ', 'Student');
-- INSERT INTO directory (email, fullname, member_type) 
-- VALUES ('test4@vnu.edu.vn', 'Quân Trần', 'Student');

-- INSERT INTO directory (email, fullname, member_type) 
-- VALUES ('admin1@vnu.edu.vn', 'Thanh Hiền', 'Staff');
-- INSERT INTO directory (email, fullname, member_type) 
-- VALUES ('admin2@vnu.edu.vn', 'Manhfarm', 'Staff');
-- INSERT INTO directory (email, fullname, member_type) 
-- VALUES ('admin3@vnu.edu.vn', 'Hà Đỗ', 'Staff');
-- INSERT INTO directory (email, fullname, member_type) 
-- VALUES ('admin4@vnu.edu.vn', 'Quân Trần', 'Staff');

-- B2. Tạo tài khoản test và admin THAO TÁC TRÊN WEBSITE (!!!!!!).

-- B3. Update role cho tài khoản admin đã tạo trên web
-- UPDATE users SET role = 'Admin' WHERE email = 'admin1@vnu.edu.vn';

-- B4. Tạo organization và thêm representative
-- INSERT INTO Organizations (org_email, org_name, representative_email, description)
-- VALUES
-- 	('doanthanhnien@uet.edu.vn', 'Đoàn Thanh Niên UET', 'test1@vnu.edu.vn', NULL),
--     ('hoihocsinh@uet.edu.vn', 'Hội học sinh', 'test1@vnu.edu.vn', NULL),
--     ('meomeoclb@uet.edu.vn', 'Câu lạc bộ yêu mèooo', 'test1@vnu.edu.vn', NULL);

-- INSERT INTO Organizations_Members (org_email, mem_email, mem_permission)
-- VALUES
-- 	('doanthanhnien@uet.edu.vn', 'test1@vnu.edu.vn', 'Manager'),
-- 	('hoihocsinh@uet.edu.vn', 'test1@vnu.edu.vn', 'Manager'),
-- 	('meomeoclb@uet.edu.vn', 'test1@vnu.edu.vn', 'Manager');

-- B5. Tạo product categories
-- INSERT INTO productcategories (category_name)
-- VALUES ('Dụng cụ học tập'), ('Quần áo'), ('Đồ dùng'), ('Khác');

-- B6. Tạo Location của user
-- INSERT INTO Locations (email, location)
-- VALUES
-- 	('test1@vnu.edu.vn', '177 Trung Kính, Yên Hòa'),
--     ('test1@vnu.edu.vn', 'Phòng 201-202 GĐ3 (Phòng CLB Thư viện Hội Sinh viện)'),
--     ('test1@vnu.edu.vn', 'KTX Ngoại ngữ'),
--     ('test1@vnu.edu.vn', '123 Doãn Kế Thiện, Cầu Giấy');

-- B7. Thêm product vào storage
-- INSERT INTO Storage (email, product_name, product_category_id, product_quantity, product_price, product_location_id) 
-- VALUES
-- 	('test1@vnu.edu.vn', 'Laptop Dell XPS 13', 1, 1, 15000000.00, 1),
-- 	('test1@vnu.edu.vn', 'Sách Đắc Nhân Tâm (Tặng)', 4, 5, 0.00, 2),
-- 	('test1@vnu.edu.vn', 'Áo khoác gió Uniqlo (Cho)', 2, 2, 0.00, 1),
-- 	('test1@vnu.edu.vn', 'Điện thoại iPhone 16 cũ', 1, 1, 12000000.00, 3),
-- 	('test1@vnu.edu.vn', 'Bàn phím cơ Logitech G213', 3, 1, 1250000.00, 1),
-- 	('test1@vnu.edu.vn', 'Giáo trình Giải tích 1', 1, 1, 0.00, 2),
-- 	('test1@vnu.edu.vn', 'Giày thể thao Nike Air Max', 2, 1, 2200000.00, 3),
-- 	('test1@vnu.edu.vn', 'Quạt đứng Senko', 3, 1, 350000.00, 1),
-- 	('test1@vnu.edu.vn', 'Bình nước giữ nhiệt Lock&Lock', 3, 1, 150000.00, 2),
-- 	('test1@vnu.edu.vn', 'Mũ bảo hiểm Andes', 3, 1, 280000.00, 3);
