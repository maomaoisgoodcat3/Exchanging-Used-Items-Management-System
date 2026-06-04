const statusClassMap = {
  approved: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-rose-100 text-rose-700',
  resending: 'bg-orange-100 text-orange-700',
};

export default function PostCard({ post, onOpenDetail, onBuyNow, onAddCart }) {
  return (
    <article className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sky-100">
      <img src={post.coverImage} alt={post.title} className="h-40 w-full rounded-2xl object-cover" />
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="font-bold text-slate-800">{post.title}</h3>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClassMap[post.status]}`}>{post.status}</span>
      </div>
      <p className="mt-1 text-sm text-slate-500">{post.id} • {post.sellerName}</p>
      <p className="mt-2 text-sm text-slate-600 line-clamp-2">{post.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-bold text-sky-700">{post.type === 'sell' ? `${post.price.toLocaleString('vi-VN')}đ` : post.type === 'trade' ? 'Trao đổi' : 'Quyên góp'}</p>
        <button onClick={() => onOpenDetail(post)} className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">Xem chi tiết</button>
      </div>
      {post.type === 'sell' && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => onBuyNow(post)} className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white">Mua ngay</button>
          <button onClick={() => onAddCart(post)} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white">Thêm vào giỏ</button>
        </div>
      )}
    </article>
  );
}
