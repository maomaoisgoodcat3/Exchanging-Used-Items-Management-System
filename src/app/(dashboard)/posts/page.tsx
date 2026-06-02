"use client";

import { useState, useEffect } from "react";
import PostCard from "@/components/features/post/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { getPosts } from "@/services/postServices";
import type { Post } from "@/types/post";

export default function PostsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State quản lý việc mở Form tạo bài đăng mới
  const [isCreating, setIsCreating] = useState(false);

  // State tạm thời để quản lý việc thêm nhiều sản phẩm trong giao diện (UI mockup)
  const [formProducts, setFormProducts] = useState([
    { id: 1, name: "", quantity: 1, price: 0 }
  ]);

  // Thêm State để lưu danh mục đang được chọn (mặc định rỗng = chọn tất cả)
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const data = await getPosts();
        setPosts(data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // 2. Cập nhật logic lọc: Kết hợp cả điều kiện Search (tên) và Category (danh mục)
  const filtered = posts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "" || p.category === selectedCategory;
    
    return matchSearch && matchCategory;
  });

  /*const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );*/

  // Hàm xử lý UI: Thêm 1 dòng sản phẩm mới vào form
  const handleAddProductRow = () => {
    setFormProducts([...formProducts, { id: Date.now(), name: "", quantity: 1, price: 0 }]);
  };

  const isAdmin = user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";
  const isOrganisation = user?.role === "CLUB";
  const canCreatePost = isStudent || isOrganisation;


  return (
    <div className="space-y-6 relative">
      <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
        {isAdmin && (
          <p className="text-sm font-medium text-blue-800">
            Admin view: xem toàn bộ bài đăng và chuẩn bị nhánh duyệt/ẩn/xóa bài.
          </p>
        )}
        {isStudent && (
          <p className="text-sm font-medium text-green-800">
            User view: xem danh sách và tạo bài đăng trao đổi/mua bán/quyên góp.
          </p>
        )}
        {isOrganisation && (
          <p className="text-sm font-medium text-cyan-800">
            Organisation view: tạo bài đăng đại diện cho {user?.organization?.name ?? "tổ chức"}.
          </p>
        )}
      </div>
      {/* 1. HEADER + SEARCH + NÚT TẠO BÀI ĐĂNG */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">📰 Danh sách bài đăng</h1>

        <div className="flex w-full md:w-auto gap-3 flex-grow justify-end">

          {/* BỘ LỌC DANH MỤC MỚI THÊM */}
          <select
            className="border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white transition-colors cursor-pointer text-sm md:text-base outline-none focus:ring-2 focus:ring-blue-200"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {/* Các option này nên khớp với danh mục bạn thiết kế trong form tạo bài */}
            <option value="Sách vở">Sách vở - Tài liệu</option>
            <option value="Quần áo">Quần áo - Đồng phục</option>
            <option value="Đồ học tập">Đồ dùng học tập</option>
            <option value="Khác">Khác</option>
          </select>

          <input
            className="border rounded-lg px-4 py-2 w-full md:w-80 bg-gray-50 focus:bg-white transition-colors"
            placeholder="Tìm kiếm bài đăng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          {canCreatePost && (
          <button 
            onClick={() => setIsCreating(true)} // Mở Pop-up khi click
            className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded-lg transition-colors whitespace-nowrap shadow-md"
          >
            + Đăng bài mới
          </button>
          )}
        </div>
      </div>

      {/* 2. KHU VỰC RENDER DANH SÁCH BÀI ĐĂNG */}
      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Đang tải dữ liệu từ hệ thống...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onClick={() => {}} // Tạm thời để trống phần click xem chi tiết
            />
          ))}
          {filtered.length === 0 && (
             <div className="col-span-full text-center text-gray-500 py-10 bg-white rounded-xl">
               Không tìm thấy bài đăng nào.
             </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. POP-UP (MODAL) GIAO DIỆN TẠO BÀI ĐĂNG MỚI                   */}
      {/* ============================================================== */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 relative h-[90vh] flex flex-col">
            
            {/* Nút tắt Pop-up */}
            <button 
              className="absolute top-4 right-5 text-gray-400 hover:text-red-500 text-3xl font-bold transition-colors"
              onClick={() => setIsCreating(false)}
            >
              &times;
            </button>
            
            <h2 className="text-2xl font-bold mb-4 border-b pb-3 text-gray-800">
              📝 Khởi tạo bài đăng mới
            </h2>
            
            {/* Nội dung Form có thanh cuộn */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              
              {/* Phần 1: Thông tin chung */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4 border">
                <h3 className="font-semibold text-gray-700">1. Thông tin chung</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề bài đăng <span className="text-red-500">*</span></label>
                    <input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="VD: Thanh lý sách giáo khoa lớp 10..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức giao dịch <span className="text-red-500">*</span></label>
                    <select className="w-full border rounded-lg px-3 py-2 bg-white">
                      <option value="MUA_BAN">💰 Mua bán (Thanh lý)</option>
                      <option value="TRAO_DOI">🔄 Trao đổi đồ</option>
                      <option value="QUYEN_GOP">🎁 Quyên góp / Tặng miễn phí</option>
                    </select>
                  </div>
                  
                </div>
              </div>

              {/* Phần 2: Hình ảnh và Mô tả */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4 border">
                <h3 className="font-semibold text-gray-700">2. Hình ảnh & Mô tả</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tải ảnh lên (Tối đa 5 ảnh)</label>
                  <input type="file" multiple className="w-full border rounded-lg px-3 py-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                  <textarea rows={4} className="w-full border rounded-lg px-3 py-2" placeholder="Mô tả rõ hơn về lý do bán, tình trạng cụ thể, hoặc mong muốn trao đổi..."></textarea>
                </div>
              </div>

              {/* Phần 3: Danh sách sản phẩm (Dynamic Form) */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4 border">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-700">3. Danh sách vật phẩm</h3>
                  <button 
                    onClick={handleAddProductRow}
                    className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 font-medium"
                  >
                    + Thêm vật phẩm
                  </button>
                </div>
                
{/* Render danh sách các dòng sản phẩm */}
                {formProducts.map((prod, index) => (
                  <div key={prod.id} className="flex flex-col gap-3 border-b border-gray-200 pb-5 mb-5 last:border-0 last:mb-0 last:pb-0">
                    
                    {/* DÒNG 1: Tên vật phẩm & Nút xóa */}
                    <div className="flex gap-3 items-end w-full">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên vật phẩm</label>
                        <input type="text" className="w-full border rounded-md px-3 py-2 text-sm" placeholder={`Vật phẩm ${index + 1}`} />
                      </div>
                      
                      {/* Nút xóa dòng - Đặt cạnh Tên vật phẩm */}
                      {formProducts.length > 1 && (
                        <button className="text-red-500 p-2 hover:bg-red-50 rounded-md border border-transparent hover:border-red-200 transition" title="Xóa vật phẩm này">
                          🗑️
                        </button>
                      )}
                    </div>

                    {/* DÒNG 2: Danh mục, Tình trạng, Số lượng, Giá */}
                    {/* Dùng grid-cols-2 cho mobile và grid-cols-4 cho máy tính để responsive đẹp mắt */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                        <select className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                          <option>Sách vở - Tài liệu</option>
                          <option>Quần áo - Đồng phục</option>
                          <option>Đồ dùng học tập</option>
                          <option>Khác</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng</label>
                        <select className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                          <option>Mới 100%</option>
                          <option>Như mới</option>
                          <option>Sử dụng vừa phải</option>
                          <option>Sử dụng nhiều</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                        <input type="number" min="1" defaultValue="1" className="w-full border rounded-md px-3 py-2 text-sm" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
                        <input type="number" min="0" defaultValue="0" className="w-full border rounded-md px-3 py-2 text-sm" />
                      </div>

                    </div>

                  </div>
                ))}
              </div>

            </div>

            {/* Footer: Các nút hành động */}
            <div className="mt-6 pt-4 border-t flex justify-end gap-3 bg-white">
              <button 
                onClick={() => setIsCreating(false)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => {
                  alert("Chức năng nộp form sẽ được kết nối với Backend API ở giai đoạn sau!");
                  setIsCreating(false);
                }}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                Gửi yêu cầu duyệt
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
