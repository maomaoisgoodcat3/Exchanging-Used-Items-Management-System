export default function HeaderBar({ activeRole, setActiveRole }) {
  return (
    <header className="sticky top-0 z-20 border-b border-sky-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm text-sky-500">🎒 Chợ đồ cũ học đường</p>
          <h1 className="text-lg font-black text-slate-800">Exchanging Used Items</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">Vai trò:</span>
          <select value={activeRole} onChange={(e) => setActiveRole(e.target.value)} className="rounded-xl border border-sky-200 px-3 py-2 text-sm">
            <option value="member">Member</option>
            <option value="organization">Organization</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
    </header>
  );
}
