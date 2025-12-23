
import React, { useState, useMemo } from 'react';
import { GraduationCap, UserCheck, AlertCircle, Users, ArrowUpRight, Send, Radio, Activity, Search } from 'lucide-react';
import { Supervision, Absence, DeliveryLog, User, Student, UserRole } from '../../types';
import { ROLES_ARABIC } from '../../constants';

// Interface for Dashboard Props to ensure type safety
interface AdminDashboardProps {
  stats: { students: number; users: number; activeSupervisions: number };
  absences: Absence[];
  supervisions: Supervision[];
  users: User[];
  deliveryLogs: DeliveryLog[];
  studentsList: Student[];
  onBroadcast: (msg: string, target: UserRole | 'ALL') => void;
}

// Interface for Committee Status in the live wall
interface CommitteeStatus {
  num: string;
  proctor?: User;
  absences: number;
  status: 'IDLE' | 'ACTIVE' | 'PROBLEM' | 'DONE';
}

const StatCard = ({ title, value, icon, color, bgColor, textColor }: any) => (
  <div className={`group p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border-2 ${color} bg-white shadow-xl shadow-slate-200/50 flex items-center gap-5 lg:gap-8 transition-all hover:scale-[1.03] hover:shadow-2xl text-right relative overflow-hidden`}>
    <div className={`absolute top-0 left-0 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${bgColor}`}></div>
    <div className={`p-4 lg:p-6 ${bgColor} ${textColor} rounded-2xl lg:rounded-3xl shadow-inner shrink-0 group-hover:rotate-6 transition-transform`}>{icon}</div>
    <div className="flex-1">
      <p className="text-slate-400 text-[10px] font-black uppercase mb-1 flex items-center gap-2">
        {title}
        <ArrowUpRight size={10} className="text-slate-300" />
      </p>
      <p className="text-3xl lg:text-4xl font-black text-slate-900 leading-none tabular-nums">{value}</p>
    </div>
  </div>
);

const AdminDashboardOverview = ({ stats, absences, supervisions, users, deliveryLogs, studentsList, onBroadcast }: AdminDashboardProps) => {
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [targetRole, setTargetRole] = useState<UserRole | 'ALL'>('ALL');
  const [liveSearch, setLiveSearch] = useState('');

  // معالجة بيانات اللجان المباشرة
  // Fix: Explicitly type the useMemo return to avoid 'unknown' property errors (Fixes line 46, 90, 97)
  const liveCommittees = useMemo<CommitteeStatus[]>(() => {
    // استخراج أرقام اللجان الفريدة من قائمة الطلاب
    const committeeNums = Array.from(new Set(studentsList.map((s: Student) => s.committee_number))).filter(Boolean).sort((a: any, b: any) => Number(a) - Number(b));
    
    return committeeNums.map(num => {
      const sv = supervisions.find((s: Supervision) => s.committee_number === num);
      const proctor = users.find((u: User) => u.id === sv?.teacher_id);
      const committeeAbsences = absences.filter((a: Absence) => a.committee_number === num);
      const isReceived = deliveryLogs.some((l: DeliveryLog) => l.committee_number === num && l.type === 'RECEIVE');
      
      let status: 'IDLE' | 'ACTIVE' | 'PROBLEM' | 'DONE' = 'IDLE';
      if (isReceived) status = 'DONE';
      else if (committeeAbsences.length > 0) status = 'PROBLEM';
      else if (sv) status = 'ACTIVE';

      return { num, proctor, absences: committeeAbsences.length, status };
    });
  }, [studentsList, supervisions, users, absences, deliveryLogs]);

  // Fix: Added optional chaining and explicit type checking for search logic to resolve property 'includes' error on unknown
  const filteredCommittees = liveCommittees.filter(c => 
    c.num.includes(liveSearch) || 
    (c.proctor?.full_name && c.proctor.full_name.includes(liveSearch))
  );

  return (
    <div className="space-y-10 lg:space-y-14 animate-slide-up text-right">
      {/* القسم العلوي: إحصائيات */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter">مركز القيادة</h2>
          <p className="text-slate-400 font-bold text-sm italic mt-2 flex items-center gap-2"><Activity size={16} className="text-blue-600 animate-pulse"/> المتابعة الحية لأداء اللجان الآن</p>
        </div>
        <div className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl font-black text-sm flex items-center gap-4">
           <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
           {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
           <span className="opacity-20">|</span>
           {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
         <StatCard title="إجمالي الطلاب" value={stats.students} icon={<GraduationCap size={28} />} color="border-blue-50" bgColor="bg-blue-600" textColor="text-white" />
         <StatCard title="لجان نشطة" value={liveCommittees.filter(c => c.status === 'ACTIVE' || c.status === 'PROBLEM').length} icon={<UserCheck size={28} />} color="border-emerald-50" bgColor="bg-emerald-600" textColor="text-white" />
         <StatCard title="بلاغات لم تُعالج" value={absences.length} icon={<AlertCircle size={28} />} color="border-red-50" bgColor="bg-red-600" textColor="text-white" />
         <StatCard title="لجان منتهية" value={liveCommittees.filter(c => c.status === 'DONE').length} icon={<Users size={28} />} color="border-indigo-50" bgColor="bg-indigo-600" textColor="text-white" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Live Wall - مراقبة اللجان */}
        <div className="xl:col-span-2 space-y-6">
           <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border shadow-sm">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Radio size={24} className="text-blue-600"/> حائط اللجان المباشر</h3>
              <div className="relative w-64">
                <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="بحث عن لجنة أو مراقب..." 
                  className="w-full pr-10 py-2 bg-slate-50 border rounded-xl font-bold text-xs outline-none focus:border-blue-500"
                  value={liveSearch}
                  onChange={e => setLiveSearch(e.target.value)}
                />
              </div>
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredCommittees.map(committee => (
                <div key={committee.num} className={`
                  p-6 rounded-[2rem] border-2 transition-all hover:scale-105 cursor-help flex flex-col items-center gap-3 relative overflow-hidden
                  ${committee.status === 'DONE' ? 'bg-indigo-50 border-indigo-100 opacity-60' : 
                    committee.status === 'PROBLEM' ? 'bg-red-50 border-red-200 animate-pulse-slow' : 
                    committee.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100 shadow-lg' : 
                    'bg-white border-slate-100 text-slate-300'}
                `}>
                   <span className="text-3xl font-black">{committee.num}</span>
                   <p className="text-[9px] font-black uppercase text-center truncate w-full">
                     {committee.proctor?.full_name || 'بدون مراقب'}
                   </p>
                   {committee.absences > 0 && (
                     <div className="absolute top-2 left-2 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black">
                       {committee.absences}
                     </div>
                   )}
                   <div className="mt-2 w-2 h-2 rounded-full bg-current opacity-20"></div>
                </div>
              ))}
           </div>
        </div>

        {/* Broadcast Center - مركز البث */}
        <div className="space-y-8">
           <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl"></div>
              <h3 className="text-2xl font-black mb-8 flex items-center gap-4"><Send size={24} className="text-blue-400"/> بث بلاغ جماعي</h3>
              
              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">الفئة المستهدفة</label>
                  <select 
                    value={targetRole} 
                    onChange={e => setTargetRole(e.target.value as any)}
                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 font-bold text-sm outline-none focus:border-blue-400"
                  >
                    <option value="ALL" className="text-slate-900">الكل (بث عام)</option>
                    {Object.entries(ROLES_ARABIC).map(([key, val]) => (
                      <option key={key} value={key} className="text-slate-900">{val}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">نص البلاغ</label>
                  <textarea 
                    value={broadcastMsg}
                    onChange={e => setBroadcastMsg(e.target.value)}
                    placeholder="اكتب التنبيه هنا..."
                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-5 font-bold text-sm h-32 outline-none focus:border-blue-400 resize-none placeholder:text-white/20"
                  ></textarea>
                </div>

                <button 
                  onClick={() => { if(broadcastMsg) { onBroadcast(broadcastMsg, targetRole); setBroadcastMsg(''); } }}
                  disabled={!broadcastMsg}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Send size={20}/>
                  إرسال الإشعار الفوري
                </button>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border shadow-sm">
              <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Activity size={18} className="text-emerald-500"/> دليل الحالات</h4>
              <div className="space-y-4">
                 <div className="flex items-center gap-4"><div className="w-4 h-4 rounded-full bg-emerald-500"></div><span className="text-xs font-bold text-slate-500">لجنة نشطة (مراقب ملتحق)</span></div>
                 <div className="flex items-center gap-4"><div className="w-4 h-4 rounded-full bg-red-500"></div><span className="text-xs font-bold text-slate-500">لجنة بها بلاغ (غياب/تأخير)</span></div>
                 <div className="flex items-center gap-4"><div className="w-4 h-4 rounded-full bg-indigo-500"></div><span className="text-xs font-bold text-slate-500">لجنة منتهية (مُستلمة بالكنترول)</span></div>
                 <div className="flex items-center gap-4"><div className="w-4 h-4 rounded-full bg-slate-200"></div><span className="text-xs font-bold text-slate-500">لجنة بانتظار المراقب</span></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
