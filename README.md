# Exchanging-Used-Items-Management-System
This is an application for exchanging/donating/selling used items at financially autonomous private schools.

---

## Thực hiện bới nhóm sinh viên
1. Nguyễn Bình An
2. Lê Minh Anh
3. Trần Lê Cương
4. Đỗ Thị Thu Hà
5. Nguyễn Minh Phúc
   
## Frontend
```
📦 frontend-nextjs
 ┣ 📂 src
 ┃ ┣ 📂 app               # Chứa các Page (Route của ứng dụng)
 ┃ ┃ ┣ 📂 (auth)          # Group route không có Layout chính
 ┃ ┃ ┃ ┣ 📂 login
 ┃ ┃ ┃ ┣ 📂 register
 ┃ ┃ ┃ ┗ 📂 forgot-password
 ┃ ┃ ┣ 📂 (dashboard)     # Group route dùng chung Layout (Sidebar, Header)
 ┃ ┃ ┃ ┣ 📂 campaigns     # Tab Campaign (Danh sách + Filter/Sort)
 ┃ ┃ ┃ ┃ ┗ 📂 [id]        # Chi tiết Campaign -> Component tự chuyển hướng Post
 ┃ ┃ ┃ ┣ 📂 posts         # Tab Post (Mặc định)
 ┃ ┃ ┃ ┃ ┗ 📂 [id]        # Chi tiết Post + Pop-up Mua hàng
 ┃ ┃ ┃ ┣ 📂 profile       # Settings, Lịch sử giao dịch, Cart
 ┃ ┃ ┃ ┗ 📂 admin         # Tab riêng cho Role Admin (Duyệt bài)
 ┃ ┃ ┗ 📜 layout.tsx      # Layout tổng toàn trang
 ┃ ┣ 📂 components        # UI Components (Tháo lắp độc lập)
 ┃ ┃ ┣ 📂 ui              # Nút, Input, Modal, Dropdown (Dùng Tailwind/Shadcn)
 ┃ ┃ ┣ 📂 shared          # Header, Sidebar, Footer
 ┃ ┃ ┗ 📂 features        # Card bài đăng, Form thanh toán, Client Pop-up
 ┃ ┣ 📂 hooks             # Custom Hooks chứa logic gọi API
 ┃ ┃ ┣ 📜 useAuth.ts
 ┃ ┃ ┣ 📜 usePosts.ts     # Gọi React Query lấy data Post
 ┃ ┃ ┗ 📜 useCart.ts
 ┃ ┣ 📂 lib               # Cấu hình thư viện
 ┃ ┃ ┣ 📜 axios.ts        # Cấu hình bắt lỗi JWT Token tự động
 ┃ ┃ ┗ 📜 utils.ts        # Format tiền tệ, thời gian, classnames
 ┃ ┣ 📂 store             # Quản lý Global State (Zustand)
 ┃ ┃ ┗ 📜 useGlobalStore.ts # Lưu role user, thông tin giỏ hàng
 ┃ ┗ 📂 types             # TypeScript Interfaces (Đồng bộ với Backend Schemas)
 ┃   ┗ 📜 index.ts
 ┣ 📜 tailwind.config.ts  # Cấu hình màu sắc, animation cơ bản
 ┗ 📜 package.json
Run Frontend:
+ npm install
+ npm run dev

```
## Backend
```
📦 backend-fastapi
 ┣ 📂 app
 ┃ ┣ 📂 api               # Chứa các Endpoints/Routers
 ┃ ┃ ┣ 📂 v1
 ┃ ┃ ┃ ┣ 📜 auth.py       # Login, Đăng ký, OTP
 ┃ ┃ ┃ ┣ 📜 users.py      # Profile, Đổi mật khẩu
 ┃ ┃ ┃ ┣ 📜 campaigns.py  # CRUD Chiến dịch
 ┃ ┃ ┃ ┣ 📜 posts.py      # CRUD Bài đăng, Mua/Bán/Quyên góp
 ┃ ┃ ┃ ┣ 📜 admin.py      # Duyệt bài, Update Service Fee
 ┃ ┃ ┃ ┗ 📜 transactions.py# Xử lý giao dịch, Giỏ hàng
 ┃ ┣ 📂 core              # Cấu hình lõi hệ thống
 ┃ ┃ ┣ 📜 config.py       # Đọc biến môi trường (.env)
 ┃ ┃ ┣ 📜 security.py     # Hash mật khẩu, JWT Token
 ┃ ┃ ┗ 📜 database.py     # Kết nối DB, Dependency Injection (get_db)
 ┃ ┣ 📂 models            # Định nghĩa các Table SQLAlchemy (Phản chiếu DBML)
 ┃ ┃ ┣ 📜 user.py         # Users, Directory, Organizations
 ┃ ┃ ┣ 📜 post.py         # Posts, PostProducts, PostImages
 ┃ ┃ ┣ 📜 campaign.py     # Campaigns
 ┃ ┃ ┗ 📜 transaction.py  # Transactions
 ┃ ┣ 📂 schemas           # Pydantic Models (Validate dữ liệu đầu vào/ra)
 ┃ ┃ ┣ 📜 user_schema.py
 ┃ ┃ ┣ 📜 post_schema.py
 ┃ ┃ ┗ ...
 ┃ ┣ 📂 services          # THƯ MỤC QUAN TRỌNG NHẤT: Chứa Business Logic
 ┃ ┃ ┣ 📜 email_svc.py    # Multi-thread gửi email OTP
 ┃ ┃ ┣ 📜 auth_svc.py     # Xử lý logic ủy quyền Organization, Login
 ┃ ┃ ┣ 📜 post_svc.py     # Logic thêm sản phẩm, update status
 ┃ ┃ ┗ 📜 payment_svc.py  # Tính toán phí (Service fee), chuyển hướng
 ┃ ┗ 📜 main.py           # Điểm khởi chạy App (Mount routers, CORS)
 ┣ 📂 alembic             # Quản lý version Database (Migration)
 ┣ 📜 requirements.txt    # Danh sách thư viện Python
 ┗ 📜 .env                # Lưu cấu hình bảo mật
```
To turn up this project, try: 
+ cd backend-fastapi
+ python -m uvicorn app.main:app --reload

---
## Diagram
### Context diagram
<img width="816" height="545" alt="Project-Context diagram drawio" src="https://github.com/user-attachments/assets/9114d863-4b43-4dbe-b527-8c0692da7331" />

### DFD level 0
<img width="1203" height="577" alt="Project-DFD level 1 drawio" src="https://github.com/user-attachments/assets/b26647b1-9617-4a87-9484-2811f604162e" />

### Entity relationship diagram
<img width="975" height="760" alt="image" src="https://github.com/user-attachments/assets/215e2ce6-ddb2-4a5a-be47-fafc51fd95e8" />

---
## Demo
<img width="1612" height="1322" alt="Screenshot 2026-06-04 155339" src="https://github.com/user-attachments/assets/ae069355-b6e9-441c-bea9-ebc04762f3bd" />
<img width="2879" height="1712" alt="Screenshot 2026-06-04 232018" src="https://github.com/user-attachments/assets/09cfb9bb-e7ea-4175-a19d-1c75bc68b829" />
<img width="2879" height="1697" alt="Screenshot 2026-06-04 233636" src="https://github.com/user-attachments/assets/a6835d5f-6d49-4c1b-a816-6adcf6a404c9" />

