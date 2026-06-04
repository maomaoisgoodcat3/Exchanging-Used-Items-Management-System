# Exchanging-Used-Items-Management-System
This is an application for exchanging/donating/selling used items at financially autonomous private schools.
# Frontend
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
```
# Backend
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

This is an application for exchanging, donating, and selling used items at financially autonomous private schools.

## Frontend

The frontend is built with Next.js and uses the App Router. Key folders include:

- `src/app`: page routes and layouts
- `src/components`: UI components and shared modules
- `src/hooks`: custom hooks such as `useAuth`
- `src/store`: global state with Zustand
- `src/types`: shared TypeScript interfaces

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Notes

- The project uses TypeScript and Next.js App Router.
- Mock authentication state is handled through `src/store/authStore.ts`.
- Ignore generated build artifacts such as `.next/` and `node_modules`.

