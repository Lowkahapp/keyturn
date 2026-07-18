import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { transactionAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, Lock } from 'lucide-react';

export default function Agreement() {
  const { id }        = useParams();
  const { user }      = useAuth();
  const [tx, setTx]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    transactionAPI.get(id).then(r => setTx(r.data.data)).finally(() => setLoading(false));
  }, [id]);

  const handleSign = async () => {
    setSigning(true);
    try {
      // In production: trigger Aadhaar eSign flow here
      toast.success('Agreement signed successfully! (eSign integration required in production)');
    } catch { toast.error('Signing failed'); }
    finally { setSigning(false); }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><div className="h-96 bg-gray-200 rounded-2xl animate-pulse" /></div>;
  if (!tx) return <div className="text-center py-20 text-gray-500">Transaction not found</div>;

  const isOwner = user?.id === tx.owner_id;
  const isRent  = tx.transaction_type === 'rent';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center"><FileText size={20} className="text-primary" /></div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rental Agreement</h1>
          <p className="text-sm text-gray-500">{tx.title}</p>
        </div>
      </div>

      <div className="card p-6 mb-6">
        {/* Agreement content */}
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4">
          <h3 className="font-bold text-gray-900 text-base">RENTAL AGREEMENT</h3>
          <p>This Rental Agreement ("Agreement") is entered into on <strong>{new Date().toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</strong></p>

          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4 text-sm">
            <div><p className="font-semibold text-gray-500 text-xs mb-1">LANDLORD (Owner)</p><p className="font-medium">{tx.owner_name}</p><p className="text-gray-400">{tx.owner_phone}</p></div>
            <div><p className="font-semibold text-gray-500 text-xs mb-1">TENANT (Seeker)</p><p className="font-medium">{tx.seeker_name}</p><p className="text-gray-400">{tx.seeker_phone}</p></div>
          </div>

          <div className="bg-primary-50 rounded-xl p-4 text-sm space-y-2">
            <p><strong>Property:</strong> {tx.address}</p>
            {isRent && (<>
              <p><strong>Monthly Rent:</strong> ₹{Number(tx.agreed_rent || tx.rent_amount).toLocaleString('en-IN')}</p>
              <p><strong>Security Deposit:</strong> ₹{Number(tx.security_deposit).toLocaleString('en-IN')}</p>
              {tx.lock_in_period_months && <p><strong>Lock-in Period:</strong> {tx.lock_in_period_months} months</p>}
            </>)}
          </div>

          <div className="text-sm space-y-3">
            <p><strong>1. TERM:</strong> This agreement commences on the date of key handover and continues on a month-to-month basis unless terminated.</p>
            <p><strong>2. RENT PAYMENT:</strong> Rent is due on the 1st of every month. A grace period of 5 days is allowed. Late payment attracts 2% penalty.</p>
            <p><strong>3. SECURITY DEPOSIT:</strong> The deposit shall be refunded within 30 days of vacating, less deductions for damage beyond fair wear and tear.</p>
            <p><strong>4. MAINTENANCE:</strong> The Tenant shall maintain the property in good condition. Structural repairs are the Owner's responsibility.</p>
            <p><strong>5. TERMINATION:</strong> Either party may terminate with 30 days written notice.</p>
            <p><strong>6. ESCROW:</strong> Funds are held in KeyTurn escrow and released to the Owner upon confirmed handover.</p>
            <p><strong>7. DISPUTE RESOLUTION:</strong> Any disputes will be resolved through KeyTurn's mediation platform before approaching courts.</p>
          </div>
        </div>
      </div>

      {/* Signature section */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Digital Signatures</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-xl border-2 ${tx.agreement_url ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}>
            <p className="text-xs font-semibold text-gray-500 mb-1">OWNER</p>
            <p className="font-medium text-gray-800">{tx.owner_name}</p>
            {tx.agreement_url ? <span className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><CheckCircle size={12} />Signed</span> : <span className="text-xs text-gray-400">Pending</span>}
          </div>
          <div className="p-4 rounded-xl border-2 border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-1">TENANT</p>
            <p className="font-medium text-gray-800">{tx.seeker_name}</p>
            <span className="text-xs text-gray-400">Pending</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-800 flex gap-2">
          <Lock size={16} className="flex-shrink-0 mt-0.5" />
          <p>By signing, you agree to all terms above. This is a legally binding agreement. Aadhaar eSign will be used in production.</p>
        </div>

        <button onClick={handleSign} disabled={signing} className="btn-primary w-full flex items-center justify-center gap-2">
          <CheckCircle size={16} />
          {signing ? 'Processing...' : `Sign as ${isOwner ? 'Owner' : 'Tenant'}`}
        </button>
      </div>
    </div>
  );
}
