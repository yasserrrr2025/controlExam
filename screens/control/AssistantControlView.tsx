
import React, { useMemo } from 'react';
import { User, ControlRequest } from '../../types';
import { Check, ShieldCheck } from 'lucide-react';

interface Props {
  user: User;
  requests: ControlRequest[];
  setRequests: any;
  onAlert: any;
}

const AssistantControlView: React.FC<Props> = ({ user, requests, setRequests, onAlert }) => {
  const myRequests = useMemo(() => requests.filter((r: ControlRequest) => user.assigned_committees?.includes(r.committee)), [requests, user]);
  
  return (
    <div className="space-y-10 animate-fade-in text-right pb-20">
       <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
          <div className="relative z-10 text-right">
             <h2 className="text-4xl font-black mb-4 tracking-tighter">مساعد الكنترول</h2>
             <div className="flex flex-wrap justify-end gap-3">{user.assigned_committees?.map((c: string) => <span key={c} className="bg-white/10 px-3 py-1 rounded-lg text-xs font-bold">لجنة {c}</span>)}</div>
          </div>
          <div className="relative z-10 mt-8 md:mt-0 bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-center min-w-[200px] shadow-inner"><p className="text-[10px] font-black uppercase text-blue-400 mb-2">بلاغات قيد الانتظار</p><p className="text-5xl font-black text-white">{myRequests.filter((r:any) => r.status === 'PENDING').length}</p></div>
       </div>
       <div className="grid grid-cols-1 gap-6">
          {myRequests.map((req: ControlRequest) => (
            <div key={req.id} className={`bg-white p-10 rounded-[3rem] border-2 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-10 transition-all ${req.status === 'DONE' ? 'opacity-50 grayscale bg-emerald-50/10' : 'border-blue-100'}`}>
               <div className="flex items-start gap-8 w-full text-right"><div className="bg-slate-900 text-white w-24 h-24 rounded-[2rem] flex flex-col items-center justify-center font-black shadow-xl shrink-0"><span className="text-[10px] opacity-40 uppercase mb-1">لجنة</span><span className="text-3xl">{req.committee}</span></div><div className="flex-1"><div className="flex items-center gap-5 mb-3"><h4 className="text-2xl font-black text-slate-800">{req.from}</h4><span className="bg-slate-50 text-slate-400 px-4 py-1 rounded-full text-xs font-bold font-mono">{req.time}</span></div><p className="text-slate-600 font-bold text-xl leading-relaxed">{req.text}</p></div></div>
               {req.status === 'PENDING' ? <button onClick={() => { setRequests((p: any) => p.map((r: any) => r.id === req.id ? {...r, status: 'DONE'} : r)); onAlert(`تم مباشرة طلب اللجنة ${req.committee}`); }} className="bg-emerald-600 text-white px-12 py-5 rounded-[1.5rem] font-black shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3 shrink-0 active:scale-95"><Check size={24} /> تمت المباشرة</button> : <div className="flex items-center gap-2 text-emerald-600 font-black shrink-0 text-lg"><ShieldCheck size={28} /> مكتمل</div>}
            </div>
          ))}
       </div>
    </div>
  );
};

export default AssistantControlView;
