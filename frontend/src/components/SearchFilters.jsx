import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const CITIES = ['Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Mumbai', 'Delhi'];
const BHK_OPTIONS = [1, 2, 3, 4];

export default function SearchFilters({ onSearch, loading }) {
  const [filters, setFilters] = useState({
    q: '', city: 'Bangalore', transaction_type: 'rent',
    property_type: '', bhk: '', min_budget: '', max_budget: '',
    furnished: '', verified_only: false
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  const handleSearch = (e) => {
    e.preventDefault();
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== false));
    onSearch(params);
  };

  const clearFilters = () => {
    setFilters({ q: '', city: 'Bangalore', transaction_type: 'rent', property_type: '', bhk: '', min_budget: '', max_budget: '', furnished: '', verified_only: false });
  };

  return (
    <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      {/* Primary row */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Transaction type tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {['rent', 'sale'].map(t => (
            <button key={t} type="button" onClick={() => set('transaction_type', t)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${filters.transaction_type === t ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {t === 'rent' ? 'Rent' : 'Buy'}
            </button>
          ))}
        </div>

        {/* City */}
        <select className="input flex-1 min-w-[140px]" value={filters.city} onChange={e => set('city', e.target.value)}>
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>

        {/* Search query */}
        <div className="relative flex-[2] min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Locality, landmark, project..." value={filters.q} onChange={e => set('q', e.target.value)} />
        </div>

        <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
          {loading ? 'Searching...' : 'Search'}
        </button>

        <button type="button" onClick={() => setShowAdvanced(v => !v)}
          className="p-3 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="border-t border-gray-100 pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* BHK */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">BHK</label>
            <div className="flex gap-1">
              {BHK_OPTIONS.map(n => (
                <button key={n} type="button" onClick={() => set('bhk', filters.bhk === n ? '' : n)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${filters.bhk === n ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Min Budget</label>
            <input className="input" type="number" placeholder={filters.transaction_type === 'rent' ? '₹ /month' : '₹ Total'}
              value={filters.min_budget} onChange={e => set('min_budget', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Max Budget</label>
            <input className="input" type="number" placeholder={filters.transaction_type === 'rent' ? '₹ /month' : '₹ Total'}
              value={filters.max_budget} onChange={e => set('max_budget', e.target.value)} />
          </div>

          {/* Furnishing */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Furnishing</label>
            <select className="input" value={filters.furnished} onChange={e => set('furnished', e.target.value)}>
              <option value="">Any</option>
              <option value="fully_furnished">Fully Furnished</option>
              <option value="semi_furnished">Semi Furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </div>

          {/* Verified only */}
          <div className="col-span-2 md:col-span-4 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.verified_only} onChange={e => set('verified_only', e.target.checked)}
                className="w-4 h-4 accent-primary" />
              <span className="text-sm text-gray-700 font-medium">Show only <span className="text-emerald-600">verified</span> listings</span>
            </label>
            <button type="button" onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <X size={12} /> Clear all
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
