import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentAPI, transactionAPI } from '../api/client';
import toast from 'react-hot-toast';
import { ShieldCheck, IndianRupee, Lock } from 'lucide-react';

export default function Payment() {
  const { type, id } = useParams(); // type: verification_fee | escrow | success_fee
  const navigate     = useNavigate();
  const [loading, setLoading] = useState(false);

  const PAYMENT_INFO = {
    verification_fee: { title: 'Verification Fee',  amount: 199,  description: 'Refundable if property transacts within 90 days. A scout will visit your property within 24-48 hours.', color: 'text-blue-600' },
    escrow:           { title: 'Escrow Deposit',     amount: null, description: 'Your funds are held safely in a regulated bank escrow until handover is confirmed by both parties.', color: 'text-primary' },
    success_fee:      { title: 'KeyTurn Success Fee', amount: null, description: 'You only pay this because your deal successfully closed. Congratulations!', color: 'text-emerald-600' },
  };

  const info = PAYMENT_INFO[type] || PAYMENT_INFO.verification_fee;

  const handlePay = async () => {
    setLoading(true);
    try {
      const orderRes = await paymentAPI.createOrder({ amount: info.amount, purpose: type, reference_id: id });
      const order = orderRes.data.order;

      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          order_id: order.id,
          amount: order.amount,
          currency: 'INR',
          name: 'KeyTurn',
          description: info.title,
          prefill: {},
          handler: async (response) => {
            try {
              await paymentAPI.verify(response);
              toast.success('Payment successful!');
              navigate(-1);
            } catch { toast.error('Payment verification failed'); }
          },
          modal: { ondismiss: () => setLoading(false) }
        });
        rzp.open();
      };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="card p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{info.title}</h1>
          {info.amount && (
            <p className={`text-3xl font-extrabold mt-2 ${info.color}`}>₹{info.amount}</p>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 flex gap-3">
          <ShieldCheck size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">{info.description}</p>
        </div>

        <div className="space-y-3 mb-6 text-sm text-gray-600">
          <div className="flex items-center gap-2"><IndianRupee size={14} className="text-primary" /> Secure payment via Razorpay</div>
          <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" /> UPI, Cards, Net Banking accepted</div>
          <div className="flex items-center gap-2"><Lock size={14} className="text-gray-400" /> 256-bit SSL encryption</div>
        </div>

        <button onClick={handlePay} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? 'Processing...' : `Pay ${info.amount ? `₹${info.amount}` : 'Now'}`}
        </button>

        <button onClick={() => navigate(-1)} className="w-full text-center text-sm text-gray-400 mt-3 hover:text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  );
}
