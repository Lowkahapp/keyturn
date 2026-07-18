import { useState, useEffect } from 'react';
import { TrendingUp, Info } from 'lucide-react';
import { priceOracleAPI } from '../api/client';

export default function PriceOracle({ propertyId, params }) {
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await priceOracleAPI.estimate(propertyId ? { property_id: propertyId } : params);
        setEstimate(res.data.data);
      } catch {} finally { setLoading(false); }
    };
    if (propertyId || params) fetch();
  }, [propertyId, JSON.stringify(params)]);

  if (loading) return <div className="bg-emerald-50 rounded-xl p-4 animate-pulse h-24" />;
  if (!estimate) return null;

  const conf = Math.round(estimate.confidence_score * 100);
  const confColor = conf >= 70 ? 'text-emerald-600' : conf >= 50 ? 'text-amber-600' : 'text-gray-500';

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-800">KeyTurn Price Estimate</span>
        <span className={`text-xs font-medium ml-auto ${confColor}`}>{conf}% confidence</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {estimate.estimated_rent && (
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Fair Rent</p>
            <p className="text-lg font-bold text-gray-900">₹{estimate.estimated_rent.toLocaleString('en-IN')}<span className="text-xs font-normal text-gray-500">/mo</span></p>
          </div>
        )}
        {estimate.estimated_sale && (
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Fair Sale Price</p>
            <p className="text-lg font-bold text-gray-900">
              {estimate.estimated_sale >= 10000000 ? `₹${(estimate.estimated_sale/10000000).toFixed(2)} Cr` : `₹${(estimate.estimated_sale/100000).toFixed(1)}L`}
            </p>
          </div>
        )}
      </div>

      {estimate.factors && (
        <div className="mt-3 pt-3 border-t border-emerald-100 flex flex-wrap gap-2">
          {Object.entries(estimate.factors).filter(([,v]) => v !== 'none').map(([k,v]) => (
            <span key={k} className="text-xs bg-white text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              {k.replace('_', ' ')}: {v}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Info size={10} />{estimate.disclaimer}</p>
    </div>
  );
}
