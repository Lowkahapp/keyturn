import { useState, useEffect } from 'react';
import { searchAPI } from '../api/client';
import SearchFilters from '../components/SearchFilters';
import PropertyCard from '../components/PropertyCard';
import {
  ShieldCheck, IndianRupee, Handshake, SlidersHorizontal,
  MapPin, Star, CheckCircle2, ArrowRight, Building2, TrendingUp
} from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
];

const STATS = [
  { value: '2,400+', label: 'Verified Listings' },
  { value: '₹0',     label: 'Upfront Fee' },
  { value: '4 Cities', label: 'Covered' },
  { value: '98%',    label: 'Deal Success Rate' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: ShieldCheck,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Every listing is scout-verified',
    desc: 'Our on-ground scouts physically visit each property, check ownership documents, and confirm every detail before it goes live.',
  },
  {
    step: '02',
    icon: Handshake,
    color: 'bg-blue-50 text-blue-600',
    title: 'Find your home, negotiate freely',
    desc: 'Browse verified listings, schedule visits, chat directly with owners, and negotiate — all without paying a rupee.',
  },
  {
    step: '03',
    icon: IndianRupee,
    color: 'bg-purple-50 text-purple-600',
    title: 'Pay only when the deal closes',
    desc: 'Once you get the keys, we charge 0.5% of annual rent (or 1% of sale price). Not before. Guaranteed.',
  },
];

const TRUST_BADGES = [
  { icon: ShieldCheck,  label: 'Physically Verified',   sub: 'Every listing scout-checked' },
  { icon: IndianRupee, label: '0% Upfront',              sub: 'Pay only on deal close' },
  { icon: Handshake,   label: 'Escrow Protected',        sub: 'Funds released on handover' },
  { icon: Star,        label: 'Outcome Guaranteed',      sub: 'India\'s first promise' },
];

const CITY_TABS = ['Bangalore', 'Mumbai', 'Hyderabad', 'Pune'];

export default function Home() {
  const [properties, setProperties]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [total, setTotal]               = useState(0);
  const [sort, setSort]                 = useState('relevance');
  const [activeFilters, setActiveFilters] = useState({ city: 'Bangalore', transaction_type: 'rent' });
  const [activeCity, setActiveCity]     = useState('Bangalore');

  const doSearch = async (params = activeFilters) => {
    setLoading(true);
    try {
      const res = await searchAPI.search({ ...params, sort });
      setProperties(res.data.data);
      setTotal(res.data.pagination?.total || 0);
      setActiveFilters(params);
    } catch { setProperties([]); } finally { setLoading(false); }
  };

  useEffect(() => { doSearch(activeFilters); }, [sort]);

  const switchCity = (city) => {
    setActiveCity(city);
    doSearch({ ...activeFilters, city });
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 text-white overflow-hidden">
        {/* background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
          {/* pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            India's First Outcome-Guaranteed Property Platform
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-5 leading-tight tracking-tight">
            Find Your Home.<br />
            <span className="text-yellow-300">Pay Only When You Get the Keys.</span>
          </h1>
          <p className="text-primary-100 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Every listing is physically verified by our scouts. Zero broker spam.
            Zero upfront fee. Escrow-protected deals. <strong className="text-white">Guaranteed.</strong>
          </p>

          {/* Search box */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 text-left">
            <SearchFilters onSearch={doSearch} loading={loading} />
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15">
                <div className="text-2xl font-extrabold text-yellow-300">{s.value}</div>
                <div className="text-xs text-primary-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TRUST BADGES ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">How KeyTurn Works</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Simple, transparent, and designed so you never pay until you're holding the keys.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map(({ step, icon: Icon, color, title, desc }) => (
            <div key={step} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative group hover:shadow-md transition-shadow">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shadow">
                {step}
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROPERTIES ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pb-16">

        {/* City tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {CITY_TABS.map(city => (
            <button key={city}
              onClick={() => switchCity(city)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${activeCity === city
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'}`}>
              <MapPin size={13} />
              {city}
            </button>
          ))}

          {/* Sort */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <SlidersHorizontal size={15} className="text-gray-400" />
            <select
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Count */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            {loading ? 'Searching...' : `${total.toLocaleString('en-IN')} verified properties`}
          </h2>
          {activeFilters.city && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin size={13} /> {activeFilters.city}
              {activeFilters.transaction_type && ` · ${activeFilters.transaction_type === 'rent' ? 'For Rent' : 'For Sale'}`}
            </p>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
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
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No properties found</h3>
            <p className="text-gray-400">Try adjusting your filters or searching a different city</p>
          </div>
        )}
      </div>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────────── */}
      <div className="bg-primary-700 text-white py-14 px-4 text-center">
        <h2 className="text-3xl font-extrabold mb-3">Own a property? List it free.</h2>
        <p className="text-primary-200 mb-7 max-w-xl mx-auto">
          We send a scout to verify your property, create a professional listing, and find you the right tenant or buyer. You pay nothing until the deal is done.
        </p>
        <a href="/list-property"
          className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition-colors shadow-lg">
          List Your Property Free <ArrowRight size={18} />
        </a>
      </div>

    </div>
  );
}
