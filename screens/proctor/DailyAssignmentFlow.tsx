
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Supervision, Student, Absence, DeliveryLog } from '../../types';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  LogIn, Scan, Users, UserCheck, MessageSquare, GraduationCap, 
  UserPlus, UserMinus, Check, Clock, History, CheckCircle, 
  ArrowRightCircle, AlertTriangle, PenTool, FileWarning, 
  AlertCircle, ChevronLeft, ChevronRight, Loader2, ShieldCheck,
  LayoutGrid, X, Send
} from 'lucide-react';

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
  setDeliveryLogs: (log: Partial<DeliveryLog>) => Promise<void>;
}

const ProctorDailyAssignmentFlow: React.FC<Props> = ({ user, supervisions, setSupervisions, students, absences, setAbsences, onAlert, sendRequest, deliveryLogs, setDeliveryLogs }) => {
  const [activeCommittee, setActiveCommittee] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isClosingWizardOpen, setIsClosingWizardOpen] = useState(false);
  const [closingStep, setClosingStep] = useState(0);
  const [closingCounts, setClosingCounts] = useState<Record<string, string>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const currentAssignment = useMemo(() => supervisions.find((s: any) => s.teacher_id === user.id), [supervisions, user]);
  
  useEffect(() => { 
    if (currentAssignment) setActiveCommittee(currentAssignment.committee_number); 
  }, [currentAssignment]);

  const isCommitteeClosed = useMemo(() => {
    if (!activeCommittee) return false;
    return deliveryLogs.some(log => log.committee_number === activeCommittee && log.type === 'RECEIVE' && log.status === 'CONFIRMED');
  }, [deliveryLogs, activeCommittee]);

  const isAwaitingReceipt = useMemo(() => {
    if (!activeCommittee) return false;
    return deliveryLogs.some(log => log.committee_number === activeCommittee && log.proctor_name === user.full_name && log.status === 'PENDING');
  }, [deliveryLogs, activeCommittee, user.full_name]);

  const myHistory = useMemo(() => {
    return deliveryLogs.filter(log => log.proctor_name === user.full_name && log.type === 'RECEIVE' && log.status === 'CONFIRMED');
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
  
  const gradesInCommittee = useMemo(() => {
    return Array.from(new Set(myStudents.map(s => s.grade))).sort();
  }, [myStudents]);

  const stats = useMemo(() => {
    const committeeAbsences = absences.filter((a: Absence) => a.committee_number === activeCommittee);
    const total = myStudents.length;
    const absent = committeeAbsences.filter((a: any) => a.type === 'ABSENT').length;
    const present = total - absent;
    return { total, absent, present };
  }, [absences, myStudents, activeCommittee]);

  const handleQuickReport = (type: string, studentName?: string) => {
    let message = "";
    switch(type) {
      case 'pencil': message = "أحتاج أقلام رصاص (مرسام) عدد: "; break;
      case 'pen': message = "أحتاج أقلام حبر جاف عدد: "; break;
      case 'questions': message = "يوجد نقص في مغلف الأسئلة عدد: "; break;
      case 'answer_sheet': message = `نقص في كرت الإجابة للطالب: ${studentName}`; break;
      case 'custom': message = customMessage; break;
    }

    if (type !== 'answer_sheet' && type !== 'custom') {
      const count = prompt("أدخل العدد المطلوب:");
      if (!count) return;
      message += count;
    }

    if (!message.trim()) return;

    sendRequest(message, activeCommittee);
    setIsReportModalOpen(false);
    setCustomMessage('');
    onAlert("تم إرسال البلاغ للكنترول بنجاح");
  };

  const startClosingWizard = () => {
    const initialCounts: Record<string, string> = {};
    gradesInCommittee.forEach(g => {
      const gradeStudents = myStudents.filter(s => s.grade === g);
      const gradeAbsences = absences.filter(a => a.committee_number === activeCommittee && gradeStudents.some(gs => gs.national_id === a.student_id && a.type === 'ABSENT'));
      initialCounts[g] = (gradeStudents.length - gradeAbsences.length).toString();
    });
    setClosingCounts(initialCounts);
    setIsClosingWizardOpen(true);
    setClosingStep(0);
  };

  const confirmClosing = async () => {
    setIsVerifying(true);
    setTimeout(async () => {
      try {
        const countsString = Object.entries(closingCounts).map(([g, c]) => `${g}: ${c}`).join(' | ');
        const logEntry: Partial<DeliveryLog> = {
          id: crypto.randomUUID(),
          teacher_name: 'بانتظار عضو الكنترول',
          proctor_name: user.full_name,
          committee_number: activeCommittee!,
          grade: countsString,
          type: 'RECEIVE',
          time: new Date().toISOString(),
          period: 1,
          status: 'PENDING'
        };
        await setDeliveryLogs(logEntry);
        await sendRequest(`طلب إغلاق اللجنة. الأعداد: ${countsString}`, activeCommittee);
        setIsVerifying(false);
        setIsClosingWizardOpen(false);
        onAlert("تم إرسال طلب إغلاق اللجنة. يرجى التوجه للكنترول لتسليم المظروف.");
      } catch (err: any) {
        setIsVerifying(false);
        onAlert(`فشل في إغلاق اللجنة: ${err.message}`);
      }
    }, 2000);
  };

  if (!activeCommittee) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-12 animate-fade-in text-center">
         <div className="bg-slate-950 p-10 md:p-20 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            <LogIn size={80} className="mx-auto text-blue-500 mb-10 group-hover:scale-110 transition-transform duration-500" />
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter">التحاق بلجنة المراقبة</h2>
            <p className="text-slate-400 font-bold text-lg mb-12 max-w-lg mx-auto">يرجى مسح الرمز الموجود على باب اللجنة أو إدخال الرقم يدوياً لبدء عملية الرصد الرقمي.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
               <button onClick={() => {
                 setIsScanning(true);
                 setTimeout(() => {
                   scannerRef.current = new Html5QrcodeScanner("proctor-join-reader", { fps: 15, qrbox: 250 }, false);
                   scannerRef.current.render((text) => { joinCommittee(text); setIsScanning(false); scannerRef.current?.clear(); }, () => {});
                 }, 100);
               }} className="p-10 bg-blue-600 rounded-[3rem] font-black text-2xl flex flex-col items-center gap-6 shadow-2xl hover:bg-blue-500 active:scale-95 transition-all">
                 <Scan size={48} />
                 <span>مسح الرمز (QR)</span>
               </button>
               <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] flex flex-col items-center gap-6">
                 <input type="text" value={manualInput} onChange={(e) => setManualInput(e.target.value)} placeholder="رقم اللجنة" className="w-full bg-white/10 border-2 border-white/10 rounded-2xl p-5 text-center text-4xl font-black text-white outline-none focus:border-blue-500 placeholder:text-white/10" />
                 <button onClick={() => joinCommittee(manualInput)} disabled={!manualInput} className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-blue-50 active:scale-95 transition-all">التحاق يدوي</button>
               </div>
            </div>
            {isScanning && (
               <div className="fixed inset-0 z-[300] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8">
                 <div id="proctor-join-reader" className="w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white/10 bg-white"></div>
                 <button onClick={() => {setIsScanning(false); scannerRef.current?.clear();}} className="mt-12 bg-white text-slate-900 px-16 py-5 rounded-[2rem] font-black text-2xl shadow-xl">إلغاء المسح</button>
               </div>
            )}
         </div>
         {myHistory.length > 0 && (
           <div className="text-right space-y-8 animate-slide-up">
             <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4"><History className="text-blue-600" /> أرشيف اللجان المنتهية اليوم</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {myHistory.map(log => (
                 <div key={log.id} className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 flex justify-between items-center shadow-xl group hover:border-emerald-200 transition-all">
                   <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all">
                       <span className="text-[10px] opacity-40 uppercase">لجنة</span>
                       <span className="text-2xl leading-none">{log.committee_number}</span>
                     </div>
                     <div className="text-right">
                       <p className="font-black text-slate-800 text-lg">تم التسليم النهائي</p>
                       <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mt-1">
                          <Clock size={12}/> {new Date(log.time).toLocaleTimeString('ar-SA')}
                       </div>
                     </div>
                   </div>
                   <div className="bg-emerald-500 p-2 rounded-full text-white shadow-lg shadow-emerald-200"><Check size={20} /></div>
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
      <div className="max-w-3xl mx-auto py-20 px-6 text-center space-y-12 animate-fade-in">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-emerald-500 blur-[80px] opacity-30 animate-pulse"></div>
          <div className="bg-emerald-500 w-32 h-32 rounded-[3rem] flex items-center justify-center mx-auto text-white shadow-2xl relative z-10 animate-bounce">
            <ShieldCheck size={70} />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">اكتملت المهمة بنجاح</h2>
          <p className="text-slate-500 font-bold text-2xl max-w-md mx-auto leading-relaxed">تم تسليم لجنة رقم {activeCommittee} للكنترول وأرشفتها في سجلات اليوم.</p>
        </div>
        <button onClick={leaveAndJoinNew} className="bg-slate-950 text-white px-16 py-7 rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-6 mx-auto shadow-2xl hover:bg-blue-600 transition-all active:scale-95">
          <ArrowRightCircle size={32} /> التحاق بلجنة جديدة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto text-right pb-32 px-4">
       <div className="bg-white p-8 md:p-12 rounded-[4rem] shadow-2xl border flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 group-hover:w-4 transition-all"></div>
          <div className="flex items-center gap-8 text-right flex-1 w-full">
            <div className="w-24 h-24 bg-slate-950 text-white rounded-[2.5rem] flex flex-col items-center justify-center font-black shadow-2xl shrink-0 group-hover:scale-105 transition-transform">
              <span className="text-[10px] opacity-40 uppercase mb-1 tracking-widest">لجنة</span>
              <span className="text-5xl leading-none">{activeCommittee}</span>
            </div>
            <div className="flex-1 min-w-0">
               <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-4 truncate">{isAwaitingReceipt ? 'بانتظار تأكيد الكنترول...' : 'رصد حضور اللجنة الرقمي'}</h3>
               <div className="flex flex-wrap gap-4">
                  <div className="bg-slate-50 border px-6 py-2 rounded-2xl flex items-center gap-3 text-slate-600 font-black text-sm">
                    <Users size={18} className="text-blue-600"/> {stats.total} إجمالي
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 px-6 py-2 rounded-2xl flex items-center gap-3 text-emerald-700 font-black text-sm">
                    <UserCheck size={18}/> {stats.present} حاضر
                  </div>
                  {stats.absent > 0 && (
                    <div className="bg-red-50 border border-red-100 px-6 py-2 rounded-2xl flex items-center gap-3 text-red-700 font-black text-sm">
                      <UserMinus size={18}/> {stats.absent} غائب
                    </div>
                  )}
               </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
             <button onClick={() => setIsReportModalOpen(true)} className="flex-1 sm:flex-initial bg-red-600 text-white px-8 py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-red-700 shadow-xl shadow-red-100 active:scale-95 transition-all">
               <AlertTriangle size={24} /> بلاغ عاجل
             </button>
             {!isAwaitingReceipt && (
               <button onClick={startClosingWizard} className="flex-1 sm:flex-initial bg-slate-950 text-white px-8 py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-blue-600 shadow-xl shadow-slate-200 active:scale-95 transition-all">
                 <ShieldCheck size={24} /> إغلاق اللجنة
               </button>
             )}
          </div>
       </div>

       {isAwaitingReceipt && (
         <div className="bg-amber-50 border-4 border-dashed border-amber-200 p-10 rounded-[3.5rem] text-center space-y-6 animate-pulse shadow-2xl shadow-amber-100">
            <Loader2 size={48} className="mx-auto text-amber-500 animate-spin" />
            <h4 className="text-2xl font-black text-amber-900 tracking-tight">جاري التدقيق الرقمي...</h4>
            <p className="text-amber-700 font-bold max-w-md mx-auto">يرجى التوجه لمقر الكنترول وتسليم المظروف ليتم مسح هويتك الرقمية وإنهاء المهمة رسمياً.</p>
         </div>
       )}

       <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${isAwaitingReceipt ? 'opacity-30 pointer-events-none grayscale scale-95 transition-all duration-500' : ''}`}>
         {myStudents.map((s: Student) => {
           const status = absences.find((a: Absence) => a.student_id === s.national_id);
           return (
             <div key={s.id} className={`p-8 rounded-[3.5rem] border-2 transition-all relative overflow-hidden group flex flex-col justify-between shadow-2xl min-h-[400px] ${status?.type === 'ABSENT' ? 'bg-red-50/50 border-red-200' : status?.type === 'LATE' ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-white hover:border-blue-100'}`}>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
                <div className="flex justify-between items-start mb-8">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner ${status?.type === 'ABSENT' ? 'bg-red-600 text-white' : status?.type === 'LATE' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'}`}>
                    <GraduationCap size={32} />
                  </div>
                  {status ? (
                    <span className={`px-5 py-2 rounded-2xl font-black text-xs uppercase shadow-lg ${status.type === 'ABSENT' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                      {status.type === 'ABSENT' ? 'غائب' : 'متأخر'}
                    </span>
                  ) : (
                    <div className="bg-emerald-500 text-white p-2 rounded-full shadow-lg"><Check size={20}/></div>
                  )}
                </div>
                <div className="flex-1 space-y-4 text-right">
                   <h4 className="text-2xl font-black text-slate-900 leading-tight mb-2 break-words">{s.name}</h4>
                   <div className="flex flex-wrap gap-2">
                     <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-xl text-[10px] font-black border border-slate-200 uppercase tracking-tighter">ID: {s.national_id}</span>
                     <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-xl text-[10px] font-black border border-blue-100">{s.grade}</span>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-10">
                   <button onClick={() => { 
                     const existing = absences.find((a: Absence) => a.student_id === s.national_id && a.type === 'ABSENT'); 
                     if(existing) setAbsences((p: Absence[]) => p.filter(a => a.student_id !== s.national_id)); 
                     else setAbsences((p: Absence[]) => [...p.filter(a => a.student_id !== s.national_id), { id: crypto.randomUUID(), student_id: s.national_id, student_name: s.name, committee_number: activeCommittee, period: 1, type: 'ABSENT', proctor_id: user.id, date: new Date().toISOString() }]); 
                   }} className={`py-6 rounded-[2.2rem] font-black text-sm transition-all flex flex-col items-center justify-center gap-2 active:scale-95 ${status?.type === 'ABSENT' ? 'bg-red-600 text-white shadow-xl shadow-red-100' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-red-50'}`}>
                     {status?.type === 'ABSENT' ? <UserPlus size={24} /> : <UserMinus size={24} />}
                     <span>{status?.type === 'ABSENT' ? 'حاضر' : 'رصد غياب'}</span>
                   </button>
                   <button onClick={() => { 
                     const existing = absences.find((a: Absence) => a.student_id === s.national_id && a.type === 'LATE'); 
                     if(existing) setAbsences((p: Absence[]) => p.filter(a => a.student_id !== s.national_id)); 
                     else setAbsences((p: Absence[]) => [...p.filter(a => a.student_id !== s.national_id), { id: crypto.randomUUID(), student_id: s.national_id, student_name: s.name, committee_number: activeCommittee, period: 1, type: 'LATE', proctor_id: user.id, date: new Date().toISOString() }]); 
                   }} className={`py-6 rounded-[2.2rem] font-black text-sm transition-all flex flex-col items-center justify-center gap-2 active:scale-95 ${status?.type === 'LATE' ? 'bg-amber-500 text-white shadow-xl shadow-amber-100' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-amber-50'}`}>
                     {status?.type === 'LATE' ? <CheckCircle size={24} /> : <Clock size={24} />}
                     <span>{status?.type === 'LATE' ? 'إلغاء التأخر' : 'رصد تأخر'}</span>
                   </button>
                </div>
             </div>
           );
         })}
       </div>

       {/* مركز البلاغات الذكي - Modal */}
       {isReportModalOpen && (
         <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 no-print">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsReportModalOpen(false)}></div>
            <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl relative z-10 overflow-hidden animate-slide-up">
               <div className="bg-red-600 p-8 text-white flex justify-between items-center">
                  <h3 className="text-3xl font-black flex items-center gap-4"><MessageSquare size={32}/> مركز البلاغات الذكي</h3>
                  <button onClick={() => setIsReportModalOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-all"><X size={32}/></button>
               </div>
               <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
                  {/* الخيارات السريعة */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <button onClick={() => handleQuickReport('pencil')} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] flex flex-col items-center gap-3 hover:border-blue-600 transition-all group">
                      <PenTool size={32} className="text-blue-600 group-hover:scale-110 transition-transform" />
                      <span className="font-black text-slate-800 text-xs">أحتاج مرسام</span>
                    </button>
                    <button onClick={() => handleQuickReport('pen')} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] flex flex-col items-center gap-3 hover:border-blue-600 transition-all group">
                      <CheckCircle size={32} className="text-blue-600 group-hover:scale-110 transition-transform" />
                      <span className="font-black text-slate-800 text-xs">أحتاج أقلام</span>
                    </button>
                    <button onClick={() => handleQuickReport('questions')} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] flex flex-col items-center gap-3 hover:border-red-600 transition-all group">
                      <FileWarning size={32} className="text-red-600 group-hover:scale-110 transition-transform" />
                      <span className="font-black text-slate-800 text-xs">نقص أسئلة</span>
                    </button>
                  </div>

                  {/* خانة الرسائل المخصصة */}
                  <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 space-y-4">
                    <div className="flex items-center gap-3 mb-2 px-2">
                       <MessageSquare size={20} className="text-blue-600" />
                       <span className="font-black text-slate-800 text-sm">رسالة مخصصة للكنترول</span>
                    </div>
                    <div className="relative">
                      <textarea 
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="اكتب رسالتك هنا (مثلاً: أحتاج مساعدة في توزيع الأوراق...)"
                        className="w-full bg-white border-2 border-slate-100 rounded-[2rem] p-6 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all resize-none h-28 shadow-inner text-sm placeholder:text-slate-300"
                      ></textarea>
                      {customMessage.trim() && (
                        <button 
                          onClick={() => handleQuickReport('custom')}
                          className="absolute bottom-4 left-4 bg-blue-600 text-white p-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all active:scale-90 flex items-center gap-2 font-black text-xs animate-slide-up"
                        >
                          إرسال الآن <Send size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* نقص كرت الإجابة للطلاب */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">بلاغ نقص كرت إجابة لطالب محدد</p>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {myStudents.map(s => (
                        <button key={s.id} onClick={() => handleQuickReport('answer_sheet', s.name)} className="w-full p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm">
                          <span className="font-bold text-slate-700 text-xs truncate">{s.name}</span>
                          <Send size={14} className="text-blue-600" />
                        </button>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
         </div>
       )}

       {/* معالج إغلاق اللجنة - Wizard */}
       {isClosingWizardOpen && (
         <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 no-print">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => !isVerifying && setIsClosingWizardOpen(false)}></div>
            <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl relative z-10 overflow-hidden animate-slide-up">
               {isVerifying ? (
                 <div className="p-20 text-center space-y-8 animate-fade-in">
                    <Loader2 size={80} className="mx-auto text-blue-600 animate-spin" />
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">جاري المراجعة والتدقيق...</h3>
                    <p className="text-slate-500 font-bold text-lg">نقوم بمطابقة أعداد الحضور مع سجلات الرصد الآلية لضمان الدقة.</p>
                 </div>
               ) : (
                 <>
                   <div className="bg-slate-950 p-10 text-white flex justify-between items-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full"></div>
                      <div className="relative z-10">
                        <h3 className="text-3xl font-black tracking-tight">إغلاق اللجنة رقم {activeCommittee}</h3>
                        <p className="text-slate-500 text-sm font-bold mt-1">يرجى مراجعة وتأكيد أعداد الحضور النهائية</p>
                      </div>
                      <div className="bg-white/10 px-6 py-2 rounded-full font-black text-xs">خطوة {closingStep + 1} من {gradesInCommittee.length + 1}</div>
                   </div>
                   <div className="p-12">
                      {closingStep < gradesInCommittee.length ? (
                        <div className="space-y-8 animate-fade-in">
                           <div className="text-center">
                              <span className="bg-blue-50 text-blue-600 px-6 py-2 rounded-full font-black text-sm border border-blue-100 mb-4 inline-block tracking-widest uppercase">تأكيد عدد طلاب صف</span>
                              <h4 className="text-5xl font-black text-slate-900 leading-none mt-2">{gradesInCommittee[closingStep]}</h4>
                           </div>
                           <div className="flex flex-col items-center gap-6">
                              <p className="text-slate-400 font-bold">العدد المرصود حالياً في النظام (حاضر):</p>
                              <div className="flex items-center gap-8">
                                 <button onClick={() => {
                                   const current = parseInt(closingCounts[gradesInCommittee[closingStep]] || '0');
                                   if (current > 0) setClosingCounts({...closingCounts, [gradesInCommittee[closingStep]]: (current - 1).toString()});
                                 }} className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-900 hover:bg-slate-200 transition-all active:scale-90"><UserMinus size={32}/></button>
                                 <input type="number" value={closingCounts[gradesInCommittee[closingStep]]} onChange={(e) => setClosingCounts({...closingCounts, [gradesInCommittee[closingStep]]: e.target.value})} className="w-40 text-center text-7xl font-black text-blue-600 bg-transparent border-b-4 border-blue-600 outline-none tabular-nums" />
                                 <button onClick={() => {
                                   const current = parseInt(closingCounts[gradesInCommittee[closingStep]] || '0');
                                   setClosingCounts({...closingCounts, [gradesInCommittee[closingStep]]: (current + 1).toString()});
                                 }} className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-900 hover:bg-slate-200 transition-all active:scale-90"><UserPlus size={32}/></button>
                              </div>
                           </div>
                           <button onClick={() => setClosingStep(s => s + 1)} className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-2xl hover:bg-blue-600 transition-all active:scale-95">
                             تأكيد الأرقام والمتابعة <ChevronLeft size={24} />
                           </button>
                        </div>
                      ) : (
                        <div className="space-y-8 animate-fade-in">
                           <div className="bg-emerald-50 p-8 rounded-[3rem] border-2 border-emerald-100 flex flex-col items-center gap-4">
                              <CheckCircle size={56} className="text-emerald-500" />
                              <h4 className="text-2xl font-black text-emerald-900 tracking-tight">المراجعة النهائية للأعداد</h4>
                              <div className="w-full space-y-3">
                                 {Object.entries(closingCounts).map(([g, c]) => (
                                   <div key={g} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                                      <span className="font-bold text-slate-500">{g}</span>
                                      <span className="font-black text-emerald-700 text-2xl tabular-nums">{c} طالب حاضر</span>
                                   </div>
                                 ))}
                              </div>
                           </div>
                           <div className="flex gap-4">
                              <button onClick={() => setClosingStep(0)} className="flex-1 bg-slate-100 text-slate-600 py-6 rounded-[2rem] font-black hover:bg-slate-200 transition-all">تعديل البيانات</button>
                              <button onClick={confirmClosing} className="flex-[2] bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                                تأكيد التوثيق وإرسال للكنترول <ShieldCheck size={28} />
                              </button>
                           </div>
                        </div>
                      )}
                   </div>
                 </>
               )}
            </div>
         </div>
       )}
    </div>
  );
};

export default ProctorDailyAssignmentFlow;
