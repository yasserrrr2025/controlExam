
import React from 'react';
import { User } from '../../types';
import { ROLES_ARABIC, APP_CONFIG } from '../../constants';

interface Props {
  user: User;
}

const TeacherBadgeView: React.FC<Props> = ({ user }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${user.national_id}`;
  return (
    <div className="flex flex-col items-center justify-center py-10 animate-fade-in no-print">
       <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl border overflow-hidden text-center relative transition-transform hover:scale-105">
          <div className="bg-slate-900 p-14 text-white relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
             <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-6 flex items-center justify-center p-2">
                <img src={APP_CONFIG.LOGO_URL} className="w-full h-full object-contain" alt="Logo" />
             </div>
             <h3 className="text-xl font-black tracking-tighter">كنترول الاختبارات</h3>
             <p className="text-blue-400 text-[10px] font-black tracking-widest mt-3 uppercase">البطاقة الرقمية للمعلم</p>
          </div>
          <div className="p-12 flex flex-col items-center">
             <div className="w-32 h-32 bg-white rounded-full mb-8 border-8 border-slate-50 shadow-2xl flex items-center justify-center overflow-hidden transition-all group-hover:rotate-6 p-2">
                <img src={APP_CONFIG.LOGO_URL} alt="Profile" className="w-full h-full object-contain" />
             </div>
             <h4 className="text-3xl font-black text-slate-900 mb-2">{user.full_name}</h4>
             <p className="bg-blue-50 text-blue-600 px-6 py-1.5 rounded-full text-xs font-black uppercase mb-10">{ROLES_ARABIC[user.role] || user.role}</p>
             <div className="p-6 bg-white border-2 border-slate-50 rounded-[3rem] shadow-inner"><img src={qrUrl} alt="QR ID" className="w-52 h-52 mix-blend-multiply" /></div>
          </div>
       </div>
    </div>
  );
};

export default TeacherBadgeView;
