// Tệp: src/components/features/post/PostCard.tsx
import type { Post } from "@/types/post";

export const typeColor: Record<string, string> = {
  Trading: "bg-yellow-100 text-yellow-700",
  Selling: "bg-blue-100 text-blue-700",
  Donating: "bg-green-100 text-green-700",
};

export default function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition p-4 flex flex-col h-full cursor-pointer"
      onClick={onClick}
    >
      {/* Header Card */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-gray-400 text-xs font-medium">#{post.post_id}</span>
        <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md ${typeColor[post.post_category] || "bg-gray-100 text-gray-700"}`}>
          {post.post_category}
        </span>
      </div>

      {/* Hình ảnh */}
      <div className="relative w-full h-48 bg-gray-50 rounded-lg mb-4 overflow-hidden border border-gray-100">
        <img 
          src={post.thumbnail_url || "https://placehold.co/400x300?text=No+Thumbnail"} 
          alt={post.title} 
          className="w-full h-full object-contain" 
        />
        {post.campaign_id && (
           <div className="absolute top-2 left-2 bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow">
             ★ Chiến dịch
           </div>
        )}
      </div>
      
      {/* Thông tin */}
      <h2 className="font-bold text-gray-800 text-lg line-clamp-1">{post.title}</h2>
      
      <div className="flex items-center gap-2 mt-2">
         <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
            {post.seller_email.charAt(0).toUpperCase()}
         </div>
         <p className="text-xs text-gray-500 truncate">{post.seller_email}</p>
      </div>
      
      <div className="flex-grow mt-3">
         <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${post.approval === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            {post.approval === 'Approved' ? "Đã duyệt" : "Chờ duyệt"}
         </span>
      </div>

      {/* Nút bấm */}
      <div 
        className="mt-4 pt-3 border-t border-gray-100 text-center text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
        Xem chi tiết &rarr;
      </div>
    </div>
  );
}