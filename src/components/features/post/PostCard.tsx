// Tệp: src/components/features/post/PostCard.tsx
import type { Post } from "@/types/post";

export const typeColor: Record<Post["type"], string> = {
  TRAO_DOI: "bg-yellow-100 text-yellow-700",
  MUA_BAN: "bg-blue-100 text-blue-700",
  QUYEN_GOP: "bg-green-100 text-green-700",
};

export default function PostCard(
  {post, onClick }: { 
    post: Post; onClick: () => void }) {

  
  return (
    <div
      className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col h-full cursor-pointer"
    >
      <div className="flex justify-between text-xs mb-2">
        <span className="text-gray-500">ID: {post.id}</span>
        <span className={`px-2 py-1 rounded-full ${typeColor[post.type]}`}>{post.type}</span>
      </div>

      <img src={post.image} alt={post.title} className="w-full h-40 object-cover rounded-lg mb-3" />
      <h2 className="font-semibold text-lg">{post.title}</h2>
      <p className="text-sm text-gray-600 mt-1">👤 {post.sellerName}</p>
      
      <div className="flex-grow">
        <span className="inline-block mt-2 text-xs bg-gray-100 px-2 py-1 rounded">{post.category}</span>
      </div>

      <div 
        onClick={onClick}
        className="mt-4 pt-3 border-t border-gray-100 text-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
        Xem chi tiết &rarr;
      </div>

    </div>
  );
}