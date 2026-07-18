import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { propertyAPI, transactionAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import toast from 'react-hot-toast';
import { PlusCircle, Eye, ShieldCheck, Clock, TrendingUp } from 'lucide-react';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [listings, setListings]         = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([propertyAPI.myListings(), transactionAPI.list()])
      .then(([l, t]) => { setListings(l.data.data); setTransactions(t.data.data); })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Active Listings', value: listings.filter(l => l.is_active).length, icon: Eye, color: 'text-blue-500 bg-blue-50' },
    { label: 'Verified', value: listings.filter(l => l.verification_status === 'verified').length, icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Pending Verification', value: listings.filter(l => l.verification_status === 'pending').length, icon: Clock, color: 'text-amber-500 bg-amber-50' },
    { label: 'Active Deals', value: transactions.filter(t => !['completed','cancelled'].includes(t.status)).length, icon: TrendingUp, color: 'text-purple-500 bg-purple-50' },
  ];

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 rounded-2xl" /><div className="h-64 bg-gray-200 rounded-2xl" /></div></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {user?.name || 'Owner'}</p>
        </div>
        <Link to="/list-property" className="btn-primary flex items-center gap-2">
          <PlusCircle size={16} /> List New Property
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Listings */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Listings</h2>
        {listings.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🏠</div>
            <p className="text-gray-500 mb-4">No listings yet</p>
            <Link to="/list-property" className="btn-primary inline-flex">Add your first property</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {p.photos?.[0] && <img src={p.photos[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.locality}, {p.city}</p>
                </div>
                <VerifiedBadge status={p.verification_status} />
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {p.transaction_type === 'rent' ? `₹${Number(p.rent_amount).toLocaleString('en-IN')}/mo` : `₹${(Number(p.sale_price)/100000).toFixed(1)}L`}
                  </p>
                  <p className="text-xs text-gray-400">{p.views_count} views</p>
                </div>
                <Link to={`/property/${p.id}`} className="text-primary text-xs font-medium hover:underline ml-2">View →</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Deals */}
      {transactions.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Deals</h2>
          <div className="space-y-3">
            {transactions.filter(t => !['completed','cancelled'].includes(t.status)).map(t => (
              <div key={t.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{t.title}</p>
                  <p className="text-xs text-gray-400">with {t.seeker_name}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-primary-50 text-primary rounded-full capitalize">{t.status.replace('_',' ')}</span>
                <Link to={`/transactions`} className="text-primary text-xs font-medium">Manage →</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
