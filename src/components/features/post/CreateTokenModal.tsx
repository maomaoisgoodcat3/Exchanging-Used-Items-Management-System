"use client";

import { X } from "lucide-react";

interface CreateTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTokenModal({
  isOpen,
  onClose,
}: CreateTokenModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-8 py-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Đặt Lại Mật Khẩu
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 transition hover:text-black"
          >
            <X size={32} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-8">
          <input
            type="email"
            value="admin@vnu.edu.vn"
            readOnly
            className="w-full rounded-lg border px-4 py-3 text-base"
          />

          <input
            type="text"
            placeholder="Dán mã khôi phục (Token) vào đây..."
            className="w-full rounded-lg border px-4 py-3 text-base"
          />

          <input
            type="password"
            placeholder="Mật khẩu mới..."
            className="w-full rounded-lg border px-4 py-3 text-base"
          />

          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới..."
            className="w-full rounded-lg border px-4 py-3 text-base"
          />
        </div>

        {/* Footer */}
        <div className="border-t px-8 py-6">
          <button
           onClick={() => {
                alert("Đổi mật khẩu thành công!");
                onClose(); // đóng modal
            }}
            className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700"
          >
            Xác Nhận Đổi Mật Khẩu
          </button>
        
          <button
            onClick={onClose}
            className="mt-5 text-m font-medium text-blue-600 hover:underline"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}