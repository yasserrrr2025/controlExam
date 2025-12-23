
import React, { useState, useMemo, useRef } from 'react';
import { User, Student, Absence, DeliveryLog, Supervision, ControlRequest } from '../../types';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { PackageCheck, Clock, Users, LayoutGrid, Scan, ArrowRightLeft, CheckCircle2, ShieldAlert, Check } from 'lucide-react';

interface Props {
  user: User;
  students: Student[];
  absences: Absence[];
  deliveryLogs: DeliveryLog[];
  setDeliveryLogs: any;
  supervisions: Supervision[];
  users: User[];
  onAlert: any;
  controlRequests: ControlRequest[];
  setControlRequests: any;
}

const StatCard = ({ title, value, icon, color, bgColor, textColor }: any) => (
  <div className={`p-8 rounded-[2.5rem] border-2 ${color} bg-white shadow-xl flex items-center gap-8 transition-all hover:scale-[1.03] text-right`}>
    <div className={`p-6 ${bgColor} ${textColor} rounded-3xl shadow-inner`}>{icon}</div>
    <div><p className="text-slate-400 text-[10px] font-black uppercase mb-1">{title}</p><p className="text-4xl font-black text-slate-900 leading-none tabular-nums">{value}</p></div>
  </div>
);

const ControlReceiptView: React.FC<Props> = ({ user, students, absences, deliveryLogs, setDeliveryLogs, supervisions, users, onAlert, controlRequests, setControlRequests }) => {
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const myGrades = useMemo(() => {
    const allUniqueGrades = Array.from(new Set(students.map((s:any) => s.grade))).filter(Boolean);
    if (user.role === 'ADMIN') return allUniqueGrades;
    return allUniqueGrades.filter((g: any) => user.assigned_grades?.includes(g));
  }, [students, user]);

  const myScopeCommittees = useMemo(() => {
    const map: Record<string, { grade: string, count: number, committee_number: string }> = {};
    students.filter((s: Student) => myGrades.includes(s.grade)).forEach((s: Student) => {
      const key = `${s.committee_number}-${s.grade}`;
      if (!map[key]) {
        map[key] = { grade: s.grade, count: 0, committee_number: s.committee_number };
      }
      map[key].count++;
    });
    return map;
  }, [students, myGrades]);

  const stats = useMemo(() => {
    const allKeys = Object.keys(myScopeCommittees);
    const myReceivedLogs = deliveryLogs.filter((l: DeliveryLog) => 
      l.type === 'RECEIVE' && allKeys.some(key => {
        const info = myScopeCommittees[key];
        return info.committee_number === l.committee_number && info.grade === l.grade;
      })
    );
    const receivedKeys = allKeys.filter(key => 
      deliveryLogs.some((l: DeliveryLog) => 
        l.type === 'RECEIVE' && 
        l.committee_number === myScopeCommittees[key].committee_number &&
        l.grade === myScopeCommittees[key].grade
      )
    );
    const remainingKeys = allKeys.filter(key => !receivedKeys.includes(key));
    let totalStudReceived = 0;
    receivedKeys.forEach(key => totalStudReceived += myScopeCommittees[key].count);
    let totalStudRemaining = 0;
    remainingKeys.forEach(key => totalStudRemaining += myScopeCommittees[key].count);
    return { receivedCount: receivedKeys.length, remainingCount: remainingKeys.length, totalStudReceived, totalStudRemaining, remainingKeys, receivedLogs: myReceivedLogs };
  }, [myScopeCommittees, deliveryLogs]);

  const handleStartProcess = (val: string) => {
    const teacher = users.find((u:User) => u.national_id === val);
    if (teacher) {
      const supervision = supervisions.find((sv:Supervision) => sv.teacher_id === teacher.id);
      if (supervision) {
        const matchingKey = Object.keys(myScopeCommittees).find(k => myScopeCommittees[k].committee_number === supervision.committee_number);
        if (matchingKey) setProcessingKey(matchingKey);
        else onAlert(`عذراً، لجنة المراقب رقم ${supervision.committee_number} تتبع صفاً خارج صلاحياتك`);
      } else onAlert("المراقب ليس لديه لجنة مسندة اليوم");
    } else {
      const matchingKeys = Object.keys(myScopeCommittees).filter(k => myScopeCommittees[k].committee_number === val);
      if (matchingKeys.length >= 1) setProcessingKey(matchingKeys[0]);
      else onAlert("رقم اللجنة غير موجود ضمن الصفوف المسندة لك");
    }
    setSearchInput('');
    setIsScanning(false);
    scannerRef.current?.clear();
  };

  const confirmReceipt = (comKey: string) => {
    const info = myScopeCommittees[comKey];
    const sv = supervisions.find((s: Supervision) => s.committee_number === info.committee_number);
    const proctor = users.find((u: User) => u.id === sv?.teacher_id);
    const log: DeliveryLog = { id: Date.now().toString(), teacher_name: user.full_name, proctor_name: proctor?.full_name || '---', committee_number: info.committee_number, grade: info.grade, type: 'RECEIVE', time: new Date().toLocaleTimeString('ar-SA'), period: 1, status: 'CONFIRMED' };
    setDeliveryLogs((prev:any) => [log, ...prev]);
    onAlert(`تم تأكيد استلام لجنة ${info.committee_number} - ${info.grade} بنجاح`);
    setProcessingKey(null);
  };

  const handleProcessAlert = (id: string) => {
    setControlRequests((prev: ControlRequest[]) => prev.map(r => r.id === id ? {...r, status: 'DONE'} : r));
    onAlert("تم تسجيل معالجة البلاغ");
  };

  const activeAlerts = controlRequests.filter(r => r.status === 'PENDING');

  if (processingKey) {
    const info = myScopeCommittees[processingKey];
    const sv = supervisions.find((s: Supervision) => s.committee_number === info.committee_number);
    const proctor = users.find((u: User) => u.id === sv?.teacher_id);
    const committeeStudents = students.filter((s:Student) => s.committee_number === info.committee_number && s.grade === info.grade);
    const committeeAbsences = absences.filter((a: Absence) => a.committee_number === info.committee_number && committeeStudents.some(s => s.national_id === a.student_id));
    const actualAbsentees = committeeAbsences.filter(a => a.type === 'ABSENT');
    const presentCount = info.count - actualAbsentees.length;
    const isAlreadyReceived = deliveryLogs.some((l: DeliveryLog) => l.committee_number === info.committee_number && l.grade === info.grade && l.type === 'RECEIVE');

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-right">
        <button onClick={() => setProcessingKey(null)} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-all"><ArrowRightLeft size={20}/> إلغاء والعودة</button>
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-2 border-blue-100 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12 border-b pb-12">
            <div className="flex items-center gap-8">
              <div className="w-32 h-32 bg-slate-900 text-white rounded-[3rem] flex flex-col items-center justify-center font-black shadow-2xl"><span className="text-xs opacity-50 mb-1">اللجنة</span><span className="text-5xl">{info.committee_number}</span></div>
              <div><h3 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">استلام كشوف {info.grade}</h3><p className="text-emerald-600 font-black bg-emerald-50 px-6 py-2 rounded-full w-fit text-lg border border-emerald-100">تحقق من المظروف</p></div>
            </div>
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 min-w-[250px] text-center shadow-inner"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">المراقب الميداني</p><h4 className="text-2xl font-black text-slate-900">{proctor?.full_name || 'بانتظار التحاق المراقب'}</h4></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border text-center shadow-sm"><p className="text-xs font-bold text-slate-400 mb-1">إجمالي طلاب {info.grade}</p><p className="text-4xl font-black text-slate-900">{info.count}</p></div>
            <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 text-center shadow-sm"><p className="text-xs font-bold text-emerald-600 mb-1">الحاضرون</p><p className="text-4xl font-black text-emerald-700">{presentCount}</p></div>
            <div className={`p-8 rounded-[2.5rem] border text-center shadow-sm ${actualAbsentees.length > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}><p className={`text-xs font-bold mb-1 ${actualAbsentees.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>الغياب الفعلي</p><p className={`text-4xl font-black ${actualAbsentees.length > 0 ? 'text-red-700' : 'text-slate-900'}`}>{actualAbsentees.length}</p></div>
          </div>
          <button disabled={isAlreadyReceived} onClick={() => confirmReceipt(processingKey)} className={`w-full py-7 rounded-[2rem] font-black text-2xl flex items-center justify-center gap-4 transition-all shadow-2xl ${isAlreadyReceived ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-black shadow-slate-900/30'}`}>{isAlreadyReceived ? <CheckCircle2 size={32}/> : <PackageCheck size={32}/>}{isAlreadyReceived ? 'تم استلام كشوف هذا الصف مسبقاً' : 'تأكيد الاستلام ومطابقة العدد'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in text-right pb-20">
      {/* قسم البلاغات العاجلة للكنترول */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 p-8 rounded-[3rem] space-y-6 shadow-lg animate-pulse-slow">
           <h3 className="text-2xl font-black text-red-700 flex items-center gap-3"><ShieldAlert size={28}/> بلاغات عاجلة من اللجان ({activeAlerts.length})</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeAlerts.map(alert => (
                <div key={alert.id} className="bg-white p-6 rounded-3xl border border-red-100 flex justify-between items-center shadow-sm">
                   <div>
                      <p className="font-black text-slate-800">لجنة {alert.committee} - {alert.from}</p>
                      <p className="text-red-600 font-bold">{alert.text}</p>
                   </div>
                   <button onClick={() => handleProcessAlert(alert.id)} className="bg-emerald-600 text-white p-3 rounded-2xl hover:bg-emerald-700 transition-all shadow-md active:scale-90"><Check size={20}/></button>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="لجاني المستلمة" value={stats.receivedCount} icon={<PackageCheck size={32} />} color="border-emerald-200" bgColor="bg-emerald-50" textColor="text-emerald-600" />
        <StatCard title="لجاني المتبقية" value={stats.remainingCount} icon={<Clock size={32} />} color="border-amber-200" bgColor="bg-amber-50" textColor="text-amber-600" />
        <StatCard title="طلاب تم استلامهم" value={stats.totalStudReceived} icon={<Users size={32} />} color="border-blue-200" bgColor="bg-blue-50" textColor="text-blue-600" />
        <StatCard title="طلاب بانتظارهم" value={stats.totalStudRemaining} icon={<LayoutGrid size={32} />} color="border-slate-200" bgColor="bg-slate-50" textColor="text-slate-600" />
      </div>

      <div className="bg-slate-900 p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-black mb-4 tracking-tighter">نقطة استلام المظاريف الذكية</h2>
          <p className="text-slate-400 font-bold mb-10 italic">نطاق مسؤوليتك الحالي: {myGrades.join(' ، ')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => {
                setIsScanning(true);
                setTimeout(() => {
                  scannerRef.current = new Html5QrcodeScanner("receipt-scanner", { fps: 15, qrbox: 250 }, false);
                  scannerRef.current.render((text) => handleStartProcess(text), () => {});
                }, 100);
              }} className="p-10 bg-blue-600 rounded-[3rem] font-black text-2xl flex flex-col items-center gap-6 shadow-2xl hover:scale-105 transition-all shadow-blue-600/30"><Scan size={48}/><span>مسح بطاقة المراقب</span></button>
            <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] flex flex-col gap-6">
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="رقم اللجنة أو الهوية" className="w-full bg-white/10 border-2 border-white/10 rounded-2xl p-5 text-center text-3xl font-black text-white outline-none focus:border-blue-500 shadow-inner" />
              <button onClick={() => handleStartProcess(searchInput)} disabled={!searchInput} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all">بدء الاستلام</button>
            </div>
          </div>
          {isScanning && (
            <div className="fixed inset-0 z-[300] bg-slate-900/98 backdrop-blur-3xl flex flex-col items-center justify-center p-10">
              <div id="receipt-scanner" className="w-full max-sm rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white/10 bg-white"></div>
              <button onClick={() => { setIsScanning(false); scannerRef.current?.clear(); }} className="mt-12 bg-white text-slate-900 px-14 py-5 rounded-2xl font-black text-xl">إلغاء المسح</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h4 className="text-2xl font-black text-slate-800">اللجان المتبقية ({stats.remainingCount})</h4>
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden min-h-[400px]">
            <table className="w-full text-right">
              <thead><tr className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase"><th className="p-8">اللجنة / الصف</th><th className="p-8">المراقب</th><th className="p-8 text-center">الإجراء</th></tr></thead>
              <tbody>
                {stats.remainingKeys.map(key => {
                  const info = myScopeCommittees[key];
                  const sv = supervisions.find((s: Supervision) => s.committee_number === info.committee_number);
                  const proctor = users.find((u: User) => u.id === sv?.teacher_id);
                  return (
                    <tr key={key} className="hover:bg-amber-50/10 border-b border-slate-50 transition-all font-bold">
                      <td className="p-8"><span className="w-12 h-12 bg-slate-900 text-white rounded-xl inline-flex items-center justify-center font-black ml-3">{info.committee_number}</span><span className="text-slate-400 text-xs">{info.grade}</span></td>
                      <td className="p-8 font-black">{proctor?.full_name || 'بانتظار التحاق المراقب'}</td>
                      <td className="p-8 text-center"><button onClick={() => setProcessingKey(key)} className="bg-blue-50 text-blue-600 px-6 py-2 rounded-xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all">استلام</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-6">
          <h4 className="text-2xl font-black text-slate-800">آخر عمليات الاستلام</h4>
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden min-h-[400px]">
            <table className="w-full text-right">
              <thead><tr className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase"><th className="p-8">اللجنة</th><th className="p-8">المراقب</th><th className="p-8 text-center">الوقت</th></tr></thead>
              <tbody>
                {stats.receivedLogs.slice(0, 10).map((log: DeliveryLog) => (
                  <tr key={log.id} className="hover:bg-emerald-50/10 border-b border-slate-50 transition-all font-bold">
                    <td className="p-8"><span className="w-12 h-12 bg-emerald-600 text-white rounded-xl inline-flex items-center justify-center font-black ml-3">{log.committee_number}</span><span className="text-slate-400 text-xs">{log.grade}</span></td>
                    <td className="p-8 font-black">{log.proctor_name || '---'}</td>
                    <td className="p-8 text-center font-bold text-slate-600">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlReceiptView;
