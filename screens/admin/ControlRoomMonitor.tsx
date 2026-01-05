
import React, { useMemo, useEffect, useState } from 'react';
import { 
  Activity, Monitor, ShieldAlert, Timer, 
  LayoutGrid, PackageCheck, UserX, UserCheck, 
  History, UserCircle, TriangleAlert, Info,
  Clock, CheckCircle2, Radio, Bell, Signal,
  MapPin, Users, Zap, X, AlertCircle, ChevronDown,
  ArrowDownToLine, Flame, Maximize2, Minimize2, MoveRight,
  MonitorPlay, LayoutPanelTop, Truck, Package, QrCode,
  ExternalLink, GraduationCap, UserCog
} from 'lucide-react';
import { Supervision, Absence, DeliveryLog, User, Student, ControlRequest } from '../../types';

interface Props {
  absences: Absence[];
  supervisions: Supervision[];
  users: User[];
  deliveryLogs: DeliveryLog[];
  students: Student[];
  requests: ControlRequest[];
}

const ControlRoomMonitor: React.FC<Props> = ({ absences, supervisions, users, deliveryLogs, students, requests }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [maximizedPanel, setMaximizedPanel] = useState<'MAP' | 'ABSENCES' | 'REPORTS' | null>(null);
  const [selectedCommitteeNum, setSelectedCommitteeNum] = useState<string | null>(null);
  
  const activeDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const totalComs = new Set(students.map(s => s.committee_number)).size;
    const completed = new Set(deliveryLogs.filter(l => l.status === 'CONFIRMED').map(l => l.committee_number)).size;
    const absents = absences.filter(a => a.type === 'ABSENT').length;
    const lates = absences.filter(a => a.type === 'LATE').length;
    const activeReqs = requests.filter(r => r.status !== 'DONE').length;
    
    return {
      totalComs,
      completed,
      remaining: totalComs - completed,
      absents,
      lates,
      activeReqs,
      progress: Math.round((completed / totalComs) * 100) || 0
    };
  }, [students, deliveryLogs, absences, requests]);

  const committeeGrid = useMemo(() => {
    const comNums = Array.from(new Set(students.map(s => s.committee_number))).filter(Boolean).sort((a: any, b: any) => Number(a) - Number(b)) as string[];
    
    return comNums.map(num => {
      const committeeGrades = Array.from(new Set(students.filter(s => s.committee_number === num).map(s => s.grade)));
      const committeeLogs = deliveryLogs.filter(l => l.committee_number === num && l.time.startsWith(activeDate));
      
      const isDone = committeeGrades.length > 0 && committeeGrades.every(g => 
        committeeLogs.some(l => l.grade === g && l.status === 'CONFIRMED')
      );

      const isSubmitted = !isDone && committeeGrades.length > 0 && committeeGrades.every(g => 
        committeeLogs.some(l => l.grade === g)
      );

      // التأكد من أن التنبيه يظهر إذا كان هناك بلاغ معلق (PENDING) أو قيد التنفيذ (IN_PROGRESS)
      const hasAlert = !isDone && requests.some(r => r.committee === num && r.status === 'PENDING');
      const inProgress = requests.some(r => r.committee === num && r.status === 'IN_PROGRESS');
      const sv = supervisions.find(s => s.committee_number === num);
      const isOccupied = !!sv;

      return { num, isDone, isSubmitted, hasAlert, inProgress, isOccupied, proctorId: sv?.teacher_id };
    });
  }, [students, deliveryLogs, requests, supervisions, activeDate]);

  const sortedRequests = useMemo(() => {
    // عرض البلاغات غير المنتهية أولاً
    return [...requests].sort((a, b) => {
        if (a.status !== 'DONE' && b.status === 'DONE') return -1;
        if (a.status === 'DONE' && b.status !== 'DONE') return 1;
        return b.time.localeCompare(a.time);
    });
  }, [requests]);

  const toggleMaximize = (panel: 'MAP' | 'ABSENCES' | 'REPORTS') => {
    setMaximizedPanel(maximizedPanel === panel ? null : panel);
  };

  // تفاصيل اللجنة المختارة للنافذة المنبثقة
  const selectedComData = useMemo(() => {
    if (!selectedCommitteeNum) return null;
    const comStudents = students.filter(s => s.committee_number === selectedCommitteeNum);
    const comAbsences = absences.filter(a => a.committee_number === selectedCommitteeNum && a.date.startsWith(activeDate));
    const sv = supervisions.find(s => s.committee_number === selectedCommitteeNum);
    const proctor = users.find(u => u.id === sv?.teacher_id);
    
    const currentUrl = new URL(window.location.href);
    currentUrl.search = ''; 
    currentUrl.hash = `status-${selectedCommitteeNum}`;
    const statusUrl = currentUrl.toString();
    
    return {
      num: selectedCommitteeNum,
      proctorName: proctor?.full_name || 'بانتظار المباشرة',
      total: comStudents.length,
      absent: comAbsences.filter(a => a.type === 'ABSENT').length,
      late: comAbsences.filter(a => a.type === 'LATE').length,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(statusUrl)}&color=000000`,
      statusUrl
    };
  }, [selectedCommitteeNum, students, absences, supervisions, users, activeDate]);

  const MapPanel = ({ isFull = false }) => (
    <div className={`bg-white/[0.04] border border-white/10 rounded-[4rem] p-10 flex flex-col shadow-2xl transition-all duration-500 ${isFull ? 'h-full' : 'h-[60%]'}`}>
      <div className="flex items-center justify-between mb-10">
         <div className="flex items-center gap-6">
            <div className="bg-blue-600/20 p-5 rounded-[2rem] text-blue-400"><LayoutGrid size={isFull ? 56 : 32} /></div>
            <div>
              <h2 className={`${isFull ? 'text-6xl' : 'text-4xl'} font-black tracking-tighter text-white`}>خريطة اللجان الحية</h2>
              <p className="text-slate-400 text-[11px] font-black uppercase mt-1 tracking-widest italic">انقر على أي لجنة لعرض كود QR المتابعة</p>
            </div>
         </div>
         <div className="flex gap-6 items-center">
            <div className="flex gap-8 items-center bg-black/50 px-8 py-3 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20"></div><span className="text-emerald-400">مكتملة</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div><span className="text-orange-400">متجه للكنترول</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></div><span className="text-red-400">بلاغ عاجل</span></div>
            </div>
            <button onClick={() => toggleMaximize('MAP')} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all shadow-xl">
               {isFull ? <Minimize2 size={32} className="text-blue-400" /> : <Maximize2 size={32} className="text-white" />}
            </button>
         </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
         <div className={`grid ${isFull ? 'grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12' : 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8'} gap-6 p-2`}>
            {committeeGrid.map(c => (
              <button 
                key={c.num} 
                onClick={() => setSelectedCommitteeNum(c.num)}
                className={`
                aspect-square rounded-[2.5rem] border-[3px] flex flex-col items-center justify-center transition-all duration-700 relative overflow-hidden group/item
                ${c.isDone ? 'bg-emerald-600 border-emerald-400 shadow-[0_20px_40px_rgba(16,185,129,0.2)]' : 
                  c.hasAlert ? 'bg-red-600 border-red-400 shadow-[0_20px_60px_rgba(220,38,38,0.4)] animate-pulse scale-110 z-20' : 
                  c.isSubmitted ? 'bg-orange-50 border-orange-300 shadow-[0_20px_50px_rgba(249,115,22,0.4)] animate-pulse scale-110 z-10' :
                  c.inProgress ? 'bg-blue-600 border-blue-400 shadow-[0_15px_30px_rgba(37,99,235,0.2)]' :
                  c.isOccupied ? 'bg-slate-800 border-blue-500/50' : 
                  'bg-white/5 border-white/5 opacity-10'}
                hover:scale-105 active:scale-95
              `}>
                <div className="absolute inset-0 bg-white opacity-0 group-hover/item:opacity-5 transition-opacity"></div>
                {c.isSubmitted && <Truck size={isFull ? 32 : 20} className="absolute top-4 right-4 text-white/40 animate-bounce" />}
                <span className="text-[10px] font-black opacity-30 uppercase relative z-10">لجنة</span>
                <span className={`${isFull ? 'text-6xl' : 'text-4xl'} font-black tabular-nums tracking-tighter relative z-10 text-white`}>{c.num}</span>
                <div className="absolute bottom-3 opacity-0 group-hover/item:opacity-100 transition-all translate-y-2 group-hover/item:translate-y-0 bg-white/20 px-3 py-1 rounded-full text-[8px] font-black uppercase">عرض التفاصيل</div>
              </button>
            ))}
         </div>
      </div>
    </div>
  );

  const AbsencesPanel = ({ isFull = false }) => (
    <div className={`bg-white/[0.04] border border-white/10 rounded-[4rem] p-10 flex flex-col shadow-2xl transition-all duration-500 ${isFull ? 'h-full' : 'h-[40%]'}`}>
       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
             <div className="p-4 bg-blue-600/20 text-blue-400 rounded-2xl"><Users size={isFull ? 56 : 32} /></div>
             <div>
                <h3 className={`${isFull ? 'text-6xl' : 'text-3xl'} font-black text-white tracking-tight`}>رصد حضور الطلاب</h3>
                <p className="text-slate-500 text-[11px] font-black uppercase mt-1 tracking-widest">تزامن رصد الغياب والتأخر</p>
             </div>
          </div>
          <button onClick={() => toggleMaximize('ABSENCES')} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
             {isFull ? <Minimize2 size={32} className="text-blue-400" /> : <Maximize2 size={32} className="text-white" />}
          </button>
       </div>
       <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-right border-collapse">
             <thead className={`sticky top-0 bg-[#0f172a] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/10 ${isFull ? 'text-2xl h-20' : 'text-[11px]'}`}>
                <tr>
                  <th className="py-4 px-8">الطالب</th>
                  <th className="py-4 px-8">اللجنة</th>
                  <th className="py-4 px-8">الصف</th>
                  <th className="py-4 px-8 text-center">الحالة</th>
                  <th className="py-4 px-8 text-left">التوقيت</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {absences.length === 0 ? (
                  <tr><td colSpan={5} className="py-32 text-center text-slate-700 font-black italic text-4xl opacity-10">بانتظار رصد الحالات الميدانية</td></tr>
                ) : (
                  absences.map(a => {
                    const student = students.find(s => s.national_id === a.student_id);
                    return (
                      <tr key={a.id} className={`${isFull ? 'text-4xl h-28' : 'text-xl'} hover:bg-white/[0.02] transition-colors`}>
                         <td className="py-6 px-8 font-black text-white">{a.student_name}</td>
                         <td className="py-6 px-8 font-black text-slate-400">لجنة {a.committee_number}</td>
                         <td className="py-6 px-8 font-bold text-slate-500">{student?.grade}</td>
                         <td className="py-6 px-8 text-center">
                            <span className={`px-6 py-2 rounded-2xl font-black ${isFull ? 'text-xl' : 'text-[10px]'} ${a.type === 'ABSENT' ? 'bg-red-500 shadow-[0_10px_20px_rgba(239,68,68,0.2)]' : 'bg-amber-500 shadow-[0_10px_20px_rgba(245,158,11,0.2)]'} text-white`}>
                               {a.type === 'ABSENT' ? 'غائب' : 'متأخر'}
                            </span>
                          </td>
                         <td className="py-6 px-8 text-left font-black text-blue-400 font-mono">
                           {new Date(a.date).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}
                         </td>
                      </tr>
                    );
                  })
                )}
             </tbody>
          </table>
       </div>
    </div>
  );

  const ReportsPanel = ({ isFull = false }) => (
    <div className={`bg-white/[0.04] border border-white/10 rounded-[4rem] p-10 flex flex-col shadow-2xl transition-all duration-500 ${isFull ? 'h-full' : 'flex-1 overflow-hidden'}`}>
       <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
          <div className="flex items-center gap-6">
             <ShieldAlert size={isFull ? 56 : 32} className="text-red-500 animate-pulse shadow-red-500" />
             <h2 className={`${isFull ? 'text-6xl' : 'text-3xl'} font-black text-white tracking-tighter uppercase`}>بلاغات الميدان</h2>
          </div>
          <button onClick={() => toggleMaximize('REPORTS')} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
             {isFull ? <Minimize2 size={32} className="text-blue-400" /> : <Maximize2 size={32} className="text-white" />}
          </button>
       </div>
       <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
          {sortedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-slate-700 opacity-10">
               <CheckCircle2 size={isFull ? 160 : 84} />
               <p className="font-black italic mt-6 text-2xl uppercase tracking-[0.5em]">No Active Alerts</p>
            </div>
          ) : (
            sortedRequests.map((req) => (
              <div key={req.id} className={`p-8 rounded-[3rem] border-2 transition-all duration-700 ${req.status === 'DONE' ? 'opacity-20 grayscale' : 'bg-red-600/10 border-red-500/40 shadow-[0_20px_40px_rgba(220,38,38,0.1)]'}`}>
                 <div className="flex justify-between items-center mb-6">
                    <div className="bg-slate-950 text-white px-6 py-2 rounded-2xl font-black text-2xl shadow-xl">لجنة {req.committee}</div>
                    <span className="text-xs font-black font-mono text-slate-500 tracking-widest">{new Date(req.time).toLocaleTimeString('ar-SA')}</span>
                 </div>
                 <p className={`${isFull ? 'text-5xl' : 'text-2xl'} font-black text-white leading-relaxed text-right`}>{req.text}</p>
                 <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><UserCircle size={24} className="text-slate-500" /></div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{req.from}</p>
                    </div>
                    {req.status === 'IN_PROGRESS' && (
                        <span className="bg-blue-600 text-white px-4 py-1 rounded-full font-black text-[10px] uppercase animate-pulse">قيد المباشرة</span>
                    )}
                 </div>
              </div>
            ))
          )}
       </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#0f172a] text-white overflow-hidden font-['Tajawal'] z-[100] flex flex-col p-6 dir-rtl text-right">
      
      {/* نافذة تفاصيل اللجنة المنبثقة (QR Zoom) */}
      {selectedComData && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-12 animate-fade-in no-print">
           <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-3xl" onClick={() => setSelectedCommitteeNum(null)}></div>
           <div className="bg-white/5 border border-white/10 w-full max-w-4xl rounded-[5rem] shadow-[0_0_150px_rgba(37,99,235,0.2)] relative z-10 overflow-hidden animate-slide-up flex flex-col md:flex-row items-center gap-12 p-16">
              
              <button onClick={() => setSelectedCommitteeNum(null)} className="absolute top-10 left-10 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all">
                <X size={48} />
              </button>

              {/* QR Code Section */}
              <div className="flex flex-col items-center gap-8 md:border-l border-white/10 md:pl-16">
                 <div className="bg-white p-8 rounded-[4rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] ring-8 ring-blue-600/20">
                    <img src={selectedComData.qrUrl} alt="QR" className="w-80 h-80 mix-blend-multiply" />
                 </div>
                 <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Scan for live status</p>
                    <p className="text-xs font-bold text-slate-500 italic">نقطة وصول المشرفين والزوار</p>
                 </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 space-y-10 text-right w-full">
                 <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-blue-600 text-white rounded-[2.5rem] flex flex-col items-center justify-center font-black shadow-2xl">
                       <span className="text-xs opacity-50 uppercase leading-none mb-1">لجنة</span>
                       <span className="text-5xl tabular-nums leading-none">{selectedComData.num}</span>
                    </div>
                    <div>
                       <h2 className="text-6xl font-black tracking-tighter text-white">بيانات اللجنة</h2>
                       <div className="flex items-center gap-3 mt-3">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                          <span className="text-emerald-400 font-black text-xs uppercase tracking-widest">تزامن مباشر نشط</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-white/[0.03] p-8 rounded-[3rem] border border-white/5 flex items-center gap-6 group hover:bg-white/[0.05] transition-all">
                       <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-blue-400 shadow-xl border border-blue-900/50"><UserCog size={32}/></div>
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">المراقب المسؤول</p>
                          <p className="text-3xl font-black text-white">{selectedComData.proctorName}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                       <div className="bg-white/[0.03] p-6 rounded-[2.5rem] border border-white/5 text-center group hover:border-blue-500/30 transition-all">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-2">إجمالي الطلاب</p>
                          <p className="text-4xl font-black text-white tabular-nums">{selectedComData.total}</p>
                       </div>
                       <div className="bg-red-500/10 p-6 rounded-[2.5rem] border border-red-500/20 text-center group hover:bg-red-500/20 transition-all">
                          <p className="text-[9px] font-black text-red-400 uppercase mb-2">الغياب</p>
                          <p className="text-4xl font-black text-red-500 tabular-nums">{selectedComData.absent}</p>
                       </div>
                       <div className="bg-amber-500/10 p-6 rounded-[2.5rem] border border-amber-500/20 text-center group hover:bg-amber-500/20 transition-all">
                          <p className="text-[9px] font-black text-amber-400 uppercase mb-2">التأخر</p>
                          <p className="text-4xl font-black text-amber-500 tabular-nums">{selectedComData.late}</p>
                       </div>
                    </div>
                 </div>

                 <div className="pt-6">
                    <a 
                      href={selectedComData.statusUrl} 
                      className="w-full py-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] font-black text-xl text-blue-400 flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-95"
                    >
                       <ExternalLink size={24} /> فتح صفحة المتابعة الكاملة
                    </a>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Header Info Bar */}
      <div className="flex justify-between items-center h-28 mb-8 border-b border-white/10 pb-6">
        <div className="bg-white/[0.05] border border-white/10 rounded-[2.5rem] px-10 py-4 flex items-center gap-8 shadow-2xl backdrop-blur-3xl">
           <MonitorPlay className="text-blue-500" size={40} />
           <div className="text-5xl font-black tabular-nums tracking-widest text-blue-400 font-mono">
              {currentTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/[صم]/, '')}
           </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center mx-10">
           <div className="flex items-center gap-8 w-full max-w-2xl">
              <span className="text-5xl font-black text-white tabular-nums">{stats.progress}%</span>
              <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden border border-white/10 p-1 shadow-inner relative">
                 <div className="h-full bg-gradient-to-l from-blue-600 via-blue-400 to-indigo-500 transition-all duration-1000 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.4)]" style={{ width: `${stats.progress}%` }}></div>
              </div>
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-3 italic">انقر على اللجنة للحصول على كود QR المتابعة</p>
        </div>

        <div className="flex items-center gap-8">
           <div className="text-right">
              <span className="bg-emerald-500/10 text-emerald-400 px-8 py-3 rounded-full border border-emerald-500/20 text-[11px] font-black flex items-center gap-4 shadow-2xl">
                 <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.8)]"></div> LIVE SYNC ACTIVE
              </span>
              <p className="text-slate-500 font-bold text-xs mt-3 mr-2 font-mono">{activeDate}</p>
        </div>
      </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
        {/* Right Info Column */}
        <div className="col-span-3 flex flex-col gap-8 overflow-hidden">
          <div className="grid grid-cols-1 gap-4">
             {[
               { icon: Package, color: 'text-blue-500', bg: 'bg-blue-600/10', val: stats.remaining, label: 'لجان متبقية', shadow: 'shadow-blue-500/10' },
               { icon: PackageCheck, color: 'text-emerald-500', bg: 'bg-emerald-600/10', val: stats.completed, label: 'لجان مكتملة', shadow: 'shadow-emerald-500/10' },
               { icon: Timer, color: 'text-amber-500', bg: 'bg-amber-600/10', val: stats.lates, label: 'حالات تأخر', shadow: 'shadow-amber-500/10' },
               { icon: UserX, color: 'text-red-500', bg: 'bg-red-600/10', val: stats.absents, label: 'حالات غياب', shadow: 'shadow-red-500/10' }
             ].map((s, i) => (
                <div key={i} className={`bg-white/[0.04] border border-white/10 rounded-[3rem] p-8 flex items-center justify-between group hover:bg-white/[0.06] transition-all shadow-2xl ${s.shadow}`}>
                   <div className="text-right">
                      <p className="text-5xl font-black tabular-nums leading-none tracking-tighter mb-3 text-white">{s.val}</p>
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">{s.label}</p>
                   </div>
                   <div className={`p-6 ${s.bg} ${s.color} rounded-[2.2rem] shadow-inner group-hover:scale-110 transition-transform`}><s.icon size={36} /></div>
                </div>
             ))}
          </div>
          {maximizedPanel !== 'REPORTS' && <ReportsPanel />}
        </div>

        {/* Center/Main Dynamic Column */}
        <div className="col-span-9 flex flex-col gap-8 overflow-hidden">
          {maximizedPanel === 'MAP' ? (
             <MapPanel isFull />
          ) : maximizedPanel === 'ABSENCES' ? (
             <AbsencesPanel isFull />
          ) : maximizedPanel === 'REPORTS' ? (
             <ReportsPanel isFull />
          ) : (
             <>
               <MapPanel />
               <AbsencesPanel />
             </>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .dir-rtl { direction: rtl; }
        @keyframes slide-up { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default ControlRoomMonitor;
