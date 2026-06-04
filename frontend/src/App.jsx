import { useEffect, useMemo, useState } from 'react';
import HeaderBar from './components/HeaderBar';
import SummaryCards from './components/SummaryCards';
import PostCard from './components/PostCard';
import CampaignCard from './components/CampaignCard';
import PostDetailModal from './components/PostDetailModal';
import ProfileSection from './components/ProfileSection';
import AdminSection from './components/AdminSection';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export default function App() {
  // ==========================================
  // 1. STATE XÁC THỰC & ĐĂNG NHẬP
  // ==========================================
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [activeRole, setActiveRole] = useState('member');
  const [activeTab, setActiveTab] = useState('posts');

  // ==========================================
  // 2. STATE DỮ LIỆU THỰC TẾ (TRỐNG HOÀN TOÀN)
  // ==========================================
  const [posts, setPosts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [profile, setProfile] = useState({});
  const [serviceFee, setServiceFee] = useState(0);

  // Lọc & Modal
  const [postSearch, setPostSearch] = useState('');
  const [postType, setPostType] = useState('all');
  const [postSort, setPostSort] = useState('newest');
  const [campaignFilterId, setCampaignFilterId] = useState('');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignStatus, setCampaignStatus] = useState('all');
  const [campaignSort, setCampaignSort] = useState('newest');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);

  // ==========================================
  // 3. XỬ LÝ ĐĂNG NHẬP (OAUTH2)
  // ==========================================
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', loginEmail);
      formData.append('password', loginPassword);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);
      } else {
        alert('Đăng nhập thất bại! Sai email hoặc mật khẩu.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  // ==========================================
  // 4. TẢI DỮ LIỆU TỪ BACKEND
  // ==========================================
  useEffect(() => {
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };

    const loadRealData = async () => {
      try {
        const [profRes, postRes, campRes, transRes, feeRes] = await Promise.all([
          fetch(`${API_BASE}/users/me`, { headers }),
          fetch(`${API_BASE}/posts`, { headers }),
          fetch(`${API_BASE}/campaigns`, { headers }),
          fetch(`${API_BASE}/transactions`, { headers }),
          fetch(`${API_BASE}/transactions/settings/system`, { headers })
        ]);

        if (profRes.ok) {
          const pData = await profRes.json();
          setProfile(pData);
          setActiveRole(pData.role?.toLowerCase() || 'member');
        }
        if (postRes.ok) setPosts(await postRes.json());
        if (campRes.ok) setCampaigns(await campRes.json());
        if (transRes.ok) setOrders(await transRes.json());
        if (feeRes.ok) {
          const feeData = await feeRes.json();
          setServiceFee(feeData.setting_value || 0);
        }
      } catch (error) {
        console.error("Lỗi đồng bộ dữ liệu:", error);
      }
    };
    loadRealData();
  }, [token]);

  // ==========================================
  // 5. GIAO DIỆN ĐĂNG NHẬP
  // ==========================================
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="mb-2 text-center text-2xl font-black text-sky-600">Marketplace</h2>
          <p className="mb-6 text-center text-sm text-slate-500">Đăng nhập để xem dữ liệu thật</p>
          <div className="space-y-4">
            <input value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} type="email" placeholder="Email" className="w-full rounded-xl border p-3 text-sm" required />
            <input value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} type="password" placeholder="Mật khẩu" className="w-full rounded-xl border p-3 text-sm" required />
            <button type="submit" className="w-full rounded-xl bg-sky-500 py-3 font-bold text-white hover:bg-sky-600">Vào hệ thống</button>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">Gợi ý: Dùng http://127.0.0.1:8000/docs để tạo tài khoản trước nếu chưa có.</p>
        </form>
      </div>
    );
  }

  // ==========================================
  // LOGIC LỌC DỮ LIỆU
  // ==========================================
  const filteredPosts = useMemo(() => posts
    .filter((p) => p.approval === 'Approved' || p.status === 'approved')
    .filter((p) => (p.title + p.post_id).toLowerCase().includes(postSearch.toLowerCase()))
    .filter((p) => postType === 'all' ? true : p.post_type === postType)
    .filter((p) => campaignFilterId ? p.campaign_id === campaignFilterId : true), 
    [posts, postSearch, postType, campaignFilterId]);

  const filteredCampaigns = useMemo(() => campaigns
    .filter((c) => c.approval === 'Approved' || c.status === 'approved')
    .filter((c) => (c.title + c.campaign_id).toLowerCase().includes(campaignSearch.toLowerCase()))
    .filter((c) => campaignStatus === 'all' ? true : c.approval === campaignStatus),
    [campaigns, campaignSearch, campaignStatus]);

  const myPosts = posts.filter((p) => p.seller_email === profile.email);
  const pendingPosts = posts.filter((p) => ['Pending', 'Resending'].includes(p.approval));
  const pendingCampaigns = campaigns.filter((c) => ['Pending', 'Resending'].includes(c.approval));

  // ==========================================
  // GỌI API TƯƠNG TÁC (CÓ TOKEN)
  // ==========================================
  const fetchAuth = (endpoint, method, body) => fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body)
  });

  const handleBuyNow = async (post) => {
    try {
      const res = await fetchAuth('/transactions', 'POST', {
        post_id: post.post_id,
        requester_email: profile.email,
        products: [{ product_id: post.products?.[0]?.product_id || 1, quantity: 1, product_source: 'Poster' }]
      });
      if (res.ok) {
        alert('Giao dịch thành công!');
        const freshOrders = await fetch(`${API_BASE}/transactions`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r=>r.json());
        setOrders(freshOrders);
      }
    } catch (err) { console.error(err); }
  };

  const handleAddCart = (post) => setCart((prev) => [...prev, post]);
  const handleApprovePost = (id) => setPosts((prev) => prev.map((p) => p.post_id === id ? { ...p, approval: 'Approved' } : p));
  const handleRejectPost = (id) => setPosts((prev) => prev.map((p) => p.post_id === id ? { ...p, approval: 'Rejected' } : p));
  const handleApproveCampaign = (id) => setCampaigns((prev) => prev.map((c) => c.campaign_id === id ? { ...c, approval: 'Approved' } : c));
  const handleRejectCampaign = (id) => setCampaigns((prev) => prev.map((c) => c.campaign_id === id ? { ...c, approval: 'Rejected' } : c));

  return (
    <div className="min-h-screen text-slate-900">
      <div className="bg-white/90 border-b flex justify-between items-center px-4 py-2 sticky top-0 z-30">
        <HeaderBar activeRole={activeRole} setActiveRole={setActiveRole} />
        <button onClick={handleLogout} className="text-sm font-semibold text-rose-500 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg">Đăng xuất</button>
      </div>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-4">
        <SummaryCards posts={posts} campaigns={campaigns} />

        <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-sky-100">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button onClick={() => setActiveTab('posts')} className={`rounded-xl px-3 py-2 text-sm font-bold ${activeTab === 'posts' ? 'bg-sky-500 text-white' : 'bg-sky-100 text-sky-700'}`}>Bài đăng</button>
            <button onClick={() => setActiveTab('campaigns')} className={`rounded-xl px-3 py-2 text-sm font-bold ${activeTab === 'campaigns' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'}`}>Chiến dịch</button>
          </div>

          {activeTab === 'posts' && (
            <>
              <div className="grid gap-2 md:grid-cols-5">
                <input value={postSearch} onChange={(e) => setPostSearch(e.target.value)} placeholder="Tìm bài đăng" className="rounded-xl border p-2 text-sm md:col-span-2" />
                <select value={postType} onChange={(e) => setPostType(e.target.value)} className="rounded-xl border p-2 text-sm"><option value="all">Tất cả</option><option value="Selling">Bán</option><option value="Trading">Trao đổi</option><option value="Donating">Quyên góp</option></select>
                <button onClick={() => { setPostSearch(''); setPostType('all'); setCampaignFilterId(''); }} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">Reset lọc</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => setShowCreatePost(true)} className="rounded-xl bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white">+ Tạo bài đăng</button>
                {campaignFilterId && <p className="rounded-xl bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700">Đang lọc chiến dịch: {campaignFilterId}</p>}
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredPosts.length === 0 ? <p className="text-slate-500 col-span-full py-5 text-center">Chưa có dữ liệu.</p> : filteredPosts.map((post) => <PostCard key={post.post_id} post={post} onOpenDetail={setSelectedPost} onBuyNow={handleBuyNow} onAddCart={handleAddCart} />)}
              </div>
            </>
          )}

          {activeTab === 'campaigns' && (
            <>
              <div className="mt-2 flex gap-2"><button onClick={() => setShowCreateCampaign(true)} className="rounded-xl bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white">+ Tạo chiến dịch</button></div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredCampaigns.length === 0 ? <p className="text-slate-500 col-span-full py-5 text-center">Chưa có dữ liệu.</p> : filteredCampaigns.map((campaign) => <CampaignCard key={campaign.campaign_id} campaign={campaign} onViewPosts={(id) => { setCampaignFilterId(id); setActiveTab('posts'); }} />)}
              </div>
            </>
          )}
        </section>

        <ProfileSection profile={profile} setProfile={setProfile} cart={cart} wishlist={wishlist} orders={orders} myPosts={myPosts} />

        {activeRole === 'admin' && (
          <AdminSection pendingPosts={pendingPosts} pendingCampaigns={pendingCampaigns} onApprovePost={handleApprovePost} onRejectPost={handleRejectPost} onApproveCampaign={handleApproveCampaign} onRejectCampaign={handleRejectCampaign} serviceFee={serviceFee} setServiceFee={setServiceFee} />
        )}
      </main>

      {selectedPost && <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} onBuyNow={handleBuyNow} onAddCart={handleAddCart} />}

      {/* FORM TẠO BÀI ĐĂNG THẬT (KHÔNG CÒN MOCK TEXT) */}
      {showCreatePost && (
        <SimpleModal title="Đăng bài mới" onClose={() => setShowCreatePost(false)}>
          <CreatePostForm
            campaigns={campaigns.filter((c) => c.approval === 'Approved')}
            userEmail={profile.email}
            onSubmit={async (data) => {
              const res = await fetchAuth('/posts', 'POST', data);
              if (res.ok) {
                const newPost = await res.json();
                setPosts((prev) => [newPost, ...prev]);
                setShowCreatePost(false);
              }
            }}
          />
        </SimpleModal>
      )}

      {/* FORM TẠO CHIẾN DỊCH THẬT */}
      {showCreateCampaign && (
        <SimpleModal title="Tạo chiến dịch" onClose={() => setShowCreateCampaign(false)}>
          <CreateCampaignForm 
            userEmail={profile.email}
            onSubmit={async (data) => {
              const res = await fetchAuth('/campaigns', 'POST', data);
              if (res.ok) {
                const newCamp = await res.json();
                setCampaigns((prev) => [newCamp, ...prev]);
                setShowCreateCampaign(false);
              }
          }} />
        </SimpleModal>
      )}
    </div>
  );
}

function SimpleModal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-bold">{title}</h3><button onClick={onClose} className="rounded bg-slate-100 px-3 py-1 text-sm">Đóng</button></div>{children}</div></div>;
}

// FORM TẠO BÀI ĐĂNG KHÔNG MOCK
function CreatePostForm({ campaigns, onSubmit, userEmail }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Selling');
  const [desc, setDesc] = useState('');
  const [prodName, setProdName] = useState('');
  const [catId, setCatId] = useState(1);
  const [price, setPrice] = useState(0);
  const [qty, setQty] = useState(1);
  const [campaignId, setCampaignId] = useState('');

  return (
    <div className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề bài đăng" className="w-full rounded-xl border p-2" />
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả chi tiết" className="w-full rounded-xl border p-2" rows={2} />
      <div className="grid grid-cols-2 gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border p-2"><option value="Selling">Bán</option><option value="Trading">Trao đổi</option><option value="Donating">Quyên góp</option></select>
        <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="w-full rounded-xl border p-2"><option value="">Không thuộc chiến dịch</option>{campaigns.map((c) => <option key={c.campaign_id} value={c.campaign_id}>{c.title}</option>)}</select>
      </div>
      <p className="font-semibold text-sm text-slate-700 mt-2">Thông tin sản phẩm</p>
      <input value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="Tên sản phẩm" className="w-full rounded-xl border p-2" />
      <div className="grid grid-cols-3 gap-2">
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Giá" className="w-full rounded-xl border p-2" />
          <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} placeholder="Số lượng" className="w-full rounded-xl border p-2" />
          <input type="number" value={catId} onChange={(e) => setCatId(Number(e.target.value))} placeholder="ID Danh mục" className="w-full rounded-xl border p-2" title="ID danh mục sản phẩm (Vd: 1)" />
      </div>
      <button 
        onClick={() => onSubmit({
          title, description: desc, post_type: type, campaign_id: campaignId ? parseInt(campaignId) : null, seller_email: userEmail,
          products: [{ product_category_id: parseInt(catId), product_name: prodName, product_quantity: parseInt(qty), product_price: parseFloat(price) }]
        })}
        className="w-full mt-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white">Đăng bài
      </button>
    </div>
  );
}

// FORM TẠO CHIẾN DỊCH KHÔNG MOCK
function CreateCampaignForm({ onSubmit, userEmail }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <div className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên chiến dịch" className="w-full rounded-xl border p-2" />
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả / Mục tiêu" className="w-full rounded-xl border p-2" rows={2} />
      <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs text-slate-500">Ngày bắt đầu</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border p-2" /></div>
          <div><label className="text-xs text-slate-500">Ngày kết thúc</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border p-2" /></div>
      </div>
      <button 
        onClick={() => onSubmit({ org_email: userEmail, title, description: desc, start_date: new Date(startDate).toISOString(), end_date: new Date(endDate).toISOString() })}
        className="w-full mt-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white">Tạo chiến dịch
      </button>
    </div>
  );
}