export default function PostDetailModal({ post, onClose, onBuyNow, onAddCart }) {
  if (!post) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/55 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-black text-slate-800">{post.title}</h2>
          <button onClick={onClose} className="rounded-lg bg-slate-100 px-3 py-1 text-sm">Đóng</button>
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <img src={post.coverImage} alt={post.title} className="h-52 w-full rounded-2xl object-cover" />
          <div className="space-y-2 text-sm text-slate-700">
            <p><b>Mã bài đăng:</b> {post.id}</p>
            <p><b>Người đăng:</b> {post.sellerName}</p>
            <p><b>Email:</b> {post.sellerEmail}</p>
            <p><b>Số điện thoại:</b> {post.sellerPhone}</p>
            <p><b>Chiến dịch:</b> {post.campaignName || 'Không có'}</p>
            <p><b>Mô tả:</b> {post.description}</p>
            <p><b>Giá:</b> {post.type === 'sell' ? `${post.price.toLocaleString('vi-VN')}đ` : 'Không áp dụng'}</p>
            <p><b>Số lượng:</b> {post.quantity}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="font-semibold text-slate-700">Danh sách sản phẩm</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
            {post.productList.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[post.coverImage, ...post.images].slice(0, 8).map((img) => <img key={img} src={img} alt="preview" className="h-20 w-full rounded-xl object-cover" />)}
        </div>
        {post.type === 'sell' && (
          <div className="mt-5 flex gap-2">
            <button onClick={() => onBuyNow(post)} className="rounded-xl bg-sky-500 px-4 py-2 font-semibold text-white">Mua ngay</button>
            <button onClick={() => onAddCart(post)} className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white">Thêm vào giỏ</button>
          </div>
        )}
        {post.type === 'trade' && <p className="mt-4 rounded-xl bg-amber-100 p-3 text-sm text-amber-700">Vui lòng liên hệ trực tiếp người đăng để thương lượng trao đổi.</p>}
        {post.type === 'donate' && <p className="mt-4 rounded-xl bg-emerald-100 p-3 text-sm text-emerald-700">Bài quyên góp thuộc chiến dịch, không hỗ trợ mua hàng hoặc thêm giỏ.</p>}
      </div>
    </div>
  );
}
