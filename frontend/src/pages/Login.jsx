import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import toast from 'react-hot-toast';
import { Home, Phone, KeyRound } from 'lucide-react';

export default function Login() {
  const [step, setStep]       = useState('phone'); // phone | otp
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
  const [name, setName]       = useState('');
  const [userType, setUserType] = useState('seeker');
  const [loading, setLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!phone.match(/^[6-9]\d{9}$/)) return toast.error('Enter a valid 10-digit mobile number');
    setLoading(true);
    try {
      await authAPI.sendOtp(`+91${phone}`);
      toast.success('OTP sent!');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp(`+91${phone}`, otp, name, userType);
      login(res.data.token, res.data.user);
      toast.success(`Welcome${name ? ', ' + name : ''}!`);
      const { user_type } = res.data.user;
      if (user_type === 'owner') navigate('/owner');
      else if (user_type === 'scout') navigate('/scout');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-white">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to <span className="text-primary">KeyTurn</span></h1>
          <p className="text-gray-500 mt-1 text-sm">Pay only when you get the keys</p>
        </div>

        <div className="card p-8">
          {step === 'phone' ? (
            <form onSubmit={sendOtp}>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Enter your mobile number</h2>

              {/* User type toggle */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
                <div className="grid grid-cols-3 gap-2">
                  {[['seeker','Looking to Rent/Buy'],['owner','Property Owner'],['scout','Property Scout']].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setUserType(val)}
                      className={`py-2.5 px-2 text-xs font-medium rounded-xl border-2 transition-colors text-center ${userType === val ? 'border-primary bg-primary-50 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="flex gap-2">
                  <span className="input w-16 text-center bg-gray-50 font-medium text-gray-600">+91</span>
                  <input className="input flex-1" type="tel" maxLength={10} placeholder="9876543210"
                    value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">By continuing, you agree to our Terms & Privacy Policy</p>
            </form>
          ) : (
            <form onSubmit={verifyOtp}>
              <button type="button" onClick={() => setStep('phone')} className="text-sm text-primary mb-4 flex items-center gap-1">← Change number</button>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Enter OTP</h2>
              <p className="text-gray-500 text-sm mb-6">Sent to +91 {phone}</p>

              {!name && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">6-digit OTP</label>
                <input className="input text-2xl tracking-[0.5em] text-center font-bold" type="text"
                  maxLength={6} placeholder="------" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g,''))} required />
                <p className="text-xs text-gray-400 mt-1">(Use any 6 digits in development)</p>
              </div>

              <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full flex items-center justify-center gap-2">
                <KeyRound size={16} />
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button type="button" onClick={sendOtp} className="w-full text-center text-sm text-primary mt-3 hover:underline">
                Resend OTP
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
