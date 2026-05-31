"use client";

import { useState } from "react";
import Link from "next/link";

export default function PostsPage() {
  const [search, setSearch] = useState("");

  const posts = [
    { id: 1, title: "Bán sách Java cơ bản", price: 50000, location: "Hà Nội" },
    { id: 2, title: "Áo hoodie trường X", price: 120000, location: "Cầu Giấy" },
    { id: 3, title: "Laptop Dell i5 cũ", price: 4500000, location: "Đống Đa" },
  ];

  // filter theo search
  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Danh sách sản phẩm</h1>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Tạo bài đăng
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 p-3 border rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition"
            >
              <h2 className="font-semibold text-lg">{post.title}</h2>

              <p className="text-gray-500 text-sm mt-1">
                📍 {post.location}
              </p>

              <p className="text-blue-600 font-bold mt-3">
                {post.price.toLocaleString()} đ
              </p>

              <button className="mt-4 w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-lg">
                Xem chi tiết
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Không tìm thấy sản phẩm</p>
        )}

      </div>
    </div>
  );
}