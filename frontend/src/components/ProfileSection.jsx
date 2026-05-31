export default function ProfileSection({ profile, setProfile, cart, wishlist, orders, myPosts }) {
  return (
    <section className="mt-8 grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h3 className="font-black text-slate-800">Hồ sơ người dùng</h3>
        <div className="mt-3 space-y-2 text-sm">
          <input className="w-full rounded-xl border p-2" value={profile.fullName} onChange={(e) => setProfile((s) => ({ ...s, fullName: e.target.value }))} />
          <input className="w-full rounded-xl border p-2" value={profile.email} onChange={(e) => setProfile((s) => ({ ...s, email: e.target.value }))} />
          <input className="w-full rounded-xl border p-2" value={profile.phone} onChange={(e) => setProfile((s) => ({ ...s, phone: e.target.value }))} />
          <input className="w-full rounded-xl border p-2" value={profile.className} onChange={(e) => setProfile((s) => ({ ...s, className: e.target.value }))} />
        </div>
        <div className="mt-4 rounded-xl bg-sky-50 p-3 text-sm text-sky-700">Đổi mật khẩu (mock): <input className="ml-2 rounded border p-1" placeholder="Mật khẩu mới" /></div>
      </article>
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h3 className="font-black text-slate-800">Giỏ hàng / Wishlist</h3>
        <p className="mt-2 text-sm font-semibold">Giỏ hàng ({cart.length})</p>
        <ul className="mt-1 text-sm text-slate-600">{cart.map((item) => <li key={item.id}>• {item.title}</li>)}</ul>
        <p className="mt-3 text-sm font-semibold">Wishlist</p>
        <ul className="mt-1 text-sm text-slate-600">{wishlist.map((item) => <li key={item}>• {item}</li>)}</ul>
        <p className="mt-3 text-sm font-semibold">Đơn hàng / Giao dịch</p>
        <ul className="mt-1 text-sm text-slate-600">{orders.map((item) => <li key={item.id}>{item.id} - {item.item} - {item.amount.toLocaleString('vi-VN')}đ - {item.status}</li>)}</ul>
      </article>
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 lg:col-span-2">
        <h3 className="font-black text-slate-800">Bài đăng của tôi</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {myPosts.map((post) => (
            <div key={post.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-semibold">{post.title}</p>
              <p className="text-slate-500">{post.id} • {post.status}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
