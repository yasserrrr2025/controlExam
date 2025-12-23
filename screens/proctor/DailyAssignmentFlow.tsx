
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Supervision, Student, Absence, DeliveryLog } from '../../types';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { LogIn, Scan, Users, UserCheck, MessageSquare, GraduationCap, UserPlus, UserMinus, Check, Clock, History, CheckCircle, ArrowRightCircle } from 'lucide-react';

interface Props {
  user: User;
  supervisions: Supervision[];
  setSupervisions: any;
  students: Student[];
  absences: Absence[];
  setAbsences: any;
  onAlert: any;
  sendRequest: any;
  deliveryLogs: DeliveryLog[];
}

const ProctorDailyAssignmentFlow: React.FC<Props> = ({ user, supervisions, setSupervisions, students, absences, setAbsences, onAlert, sendRequest, deliveryLogs }) => {
  const [activeCommittee, setActiveCommittee] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const currentAssignment = useMemo(() => supervisions.find((s: any) => s.teacher_id === user.id), [supervisions, user]);
  
  useEffect(() => { 
    if (currentAssignment) setActiveCommittee(currentAssignment.committee_number); 
  }, [currentAssignment]);

  const isCommitteeClosed = useMemo(() => {
    if (!activeCommittee) return false;
    return deliveryLogs.some(log => log.committee_number === activeCommittee && log.type === 'RECEIVE');
  }, [deliveryLogs, activeCommittee]);

  const myHistory = useMemo(() => {
    return deliveryLogs.filter(log => log.proctor_name === user.full_name && log.type === 'RECEIVE');
  }, [deliveryLogs, user.full_name]);

  const joinCommittee = (committeeNum: string) => {
    if (!committeeNum) return;
    const newSV: Supervision = { 
      id: crypto.randomUUID(), 
      teacher_id: user.id, 
      committee_number: committeeNum, 
      date: new Date().toISOString(), 
      period: 1, 
      subject: 'اختبار الفترة' 
    };
    setSupervisions((prev: any) => [...prev, newSV]);
    setActiveCommittee(committeeNum);
    onAlert(`تم التحاقك باللجنة ${committeeNum} بنجاح`);
  };

  const leaveAndJoinNew = () => {
    setSupervisions((prev: any) => prev.filter((s: any) => s.teacher_id !== user.id));
    setActiveCommittee(null);
  };

  const myStudents = useMemo(() => students.filter((s: Student) => s.committee_number === activeCommittee), [students, activeCommittee]);
  
  const stats = useMemo(() => {
    const committeeAbsences = absences.filter((a: Absence) => a.committee_number === activeCommittee);
    const total = myStudents.length;
    const absent = committeeAbsences.filter((a: any) => a.type === 'ABSENT').length;
    const present = total - absent;
    return { total, absent, present };
  }, [absences, myStudents, activeCommittee]);

  if (!activeCommittee) {
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-12 animate-fade-in text-center">
         <div className="bg-slate-900 p-14 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
            <LogIn size={64} className="mx-auto text-blue-400 mb-8" />
            <h2 className="text-4xl font-black mb-4 tracking-tighter">التحاق بلجنة المراقبة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto mt-12">
               <button onClick={() => {
                 setIsScanning(true);
                 setTimeout(() => {
                   scannerRef.current = new Html5QrcodeScanner("proctor-join-reader", { fps: 15, qrbox: 250 }, false);
                   scannerRef.current.render((text) => { joinCommittee(text); setIsScanning(false); scannerRef.current?.clear(); }, () => {});
                 }, 100);
               }} className="p-10 bg-blue-600 rounded-[3rem] font-black text-2xl flex flex-col items-center gap-6 shadow-2xl hover:scale-105 transition-all shadow-blue-600/30"><Scan size={48} /><span>مسح كود اللجنة</span></button>
               <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] flex flex-col items-center gap-6"><input type="text" value={manualInput} onChange={(e) => setManualInput(e.target.value)} placeholder="رقم اللجنة" className="w-full bg-white/10 border-2 border-white/10 rounded-2xl p-5 text-center text-3xl font-black text-white outline-none focus:border-blue-500 shadow-inner" /><button onClick={() => joinCommittee(manualInput)} disabled={!manualInput} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-sm transition-all">إسناد يدوي</button></div>
            </div>
            {isScanning && (
               <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-10"><div id="proctor-join-reader" className="w-full max-sm rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white/10 bg-white"></div><button onClick={() => {setIsScanning(false); scannerRef.current?.clear();}} className="mt-12 bg-white text-slate-900 px-10 py-4 rounded-2xl font-black shadow-xl">إلغاء المسح</button></div>
            )}
         </div>

         {myHistory.length > 0 && (
           <div className="text-right space-y-6">
             <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><History className="text-blue-600" /> سجل لجانك المنتهية اليوم</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {myHistory.map(log => (
                 <div key={log.id} className="bg-white p-6 rounded-[2rem] border-2 border-emerald-100 flex justify-between items-center shadow-sm">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-black">
                       {log.committee_number}
                     </div>
                     <div>
                       <p className="font-black text-slate-800">لجنة منتهية</p>
                       <p className="text-xs text-slate-400 font-bold">وقت الاستلام: {log.time}</p>
                     </div>
                   </div>
                   <CheckCircle className="text-emerald-500" size={24} />
                 </div>
               ))}
             </div>
           </div>
         )}
      </div>
    );
  }

  if (isCommitteeClosed) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-8 animate-fade-in">
        <div className="bg-emerald-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-white shadow-2xl shadow-emerald-200 animate-bounce">
          <CheckCircle size={56} />
        </div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">تم تسليم اللجنة بنجاح!</h2>
        <p className="text-slate-500 font-bold text-xl">تم إغلاق لجنة رقم {activeCommittee} واستلام كافة الأوراق من قبل الكنترول.</p>
        <button 
          onClick={leaveAndJoinNew}
          className="bg-slate-900 text-white px-12 py-6 rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-4 mx-auto shadow-2xl hover:bg-black transition-all active:scale-95"
        >
          <ArrowRightCircle size={32} /> التحاق بلجنة جديدة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto text-right pb-20">
       <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-8 text-right"><div className="w-24 h-24 bg-blue-600 text-white rounded-[2.5rem] flex flex-col items-center justify-center font-black shadow-2xl"><span className="text-[10px] opacity-60 uppercase mb-1">اللجنة</span><span className="text-4xl leading-none">{activeCommittee}</span></div><div className="space-y-2"><h3 className="text-3xl font-black text-slate-900 tracking-tighter">رصد حضور اللجنة الرقمي</h3><div className="flex flex-wrap gap-4"><span className="flex items-center gap-2 text-slate-500 font-bold text-sm bg-slate-50 px-3 py-1 rounded-full"><Users size={16}/> {stats.total} طالب</span><span className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full"><UserCheck size={16}/> {stats.present} حاضر</span></div></div></div>
          <div className="flex gap-4"><button onClick={() => { const txt = prompt('ما هو طلبك للكنترول؟'); if(txt) sendRequest(txt, activeCommittee); }} className="bg-red-600 text-white px-8 py-5 rounded-[1.8rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-red-700 shadow-2xl transition-all"><MessageSquare size={24} /> بلاغ عاجل</button></div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {myStudents.map((s: Student) => {
           const status = absences.find((a: Absence) => a.student_id === s.national_id);
           
           let cardStyles = "bg-white border-transparent hover:border-blue-100 shadow-xl";
           if (status?.type === 'ABSENT') cardStyles = "bg-red-50 border-red-200 shadow-red-100/50 shadow-lg";
           else if (status?.type === 'LATE') cardStyles = "bg-amber-50 border-amber-200 shadow-amber-100/50 shadow-lg";
           else cardStyles = "bg-emerald-50/10 border-emerald-50 hover:border-emerald-200 shadow-xl";

           return (
             <div key={s.id} className={`p-10 rounded-[3.5rem] border-2 transition-all relative overflow-hidden group min-h-[360px] flex flex-col justify-between ${cardStyles}`}>
                {status && <div className={`absolute top-8 left-8 px-5 py-1.5 rounded-2xl font-black text-xs uppercase shadow-xl ${status.type === 'ABSENT' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>{status.type === 'ABSENT' ? 'غائب' : 'متأخر'}</div>}
                {!status && <div className="absolute top-8 left-8 text-emerald-500 opacity-40"><CheckCircle size={28} /></div>}
                
                <div className="mb-6"><div className="flex items-center gap-4 mb-4"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${status?.type === 'ABSENT' ? 'bg-red-100 text-red-600' : status?.type === 'LATE' ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}><GraduationCap size={28} /></div><div className="text-right"><h4 className="font-black text-2xl text-slate-800 leading-none mb-1">{s.name}</h4><p className="text-[10px] font-black text-slate-400 font-mono">{s.national_id}</p></div></div><div className="flex gap-2"><span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-xl text-[10px] font-black">{s.grade}</span></div></div>
                <div className="grid grid-cols-2 gap-4 mt-auto">
                   <button onClick={() => { 
                     const existing = absences.find((a: Absence) => a.student_id === s.national_id && a.type === 'ABSENT'); 
                     if(existing) setAbsences((p: Absence[]) => p.filter(a => a.student_id !== s.national_id)); 
                     else setAbsences((p: Absence[]) => [...p.filter(a => a.student_id !== s.national_id), { id: crypto.randomUUID(), student_id: s.national_id, student_name: s.name, committee_number: activeCommittee, period: 1, type: 'ABSENT', proctor_id: user.id, date: new Date().toISOString() }]); 
                   }} className={`py-6 rounded-[2rem] font-black text-sm transition-all flex flex-col items-center justify-center gap-2 ${status?.type === 'ABSENT' ? 'bg-red-600 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:bg-red-50'}`}>{status?.type === 'ABSENT' ? <UserPlus size={20} /> : <UserMinus size={20} />}<span>{status?.type === 'ABSENT' ? 'حاضر' : 'غائب'}</span></button>
                   
                   <button onClick={() => { 
                     const existing = absences.find((a: Absence) => a.student_id === s.national_id && a.type === 'LATE'); 
                     if(existing) setAbsences((p: Absence[]) => p.filter(a => a.student_id !== s.national_id)); 
                     else setAbsences((p: Absence[]) => [...p.filter(a => a.student_id !== s.national_id), { id: crypto.randomUUID(), student_id: s.national_id, student_name: s.name, committee_number: activeCommittee, period: 1, type: 'LATE', proctor_id: user.id, date: new Date().toISOString() }]); 
                   }} className={`py-6 rounded-[2rem] font-black text-sm transition-all flex flex-col items-center justify-center gap-2 ${status?.type === 'LATE' ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:bg-amber-50'}`}>{status?.type === 'LATE' ? <Check size={20} /> : <Clock size={20} />}<span>{status?.type === 'LATE' ? 'إلغاء التأخر' : 'رصد تأخر'}</span></button>
                </div>
             </div>
           );
         })}
       </div>

       {myHistory.length > 0 && (
          <div className="pt-10 border-t-2 border-slate-100">
             <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3"><History className="text-blue-600" /> سجل لجانك اليوم</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {myHistory.map(log => (
                  <div key={log.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-100 shadow-sm flex items-center justify-between">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">لجنة</p>
                        <p className="text-3xl font-black text-emerald-600 leading-none">{log.committee_number}</p>
                     </div>
                     <div className="text-left">
                        <p className="font-black text-slate-800 text-sm">تم التسليم</p>
                        <p className="text-xs font-mono text-slate-400">{log.time}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
       )}
    </div>
  );
};

export default ProctorDailyAssignmentFlow;
