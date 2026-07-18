import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyAPI } from '../api/client';
import toast from 'react-hot-toast';
import PriceOracle from '../components/PriceOracle';

const STEPS = ['Basic Info', 'Details', 'Price & Availability', 'Photos'];
const AMENITIES = ['Lift','Gym','Swimming Pool','Security','Parking','Power Backup','Water 24x7','Club House','Garden','CCTV','Gas Pipeline','Intercom'];

export default function ListProperty() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    transaction_type: 'rent', property_type: 'apartment', city: 'Bangalore',
    state: 'Karnataka', locality: '', address: '', pincode: '',
    bhk: 2, carpet_area_sqft: '', super_builtup_sqft: '',
    floor_number: '', total_floors: '', age_years: 0,
    furnishing: 'semi_furnished', title: '', description: '',
    rent_amount: '', deposit_amount: '', sale_price: '',
    maintenance_amount: '', available_from: '',
    amenities: [], photos: []
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleAmenity = (a) => set('amenities', form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await propertyAPI.create({ ...form, title: form.title || `${form.bhk}BHK ${form.property_type} in ${form.locality}` });
      toast.success('Property listed! Requesting verification...');
      await propertyAPI.requestVerify(res.data.data.id);
      toast.success('A scout will visit within 24-48 hours to verify your property.');
      navigate('/owner');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to list property');
    } finally { setLoading(false); }
  };

  const oracleParams = form.city && form.bhk ? { city: form.city, locality: form.locality, bhk: form.bhk, carpet_area_sqft: form.carpet_area_sqft, furnishing: form.furnishing } : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">List Your Property</h1>
      <p className="text-gray-500 text-sm mb-6">Free to list. We only earn when you successfully rent/sell.</p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-gray-200 text-gray-400'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 transition-colors ${i < step ? 'bg-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="card p-6 mb-6">
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
                <div className="flex gap-2">
                  {['rent','sale'].map(t => (
                    <button key={t} type="button" onClick={() => set('transaction_type', t)}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-colors ${form.transaction_type === t ? 'border-primary bg-primary-50 text-primary' : 'border-gray-200 text-gray-500'}`}>
                      For {t === 'rent' ? 'Rent' : 'Sale'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select className="input" value={form.property_type} onChange={e => set('property_type', e.target.value)}>
                  {['apartment','villa','independent_house','pg','commercial'].map(t => <option key={t} value={t} className="capitalize">{t.replace('_',' ')}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <select className="input" value={form.city} onChange={e => set('city', e.target.value)}>
                  {['Bangalore','Hyderabad','Pune','Chennai','Mumbai'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locality / Area</label>
                <input className="input" placeholder="e.g. Koramangala" value={form.locality} onChange={e => set('locality', e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
              <textarea className="input" rows={2} placeholder="Flat no, Building, Street, Area" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Title (optional)</label>
              <input className="input" placeholder={`e.g. Spacious ${form.bhk}BHK in ${form.locality || 'your area'}`}
                value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Property Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BHK</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => set('bhk', n)}
                      className={`flex-1 py-2 text-sm rounded-lg border-2 font-semibold transition-colors ${form.bhk === n ? 'border-primary bg-primary-50 text-primary' : 'border-gray-200 text-gray-500'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carpet Area (sq.ft)</label>
                <input className="input" type="number" placeholder="e.g. 950" value={form.carpet_area_sqft} onChange={e => set('carpet_area_sqft', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Super Built-up (sq.ft)</label>
                <input className="input" type="number" placeholder="e.g. 1200" value={form.super_builtup_sqft} onChange={e => set('super_builtup_sqft', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                <input className="input" type="number" placeholder="3" value={form.floor_number} onChange={e => set('floor_number', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Floors</label>
                <input className="input" type="number" placeholder="12" value={form.total_floors} onChange={e => set('total_floors', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Age (years)</label>
                <input className="input" type="number" placeholder="0" value={form.age_years} onChange={e => set('age_years', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Furnishing</label>
                <select className="input" value={form.furnishing} onChange={e => set('furnishing', e.target.value)}>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi_furnished">Semi Furnished</option>
                  <option value="fully_furnished">Fully Furnished</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map(a => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.amenities.includes(a) ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input" rows={3} placeholder="Describe your property — highlights, nearby landmarks, etc."
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Price & Availability</h2>

            {/* Price oracle preview */}
            {oracleParams && <PriceOracle params={oracleParams} />}

            {form.transaction_type === 'rent' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (₹)</label>
                  <input className="input" type="number" placeholder="e.g. 25000" value={form.rent_amount} onChange={e => set('rent_amount', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (₹)</label>
                  <input className="input" type="number" placeholder="e.g. 50000" value={form.deposit_amount} onChange={e => set('deposit_amount', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance (₹/mo)</label>
                  <input className="input" type="number" placeholder="Optional" value={form.maintenance_amount} onChange={e => set('maintenance_amount', e.target.value)} />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price (₹)</label>
                <input className="input" type="number" placeholder="e.g. 7500000" value={form.sale_price} onChange={e => set('sale_price', e.target.value)} required />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
              <input className="input" type="date" value={form.available_from} onChange={e => set('available_from', e.target.value)} />
            </div>

            <div className="bg-primary-50 rounded-xl p-4 text-sm text-primary-700">
              <strong>KeyTurn Success Fee:</strong> You pay{' '}
              {form.transaction_type === 'rent' ? '0.5% of annual rent' : '1% of sale price'}{' '}
              <em>only</em> when the deal closes. No upfront charges.
              {form.rent_amount && form.transaction_type === 'rent' && (
                <span className="block mt-1 font-semibold">
                  = ₹{Math.round(form.rent_amount * 12 * 0.005).toLocaleString('en-IN')} (one-time, on success)
                </span>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Photos</h2>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">📷</div>
              <p className="text-gray-600 font-medium mb-1">Upload property photos</p>
              <p className="text-gray-400 text-sm mb-4">Min 5 photos recommended. Our scout will also take verified photos during the visit.</p>
              <p className="text-xs text-gray-400 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
                Photo upload available after listing is created — you can add them from your Owner Dashboard
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={() => step > 0 && setStep(s => s - 1)} disabled={step === 0}
          className="btn-secondary disabled:opacity-40">← Back</button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} className="btn-primary">Next →</button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} className="btn-primary">
            {loading ? 'Listing...' : '🏠 List Property'}
          </button>
        )}
      </div>
    </div>
  );
}
