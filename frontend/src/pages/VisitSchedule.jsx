import { useState, useEffect } from 'react';
import { visitAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Calendar, MapPin, CheckCircle, X } from 'lucide-react';

const STATUS_COLORS = {
  requested:  'bg-blue-50 text-blue-700',
  confirmed:  'bg-emerald-50 text-emerald-700',
  completed:  'bg-gray-100 text-gray-600',
  cancelled:  'bg-red-50 text-red-700',
  no_show:    'bg-orange-50 text-orange-700',
};

export default function VisitSchedule() {
  const { user } = useAuth();
  const [visits, setVisits]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => visitAPI.list().then(r => setVisits(r.data.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleConfirm = async (id) => {
    try { await visitAPI.confirm(id); toast.success('Visit confirmed!'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleCancel = async (id) => {
    try { await visitAPI.cancel(id); toast.success('Visit cancelled'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Visits</h1>
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : visits.length === 0 ? (
        <div className="text-center py-16 card"><Calendar size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">No visits scheduled</p></div>
      ) : (
        <div className="space-y-4">
          {visits.map(v => (
            <div key={v.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{v.title}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1"><MapPin size={12} />{v.address}</div>
                  <div className="flex items-center gap-1 text-xs text-primary font-medium mt-2"><Calendar size={12} />{format(new Date(v.scheduled_at), 'EEEE, MMM d · h:mm a')}</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[v.status] || 'bg-gray-100 text-gray-600'}`}>{v.status}</span>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 flex-1">
                  {user?.user_type === 'owner' ? `Seeker: ${v.seeker_name} · ${v.seeker_phone}` : `Owner: ${v.owner_name} · ${v.owner_phone}`}
                </p>
                {v.status === 'requested' && user?.user_type === 'owner' && (
                  <button onClick={() => handleConfirm(v.id)} className="text-xs btn-primary py-1.5 px-3 flex items-center gap-1">
                    <CheckCircle size={12} /> Confirm
                  </button>
                )}
                {['requested','confirmed'].includes(v.status) && (
                  <button onClick={() => handleCancel(v.id)} className="text-xs border border-red-200 text-red-500 py-1.5 px-3 rounded-lg hover:bg-red-50 flex items-center gap-1">
                    <X size={12} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
