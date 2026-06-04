export default function PostDetailModal({ post, onClose, onBuyNow, onAddCart }) {
  if (!post) return null;
  
  const id = post.post_id || post.id;
  const type = post.post_type || post.type;
  const price = post.products?.[0]?.product_price || post.price || 0;
  const quantity = post.products?.[0]?.product_quantity || post.quantity || 1;
  const image = post.thumbnail_url || post.image_post_url || post.coverImage || `https://picsum.photos/500/300?random=${id}`;
  
  // Trích xuất tên sản phẩm từ mảng products của Backend
  const productList = post.products ? post.products.map(p => p.product_name || `Sản phẩm ${p.product_id}`) : (post.productList || []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/55 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-black text-slate-800">{post.title}</h2>
          <button onClick={onClose} className="rounded-lg bg-slate-100 px-3 py-1 text-sm">Đóng</button>
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <img src={image} alt={post.title} className="h-52 w-full rounded-2xl object-cover" />
          <div className="space-y-2 text-sm text-slate-700">
            <p><b>Mã bài đăng:</b> {id}</p>
            <p><b>Người đăng (Email):</b> {post.seller_email || post.sellerEmail}</p>
            <p><b>Chiến dịch ID:</b> {post.campaign_id || post.campaignId || 'Không có'}</p>
            <p><b>Mô tả:</b> {post.description}</p>
            <p><b>Giá:</b> {type === 'Selling' || type === 'sell' ? `${price.toLocaleString('vi-VN')}đ` : 'Không áp dụng'}</p>
            <p><b>Tổng số lượng:</b> {quantity}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="font-semibold text-slate-700">Danh sách sản phẩm</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
            {productList.length > 0 ? productList.map((item, idx) => <li key={idx}>{item}</li>) : <li>Chưa có chi tiết sản phẩm</li>}
          </ul>
        </div>
        {(type === 'Selling' || type === 'sell') && (
          <div className="mt-5 flex gap-2">
            <button onClick={() => onBuyNow(post)} className="rounded-xl bg-sky-500 px-4 py-2 font-semibold text-white">Mua ngay</button>
            <button onClick={() => onAddCart(post)} className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white">Thêm vào giỏ</button>
          </div>
        )}
        {(type === 'Trading' || type === 'trade') && <p className="mt-4 rounded-xl bg-amber-100 p-3 text-sm text-amber-700">Vui lòng liên hệ trực tiếp người đăng để thương lượng trao đổi.</p>}
        {(type === 'Donating' || type === 'donate') && <p className="mt-4 rounded-xl bg-emerald-100 p-3 text-sm text-emerald-700">Bài quyên góp thuộc chiến dịch, không hỗ trợ mua hàng hoặc thêm giỏ.</p>}
      </div>
    </div>
  );
}