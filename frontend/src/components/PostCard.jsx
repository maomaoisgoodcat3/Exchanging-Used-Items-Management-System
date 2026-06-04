// Đã sửa key thành viết hoa chữ cái đầu theo chuẩn Enum của Backend
const statusClassMap = {
  Approved: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-700',
  Rejected: 'bg-rose-100 text-rose-700',
  Resending: 'bg-orange-100 text-orange-700',
  // Fallback cho dữ liệu cũ nếu còn sót
  approved: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
};

export default function PostCard({ post, onOpenDetail, onBuyNow, onAddCart }) {
  // Lấy giá trị an toàn từ Backend (hoặc fallback)
  const id = post.post_id || post.id;
  const status = post.approval || post.status || 'Pending';
  const type = post.post_type || post.type;
  const price = post.products?.[0]?.product_price || post.price || 0;
  const image = post.thumbnail_url || post.image_post_url || post.coverImage || `https://picsum.photos/500/300?random=${id}`;

  return (
    <article className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sky-100">
      <img src={image} alt={post.title} className="h-40 w-full rounded-2xl object-cover" />
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="font-bold text-slate-800">{post.title}</h3>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClassMap[status] || 'bg-slate-100'}`}>{status}</span>
      </div>
      <p className="mt-1 text-sm text-slate-500">{id} • {post.seller_email || post.sellerName}</p>
      <p className="mt-2 text-sm text-slate-600 line-clamp-2">{post.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-bold text-sky-700">
          {type === 'Selling' || type === 'sell' ? `${price.toLocaleString('vi-VN')}đ` : type === 'Trading' || type === 'trade' ? 'Trao đổi' : 'Quyên góp'}
        </p>
        <button onClick={() => onOpenDetail(post)} className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">Xem chi tiết</button>
      </div>
      {(type === 'Selling' || type === 'sell') && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => onBuyNow(post)} className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white">Mua ngay</button>
          <button onClick={() => onAddCart(post)} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white">Thêm vào giỏ</button>
        </div>
      )}
    </article>
  );
}