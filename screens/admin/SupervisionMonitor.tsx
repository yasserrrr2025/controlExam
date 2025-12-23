
import React, { useState, useMemo } from 'react';
import { Supervision, User, Student, Absence, DeliveryLog } from '../../types';
import OfficialHeader from '../../components/OfficialHeader';
import { Printer, Clock } from 'lucide-react';

interface Props {
  supervisions: Supervision[];
  users: User[];
  students: Student[];
  absences: Absence[];
  deliveryLogs: DeliveryLog[];
}

const AdminSupervisionMonitor: React.FC<Props> = ({ supervisions, users, students, absences, deliveryLogs }) => {
  const [reportInfo, setReportInfo] = useState({ 
    day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date()), 
    date: new Date().toISOString().split('T')[0], 
    subject: '' 
  });

  const handleDateChange = (dateVal: string) => {
    if (!dateVal) return;
    const dateObj = new Date(dateVal);
    const dayName = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(dateObj);
    setReportInfo({ ...reportInfo, date: dateVal, day: dayName });
  };

  const committeeStats = useMemo(() => {
    const sortedSV = [...supervisions].sort((a, b) => Number(a.committee_number) - Number(b.committee_number));
    return sortedSV.map(sv => {
      const proctor = users.find((u: any) => u.id === sv.teacher_id);
      const committeeStudents = students.filter((s: Student) => s.committee_number === sv.committee_number);
      const committeeAbsences = absences.filter((a: Absence) => a.committee_number === sv.committee_number);
      const total = committeeStudents.length;
      
      // الحسابات: المتأخر لا يُخصم من الحضور
      const absent = committeeAbsences.filter((a: any) => a.type === 'ABSENT').length;
      const late = committeeAbsences.filter((a: any) => a.type === 'LATE').length;
      const present = total - absent; // الحضور يشمل (المنتظمين + المتأخرين)
      
      const delivery = deliveryLogs.find((l: DeliveryLog) => l.committee_number === sv.committee_number && l.type === 'RECEIVE');
      return { 
        committee_number: sv.committee_number, 
        proctor_name: proctor?.full_name || 'غير محدد', 
        total, 
        present, 
        absent, 
        late, 
        delivery_time: delivery?.time || 'لم تُستلم' 
      };
    });
  }, [supervisions, users, students, absences, deliveryLogs]);

  return (
    <div className="space-y-10 animate-fade-in text-right pb-20">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-2 border-slate-50 no-print">
        <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3"><Printer className="text-blue-600" /> إعداد تقرير مسير المراقبة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase">اليوم</label>
            <input type="text" readOnly className="w-full p-4 bg-slate-100 border rounded-2xl font-black outline-none text-slate-600" value={reportInfo.day} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase">التاريخ</label>
            <input type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600 shadow-sm" value={reportInfo.date} onChange={e => handleDateChange(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase">المادة</label>
            <input type="text" placeholder="اسم المادة" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600 shadow-sm" value={reportInfo.subject} onChange={e => setReportInfo({...reportInfo, subject: e.target.value})} />
          </div>
        </div>
        <button onClick={() => window.print()} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-4 hover:bg-black transition-all active:scale-95">
          <Printer size={28} /> طباعة المسير الرسمي (PDF)
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border overflow-hidden no-print">
         <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="p-6">رقم اللجنة</th>
                <th className="p-6">المراقب</th>
                <th className="p-6 text-center">الطلاب</th>
                <th className="p-6 text-center">حضور</th>
                <th className="p-6 text-center">تأخير</th>
                <th className="p-6 text-center">غياب</th>
                <th className="p-6 text-center">وقت التسليم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
               {committeeStats.map((stat, idx) => (
                 <tr key={idx} className="hover:bg-blue-50/20 font-bold">
                    <td className="p-6">لجنة {stat.committee_number}</td>
                    <td className="p-6 font-black">{stat.proctor_name}</td>
                    <td className="p-6 text-center">{stat.total}</td>
                    <td className="p-6 text-center text-emerald-700">{stat.present}</td>
                    <td className="p-6 text-center text-amber-600">{stat.late}</td>
                    <td className="p-6 text-center text-red-700">{stat.absent}</td>
                    <td className="p-6 text-center text-xs font-mono bg-slate-50/50">{stat.delivery_time}</td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      <div className="print-only w-full">
        <OfficialHeader />
        <div className="text-center my-8">
          <h2 className="text-2xl font-black border-b-4 border-double border-slate-900 pb-2 inline-block px-10">مسير المراقبة اليومي</h2>
        </div>
        <table className="w-full text-center border-2 border-slate-900 mt-6 border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border-2 border-slate-900 p-3 font-black text-xs">م</th>
              <th className="border-2 border-slate-900 p-3 font-black text-xs">اللجنة</th>
              <th className="border-2 border-slate-900 p-3 font-black text-xs">اسم المراقب</th>
              <th className="border-2 border-slate-900 p-3 font-black text-xs">الطلاب</th>
              <th className="border-2 border-slate-900 p-3 font-black text-xs">حضور</th>
              <th className="border-2 border-slate-900 p-3 font-black text-xs">تأخير</th>
              <th className="border-2 border-slate-900 p-3 font-black text-xs">غياب</th>
              <th className="border-2 border-slate-900 p-3 font-black text-xs">وقت التسليم</th>
              <th className="border-2 border-slate-900 p-3 font-black text-xs">التوقيع</th>
            </tr>
          </thead>
          <tbody>
            {committeeStats.map((stat, i) => (
              <tr key={i}>
                <td className="border-2 border-slate-900 p-3 font-bold text-sm">{i+1}</td>
                <td className="border-2 border-slate-900 p-3 font-bold text-sm">{stat.committee_number}</td>
                <td className="border-2 border-slate-900 p-3 text-right px-4 font-black text-sm">{stat.proctor_name}</td>
                <td className="border-2 border-slate-900 p-3 text-sm">{stat.total}</td>
                <td className="border-2 border-slate-900 p-3 font-black text-sm">{stat.present}</td>
                <td className="border-2 border-slate-900 p-3 font-black text-sm">{stat.late}</td>
                <td className="border-2 border-slate-900 p-3 font-black text-sm">{stat.absent}</td>
                <td className="border-2 border-slate-900 p-3 font-mono text-[10px]">{stat.delivery_time}</td>
                <td className="border-2 border-slate-900 p-3 w-24"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSupervisionMonitor;
