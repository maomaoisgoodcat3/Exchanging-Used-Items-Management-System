import { useMemo, useState } from 'react';
import HeaderBar from './components/HeaderBar';
import SummaryCards from './components/SummaryCards';
import PostCard from './components/PostCard';
import CampaignCard from './components/CampaignCard';
import PostDetailModal from './components/PostDetailModal';
import ProfileSection from './components/ProfileSection';
import AdminSection from './components/AdminSection';
import { campaignsSeed, postsSeed, initialOrders, initialProfile, initialWishlist } from './data/mockData';

export default function App() {
  const [activeRole, setActiveRole] = useState('member');
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState(postsSeed);
  const [campaigns, setCampaigns] = useState(campaignsSeed);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(initialOrders);
  const [wishlist] = useState(initialWishlist);
  const [profile, setProfile] = useState(initialProfile);
  const [serviceFee, setServiceFee] = useState(3);

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

  const filteredPosts = useMemo(() => posts
    .filter((p) => p.status === 'approved')
    .filter((p) => (p.title + p.id + p.sellerName).toLowerCase().includes(postSearch.toLowerCase()))
    .filter((p) => postType === 'all' ? true : p.type === postType)
    .filter((p) => campaignFilterId ? p.campaignId === campaignFilterId : true)
    .sort((a, b) => postSort === 'newest' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id)), [posts, postSearch, postType, postSort, campaignFilterId]);

  const filteredCampaigns = useMemo(() => campaigns
    .filter((c) => c.status === 'approved')
    .filter((c) => (c.title + c.id + c.organizerName).toLowerCase().includes(campaignSearch.toLowerCase()))
    .filter((c) => campaignStatus === 'all' ? true : c.status === campaignStatus)
    .sort((a, b) => campaignSort === 'newest' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id)), [campaigns, campaignSearch, campaignStatus, campaignSort]);

  const myPosts = posts.filter((p) => p.sellerEmail === profile.email);
  const pendingPosts = posts.filter((p) => p.status === 'pending' || p.status === 'resending');
  const pendingCampaigns = campaigns.filter((c) => c.status === 'pending' || c.status === 'resending');

  const handleBuyNow = (post) => {
    const total = post.price + Math.round((post.price * serviceFee) / 100);
    setOrders((prev) => [{ id: `OD${String(prev.length + 1).padStart(3, '0')}`, item: post.title, amount: total, status: 'Mới tạo' }, ...prev]);
    alert(`Đã tạo đơn cho ${post.title}`);
  };

  const handleAddCart = (post) => setCart((prev) => [...prev, post]);

  const handleApprovePost = (id) => setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: 'approved' } : p));
  const handleRejectPost = (id) => setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: 'rejected' } : p));
  const handleApproveCampaign = (id) => setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: 'approved' } : c));
  const handleRejectCampaign = (id) => setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: 'rejected' } : c));

  return (
    <div className="min-h-screen">
      <HeaderBar activeRole={activeRole} setActiveRole={setActiveRole} />
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
                <select value={postType} onChange={(e) => setPostType(e.target.value)} className="rounded-xl border p-2 text-sm"><option value="all">Tất cả loại</option><option value="sell">Bán</option><option value="trade">Trao đổi</option><option value="donate">Quyên góp</option></select>
                <select value={postSort} onChange={(e) => setPostSort(e.target.value)} className="rounded-xl border p-2 text-sm"><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option></select>
                <button onClick={() => { setPostSearch(''); setPostType('all'); setPostSort('newest'); setCampaignFilterId(''); }} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">Reset lọc</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => setShowCreatePost(true)} className="rounded-xl bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white">+ Tạo bài đăng</button>
                {campaignFilterId && <p className="rounded-xl bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700">Đang lọc theo chiến dịch: {campaignFilterId}</p>}
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredPosts.map((post) => <PostCard key={post.id} post={post} onOpenDetail={setSelectedPost} onBuyNow={handleBuyNow} onAddCart={handleAddCart} />)}
              </div>
            </>
          )}

          {activeTab === 'campaigns' && (
            <>
              <div className="grid gap-2 md:grid-cols-5">
                <input value={campaignSearch} onChange={(e) => setCampaignSearch(e.target.value)} placeholder="Tìm chiến dịch" className="rounded-xl border p-2 text-sm md:col-span-2" />
                <select value={campaignStatus} onChange={(e) => setCampaignStatus(e.target.value)} className="rounded-xl border p-2 text-sm"><option value="all">Tất cả trạng thái</option><option value="approved">Đã duyệt</option><option value="pending">Chờ duyệt</option><option value="resending">Gửi lại</option></select>
                <select value={campaignSort} onChange={(e) => setCampaignSort(e.target.value)} className="rounded-xl border p-2 text-sm"><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option></select>
                <button onClick={() => { setCampaignSearch(''); setCampaignStatus('all'); setCampaignSort('newest'); }} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">Reset lọc</button>
              </div>
              <div className="mt-2 flex gap-2"><button onClick={() => setShowCreateCampaign(true)} className="rounded-xl bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white">+ Tạo chiến dịch</button></div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredCampaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} onViewPosts={(campaignId) => { setCampaignFilterId(campaignId); setActiveTab('posts'); }} />)}
              </div>
            </>
          )}
        </section>

        <ProfileSection profile={profile} setProfile={setProfile} cart={cart} wishlist={wishlist} orders={orders} myPosts={myPosts} />

        {activeRole === 'admin' && (
          <AdminSection
            pendingPosts={pendingPosts}
            pendingCampaigns={pendingCampaigns}
            onApprovePost={handleApprovePost}
            onRejectPost={handleRejectPost}
            onApproveCampaign={handleApproveCampaign}
            onRejectCampaign={handleRejectCampaign}
            serviceFee={serviceFee}
            setServiceFee={setServiceFee}
          />
        )}
      </main>

      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} onBuyNow={handleBuyNow} onAddCart={handleAddCart} />

      {showCreatePost && (
        <SimpleModal title="Tạo bài đăng" onClose={() => setShowCreatePost(false)}>
          <CreatePostForm
            campaigns={campaigns.filter((c) => c.status === 'approved')}
            onSubmit={(data) => {
              const nextId = `P${String(posts.length + 1).padStart(3, '0')}`;
              setPosts((prev) => [{ ...data, id: nextId, status: 'pending' }, ...prev]);
              setShowCreatePost(false);
            }}
          />
        </SimpleModal>
      )}

      {showCreateCampaign && (
        <SimpleModal title="Tạo chiến dịch" onClose={() => setShowCreateCampaign(false)}>
          <CreateCampaignForm onSubmit={(data) => {
            const nextId = `CP${String(campaigns.length + 1).padStart(3, '0')}`;
            setCampaigns((prev) => [{ ...data, id: nextId, status: 'pending', timelineStatus: 'active' }, ...prev]);
            setShowCreateCampaign(false);
          }} />
        </SimpleModal>
      )}
    </div>
  );
}

function SimpleModal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-bold">{title}</h3><button onClick={onClose} className="rounded bg-slate-100 px-3 py-1 text-sm">Đóng</button></div>{children}</div></div>;
}

function CreatePostForm({ campaigns, onSubmit }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('sell');
  const [price, setPrice] = useState(0);
  const [campaignId, setCampaignId] = useState('');
  const campaignName = campaigns.find((c) => c.id === campaignId)?.title || '';
  return (
    <div className="space-y-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" className="w-full rounded-xl border p-2" />
      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border p-2"><option value="sell">Bán</option><option value="trade">Trao đổi</option><option value="donate">Quyên góp</option></select>
      <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value || 0))} className="w-full rounded-xl border p-2" placeholder="Giá" />
      <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="w-full rounded-xl border p-2"><option value="">Không thuộc chiến dịch</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
      <button onClick={() => onSubmit({ title, type, price, quantity: 1, sellerName: profileFallback.fullName, sellerEmail: profileFallback.email, sellerPhone: profileFallback.phone, campaignId, campaignName, description: 'Bài mới tạo từ form', productList: ['Sản phẩm'], coverImage: 'https://picsum.photos/500/300?newpost', images: [] })} className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white">Gửi bài đăng</button>
    </div>
  );
}

function CreateCampaignForm({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  return <div className="space-y-2"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên chiến dịch" className="w-full rounded-xl border p-2" /><textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Mục tiêu" className="w-full rounded-xl border p-2" /><button onClick={() => onSubmit({ title, goal, description: goal, organizerName: 'Đại diện tổ chức', organizerEmail: 'org@school.vn', startDate: '2026-06-01', endDate: '2026-07-01' })} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white">Gửi chiến dịch</button></div>;
}

const profileFallback = { fullName: 'Người dùng mới', email: 'user@school.vn', phone: '0900000000' };
