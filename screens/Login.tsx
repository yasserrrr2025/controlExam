
import React, { useState } from 'react';
import { User } from '../types';
import { APP_CONFIG } from '../constants';
import { db } from '../supabase';

interface Props {
  users: User[]; // لا نزال نحتاج القائمة المحلية للعرض السريع إذا لزم الأمر
  onLogin: (user: User) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [loginId, setLoginId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = loginId.trim();
    if (!id) return;
    
    setIsLoading(true);
    try {
      // التحقق من قاعدة البيانات الحقيقية
      const user = await db.users.getById(id);
      if (user) {
        onLogin(user);
      } else {
        alert('عذراً! رقم الهوية غير مسجل في النظام. يرجى مراجعة إدارة الكنترول.');
      }
    } catch (err) {
      alert('خطأ في الاتصال بقاعدة البيانات. تأكد من إعدادات Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 font-['Tajawal'] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>

      <div className="bg-white/95 backdrop-blur-xl p-8 lg:p-14 rounded-[3rem] shadow-2xl w-full max-w-md border border-white/20 text-center relative z-10 animate-slide-up">
        <div className="bg-white w-28 h-28 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl border-4 border-slate-50 overflow-hidden rotate-3 transition-transform hover:rotate-0">
           <img src={APP_CONFIG.LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-2 tracking-tighter">كنترول الاختبارات</h1>
        <p className="text-slate-400 font-bold mb-10 italic">أدخل رقم الهوية للمتابعة</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input 
              type="text" 
              inputMode="numeric"
              value={loginId} 
              onChange={(e) => setLoginId(e.target.value)} 
              placeholder="رقم الهوية" 
              className="w-full p-5 lg:p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-2xl font-black focus:border-blue-600 outline-none transition-all shadow-inner placeholder:text-slate-200" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className={`
              w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-2xl shadow-slate-900/20 
              transition-all flex items-center justify-center gap-3
              ${isLoading ? 'opacity-70 scale-95' : 'hover:bg-blue-600 active:scale-95'}
            `}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              'دخول النظام'
            )}
          </button>
        </form>
        
        <div className="mt-12 space-y-2">
          <p className="text-[10px] text-slate-300 font-black tracking-widest uppercase">Official Exam Control System</p>
          <p className="text-[9px] text-slate-400 font-bold">إصدار 5.0.0 - الربط السحابي مفعل</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
