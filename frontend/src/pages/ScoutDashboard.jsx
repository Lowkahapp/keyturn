import { useState, useEffect } from 'react';
import { scoutAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MapPin, Camera, CheckCircle, Clock, IndianRupee, Star } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  assigned:     'bg-blue-50 text-blue-700',
  in_progress:  'bg-amber-50 text-amber-700',
  submitted:    'bg-purple-50 text-purple-700',
  approved:     'bg-emerald-50 text-emerald-700',
  rejected:     'bg-red-50 text-red-700',
};

export default function ScoutDashboard() {
  const { user }     = useAuth();
  const [tasks, setTasks]       = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    Promise.all([scoutAPI.tasks(), scoutAPI.earnings()])
      .then(([t, e]) => { setTasks(t.data.data); setEarnings(e.data.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckIn = async (taskId) => {
    try {
      await scoutAPI.checkIn(taskId, {});
      toast.success('Checked in! Begin the verification.');
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'in_progress' } : t));
    } catch (err) { toast.error(err.response?.data?.message || 'Check-in failed'); }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 rounded-2xl" /></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Scout Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Welcome, {user?.name}. Help make Indian real estate trustworthy.</p>

      {/* Earnings bar */}
      {earnings && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Earned', value: `₹${Number(earnings.total_earned || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Completed', value: earnings.completed_count || 0, icon: CheckCircle, color: 'bg-blue-50 text-blue-600' },
            { label: 'Pending', value: earnings.pending_count || 0, icon: Clock, color: 'bg-amber-50 text-amber-600' },
            { label: 'Avg Rating', value: earnings.avg_rating ? `${Number(earnings.avg_rating).toFixed(1)} ⭐` : 'N/A', icon: Star, color: 'bg-purple-50 text-purple-600' },
          ].map(s => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={16} /></div>
              <div><p className="font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-400">{s.label}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Tasks */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Verification Tasks</h2>
        {tasks.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-gray-500">No tasks assigned yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{task.title}</p>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                      <MapPin size={12} />{task.address}
                    </div>
                    {task.scheduled_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        Scheduled: {format(new Date(task.scheduled_at), 'MMM d, h:mm a')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-600'}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-bold text-emerald-600">₹{task.scout_payout}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{task.bhk} BHK</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded capitalize">{task.property_type}</span>
                  <span>Owner: {task.owner_name} · {task.owner_phone}</span>
                </div>

                {/* Checklist requirements */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs text-gray-600">
                  <p className="font-medium mb-1">Verification checklist:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {['10+ photos (all rooms)','60-sec video walkthrough','Measure carpet area','Verify ownership docs','Check building amenities','Rate property condition'].map(item => (
                      <span key={item} className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-400 flex-shrink-0" />{item}</span>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {task.status === 'assigned' && (
                    <button onClick={() => handleCheckIn(task.id)} className="btn-primary text-sm py-2 flex items-center gap-1">
                      <MapPin size={14} /> Check In & Start
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button onClick={() => setActiveTask(task)} className="btn-primary text-sm py-2 flex items-center gap-1">
                      <Camera size={14} /> Submit Verification
                    </button>
                  )}
                  {task.status === 'submitted' && (
                    <span className="text-sm text-purple-600 font-medium">⏳ Under admin review</span>
                  )}
                  {task.status === 'approved' && (
                    <span className="text-sm text-emerald-600 font-medium">✅ Approved — payout processing</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit verification modal (simplified) */}
      {activeTask && (
        <SubmitVerificationModal task={activeTask} onClose={() => setActiveTask(null)}
          onSuccess={(id) => { setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'submitted' } : t)); setActiveTask(null); }} />
      )}
    </div>
  );
}

function SubmitVerificationModal({ task, onClose, onSuccess }) {
  const [form, setForm] = useState({ scout_notes: '', actual_carpet_area: '', condition_rating: 4, ownership_verified: false, photos: [], video_url: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.photos.length < 1) return toast.error('Add at least one photo URL for demo purposes');
    setLoading(true);
    try {
      await scoutAPI.complete(task.id, { ...form, photos: form.photos });
      toast.success('Verification submitted for admin review!');
      onSuccess(task.id);
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Submit Verification</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-sm text-gray-500 mb-5">{task.title} · {task.locality}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual Carpet Area (sq.ft)</label>
              <input className="input" type="number" value={form.actual_carpet_area} onChange={e => set('actual_carpet_area', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition Rating (1-5)</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => set('condition_rating', n)}
                    className={`flex-1 py-2 text-sm rounded-lg border-2 font-semibold transition-colors ${form.condition_rating === n ? 'border-primary bg-primary-50 text-primary' : 'border-gray-200 text-gray-500'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo URLs (comma-separated for demo)</label>
            <input className="input" placeholder="https://..." onChange={e => set('photos', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scout Notes</label>
            <textarea className="input" rows={3} placeholder="Property condition, observations, discrepancies..."
              value={form.scout_notes} onChange={e => set('scout_notes', e.target.value)} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ownership_verified} onChange={e => set('ownership_verified', e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm text-gray-700">Ownership documents verified</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Submitting...' : 'Submit Verification'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
