"use client";

import { useState } from "react";

type CreatePostModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [formProducts, setFormProducts] = useState([
    { id: Date.now(), name: "", quantity: 1, price: 0 }
  ]);

  if (!isOpen) return null;

  const handleAddProductRow = () => {
    setFormProducts([...formProducts, { id: Date.now(), name: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveProductRow = (idToRemove: number) => {
    setFormProducts(formProducts.filter(prod => prod.id !== idToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 relative h-[90vh] flex flex-col animate-fadeIn">
        
        <button 
          className="absolute top-4 right-5 text-gray-400 hover:text-red-500 text-3xl font-bold transition-colors z-20"
          onClick={onClose}
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
                <input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="VD: Thanh lý sách giáo khoa..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức <span className="text-red-500">*</span></label>
                <select className="w-full border rounded-lg px-3 py-2 bg-white">
                  <option value="MUA_BAN">Mua bán</option>
                  <option value="TRAO_DOI">Trao đổi</option>
                  <option value="QUYEN_GOP">Quyên góp</option>
                </select>
              </div>
            </div>
          </div>

          {/* Phần 2: Hình ảnh và Mô tả */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4 border">
            <h3 className="font-semibold text-gray-700">2. Hình ảnh & Mô tả</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tải ảnh lên</label>
              <input type="file" multiple className="w-full border rounded-lg px-3 py-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-50 file:text-blue-700 file:hover:bg-blue-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
              <textarea rows={4} className="w-full border rounded-lg px-3 py-2" placeholder="Mô tả chi tiết..."></textarea>
            </div>
          </div>

          {/* Phần 3: Danh sách vật phẩm */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4 border">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-700">3. Danh sách vật phẩm</h3>
              <button onClick={handleAddProductRow} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200">
                + Thêm vật phẩm
              </button>
            </div>
            
            {formProducts.map((prod, index) => (
              <div key={prod.id} className="flex flex-col gap-3 border-b border-gray-200 pb-5 mb-5 last:border-0 last:pb-0">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Tên vật phẩm</label>
                    <input type="text" className="w-full border rounded-md px-3 py-2 text-sm" placeholder={`Vật phẩm ${index + 1}`} />
                  </div>
                  {formProducts.length > 1 && (
                    <button onClick={() => handleRemoveProductRow(prod.id)} className="text-red-500 p-2 hover:bg-red-100">🗑️</button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                      <option>Sách vở</option>
                      <option>Quần áo</option>
                      <option>Đồ dùng học tập</option>
                      <option>Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tình trạng</label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                      <option>Mới 100%</option>
                      <option>Như mới</option>
                      <option>Sử dụng vừa phải</option>
                      <option>Sử dụng nhiều</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                    <input type="number" defaultValue="1" className="w-full border rounded-md px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giá (VNĐ)</label>
                    <input type="number" defaultValue="0" className="w-full border rounded-md px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-300 ">Hủy bỏ</button>
          <button onClick={() => { alert("Đã gửi duyệt!"); onClose(); }} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Gửi yêu cầu duyệt</button>
        </div>
      </div>
    </div>
  );
}