
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { APP_CONFIG } from '../constants';
import { db } from '../supabase';
import { ShieldCheck, Download, Smartphone, Share, KeyRound, Fingerprint, Sparkles } from 'lucide-react';

interface Props {
  users: User[];
  onLogin: (user: User) => void;
  onAlert: (msg: string, type: any) => void;
}

const Login: React.FC<Props> = ({ onLogin, onAlert }) => {
  const [loginId, setLoginId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [focused, setFocused] = useState(false);
  const validRoles: UserRole[] = ['ADMIN', 'CONTROL_MANAGER', 'PROCTOR', 'CONTROL', 'ASSISTANT_CONTROL', 'COUNSELOR'];

  const normalizeNationalId = (value: string) =>
    value
      .replace(/[\u0660-\u0669]/g, digit => String(digit.charCodeAt(0) - 1632))
      .replace(/[\u06f0-\u06f9]/g, digit => String(digit.charCodeAt(0) - 1776))
      .replace(/\D/g, '');

  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isIos && !isStandalone) setShowIosHint(true);

    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = normalizeNationalId(loginId);
    if (!id) { onAlert('يرجى إدخال رقم الهوية', 'warning'); return; }
    if (id.length < 6) { onAlert('رقم الهوية المدخل غير مكتمل.', 'warning'); return; }
    setIsLoading(true);
    try {
      const user = await db.users.getById(id);
      if (user && validRoles.includes(user.role)) {
        onAlert(`أهلاً بك، ${user.full_name}`, 'success');
        onLogin(user);
      } else if (user) {
        onAlert('تم العثور على المستخدم لكن صلاحية الدخول غير معروفة.', 'error');
      } else {
        onAlert('عذراً! رقم الهوية غير مسجل.', 'error');
      }
    } catch (err: any) {
      onAlert(err.message || 'خطأ في الاتصال بقاعدة البيانات.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#020917] p-4 font-['Tajawal'] relative overflow-hidden" dir="rtl">

      {/* â”€â”€ ط·ط¨ظ‚ط© ط®ظ„ظپظٹط© â”€â”€ */}
      {/* ط¯ظˆط§ط¦ط± ط¶ظˆط¦ظٹط© */}
      <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-700/20 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-700/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* ط´ط¨ظƒط© ط£ظپظ‚ظٹط© ط®ظپظٹظپط© */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* â”€â”€ ظ†طµ طھط±ط­ظٹط¨ظٹ ط¹ظ„ظˆظٹ â”€â”€ */}
      <div className="relative z-10 text-center mb-8 space-y-2 animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em] mb-4">
          <ShieldCheck size={13} />
          ط¨ظˆط§ط¨ط© ط§ظ„ط¯ط®ظˆظ„ ط§ظ„ط¢ظ…ظ†
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
          ط§ظ„ظƒظ†طھط±ظˆظ„ ط§ظ„ظ…ط·ظˆط±
        </h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
          Smart Exam Control System
        </p>
      </div>

      {/* â”€â”€ ط§ظ„ظƒط§ط±طھ ط§ظ„ط±ط¦ظٹط³ظٹ â”€â”€ */}
      <div className="relative z-10 w-full max-w-sm animate-slide-up">

        {/* ط¥ط·ط§ط± ط¶ظˆط¦ظٹ ط®ط§ط±ط¬ظٹ */}
        <div className="absolute -inset-px bg-gradient-to-b from-white/10 via-transparent to-blue-500/20 rounded-[3rem] pointer-events-none" />

        <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 shadow-2xl overflow-hidden">

          {/* طھظˆظ‡ط¬ ط¯ط§ط®ظ„ظٹ ط£ط¹ظ„ظ‰ */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-blue-500/10 blur-2xl rounded-full pointer-events-none" />

          {/* â”€â”€ ط´ط¹ط§ط± ط§ظ„ظˆط²ط§ط±ط© â”€â”€ */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-5">
              {/* ظ‡ط§ظ„ط© ط¶ظˆط¦ظٹط© ط®ظ„ظپ ط§ظ„ط´ط¹ط§ط± */}
              <div className="absolute inset-0 bg-blue-500/20 rounded-[1.8rem] blur-xl scale-125 pointer-events-none" />
              <div className="relative w-22 h-22 bg-white rounded-[1.8rem] p-3 shadow-2xl border border-white/20"
                style={{ width: '88px', height: '88px' }}>
                <img src={APP_CONFIG.LOGO_URL} alt="ظˆط²ط§ط±ط© ط§ظ„طھط¹ظ„ظٹظ…" className="w-full h-full object-contain" />
              </div>
              {/* ظ†ظ‚ط·ط© طھط­ظ‚ظ‚ */}
              <div className="absolute -bottom-1.5 -left-1.5 w-7 h-7 bg-emerald-500 rounded-xl border-2 border-[#020917] flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <ShieldCheck size={14} className="text-white" />
              </div>
            </div>

            {/* ط§ظ„ظ†طµ طھط­طھ ط§ظ„ط´ط¹ط§ط± */}
            <div className="text-center space-y-1.5">
              <p className="text-white/40 font-bold text-[10px] uppercase tracking-[0.3em]">ط§ظ„ظ…ظ…ظ„ظƒط© ط§ظ„ط¹ط±ط¨ظٹط© ط§ظ„ط³ط¹ظˆط¯ظٹط©</p>
              <p className="text-white/70 font-black text-sm">ظˆط²ط§ط±ط© ط§ظ„طھط¹ظ„ظٹظ…</p>
              <p className="text-white/55 font-bold text-xs">ط¥ط¯ط§ط±ط© ط§ظ„طھط¹ظ„ظٹظ… ط¨ظ…ط­ط§ظپط¸ط© ط¬ط¯ط©</p>
              <p className="text-blue-400/80 font-black text-xs">ظ…ط¯ط±ط³ط© ط¹ظ…ط§ط¯ ط§ظ„ط¯ظٹظ† ط²ظ†ظƒظٹ ط§ظ„ظ…طھظˆط³ط·ط©</p>
            </div>
          </div>

          {/* â”€â”€ ظ†ظ…ظˆط°ط¬ ط§ظ„ط¯ط®ظˆظ„ â”€â”€ */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ط­ظ‚ظ„ ط§ظ„ظ‡ظˆظٹط© */}
            <div className="relative">
              <div className={`absolute inset-0 rounded-[1.8rem] transition-all duration-300 ${focused ? 'bg-blue-500/10 shadow-[0_0_0_2px_rgba(59,130,246,0.5)]' : 'bg-white/5'} rounded-[1.8rem]`} />
              <div className="relative flex items-center">
                <div className={`absolute right-5 transition-colors duration-200 ${focused ? 'text-blue-400' : 'text-white/25'}`}>
                  <Fingerprint size={22} />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="ط£ط¯ط®ظ„ ط±ظ‚ظ… ط§ظ„ظ‡ظˆظٹط© ط§ظ„ظˆط·ظ†ظٹط©"
                  className="w-full pr-14 pl-6 py-5 bg-transparent text-white text-center text-lg font-black placeholder:text-white/25 outline-none tracking-widest border-0"
                  style={{ caretColor: '#3b82f6' }}
                />
              </div>
            </div>

            {/* ط²ط± ط§ظ„ط¯ط®ظˆظ„ */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full relative py-5 rounded-[1.8rem] font-black text-lg transition-all duration-300 overflow-hidden group
                ${isLoading
                  ? 'bg-blue-600/50 text-white/50 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98] shadow-2xl shadow-blue-600/30'
                }`}
            >
              {/* shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <span className="relative flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" style={{ borderWidth: '3px' }} />
                    ط¬ط§ط±ظٹ ط§ظ„طھط­ظ‚ظ‚...
                  </>
                ) : (
                  <>
                    <KeyRound size={20} />
                    ط¯ط®ظˆظ„ ط§ظ„ظ†ط¸ط§ظ…
                  </>
                )}
              </span>
            </button>
          </form>

          {/* â”€â”€ طھط«ط¨ظٹطھ ط§ظ„طھط·ط¨ظٹظ‚ (Android) â”€â”€ */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="mt-4 w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 hover:bg-emerald-500/20 transition-all"
            >
              <Download size={18} />
              طھط«ط¨ظٹطھ ط§ظ„ظƒظ†طھط±ظˆظ„ ط§ظ„ظ…ط·ظˆط± ط¹ظ„ظ‰ ط¬ظˆط§ظ„ظƒ
            </button>
          )}

          {/* â”€â”€ طھط¹ظ„ظٹظ…ط§طھ iOS â”€â”€ */}
          {showIosHint && (
            <div className="mt-4 p-5 bg-blue-500/10 border border-blue-500/20 rounded-[1.5rem] text-right">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Smartphone size={18} />
                <h4 className="font-black text-sm">طھط«ط¨ظٹطھ ط¹ظ„ظ‰ iPhone</h4>
              </div>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                ط§ط¶ط؛ط· ط²ط± ط§ظ„ظ…ط´ط§ط±ظƒط© <Share size={12} className="inline mx-1" /> ظپظٹ ط§ظ„ط£ط³ظپظ„ ط«ظ…
                <span className="text-blue-400 font-black"> "ط¥ط¶ط§ظپط© ط¥ظ„ظ‰ ط§ظ„ط´ط§ط´ط© ط§ظ„ط±ط¦ظٹط³ظٹط©"</span>
              </p>
            </div>
          )}

          {/* â”€â”€ Footer â”€â”€ */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <p className="text-[9px] text-white/15 font-black tracking-[0.3em] uppercase">V 8.0 SECURE</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[9px] text-emerald-500/60 font-black uppercase tracking-wider">LIVE</p>
            </div>
            <p className="text-[9px] text-white/15 font-black tracking-[0.2em] uppercase">Powered by Supabase</p>
          </div>
        </div>
      </div>

      {/* â”€â”€ ظ†طµ ط³ظپظ„ظٹ â”€â”€ */}
      <p className="relative z-10 mt-8 text-[10px] text-white/15 font-bold text-center tracking-[0.3em] animate-fade-in">
        ظ…ط¯ط±ط³ط© ط¹ظ…ط§ط¯ ط§ظ„ط¯ظٹظ† ط²ظ†ظƒظٹ ط§ظ„ظ…طھظˆط³ط·ط© آ· ظ†ط¸ط§ظ… ظƒظ†طھط±ظˆظ„ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ ط§ظ„ظ…ظˆط­ط¯
      </p>

      <style>{`
        @keyframes fade-in  { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp  { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in    { animation: fade-in  0.6s ease-out both; }
        .animate-slide-up   { animation: slideUp  0.7s ease-out 0.15s both; }
      `}</style>
    </div>
  );
};

export default Login;


