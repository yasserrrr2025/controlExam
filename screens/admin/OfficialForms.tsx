
import React, { useState, useMemo } from 'react';
import { Absence, Student } from '../../types';
import { Printer, FileText, Clock, UserX, ArrowRightLeft, Calendar, FileCheck, CheckCircle2, ListChecks, ClipboardList, Send, History } from 'lucide-react';
import { APP_CONFIG } from '../../constants';

interface Props {
  absences: Absence[];
  students: Student[];
}

const AdminOfficialForms: React.FC<Props> = ({ absences, students }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedForm, setSelectedForm] = useState<{ type: 'ABSENCE' | 'DELAY' | 'ABSENCE_REGISTER_ALL' | 'DELAY_REGISTER_ALL' | 'PRINT_ALL_DAILY_FORMS', absenceId?: string } | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // حالات اليوم المحدد
  const dailyAbsences = useMemo(() => {
    return absences.filter(a => a.date.startsWith(selectedDate));
  }, [absences, selectedDate]);

  // السجلات الشاملة (كافة الحالات في النظام)
  const allAbsences = useMemo(() => absences.filter(a => a.type === 'ABSENT').sort((a,b) => b.date.localeCompare(a.date)), [absences]);
  const allDelays = useMemo(() => absences.filter(a => a.type === 'LATE').sort((a,b) => b.date.localeCompare(a.date)), [absences]);

  const getDayName = (dateStr: string) => {
    return new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date(dateStr));
  };

  const renderSingleForm = (absence: Absence, type: 'ABSENT' | 'LATE') => {
    const student = students.find(s => s.national_id === absence.student_id);
    const day = getDayName(absence.date);
    const date = new Date(absence.date).toLocaleDateString('ar-SA');

    return (
      <div key={absence.id} className="bg-white p-6 font-['Tajawal'] text-slate-900 border-[1px] border-slate-300 m-0 print-form-container page-break-after-always">
        <div className="flex justify-between items-start border-b-[1.5px] border-slate-900 pb-2 mb-4">
           <div className="text-[9px] font-black space-y-0.5">
              <p>{APP_CONFIG.MINISTRY_NAME}</p>
              <p>{APP_CONFIG.ADMINISTRATION_NAME}</p>
              <p>{APP_CONFIG.SCHOOL_NAME}</p>
           </div>
           <div className="text-center">
              <img src={APP_CONFIG.LOGO_URL} className="w-10 h-10 mx-auto mb-1" alt="Logo" />
              <p className="text-[11px] font-black">محضر {type === 'ABSENT' ? 'غياب' : 'تأخر'} رسمي</p>
           </div>
           <div className="text-[9px] font-bold text-left">
              <p>التاريخ: {date}</p>
              <p>اليوم: {day}</p>
              <p>رقم: {absence.id.slice(0,6)}</p>
           </div>
        </div>

        <h2 className="text-center text-[13px] font-black underline mb-6 uppercase">
          بيان {type === 'ABSENT' ? 'غياب طالب عن الاختبار' : 'تأخر طالب عن موعد الاختبار'}
        </h2>

        <div className="grid grid-cols-4 border-[1.5px] border-slate-900 text-[10px] mb-6">
           <div className="bg-slate-100 p-2 border-l border-b border-slate-900 font-black">اسم الطالب</div>
           <div className="p-2 border-b border-slate-900 col-span-3 font-bold">{absence.student_name}</div>
           
           <div className="bg-slate-100 p-2 border-l border-b border-slate-900 font-black">رقم الجلوس</div>
           <div className="p-2 border-l border-b border-slate-900 font-bold">{student?.seating_number || '---'}</div>
           <div className="bg-slate-100 p-2 border-l border-b border-slate-900 font-black">اللجنة</div>
           <div className="p-2 border-b border-slate-900 font-bold">{absence.committee_number}</div>

           <div className="bg-slate-100 p-2 border-l border-b border-slate-900 font-black">الصف</div>
           <div className="p-2 border-l border-b border-slate-900 font-bold">{student?.grade || '---'}</div>
           <div className="bg-slate-100 p-2 border-l border-b border-slate-900 font-black">المادة</div>
           <div className="p-2 border-b border-slate-900 font-bold">.........................</div>
        </div>

        <div className="space-y-4">
          <div className="border-[1.5px] border-slate-900 p-3">
             <p className="text-[10px] font-black mb-2 italic underline">إفادة الطالب / ولي الأمر (أو سبب الغياب):</p>
             <div className="h-14 border-b border-dashed border-slate-300"></div>
          </div>
          <div className="grid grid-cols-2 border-[1.5px] border-slate-900 p-3 text-[9px] gap-6">
             <div className="space-y-6"><p className="font-black underline">مصادقة لجنة التحكم</p><div className="flex justify-between"><span>الاسم: .................</span><span>التوقيع: ........</span></div></div>
             <div className="space-y-6"><p className="font-black underline">اعتماد مدير المدرسة</p><div className="flex justify-between"><span>الاسم: .................</span><span>التوقيع: ........</span></div></div>
          </div>
        </div>
      </div>
    );
  };

  const renderComprehensiveRegister = (list: Absence[], title: string) => {
    return (
      <div className="bg-white p-4 font-['Tajawal'] text-slate-900 border-[1.5px] border-slate-900 m-0 print-form-container">
        <div className="flex justify-between items-start border-b-[1.5px] border-slate-900 pb-2 mb-4">
           <div className="text-[9px] font-black space-y-0.5"><p>{APP_CONFIG.MINISTRY_NAME}</p><p>{APP_CONFIG.ADMINISTRATION_NAME}</p><p>{APP_CONFIG.SCHOOL_NAME}</p></div>
           <div className="text-center"><img src={APP_CONFIG.LOGO_URL} className="w-10 h-10 mx-auto mb-1" alt="Logo" /><p className="text-[12px] font-black">{title} - أرشيف شامل</p></div>
           <div className="text-[9px] font-bold text-left"><p>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}</p><p>إجمالي الحالات: {list.length}</p></div>
        </div>
        <h2 className="text-center text-[12px] font-black mb-4 underline">سجل {title} الشامل لكافة اللجان</h2>
        <table className="w-full text-center border-[1.5px] border-slate-900 border-collapse text-[9px]">
          <thead className="bg-slate-100 font-black">
            <tr>
              <th className="border border-slate-900 p-1">م</th>
              <th className="border border-slate-900 p-1">التاريخ</th>
              <th className="border border-slate-900 p-1">اسم الطالب</th>
              <th className="border border-slate-900 p-1">الصف</th>
              <th className="border border-slate-900 p-1">اللجنة</th>
              <th className="border border-slate-900 p-1">ملاحظات الإدارة</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a, i) => {
              const s = students.find(std => std.national_id === a.student_id);
              return (
                <tr key={a.id}>
                  <td className="border border-slate-900 p-1">{i+1}</td>
                  <td className="border border-slate-900 p-1">{new Date(a.date).toLocaleDateString('ar-SA')}</td>
                  <td className="border border-slate-900 p-1 text-right px-2 font-bold">{a.student_name}</td>
                  <td className="border border-slate-900 p-1">{s?.grade || '---'}</td>
                  <td className="border border-slate-900 p-1 font-black">{a.committee_number}</td>
                  <td className="border border-slate-900 p-1 w-32"></td>
                </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan={6} className="border border-slate-900 p-4 text-slate-400 italic">لا توجد سجلات مسجلة في النظام</td></tr>}
          </tbody>
        </table>
        <div className="grid grid-cols-2 mt-8 px-10 text-[10px] font-black">
           <div className="text-center space-y-8"><p>رئيس الكنترول</p><p>.....................</p></div>
           <div className="text-center space-y-8"><p>مدير المدرسة</p><p>.....................</p></div>
        </div>
      </div>
    );
  };

  const handlePrint = (type: any, id?: string) => {
    setSelectedForm({ type, absenceId: id });
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  return (
    <div className="space-y-8 animate-fade-in text-right pb-20 no-print">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">مركز استخراج النماذج والسجلات</h2>
          <p className="text-slate-400 font-bold mt-1 italic">إصدار المحاضر اليومية والسجلات العامة الشاملة</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="date" className="pr-10 py-3 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs shadow-sm outline-none focus:border-blue-600" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <button 
            disabled={dailyAbsences.length === 0} 
            onClick={() => handlePrint('PRINT_ALL_DAILY_FORMS')} 
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-xl flex items-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            <Printer size={18} /> طباعة جميع محاضر اليوم ({dailyAbsences.length})
          </button>
        </div>
      </div>

      {/* سجلات إحصائية شاملة (تراكمية لكل الحالات) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full"></div>
            <div className="relative z-10 flex items-center justify-between">
               <div className="space-y-2">
                  <h3 className="text-xl font-black flex items-center gap-3"><History className="text-red-400" /> السجل العام للغياب</h3>
                  <p className="text-[10px] text-slate-400 font-bold">كشف رسمي شامل بكافة حالات الغياب المسجلة في النظام</p>
               </div>
               <div className="text-center">
                  <p className="text-3xl font-black text-red-500">{allAbsences.length}</p>
                  <p className="text-[9px] font-black uppercase text-slate-500">حالة مسجلة</p>
               </div>
            </div>
            <button onClick={() => handlePrint('ABSENCE_REGISTER_ALL')} className="mt-8 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3">
               <Printer size={18}/> طباعة سجل الغياب الشامل
            </button>
         </div>

         <div className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>
            <div className="relative z-10 flex items-center justify-between">
               <div className="space-y-2">
                  <h3 className="text-xl font-black flex items-center gap-3"><Clock className="text-amber-400" /> السجل العام للتأخر</h3>
                  <p className="text-[10px] text-slate-400 font-bold">كشف رسمي شامل بكافة حالات التأخير المسجلة في النظام</p>
               </div>
               <div className="text-center">
                  <p className="text-3xl font-black text-amber-500">{allDelays.length}</p>
                  <p className="text-[9px] font-black uppercase text-slate-500">حالة مسجلة</p>
               </div>
            </div>
            <button onClick={() => handlePrint('DELAY_REGISTER_ALL')} className="mt-8 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-3">
               <Printer size={18}/> طباعة سجل التأخير الشامل
            </button>
         </div>
      </div>

      <div className="flex items-center gap-4 border-b pb-4 mt-12">
         <ListChecks size={24} className="text-blue-600" />
         <h3 className="text-xl font-black text-slate-800">المحاضر الفردية ليوم {new Date(selectedDate).toLocaleDateString('ar-SA')}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dailyAbsences.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
             <p className="text-xl font-black text-slate-300 italic">لا توجد بلاغات مسجلة لهذا التاريخ المختار</p>
          </div>
        ) : (
          dailyAbsences.map(a => {
            const s = students.find(std => std.national_id === a.student_id);
            return (
              <div key={a.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-xl flex flex-col justify-between group hover:border-blue-500 transition-all">
                 <div className="space-y-4">
                    <div className="flex justify-between items-start">
                       <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${a.type === 'ABSENT' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          {a.type === 'ABSENT' ? 'غياب' : 'تأخير'}
                       </span>
                       <span className="text-[10px] font-bold text-slate-300">لجنة {a.committee_number}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 leading-tight">{a.student_name}</h4>
                    <p className="text-[10px] font-bold text-slate-400">{s?.grade} - {s?.section}</p>
                 </div>
                 <button onClick={() => handlePrint(a.type === 'ABSENT' ? 'ABSENCE' : 'DELAY', a.id)} className="mt-8 w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3">
                    <Printer size={16}/> طباعة المحضر الفردي
                 </button>
              </div>
            );
          })
        )}
      </div>

      {/* منطقة الطباعة المخفية */}
      <div className="hidden print:block print:m-0 print:p-0">
         {selectedForm?.type === 'ABSENCE_REGISTER_ALL' && renderComprehensiveRegister(allAbsences, 'الغياب العام')}
         {selectedForm?.type === 'DELAY_REGISTER_ALL' && renderComprehensiveRegister(allDelays, 'التأخير العام')}
         
         {selectedForm?.type === 'PRINT_ALL_DAILY_FORMS' && dailyAbsences.map(a => 
            renderSingleForm(a, a.type === 'ABSENT' ? 'ABSENT' : 'LATE')
         )}

         {selectedForm?.type === 'ABSENCE' && dailyAbsences.find(a => a.id === selectedForm.absenceId) && renderSingleForm(dailyAbsences.find(a => a.id === selectedForm.absenceId)!, 'ABSENT')}
         {selectedForm?.type === 'DELAY' && dailyAbsences.find(a => a.id === selectedForm.absenceId) && renderSingleForm(dailyAbsences.find(a => a.id === selectedForm.absenceId)!, 'LATE')}
      </div>

      <style>{`
        @media print {
          @page { margin: 0.3cm; size: A4 portrait; }
          body { background: white !important; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-form-container { width: 100% !important; box-shadow: none !important; border: none !important; margin-bottom: 0 !important; }
          .page-break-after-always { page-break-after: always; }
        }
      `}</style>
    </div>
  );
};

export default AdminOfficialForms;
