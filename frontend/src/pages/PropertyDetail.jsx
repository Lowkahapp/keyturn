import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyAPI, transactionAPI, visitAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import PriceOracle from '../components/PriceOracle';
import toast from 'react-hot-toast';
import { MapPin, Bed, Maximize2, Building, Calendar, Phone, MessageCircle, ShieldCheck, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PropertyDetail() {
  const { id }           = useParams();
  const { user }         = useAuth();
  const navigate         = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [visitDate, setVisitDate]     = useState('');
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    propertyAPI.get(id)
      .then(r => setProperty(r.data.data))
      .catch(() => toast.error('Property not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleInterest = async () => {
    if (!user) return navigate('/login');
    setActionLoading(true);
    try {
      const res = await transactionAPI.initiate(id);
      toast.success('Interest shown! Chat with the owner now.');
      navigate('/chat');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setActionLoading(false); }
  };

  const handleVisit = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setActionLoading(true);
    try {
      await visitAPI.schedule({ property_id: id, scheduled_at: visitDate });
      toast.success('Visit scheduled! Owner will confirm shortly.');
      setShowVisitForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule visit');
    } finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-96 bg-gray-200 rounded-2xl mb-6" />
      <div className="grid grid-cols-3 gap-6"><div className="col-span-2 space-y-4"><div className="h-8 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-200 rounded w-1/2" /></div></div>
    </div>
  );
  if (!property) return <div className="text-center py-20 text-gray-500">Property not found</div>;

  const p = property;
  const photos = p.photos?.length ? p.photos : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'];
  const isRent = p.transaction_type === 'rent';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Photos + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo gallery */}
          <div className="card overflow-hidden">
            <div className="relative h-80 bg-gray-100">
              <img src={photos[activePhoto]} alt={p.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4"><VerifiedBadge status={p.verification_status} size="lg" /></div>
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {photos.map((ph, i) => (
                  <img key={i} src={ph} alt="" onClick={() => setActivePhoto(i)}
                    className={`w-16 h-12 object-cover rounded-lg cursor-pointer flex-shrink-0 border-2 transition-all ${i === activePhoto ? 'border-primary' : 'border-transparent opacity-70'}`} />
                ))}
              </div>
            )}
          </div>

          {/* Property info */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{p.title}</h1>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <MapPin size={14} /> {p.address}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-extrabold text-primary">
                  {isRent ? `₹${p.rent_amount?.toLocaleString('en-IN')}/mo` : `₹${(p.sale_price/100000).toFixed(1)}L`}
                </p>
                {isRent && <p className="text-sm text-gray-400">Deposit: ₹{p.deposit_amount?.toLocaleString('en-IN')}</p>}
              </div>
            </div>

            {/* Key specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100 mb-4">
              {[
                { icon: Bed,       label: 'BHK',         val: p.bhk ? `${p.bhk} BHK` : '-' },
                { icon: Maximize2, label: 'Carpet Area',  val: p.carpet_area_sqft ? `${p.carpet_area_sqft} sq.ft` : '-' },
                { icon: Building,  label: 'Floor',        val: p.floor_number ? `${p.floor_number}/${p.total_floors}` : '-' },
                { icon: Calendar,  label: 'Available',    val: p.available_from ? format(new Date(p.available_from), 'MMM d, yyyy') : 'Immediately' },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="text-center">
                  <Icon size={18} className="text-primary mx-auto mb-1" />
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{val}</p>
                </div>
              ))}
            </div>

            {/* Amenities */}
            {p.amenities?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(p.amenities) ? p.amenities : JSON.parse(p.amenities || '[]')).map(a => (
                    <span key={a} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full capitalize flex items-center gap-1">
                      <CheckCircle size={10} className="text-emerald-500" />{a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {p.description && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">About this property</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{p.description}</p>
              </div>
            )}
          </div>

          {/* Verification details */}
          {p.verification_status === 'verified' && (
            <div className="card p-5 border-l-4 border-emerald-500">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h3 className="font-semibold text-emerald-800">KeyTurn Verified Property</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-gray-400 text-xs">Actual Area</p><p className="font-medium">{p.actual_carpet_area || p.carpet_area_sqft} sq.ft</p></div>
                <div><p className="text-gray-400 text-xs">Condition</p><p className="font-medium">{'⭐'.repeat(p.condition_rating || 4)}</p></div>
                <div><p className="text-gray-400 text-xs">Ownership</p><p className="font-medium text-emerald-600">{p.ownership_verified ? 'Verified' : 'Checked'}</p></div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions + Price Oracle */}
        <div className="space-y-4">
          {/* Price Oracle */}
          <PriceOracle propertyId={id} />

          {/* Action card */}
          <div className="card p-5 sticky top-20">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                {p.owner_name?.[0] || 'O'}
              </div>
              <div>
                <p className="font-medium text-gray-900">{p.owner_name || 'Property Owner'}</p>
                <p className="text-xs text-gray-400">Owner · {p.owner_rating ? `⭐ ${p.owner_rating}` : 'New'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={handleInterest} disabled={actionLoading}
                className="btn-primary w-full flex items-center justify-center gap-2">
                <MessageCircle size={16} />
                {actionLoading ? 'Processing...' : 'Show Interest & Chat'}
              </button>

              <button onClick={() => setShowVisitForm(v => !v)} className="btn-secondary w-full flex items-center justify-center gap-2">
                <Calendar size={16} /> Schedule Visit
              </button>
            </div>

            {showVisitForm && (
              <form onSubmit={handleVisit} className="mt-4 pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pick a date & time</label>
                <input type="datetime-local" className="input mb-3" required
                  min={new Date(Date.now() + 3600000).toISOString().slice(0,16)}
                  value={visitDate} onChange={e => setVisitDate(e.target.value)} />
                <button type="submit" disabled={actionLoading} className="btn-primary w-full text-sm">
                  {actionLoading ? 'Scheduling...' : 'Confirm Visit'}
                </button>
              </form>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">🔒 You'll only pay KeyTurn if a deal closes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
