const statusClassMap = {
  Approved: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-700',
  Rejected: 'bg-rose-100 text-rose-700',
  Resending: 'bg-orange-100 text-orange-700',
};

export default function CampaignCard({ campaign, onViewPosts }) {
  const id = campaign.campaign_id || campaign.id;
  const status = campaign.approval || campaign.status || 'Pending';
  const startDate = campaign.start_date ? campaign.start_date.substring(0, 10) : campaign.startDate;
  const endDate = campaign.end_date ? campaign.end_date.substring(0, 10) : campaign.endDate;

  return (
    <article className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-slate-800">{campaign.title}</h3>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClassMap[status] || 'bg-slate-100'}`}>{status}</span>
      </div>
      <p className="mt-1 text-sm text-slate-500">Mã: {id} • {campaign.org_email || campaign.organizerName}</p>
      <p className="mt-2 text-sm text-slate-600 line-clamp-2">{campaign.description || campaign.goal}</p>
      <p className="mt-2 text-xs text-slate-500">{startDate} đến {endDate}</p>
      <button onClick={() => onViewPosts(id)} className="mt-3 w-full rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white">Xem bài đăng</button>
    </article>
  );
}