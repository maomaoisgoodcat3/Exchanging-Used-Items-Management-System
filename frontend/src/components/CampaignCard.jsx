const statusClassMap = { approved: 'bg-emerald-100 text-emerald-700', pending: 'bg-amber-100 text-amber-700', rejected: 'bg-rose-100 text-rose-700', resending: 'bg-orange-100 text-orange-700' };

export default function CampaignCard({ campaign, onViewPosts }) {
  return (
    <article className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-slate-800">{campaign.title}</h3>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClassMap[campaign.status]}`}>{campaign.status}</span>
      </div>
      <p className="mt-1 text-sm text-slate-500">{campaign.id} • {campaign.organizerName}</p>
      <p className="mt-2 text-sm text-slate-600 line-clamp-2">{campaign.goal}</p>
      <p className="mt-2 text-xs text-slate-500">{campaign.startDate} đến {campaign.endDate}</p>
      <button onClick={() => onViewPosts(campaign.id)} className="mt-3 w-full rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white">Xem bài đăng trong chiến dịch</button>
    </article>
  );
}
