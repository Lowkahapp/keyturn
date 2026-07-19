import { useState, useEffect } from 'react';
import api from '../api/client';
import {
  Users, Building2, ShieldCheck, ArrowLeftRight,
  CheckCircle2, XCircle, Clock, TrendingUp,
  Search, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtPrice = (n) => n >= 10000000 ? `₹${(n/10000000).toFixed(1)}Cr` : n >= 100000 ? `₹${(n/100000).toFixed(0)}L` : `₹${fmt(n)}`;

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon size={20} />
    </div>
    <div className="text-2xl font-extrabold text-gray-900">{value}</div>
    <div className="text-sm font-medium text-gray-500 mt-0.5">{label}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    verified:   'bg-emerald-100 text-emerald-700',
    unverified: 'bg-gray-100 text-gray-600',
    pending:    'bg-yellow-100 text-yellow-700',
    rejected:   'bg-red-100 text-red-700',
    completed:  'bg-blue-100 text-blue-700',
    active:     'bg-green-100 text-green-700',
    submitted:  'bg-purple-100 text-purple-700',
    assigned:   'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({ page, total, limit, onChange }) => {
  const pages = Math.ceil(total / limit);
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
      <span>Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {fmt(total)}</span>
      <div className="flex gap-2">
        <button disabled={page === 1} onClick={() => onChange(page - 1)}
          className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
          <ChevronLeft size={16} />
        </button>
        <button disabled={page >= pages} onClick={() => onChange(page + 1)}
          className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',       label: 'Overview',       icon: TrendingUp },
  { key: 'properties',     label: 'Properties',     icon: Building2 },
  { key: 'users',          label: 'Users',          icon: Users },
  { key: 'verifications',  label: 'Verifications',  icon: ShieldCheck },
  { key: 'transactions',   label: 'Transactions',   icon: ArrowLeftRight },
];

export default function AdminDashboard() {
  const [tab, setTab]           = useState('overview');
  const [stats, setStats]       = useState(null);
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('');
  const LIMIT = 15;

  const loadStats = async () => {
    const res = await api.get('/admin/stats');
    setStats(res.data.data);
  };

  const loadData = async (t = tab, p = page) => {
    if (t === 'overview') return;
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT };
      if (search) params.search = search;
      if (filter) {
        if (t === 'users')         params.user_type            = filter;
        if (t === 'properties')    params.verification_status  = filter;
        if (t === 'verifications') params.status               = filter;
        if (t === 'transactions')  params.status               = filter;
      }
      const res = await api.get(`/admin/${t}`, { params });
      setData(res.data.data);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { setPage(1); loadData(tab, 1); }, [tab, filter]);
  useEffect(() => { loadData(tab, page); }, [page]);

  const switchTab = (t) => { setTab(t); setSearch(''); setFilter(''); setData([]); setTotal(0); };

  const updateProperty = async (id, body) => {
    await api.patch(`/admin/properties/${id}`, body);
    loadData();
  };

  const updateUser = async (id, body) => {
    await api.patch(`/admin/users/${id}`, body);
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">KeyTurn platform management</p>
        </div>
        <button onClick={() => { loadStats(); loadData(); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => switchTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
      {tab === 'overview' && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users}          label="Total Users"       value={fmt(stats.users.total)}
              sub={`${fmt(stats.users.owners)} owners · ${fmt(stats.users.seekers)} seekers`}
              color="bg-blue-50 text-blue-600" />
            <StatCard icon={Building2}      label="Active Listings"   value={fmt(stats.properties.total)}
              sub={`${fmt(stats.properties.verified)} verified`}
              color="bg-emerald-50 text-emerald-600" />
            <StatCard icon={ArrowLeftRight} label="Transactions"      value={fmt(stats.transactions.total)}
              sub={`${fmt(stats.transactions.completed)} completed`}
              color="bg-purple-50 text-purple-600" />
            <StatCard icon={ShieldCheck}    label="Verifications"     value={fmt(stats.verifications.total)}
              sub={`${fmt(stats.verifications.pending)} pending review`}
              color="bg-orange-50 text-orange-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-4">Listings Breakdown</h3>
              {[
                { label: 'Verified',   value: stats.properties.verified,   color: 'bg-emerald-500' },
                { label: 'Unverified', value: stats.properties.unverified, color: 'bg-gray-300' },
                { label: 'Rentals',    value: stats.properties.rentals,    color: 'bg-blue-400' },
                { label: 'Sales',      value: stats.properties.sales,      color: 'bg-purple-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{fmt(value)}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-4">User Breakdown</h3>
              {[
                { label: 'Owners',   value: stats.users.owners,  color: 'bg-green-400' },
                { label: 'Seekers',  value: stats.users.seekers, color: 'bg-blue-400' },
                { label: 'Scouts',   value: stats.users.scouts,  color: 'bg-orange-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{fmt(value)}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Review pending verifications', tab: 'verifications', filter: 'submitted' },
                  { label: 'View unverified listings',     tab: 'properties',    filter: 'unverified' },
                  { label: 'Manage users',                 tab: 'users',         filter: '' },
                  { label: 'View all transactions',        tab: 'transactions',  filter: '' },
                ].map(a => (
                  <button key={a.label}
                    onClick={() => { switchTab(a.tab); setFilter(a.filter); }}
                    className="w-full text-left text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors">
                    → {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROPERTIES ────────────────────────────────────────────────────── */}
      {tab === 'properties' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Search title or locality..." value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadData()} />
            </div>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
              value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  {['Property','Owner','City','Type','Price','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : data.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.photos?.[0] && <img src={p.photos[0]} className="w-10 h-10 rounded-lg object-cover" />}
                        <div>
                          <div className="font-medium text-gray-800 max-w-[200px] truncate">{p.title}</div>
                          <div className="text-xs text-gray-400">{p.locality}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.owner_name}<div className="text-xs text-gray-400">{p.owner_phone}</div></td>
                    <td className="px-4 py-3 text-gray-600">{p.city}</td>
                    <td className="px-4 py-3"><span className="capitalize text-gray-600">{p.transaction_type}</span></td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {p.transaction_type === 'rent' ? `₹${fmt(p.rent_amount)}/mo` : fmtPrice(p.sale_price)}
                    </td>
                    <td className="px-4 py-3"><Badge status={p.verification_status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {p.verification_status !== 'verified' && (
                          <button onClick={() => updateProperty(p.id, { verification_status: 'verified' })}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Verify">
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button onClick={() => updateProperty(p.id, { is_active: !p.is_active })}
                          className={`p-1.5 rounded-lg ${p.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                          title={p.is_active ? 'Deactivate' : 'Activate'}>
                          {p.is_active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
          </div>
        </div>
      )}

      {/* ── USERS ─────────────────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Search name, phone or email..." value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadData()} />
            </div>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
              value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="owner">Owners</option>
              <option value="seeker">Seekers</option>
              <option value="scout">Scouts</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  {['Name','Phone','Role','KYC','Joined','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : data.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{u.name || '—'}</div>
                      <div className="text-xs text-gray-400">{u.email || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.phone}</td>
                    <td className="px-4 py-3"><Badge status={u.user_type} /></td>
                    <td className="px-4 py-3"><Badge status={u.kyc_status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {u.kyc_status !== 'verified' && (
                          <button onClick={() => updateUser(u.id, { kyc_status: 'verified' })}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Verify KYC">
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                          className={`p-1.5 rounded-lg ${u.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}>
                          {u.is_active !== false ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
          </div>
        </div>
      )}

      {/* ── VERIFICATIONS ─────────────────────────────────────────────────── */}
      {tab === 'verifications' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex gap-3">
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
              value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  {['Property','Location','Scout','Scheduled','Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">No verifications yet</td></tr>
                ) : data.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{v.property_title}</td>
                    <td className="px-4 py-3 text-gray-600">{v.locality}, {v.city}</td>
                    <td className="px-4 py-3 text-gray-600">{v.scout_name || <span className="text-gray-400">Unassigned</span>}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {v.scheduled_at ? new Date(v.scheduled_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3"><Badge status={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS ──────────────────────────────────────────────────── */}
      {tab === 'transactions' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex gap-3">
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
              value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="interest_shown">Interest Shown</option>
              <option value="negotiating">Negotiating</option>
              <option value="agreed">Agreed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  {['Property','Owner','Seeker','Type','Value','KeyTurn Fee','Status','Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">No transactions yet</td></tr>
                ) : data.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px] truncate">{t.property_title}</td>
                    <td className="px-4 py-3 text-gray-600">{t.owner_name}</td>
                    <td className="px-4 py-3 text-gray-600">{t.seeker_name}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{t.transaction_type}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {t.transaction_type === 'rent' ? `₹${fmt(t.agreed_rent)}/mo` : fmtPrice(t.agreed_sale_price)}
                    </td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">
                      {t.keyturn_fee ? fmtPrice(t.keyturn_fee) : '—'}
                    </td>
                    <td className="px-4 py-3"><Badge status={t.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}