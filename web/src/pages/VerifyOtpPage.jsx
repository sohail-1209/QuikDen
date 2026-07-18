import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import SEO from '../components/SEO';

export default function VerifyOtpPage() {
  const { t } = useTranslation();
  const { verifyEmail, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const userId = searchParams.get('userId');
  // Retrieve developer mock OTP if passed from registration page
  const mockOtp = location.state?.mockOtp;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [devOtp, setDevOtp] = useState(mockOtp || null);

  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle typing inside 6 digit boxes
  const handleChange = (index, value) => {
    if (isNaN(value)) return; // Only allow numbers

    const newOtp = [...otp];
    // Take only the last character if multiple are inputted
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle paste events (e.g. paste a 6 digit code)
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split('');
    setOtp(digits);
    inputRefs.current[5].focus();
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      toast.error(t('pleaseEnterAllDigits', 'Please enter all 6 digits'));
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(otpCode);
      toast.success(t('verificationSuccessful', 'Phone number verified successfully!'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || t('verificationFailed', 'OTP verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || !userId) return;
    setResending(true);
    try {
      const resObj = await resendOtp(userId);
      toast.success(t('newOtpSent', 'A new OTP has been sent.'));
      setTimer(60);
      if (resObj.data?.otp) {
        setDevOtp(resObj.data.otp);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('resendFailed', 'Failed to resend OTP'));
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <SEO
        title="Verify OTP — Quikden"
        description="Verify your phone number with OTP to access your Quikden account."
        url="/verify-otp"
        noIndex={true}
      />
      <Navbar />

      <style>{`
        .otp-bg {
          background-color: #f0fdfa;
          background-image:
            radial-gradient(circle at 20% 80%, rgba(13,148,136,0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(13,148,136,0.04) 0%, transparent 50%);
        }
      `}</style>

      <div className="min-h-screen otp-bg flex items-center justify-center px-4 py-6 relative overflow-hidden">
        <svg className="absolute bottom-0 right-0 w-48 h-24 opacity-[0.06] pointer-events-none" viewBox="0 0 256 128" fill="none">
          <path d="M0 64 Q64 0 128 64 T256 64 V128 H0 Z" fill="#0D9488" />
        </svg>

        <div className="w-full max-w-[400px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-6 relative z-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20">
            <ShieldCheck size={28} className="text-white" />
          </div>

          <h1 className="font-display font-bold text-xl sm:text-2xl text-surface-900 tracking-tight">
            {t('otpVerification', 'Enter Verification Code')}
          </h1>
          <p className="text-surface-500 text-xs sm:text-sm mt-1 mb-6 max-w-xs mx-auto leading-relaxed">
            {t('enterOtpSent', 'We have sent a 6-digit verification code to your registered mobile number.')}
          </p>

          {/* Dev Mock OTP Alert */}
          {devOtp && (
            <div className="mb-5 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-medium text-left">
              <span className="font-bold">🛠️ Dev Mock Mode active:</span>
              <p className="mt-0.5">Use OTP code <span className="font-mono text-sm font-bold underline bg-teal-100 px-1.5 py-0.5 rounded">{devOtp}</span> to verify this account.</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-between gap-2 max-w-[300px] mx-auto" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-10 h-12 text-center text-lg font-bold bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all shadow-sm"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>{t('verify', 'Verify & Login')} <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Resend OTP Logic */}
          <div className="mt-6 flex flex-col items-center gap-1">
            <p className="text-[11px] text-surface-500">
              {t('didNotReceiveCode', "Didn't receive the verification code?")}
            </p>
            {timer > 0 ? (
              <span className="text-[11px] text-surface-400 font-medium">
                {t('resendIn', 'Resend in')} {timer}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-[12px] text-primary-600 font-semibold hover:text-primary-700 hover:underline inline-flex items-center gap-1 transition-colors active:scale-95 disabled:opacity-60"
              >
                {resending ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  t('resendOtp', 'Resend OTP')
                )}
              </button>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-surface-100">
            <button
              type="button"
              onClick={() => navigate('/register', { replace: true })}
              className="text-[11px] text-surface-500 hover:text-primary-600 font-medium transition-colors"
            >
              {t('backToRegister', 'Back to Registration')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
