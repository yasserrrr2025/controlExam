
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { APP_CONFIG } from '../constants';
import { db } from '../supabase';
import { ShieldCheck, Download, Smartphone, Share, X, Info, Lock } from 'lucide-react';

interface Props {
  users: User[];
  onLogin: (user: User) => void;
  onAlert: (msg: string, type: any) => void;
}

const Login: React.FC<Props> = ({ onLogin, onAlert }) => {
  const [loginId, setLoginId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = loginId.trim();
    if (!id) {
      onAlert('يرجى إدخال رقم الهوية', 'warning');
      return;
    }
    
    setIsLoading(true);
    try {
      const user = await db.users.getById(id);
      if (user) {
        onAlert(`أهلاً بك، ${user.full_name}`, 'success');
        onLogin(user);
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-900 z-0 rounded-b-[3rem] shadow-2xl"></div>
      
      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="text-center mb-8">
           <div className="bg-white w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl p-3 border border-slate-100">
             <img src={APP_CONFIG.LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
           </div>
           <h1 className="text-2xl font-black text-white tracking-tight">كنترول الاختبارات</h1>
           <p className="text-slate-400 text-sm mt-1 font-medium italic">النظام الموحد للمراقبة والتوثيق</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-widest">رقم الهوية الوطنية</label>
              <div className="relative">
                <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={loginId} 
                  onChange={(e) => setLoginId(e.target.value)} 
                  placeholder="أدخل 10 أرقام" 
                  className="w-full pr-12 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-xl font-black focus:border-indigo-600 focus:bg-white outline-none transition-all" 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 text-lg hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : 'دخول النظام'}
            </button>
          </form>
          
          <div className="mt-8 flex items-center gap-3 justify-center text-slate-300">
             <div className="h-px bg-slate-100 flex-1"></div>
             <span className="text-[10px] font-black tracking-widest uppercase">V 7.0 PRO</span>
             <div className="h-px bg-slate-100 flex-1"></div>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-400 text-[11px] font-medium leading-relaxed">
          جميع الحقوق محفوظة للمدرسة والمؤسسة التعليمية <br/> © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Login;
