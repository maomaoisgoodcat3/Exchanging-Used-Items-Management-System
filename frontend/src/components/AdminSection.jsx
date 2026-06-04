export default function AdminSection({ pendingPosts, pendingCampaigns, onApprovePost, onRejectPost, onApproveCampaign, onRejectCampaign, serviceFee, setServiceFee }) {
  return (
    <section className="mt-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <h3 className="font-black text-slate-800">Khu vực duyệt bài (Admin)</h3>
      <div className="mt-3 rounded-xl bg-fuchsia-50 p-3 text-sm text-fuchsia-700">
        Phí dịch vụ hệ thống: 
        <input type="number" min="0" className="mx-2 w-24 rounded border p-1" value={serviceFee} onChange={(e) => setServiceFee(Number(e.target.value || 0))} />%
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="font-semibold">Bài đăng chờ duyệt/gửi lại</p>
          {pendingPosts.length === 0 && <p className="mt-2 text-slate-500 text-sm">Không có bài đăng nào cần duyệt.</p>}
          {pendingPosts.map((post) => {
            const id = post.post_id || post.id;
            const status = post.approval || post.status;
            return (
              <div key={id} className="mt-2 rounded-xl bg-slate-50 p-3 text-sm">
                <p className="font-semibold">{post.title}</p>
                <p className="text-slate-500">Mã: {id} • {status}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => onApprovePost(id)} className="rounded-lg bg-emerald-500 px-3 py-1 text-white hover:bg-emerald-600">Duyệt</button>
                  <button onClick={() => onRejectPost(id)} className="rounded-lg bg-rose-500 px-3 py-1 text-white hover:bg-rose-600">Từ chối</button>
                </div>
              </div>
            );
          })}
        </div>
        <div>
          <p className="font-semibold">Chiến dịch chờ duyệt/gửi lại</p>
          {pendingCampaigns.length === 0 && <p className="mt-2 text-slate-500 text-sm">Không có chiến dịch nào cần duyệt.</p>}
          {pendingCampaigns.map((campaign) => {
            const id = campaign.campaign_id || campaign.id;
            const status = campaign.approval || campaign.status;
            return (
              <div key={id} className="mt-2 rounded-xl bg-slate-50 p-3 text-sm">
                <p className="font-semibold">{campaign.title}</p>
                <p className="text-slate-500">Mã: {id} • {status}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => onApproveCampaign(id)} className="rounded-lg bg-emerald-500 px-3 py-1 text-white hover:bg-emerald-600">Duyệt</button>
                  <button onClick={() => onRejectCampaign(id)} className="rounded-lg bg-rose-500 px-3 py-1 text-white hover:bg-rose-600">Từ chối</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}