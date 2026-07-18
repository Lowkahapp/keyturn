import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transactionAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ChevronRight, IndianRupee } from 'lucide-react';

const STATUS_LABELS = {
  interest_shown:   { label: 'Interest Shown',    color: 'bg-blue-50 text-blue-700' },
  negotiating:      { label: 'Negotiating',        color: 'bg-amber-50 text-amber-700' },
  agreed:           { label: 'Terms Agreed',       color: 'bg-purple-50 text-purple-700' },
  escrow_initiated: { label: 'Escrow Initiated',   color: 'bg-indigo-50 text-indigo-700' },
  escrow_funded:    { label: 'Escrow Funded',      color: 'bg-teal-50 text-teal-700' },
  agreement_signed: { label: 'Agreement Signed',   color: 'bg-emerald-50 text-emerald-700' },
  handover_done:    { label: 'Handover Done',      color: 'bg-green-50 text-green-700' },
  completed:        { label: 'Completed ✓',        color: 'bg-emerald-100 text-emerald-800' },
  cancelled:        { label: 'Cancelled',          color: 'bg-red-50 text-red-700' },
};

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('active');

  useEffect(() => {
    transactionAPI.list()
      .then(r => setTransactions(r.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'active'
    ? transactions.filter(t => !['completed','cancelled'].includes(t.status))
    : filter === 'completed'
    ? transactions.filter(t => t.status === 'completed')
    : transactions;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Transactions</h1>

      <div className="flex gap-2 mb-6">
        {['active','completed','all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-xl capitalize transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500">No {filter} transactions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(tx => {
            const statusInfo = STATUS_LABELS[tx.status] || { label: tx.status, color: 'bg-gray-100 text-gray-600' };
            const isOwner = user?.id === tx.owner_id;
            const other = isOwner ? tx.seeker_name : tx.owner_name;
            const amount = tx.transaction_type === 'rent' ? tx.agreed_rent || tx.rent_amount : tx.agreed_sale_price || tx.sale_price;

            return (
              <div key={tx.id} className="card p-5 flex items-center gap-4">
                <div className="w-12 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {tx.photos?.[0] && <img src={tx.photos[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{tx.title}</p>
                  <p className="text-xs text-gray-400">{isOwner ? 'Seeker' : 'Owner'}: {other}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(tx.created_at), 'MMM d, yyyy')}</p>
                </div>
                {amount && (
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900 flex items-center gap-0.5">
                      <IndianRupee size={14} />{Number(amount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{tx.transaction_type}</p>
                  </div>
                )}
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${statusInfo.color}`}>{statusInfo.label}</span>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
