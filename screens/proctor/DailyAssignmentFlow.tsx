
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Supervision, Student, Absence, DeliveryLog, ControlRequest, CommitteeReport } from '../../types';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Loader2, ShieldCheck, Camera, Shield, Zap, 
  PackageCheck, RefreshCcw, ChevronLeft, CheckCircle2, 
  Minus, Plus, GraduationCap, History, Clock,
  FileText, UserCog, Pencil, Stethoscope, MessageSquare,
  ChevronRight, Users, Check, AlertCircle, Award,
  Sparkles, CheckCircle, Info, X, UserSearch, AlertTriangle,
  ArrowRight, Timer, UserCheck, Bell, Package
} from 'lucide-react';
import { db } from '../../supabase';
import { APP_CONFIG, ROLES_ARABIC } from '../../constants';

interface Props {
  user: User;
  users?: User[];
  supervisions?: Supervision[];
  setSupervisions: () => Promise<void>;
  students?: Student[];
  absences?: Absence[];
  setAbsences: () => Promise<void>;
  onAlert: (msg: string, type: string) => void;
  sendRequest: (txt: string, com: string) => Promise<void>;
  deliveryLogs?: DeliveryLog[];
  setDeliveryLogs: (log: Partial<DeliveryLog>) => Promise<void>;
  systemConfig: any;
  controlRequests?: ControlRequest[];
  // Fix: Add missing committeeReports and onReportUpsert props to interface
  committeeReports?: CommitteeReport[];
  onReportUpsert?: (report: Partial<CommitteeReport>) => Promise<void>;
}

const ProctorDailyAssignmentFlow: React.FC<Props> = ({ 
  user, 
  users = [],
  supervisions = [], 
  setSupervisions, 
  students = [], 
  absences = [], 
  setAbsences, 
  onAlert, 
  sendRequest, 
  deliveryLogs = [], 
  setDeliveryLogs, 
  systemConfig,
  controlRequests = [],
  // Fix: Add missing committeeReports and onReportUpsert to destructured props
  committeeReports = [],
  onReportUpsert
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isClosingWizardOpen, setIsClosingWizardOpen] = useState(false);
  const [closingStep, setClosingStep] = useState(0); 
  const [currentGradeIdx, setCurrentGradeIdx] = useState(0);
  const [closingCounts, setClosingCounts] = useState<Record<string, number>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [countError, setCountError] = useState<string | null>(null);
  const [isCountingLocked, setIsCountingLocked] = useState(false);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportStep, setReportStep] = useState<'CATEGORIES' | 'SELECT_STUDENTS' | 'SELECT_TEACHER' | 'INPUT_QUANTITY' | 'OTHER'>('CATEGORIES');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [quantity, setQuantity] = useState(1);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const activeDate = useMemo(() => systemConfig?.active_exam_date || new Date().toISOString().split('T')[0], [systemConfig]);

  const activeAssignment = useMemo(() => 
    supervisions.find((s: any) => s.teacher_id === user.id && s.date && s.date.startsWith(activeDate)), 
  [supervisions, user.id, activeDate]);

  const activeCommittee = activeAssignment?.committee_number || null;

  const myActiveRequests = useMemo(() => 
    controlRequests.filter(r => r.from === user.full_name && r.committee === activeCommittee && r.status !== 'DONE')
      .sort((a, b) => b.time.localeCompare(a.time)),
  [controlRequests, user.full_name, activeCommittee]);

  const isCommitteeFinished = useMemo(() => {
    if (!activeCommittee) return false;
    const committeeGrades = Array.from(new Set(students.filter(s => s.committee_number === activeCommittee).map(s => s.grade)));
    const reportedGrades = deliveryLogs.filter(l => 
      l.committee_number === activeCommittee && 
      l.time.startsWith(activeDate)
    ).map(l => l.grade);
    
    return committeeGrades.length > 0 && committeeGrades.every(g => reportedGrades.includes(g));
  }, [deliveryLogs, activeCommittee, activeDate, students]);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const myStudents = useMemo(() => students.filter(s => s.committee_number === activeCommittee), [students, activeCommittee]);
  const myGrades = useMemo(() => Array.from(new Set(myStudents.map(s => s.grade))).sort(), [myStudents]);
  const myAbsences = useMemo(() => absences.filter(a => a.committee_number === activeCommittee && a.date.startsWith(activeDate)), [absences, activeCommittee, activeDate]);
  
  const stats = useMemo(() => {
    const total = myStudents.length;
    const abs = myAbsences.filter(a => a.type === 'ABSENT').length;
    const late = myAbsences.filter(a => a.type === 'LATE').length;
    return { total, present: total - abs, absent: abs, late };
  }, [myStudents, myAbsences]);

  const toggleStudentStatus = async (student: Student, type: 'ABSENT' | 'LATE') => {
    if (isCommitteeFinished) return;
    const existing = absences.find(a => a.student_id === student.national_id && a.date.startsWith(activeDate));
    try {
      if (existing && existing.type === type) {
        await db.absences.delete(student.national_id);
      } else {
        await db.absences.upsert({ 
          id: existing?.id || crypto.randomUUID(), 
          student_id: student.national_id, 
          student_name: student.name, 
          committee_number: activeCommittee!, 
          period: 1, 
          type, 
          proctor_id: user.id, 
          date: new Date().toISOString() 
        });
      }
      await setAbsences();
    } catch (err: any) { onAlert(err.message || String(err), 'error'); }
  };

  const handleUrgentReport = async () => {
    let message = "";
    switch(selectedCategory) {
      case 'ANSWER_SHEET': 
        const names = myStudents.filter(s => selectedStudentIds.includes(s.national_id)).map(s => s.name).join('، ');
        message = `طلب ورقة إجابة: (${names})`;
        break;
      case 'SUBJECT_TEACHER': message = `استدعاء معلم المادة: (${otherText})`; break;
      case 'PENCIL': message = `طلب أدوات عدد: (${quantity})`; break;
      case 'QUESTION_SHEET': message = `طلب ورقة أسئلة عدد: (${quantity})`; break;
      case 'HEALTH': message = `🚨 حالة صحية في اللجنة`; break;
      case 'OTHER': message = `بلاغ: ${otherText}`; break;
    }

    try {
      await sendRequest(message, activeCommittee!);
      onAlert("تم إرسال البلاغ لوحدة التحكم", "success");
      setIsReportModalOpen(false);
      resetReportState();
    } catch (err: any) { onAlert(err.message, 'error'); }
  };

  const resetReportState = () => {
    setReportStep('CATEGORIES');
    setSelectedCategory('');
    setSelectedStudentIds([]);
    setOtherText('');
    setQuantity(1);
  };

  const finalizeClosing = async () => {
    setIsVerifying(true);
    try {
      for (const grade of myGrades) {
        await setDeliveryLogs({ 
          id: crypto.randomUUID(), 
          teacher_name: 'بانتظار الكنترول', 
          proctor_name: user.full_name, 
          committee_number: activeCommittee!, 
          grade, 
          type: 'RECEIVE', 
          time: new Date().toISOString(), 
          period: 1, 
          status: 'PENDING' 
        });
      }
      await sendRequest(`المراقب ${user.full_name} أنهى الرصد ومتجه للكنترول.`, activeCommittee!);
      setIsClosingWizardOpen(false);
      onAlert('تم إنهاء اللجنة بنجاح.', 'success');
    } catch (err: any) { onAlert(err.message, 'error'); } finally { setIsVerifying(false); }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 size={40} className="animate-spin text-indigo-600" />
        <p className="font-bold text-sm italic">جاري تجهيز بيانات اللجنة...</p>
      </div>
    );
  }

  if (!activeCommittee) {
     return (
        <div className="max-w-md mx-auto py-12 px-4 text-center animate-fade-in">
           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                 <Shield size={200} className="absolute -top-10 -right-10" />
              </div>
              <div className="relative z-10">
                 <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Camera size={32} />
                 </div>
                 <h2 className="text-2xl font-black mb-2">مباشرة الرصد الميداني</h2>
                 <p className="text-slate-400 text-xs font-medium leading-relaxed">يرجى مسح الرمز المكتوب على ملصق اللجنة لبدء عملية رصد الحضور والغياب.</p>
              </div>
           </div>
           
           <button onClick={() => { setIsScanning(true); setTimeout(async () => { try { const scanner = new Html5Qrcode("proctor-qr-v70"); qrScannerRef.current = scanner; await scanner.start({ facingMode: "environment" }, { fps: 20, qrbox: 250 }, (text) => { /* logic to join */ }, () => {}); } catch (err) { setIsScanning(false); } }, 200); }} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 tap-active">
              بدء المسح الآن
           </button>
        </div>
     );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto pb-24">
       <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center font-black">
                <span className="text-[10px] leading-none mb-1">لجنة</span>
                <span className="text-xl leading-none">{activeCommittee}</span>
             </div>
             <div>
                <h3 className="font-black text-slate-900 text-sm">{user.full_name}</h3>
                <p className="text-[10px] font-bold text-emerald-600 mt-0.5">مباشر الآن</p>
             </div>
          </div>
          <div className="flex gap-2">
             <div className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl text-center">
                <p className="text-[10px] font-black">{stats.absent}</p>
                <p className="text-[8px] font-bold uppercase">غائب</p>
             </div>
             <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-center">
                <p className="text-[10px] font-black">{stats.late}</p>
                <p className="text-[8px] font-bold uppercase">متأخر</p>
             </div>
          </div>
       </div>

       {myActiveRequests.length > 0 && (
         <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg animate-pulse flex items-center gap-4">
            <Bell size={20} />
            <p className="text-xs font-black">لديك بلاغ قيد المباشرة من الكنترول...</p>
         </div>
       )}

       <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setIsReportModalOpen(true)} className="p-4 bg-rose-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-100 tap-active">
             <Zap size={18} fill="white" /> بلاغ عاجل
          </button>
          <button onClick={() => setIsClosingWizardOpen(true)} className="p-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg tap-active">
             <PackageCheck size={18} /> إنهاء اللجنة
          </button>
       </div>

       <div className="space-y-3">
         {myStudents.map((s: Student) => {
           const status = myAbsences.find(a => a.student_id === s.national_id);
           return (
             <div key={s.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between bg-white ${status?.type === 'ABSENT' ? 'border-rose-200' : status?.type === 'LATE' ? 'border-amber-200' : 'border-slate-100 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status?.type === 'ABSENT' ? 'bg-rose-100 text-rose-600' : status?.type === 'LATE' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}><GraduationCap size={20} /></div>
                  <div>
                    <h4 className="font-black text-slate-900 text-[13px] leading-tight mb-0.5">{s.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400">فصل: {s.section}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                   <button onClick={() => toggleStudentStatus(s, 'ABSENT')} className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all ${status?.type === 'ABSENT' ? 'bg-rose-600 text-white shadow-md shadow-rose-100' : 'bg-slate-50 text-slate-400'}`}>غائب</button>
                   <button onClick={() => toggleStudentStatus(s, 'LATE')} className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all ${status?.type === 'LATE' ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 'bg-slate-50 text-slate-400'}`}>متأخر</button>
                </div>
             </div>
           );
         })}
       </div>
    </div>
  );
};

export default ProctorDailyAssignmentFlow;
