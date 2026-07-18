import { useState, useEffect } from 'react';
import { searchAPI } from '../api/client';
import SearchFilters from '../components/SearchFilters';
import PropertyCard from '../components/PropertyCard';
import { ShieldCheck, IndianRupee, Handshake, SlidersHorizontal } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
];

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [sort, setSort]             = useState('relevance');
  const [activeFilters, setActiveFilters] = useState({ city: 'Bangalore', transaction_type: 'rent' });

  const doSearch = async (params = activeFilters) => {
    setLoading(true);
    try {
      const res = await searchAPI.search({ ...params, sort });
      setProperties(res.data.data);
      setTotal(res.data.pagination?.total || 0);
      setActiveFilters(params);
    } catch { setProperties([]); } finally { setLoading(false); }
  };

  useEffect(() => { doSearch(); }, [sort]);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-500 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Find Your Home.<br />
            <span className="text-accent">Pay Only When You Get the Keys.</span>
          </h1>
          <p className="text-primary-100 text-lg">Every listing is physically verified. Zero broker spam. Escrow-protected deals.</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <SearchFilters onSearch={doSearch} loading={loading} />
        </div>
      </div>

      {/* Trust pillars */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: ShieldCheck, color: 'text-emerald-500', label: 'Every listing physically verified' },
            { icon: IndianRupee, color: 'text-blue-500',    label: 'Pay only on successful deal' },
            { icon: Handshake,   color: 'text-purple-500',  label: 'Escrow-protected transactions' },
          ].map(({ icon: Icon, color, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon size={24} className={color} />
              <p className="text-xs font-medium text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {loading ? 'Searching...' : `${total.toLocaleString('en-IN')} properties found`}
            </h2>
            {activeFilters.city && <p className="text-sm text-gray-500">in {activeFilters.city}</p>}
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-gray-400" />
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
              value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No properties found</h3>
            <p className="text-gray-400">Try adjusting your filters or searching a different area</p>
          </div>
        )}
      </div>
    </div>
  );
}
