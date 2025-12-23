
import React, { useState, useMemo, useEffect } from 'react';
import { GraduationCap, UserCheck, AlertCircle, Users, ArrowUpRight, Send, Radio, Activity, Search, ShieldAlert, Timer, UserX, Clock, UserCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Supervision, Absence, DeliveryLog, User, Student, UserRole, SystemConfig } from '../../types';
import { ROLES_ARABIC } from '../../constants';

interface AdminDashboardProps {
  stats: { students: number; users: number; activeSupervisions: number };
  absences: Absence[];
  supervisions: Supervision[];
  users: User[];
  deliveryLogs: DeliveryLog[];
  studentsList: Student[];
  onBroadcast: (msg: string, target: UserRole | 'ALL') => void;
  systemConfig: SystemConfig;
}

interface CommitteeStatus {
  num: string;
  proctor?: User;
  absences: number;
  lates: number;
  totalStudents: number;
  status: 'IDLE' | 'ACTIVE' | 'PROBLEM' | 'DONE';
  isAnomaly: boolean;
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

const AdminDashboardOverview = ({ stats, absences, supervisions, users, deliveryLogs, studentsList, onBroadcast, systemConfig }: AdminDashboardProps) => {
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [targetRole, setTargetRole] = useState<UserRole | 'ALL'>('ALL');
  const [liveSearch, setLiveSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const liveCommittees = useMemo<CommitteeStatus[]>(() => {
    const committeeNums = Array.from(new Set(studentsList.map((s: Student) => s.committee_number))).filter(Boolean).sort((a: any, b: any) => Number(a) - Number(b));
    
    const now = new Date();
    const [startHour, startMin] = (systemConfig.exam_start_time || '08:00').split(':').map(Number);
    const examStartTimeDate = new Date();
    examStartTimeDate.setHours(startHour, startMin, 0);
    const fiveMinutesAfter = new Date(examStartTimeDate.getTime() + 5 * 60 * 1000);
    const isAfterGracePeriod = now > fiveMinutesAfter;

    return committeeNums.map(num => {
      const sv = supervisions.find((s: Supervision) => s.committee_number === num);
      const proctor = users.find((u: User) => u.id === sv?.teacher_id);
      const committeeStudents = studentsList.filter(s => s.committee_number === num);
      const committeeAbsences = absences.filter((a: Absence) => a.committee_number === num && a.type === 'ABSENT');
      const committeeLates = absences.filter((a: Absence) => a.committee_number === num && a.type === 'LATE');
      const isReceived = deliveryLogs.some((l: DeliveryLog) => l.committee_number === num && l.type === 'RECEIVE' && l.status === 'CONFIRMED');
      
      let status: 'IDLE' | 'ACTIVE' | 'PROBLEM' | 'DONE' = 'IDLE';
      if (isReceived) status = 'DONE';
      else if (committeeAbsences.length > 0 || committeeLates.length > 0) status = 'PROBLEM';
      else if (sv) status = 'ACTIVE';

      const isAnomaly = isAfterGracePeriod && !sv && !isReceived;

      return { 
        num, 
        proctor, 
        absences: committeeAbsences.length, 
        lates: committeeLates.length,
        totalStudents: committeeStudents.length,
        status,
        isAnomaly
      };
    });
  }, [studentsList, supervisions, users, absences, deliveryLogs, systemConfig, currentTime]);

  const filteredCommittees = liveCommittees.filter(c => 
    c.num.includes(liveSearch) || 
    (c.proctor?.full_name && c.proctor.full_name.includes(liveSearch))
  );

  return (
    <div className="space-y-10 lg:space-y-14 animate-slide-up text-right">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter">مركز القيادة الذكي</h2>
          <p className="text-slate-400 font-bold text-sm italic mt-2 flex items-center gap-2">
            <Activity size={16} className="text-blue-600 animate-pulse"/> 
            مراقبة الأداء واكتشاف الشذوذ مفعلة
          </p>
        </div>
        <div className="bg-slate-950 p-1.5 rounded-[2.2rem] flex items-center gap-1 shadow-2xl">
           <div className="bg-blue-600 text-white px-6 py-3 rounded-[1.8rem] font-black text-xs flex items-center gap-3">
              <Clock size={16}/> {currentTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
           </div>
           <div className="text-slate-500 px-6 py-3 font-bold text-xs">
              بداية الاختبار: {systemConfig.exam_start_time}
           </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
         <StatCard title="إجمالي الطلاب" value={stats.students} icon={<GraduationCap size={28} />} color="border-blue-50" bgColor="bg-blue-600" textColor="text-white" />
         <StatCard title="لجان مراقبة" value={liveCommittees.filter(c => c.status === 'ACTIVE' || c.status === 'PROBLEM').length} icon={<UserCheck size={28} />} color="border-emerald-50" bgColor="bg-emerald-600" textColor="text-white" />
         <StatCard title="إجمالي الغياب" value={absences.filter(a => a.type === 'ABSENT').length} icon={<UserX size={28} />} color="border-red-50" bgColor="bg-red-600" textColor="text-white" />
         <StatCard title="إنذارات اللجان" value={liveCommittees.filter(c => c.isAnomaly).length} icon={<ShieldAlert size={28} />} color="border-amber-50" bgColor="bg-amber-500" textColor="text-white" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
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
           
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCommittees.map(committee => (
                <div key={committee.num} className={`
                  p-6 rounded-[2.5rem] border-2 transition-all hover:scale-105 cursor-help flex flex-col gap-5 relative overflow-hidden min-h-[280px]
                  ${committee.isAnomaly ? 'bg-red-50 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.4)] animate-pulse' : 
                    committee.status === 'DONE' ? 'bg-blue-600 border-blue-400 shadow-blue-100 shadow-lg' : 
                    committee.status === 'PROBLEM' ? 'bg-amber-50 border-amber-400 shadow-amber-50' : 
                    committee.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-300 shadow-emerald-100 shadow-lg' : 
                    'bg-white border-slate-100'}
                `}>
                   {committee.isAnomaly && (
                     <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1 rounded-bl-xl font-black text-[9px] z-20 flex items-center gap-1">
                        <ShieldAlert size={10} /> بدون مراقب
                     </div>
                   )}

                   {committee.status === 'DONE' && (
                     <div className="absolute top-0 right-0 bg-white/20 text-white px-4 py-1 rounded-bl-xl font-black text-[9px] z-20 flex items-center gap-1">
                        <CheckCircle2 size={10} /> مستلمة
                     </div>
                   )}
                   
                   <div className="flex justify-between items-center">
                     <div className="flex flex-col">
                        <span className={`text-4xl font-black leading-none ${committee.status === 'DONE' ? 'text-white' : 'text-slate-900'}`}>{committee.num}</span>
                        <span className={`text-[9px] font-bold uppercase mt-1 ${committee.status === 'DONE' ? 'text-blue-100' : 'text-slate-400'}`}>رقم اللجنة</span>
                     </div>
                     <div className={`p-2.5 rounded-2xl ${committee.status === 'DONE' ? 'bg-white/20 text-white' : 'bg-white/50 shadow-inner'}`}>
                        <Timer size={18} className={committee.status === 'ACTIVE' ? 'text-emerald-500 animate-spin-slow' : committee.status === 'DONE' ? 'text-white' : 'text-slate-300'} />
                     </div>
                   </div>

                   {/* اسم المراقب - تم إلغاء الاختصار وتفعيل الالتفاف */}
                   <div className={`
                    p-3.5 rounded-2xl flex items-start gap-3 border shadow-sm transition-all
                    ${committee.status === 'DONE' ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-900 border-slate-800 text-white'}
                   `}>
                     <UserCircle size={16} className={`mt-0.5 shrink-0 ${committee.status === 'DONE' ? 'text-blue-200' : 'text-blue-400'}`} />
                     <div className="flex flex-col flex-1">
                        <p className="text-[10px] font-black uppercase opacity-60 mb-0.5 tracking-widest">اسم المراقب</p>
                        <p className="text-[11px] font-black whitespace-normal break-words leading-snug">
                          {committee.proctor?.full_name || 'بانتظار التحاق المراقب'}
                        </p>
                     </div>
                   </div>

                   {/* شبكة البيانات - 3 أعمدة واضحة */}
                   <div className="grid grid-cols-3 gap-2">
                      <div className={`p-2.5 rounded-xl text-center flex flex-col items-center gap-1 ${committee.status === 'DONE' ? 'bg-white/10' : 'bg-slate-50/50'}`}>
                         <span className={`text-[8px] font-black uppercase ${committee.status === 'DONE' ? 'text-blue-100' : 'text-slate-400'}`}>طلاب</span>
                         <span className={`text-sm font-black tabular-nums ${committee.status === 'DONE' ? 'text-white' : 'text-slate-800'}`}>{committee.totalStudents}</span>
                      </div>
                      <div className={`p-2.5 rounded-xl text-center flex flex-col items-center gap-1 ${committee.absences > 0 ? (committee.status === 'DONE' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-700') : (committee.status === 'DONE' ? 'bg-white/5 text-blue-200' : 'bg-slate-50/50 text-slate-300')}`}>
                         <span className={`text-[8px] font-black uppercase`}>غياب</span>
                         <span className="text-sm font-black tabular-nums">{committee.absences}</span>
                      </div>
                      <div className={`p-2.5 rounded-xl text-center flex flex-col items-center gap-1 ${committee.lates > 0 ? (committee.status === 'DONE' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700 font-black border-amber-200 border') : (committee.status === 'DONE' ? 'bg-white/5 text-blue-200' : 'bg-slate-50/50 text-slate-300')}`}>
                         <span className={`text-[8px] font-black uppercase`}>تأخير</span>
                         <span className="text-sm font-black tabular-nums">{committee.lates}</span>
                      </div>
                   </div>

                   {committee.isAnomaly && (
                     <div className="mt-1 text-[9px] font-bold text-red-600 bg-red-100/50 p-2 rounded-lg text-center animate-bounce flex items-center justify-center gap-1">
                        <AlertTriangle size={10} /> تجاوز وقت البدء
                     </div>
                   )}
                </div>
              ))}
           </div>
        </div>

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
                  <Send size={20}/> إرسال الإشعار الفوري
                </button>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-4">
              <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Activity size={18} className="text-emerald-500"/> دليل الحالات</h4>
              <div className="space-y-4">
                 <div className="flex items-center gap-4"><div className="w-5 h-5 rounded-lg bg-red-600 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div><span className="text-xs font-black text-red-600 uppercase">لجنة تجاوزت وقت البدء بدون مراقب</span></div>
                 <div className="flex items-center gap-4"><div className="w-4 h-4 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div><span className="text-xs font-black text-blue-600">لجنة منتهية (مُستلمة بالكنترول)</span></div>
                 <div className="flex items-center gap-4"><div className="w-4 h-4 rounded-full bg-emerald-500"></div><span className="text-xs font-bold text-slate-500">لجنة نشطة (مراقب ملتحق)</span></div>
                 <div className="flex items-center gap-4"><div className="w-4 h-4 rounded-full bg-amber-500"></div><span className="text-xs font-bold text-slate-500">لجنة بها بلاغ غياب أو تأخير</span></div>
                 <div className="flex items-center gap-4"><div className="w-4 h-4 rounded-full bg-slate-200"></div><span className="text-xs font-bold text-slate-500">لجنة شاغرة (بانتظار البدء)</span></div>
              </div>
           </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          50% { box-shadow: 0 0 25px 10px rgba(239, 68, 68, 0.3); }
        }
        .animate-spin-slow { animation: spin 3s linear infinite; }
      `}</style>
    </div>
  );
};

export default AdminDashboardOverview;
