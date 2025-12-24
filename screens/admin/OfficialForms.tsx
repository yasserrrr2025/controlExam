
import React, { useState, useMemo } from 'react';
import { Absence, Student } from '../../types';
import { Printer, Calendar, History, Clock, Search, ListChecks } from 'lucide-react';
import OfficialHeader from '../../components/OfficialHeader';

interface Props {
  absences: Absence[];
  students: Student[];
}

const AdminOfficialForms: React.FC<Props> = ({ absences, students }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedForm, setSelectedForm] = useState<{ type: string, id?: string } | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const dailyAbsences = useMemo(() => absences.filter(a => a.date.startsWith(selectedDate)), [absences, selectedDate]);
  const allAbsences = useMemo(() => absences.filter(a => a.type === 'ABSENT'), [absences]);
  const allDelays = useMemo(() => absences.filter(a => a.type === 'LATE'), [absences]);

  // نموذج 36 - غياب طالب
  const renderAbsenceForm = (absence: Absence) => {
    const student = students.find(s => s.national_id === absence.student_id);
    return (
      <div key={absence.id} className="print-page-layout bg-white text-slate-950 font-['Tajawal'] p-8 block">
        <OfficialHeader />
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-blue-700 mb-1">نموذج رقم: 36</p>
          <h2 className="text-3xl font-black">محضر غياب طالب عن الاختبار</h2>
        </div>

        <div className="w-full border-2 border-slate-900 mb-8 overflow-hidden text-[14px]">
           <div className="grid grid-cols-2 border-b-2 border-slate-900">
              <div className="p-3 border-l-2 border-slate-900 flex justify-between px-4"><span className="font-bold">اسم الطالب:</span> <span className="font-black text-lg">{absence.student_name}</span></div>
              <div className="p-3 flex justify-between px-4"><span className="font-bold">رقم الجلوس:</span> <span className="font-black">{student?.seating_number || '................'}</span></div>
           </div>
           <div className="grid grid-cols-2 border-b-2 border-slate-900">
              <div className="p-3 border-l-2 border-slate-900 flex justify-between px-4"><span className="font-bold">اليوم:</span> <span className="font-black">........................</span></div>
              <div className="p-3 flex justify-between px-4"><span className="font-bold">التاريخ:</span> <span className="font-black">{new Date(absence.date).toLocaleDateString('ar-SA')}</span></div>
           </div>
           <div className="grid grid-cols-2 border-b-2 border-slate-900">
              <div className="p-3 border-l-2 border-slate-900 flex justify-between px-4"><span className="font-bold">الفترة:</span> <span className="font-black">........................</span></div>
              <div className="p-3 flex justify-between px-4"><span className="font-bold">رقم اللجنة:</span> <span className="font-black">{absence.committee_number}</span></div>
           </div>
           <div className="grid grid-cols-4">
              <div className="p-3 border-l-2 border-slate-900 flex justify-between px-4 col-span-2"><span className="font-bold">المادة:</span> <span className="font-black">........................</span></div>
              <div className="p-3 border-l-2 border-slate-900 flex justify-between px-4"><span className="font-bold">الصف:</span> <span className="font-black">{student?.grade || '....'}</span></div>
              <div className="p-3 flex justify-between px-4"><span className="font-bold">الفصل:</span> <span className="font-black">{student?.section || '....'}</span></div>
           </div>
        </div>

        <div className="mb-8">
           <div className="bg-slate-100 p-2 border-2 border-slate-900 text-center font-black">مصادقة لجنة الإشراف والملاحظة</div>
           <table className="w-full border-x-2 border-b-2 border-slate-900 text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold">
                  <th className="border-2 border-slate-900 p-2 w-12">م</th>
                  <th className="border-2 border-slate-900 p-2">الاسم</th>
                  <th className="border-2 border-slate-900 p-2 w-40">الصفة</th>
                  <th className="border-2 border-slate-900 p-2 w-40">التوقيع</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border-2 border-slate-900 p-4">1</td><td className="border-2 border-slate-900">........................................</td><td className="border-2 border-slate-900 font-bold">رئيس الكنترول</td><td className="border-2 border-slate-900"></td></tr>
                <tr><td className="border-2 border-slate-900 p-4">2</td><td className="border-2 border-slate-900">........................................</td><td className="border-2 border-slate-900 font-bold">عضو</td><td className="border-2 border-slate-900"></td></tr>
                <tr><td className="border-2 border-slate-900 p-4">3</td><td className="border-2 border-slate-900">........................................</td><td className="border-2 border-slate-900 font-bold">ملاحظ اللجنة</td><td className="border-2 border-slate-900"></td></tr>
              </tbody>
           </table>
        </div>

        <div className="flex flex-col items-end mt-16 px-10 gap-10">
           <div className="text-center">
              <p className="text-xl font-black mb-10">مدير المدرسة:</p>
              <p className="text-lg font-bold">التوقيع: ....................................</p>
           </div>
        </div>
      </div>
    );
  };

  // نموذج 31 - تأخر طالب
  const renderDelayForm = (absence: Absence) => {
    const student = students.find(s => s.national_id === absence.student_id);
    return (
      <div key={absence.id} className="print-page-layout bg-white text-slate-950 font-['Tajawal'] p-8 block">
        <OfficialHeader />
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-blue-700 mb-1">نموذج رقم: 31</p>
          <h2 className="text-2xl font-black">تعهد طالب تأخر عن الاختبار</h2>
        </div>
        
        {/* تصميم مشابه لـ 36 حسب متطلباتك */}
        <div className="w-full border-2 border-slate-900 mb-6 text-[14px]">
           <div className="p-3 border-b-2 border-slate-900 flex justify-between px-4"><span className="font-bold">اسم الطالب:</span> <span className="font-black text-lg">{absence.student_name}</span></div>
           <div className="grid grid-cols-3 border-b-2 border-slate-900 text-center bg-slate-50 font-bold"><div className="p-1 border-l-2 border-slate-900">الصف</div><div className="p-1 border-l-2 border-slate-900">الفصل</div><div>اللجنة</div></div>
           <div className="grid grid-cols-3 border-b-2 border-slate-900 text-center font-black"><div className="p-3 border-l-2 border-slate-900">{student?.grade}</div><div className="p-3 border-l-2 border-slate-900">{student?.section}</div><div>{absence.committee_number}</div></div>
           <div className="grid grid-cols-2 border-b-2 border-slate-900 text-center bg-slate-50 font-bold"><div className="p-1 border-l-2 border-slate-900">اليوم</div><div>التاريخ</div></div>
           <div className="grid grid-cols-2 border-b-2 border-slate-900 text-center font-black"><div className="p-3 border-l-2 border-slate-900">................</div><div>{new Date(absence.date).toLocaleDateString('ar-SA')}</div></div>
        </div>

        <div className="p-6 border-2 border-slate-900 bg-slate-50 italic text-[14px] leading-relaxed mb-8">
           <p>أتعهد أنا الطالب / ................................................................ بالالتزام بالحضور المبكر أيام الاختبارات وعدم تكرار التأخر، وأشعرت أنه في حال التكرار يتم حسم درجة من درجات المواظبة عن كل تأخر وعلى ذلك أوقع.</p>
           <p className="text-left font-black mt-4">توقيع الطالب: ...............................</p>
        </div>

        <div className="grid grid-cols-2 border-2 border-slate-900 h-32">
           <div className="border-l-2 border-slate-900 flex flex-col"><div className="bg-slate-100 p-1 border-b-2 border-slate-900 text-center font-bold">لجنة الإشراف والملاحظة</div><div className="flex-1 p-2"></div></div>
           <div className="flex flex-col"><div className="bg-slate-100 p-1 border-b-2 border-slate-900 text-center font-bold">لجنة التحكم والضبط</div><div className="flex-1 p-2"></div></div>
        </div>

        <div className="text-center mt-12"><p className="text-xl font-black">مدير المدرسة</p><p className="mt-8">................................................</p></div>
      </div>
    );
  };

  const handlePrint = (type: string, id?: string) => {
    setSelectedForm({ type, id });
    setIsPrinting(true);
    // الانتظار للتأكد من الرندر قبل فتح نافذة الطباعة
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  return (
    <div className="space-y-8 text-right pb-20 no-print">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-4 border-blue-600 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">مركز استخراج النماذج الرسمية</h2>
          <p className="text-slate-400 font-bold mt-1 italic">طباعة محاضر 36 و 31 المعتمدة</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <input type="date" className="px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-blue-600 shadow-sm" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <button 
            disabled={dailyAbsences.length === 0} 
            onClick={() => handlePrint('ALL_DAILY')} 
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-xl flex items-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            <Printer size={18} /> طباعة جميع محاضر اليوم المعتمدة ({dailyAbsences.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group border-b-8 border-red-600">
            <h3 className="text-xl font-black mb-2 flex items-center gap-3"><History className="text-red-400" /> السجل الشامل للغياب</h3>
            <button onClick={() => handlePrint('REGISTER_ABSENCE')} className="mt-6 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white transition-all">طباعة سجل الغياب العام</button>
         </div>
         <div className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group border-b-8 border-amber-600">
            <h3 className="text-xl font-black mb-2 flex items-center gap-3"><Clock className="text-amber-400" /> السجل الشامل للتأخر</h3>
            <button onClick={() => handlePrint('REGISTER_DELAY')} className="mt-6 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs hover:bg-amber-600 hover:text-white transition-all">طباعة سجل التأخر العام</button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dailyAbsences.map(a => (
          <div key={a.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-xl flex flex-col justify-between group hover:border-blue-500 transition-all">
             <div className="space-y-3">
                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${a.type === 'ABSENT' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                  {a.type === 'ABSENT' ? 'نموذج 36' : 'نموذج 31'}
                </span>
                <h4 className="text-lg font-black text-slate-800 leading-tight">{a.student_name}</h4>
                <p className="text-[10px] font-bold text-slate-400">لجنة رقم: {a.committee_number}</p>
             </div>
             <button onClick={() => handlePrint(a.type === 'ABSENT' ? 'SINGLE_ABSENCE' : 'SINGLE_DELAY', a.id)} className="mt-6 w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2">
                <Printer size={16}/> طباعة المحضر الفردي
             </button>
          </div>
        ))}
      </div>

      {/* منطقة الطباعة المخصصة - مخفية في الشاشة وتظهر فقط عند الطباعة */}
      {isPrinting && (
        <div className="print-only-container">
           {selectedForm?.type === 'ALL_DAILY' && dailyAbsences.map(a => a.type === 'ABSENT' ? renderAbsenceForm(a) : renderDelayForm(a))}
           {selectedForm?.type === 'SINGLE_ABSENCE' && dailyAbsences.find(a => a.id === selectedForm.id) && renderAbsenceForm(dailyAbsences.find(a => a.id === selectedForm.id)!)}
           {selectedForm?.type === 'SINGLE_DELAY' && dailyAbsences.find(a => a.id === selectedForm.id) && renderDelayForm(dailyAbsences.find(a => a.id === selectedForm.id)!)}
        </div>
      )}

      <style>{`
        @media screen {
          .print-only-container { display: none; }
        }
        @media print {
          @page { size: A4 portrait; margin: 1cm; }
          body * { visibility: hidden !important; }
          .print-only-container, .print-only-container * { 
            visibility: visible !important; 
            display: block !important;
          }
          .print-only-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
          }
          .no-print { display: none !important; }
          .page-break-after-always { page-break-after: always; }
          table { width: 100%; border-collapse: collapse; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default AdminOfficialForms;
