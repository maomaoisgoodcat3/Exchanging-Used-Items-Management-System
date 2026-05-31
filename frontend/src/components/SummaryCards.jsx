export default function SummaryCards({ posts, campaigns }) {
  const pending = posts.filter((p) => p.status === 'pending' || p.status === 'resending').length + campaigns.filter((c) => c.status === 'pending' || c.status === 'resending').length;
  const successOrders = posts.filter((p) => p.status === 'approved' && p.type === 'sell').length;
  const cards = [
    { label: 'Tổng bài đăng', value: posts.length, tone: 'bg-sky-100 text-sky-700' },
    { label: 'Chiến dịch hoạt động', value: campaigns.filter((c) => c.timelineStatus === 'active').length, tone: 'bg-emerald-100 text-emerald-700' },
    { label: 'Chờ duyệt', value: pending, tone: 'bg-amber-100 text-amber-700' },
    { label: 'Giao dịch thành công', value: successOrders, tone: 'bg-fuchsia-100 text-fuchsia-700' },
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
