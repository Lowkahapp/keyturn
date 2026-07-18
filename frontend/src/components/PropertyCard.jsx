import { Link } from 'react-router-dom';
import { MapPin, Bed, Maximize2, CheckCircle, Clock, Eye } from 'lucide-react';
import VerifiedBadge from './VerifiedBadge';

const formatRent = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${(n/1000).toFixed(0)}K`;
const formatSale = (n) => n >= 10000000 ? `₹${(n/10000000).toFixed(2)} Cr` : n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${n}`;

export default function PropertyCard({ property }) {
  const p = property;
  const photo = p.photos?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80';
  const isRent = p.transaction_type === 'rent';

  return (
    <Link to={`/property/${p.id}`} className="card group hover:shadow-md transition-all duration-200 block">
      {/* Photo */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img src={photo} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-3 left-3">
          <VerifiedBadge status={p.verification_status} />
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-full text-gray-700">
          {isRent ? 'Rent' : 'Buy'}
        </div>
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Eye size={10} /> {p.views_count || 0}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{p.title}</h3>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
          <MapPin size={12} />
          <span>{p.locality}, {p.city}</span>
        </div>

        <div className="flex items-center gap-3 text-gray-600 text-xs mb-3">
          {p.bhk && <span className="flex items-center gap-1"><Bed size={12} /> {p.bhk} BHK</span>}
          {p.carpet_area_sqft && <span className="flex items-center gap-1"><Maximize2 size={12} /> {p.carpet_area_sqft} sq.ft</span>}
          {p.furnishing && <span className="capitalize">{p.furnishing?.replace('_', ' ')}</span>}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {isRent ? `${formatRent(p.rent_amount)}/mo` : formatSale(p.sale_price)}
            </span>
            {isRent && p.deposit_amount && (
              <p className="text-xs text-gray-400">Deposit: {formatRent(p.deposit_amount)}</p>
            )}
          </div>
          {p.owner_name && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Owner</p>
              <p className="text-xs font-medium text-gray-600">{p.owner_name}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
