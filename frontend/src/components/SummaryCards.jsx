export default function SummaryCards({ posts, campaigns }) {
  // Lọc theo "Pending" của Backend (hoặc "pending" cũ)
  const pending = 
    posts.filter((p) => p.approval === 'Pending' || p.approval === 'Resending' || p.status === 'pending').length + 
    campaigns.filter((c) => c.approval === 'Pending' || c.approval === 'Resending' || c.status === 'pending').length;
    
  const successOrders = posts.filter((p) => (p.approval === 'Approved' || p.status === 'approved') && (p.post_type === 'Selling' || p.type === 'sell')).length;
  
  const cards = [
    { label: 'Tổng bài đăng', value: posts.length, tone: 'bg-sky-100 text-sky-700' },
    { label: 'Chiến dịch (Hệ thống)', value: campaigns.length, tone: 'bg-emerald-100 text-emerald-700' },
    { label: 'Chờ duyệt', value: pending, tone: 'bg-amber-100 text-amber-700' },
    { label: 'Tin bán hàng (Đã duyệt)', value: successOrders, tone: 'bg-fuchsia-100 text-fuchsia-700' },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className={`mt-2 inline-flex rounded-xl px-3 py-1 text-2xl font-black ${card.tone}`}>{card.value}</p>
        </article>
      ))}
    </section>
  );
}