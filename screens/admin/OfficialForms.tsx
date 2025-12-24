
import React, { useState, useMemo } from 'react';
import { Absence, Student } from '../../types';
import { Printer, FileText, Clock, UserX, ArrowRightLeft, Calendar, FileCheck, CheckCircle2, ListChecks, ClipboardList, Send, History } from 'lucide-react';
import { APP_CONFIG } from '../../constants';
import OfficialHeader from '../../components/OfficialHeader';

interface Props {
  absences: Absence[];
  students: Student[];
}

const AdminOfficialForms: React.FC<Props> = ({ absences, students }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedForm, setSelectedForm] = useState<{ type: 'ABSENCE' | 'DELAY' | 'ABSENCE_REGISTER_ALL' | 'DELAY_REGISTER_ALL' | 'PRINT_ALL_DAILY_FORMS', absenceId?: string } | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const dailyAbsences = useMemo(() => {
    return absences.filter(a => a.date.startsWith(selectedDate));
  }, [absences, selectedDate]);

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
      <div key={absence.id} className="bg-white p-6 font-['Tajawal'] text-slate-900 border-[1.5px] border-slate-900 m-0 print-form-container page-break-after-always">
        <OfficialHeader />
        
        <h2 className="text-center text-[13px] font-black underline my-6 uppercase">
          محضر {type === 'ABSENT' ? 'غياب طالب عن الاختبار' : 'تأخر طالب عن الاختبار'}
        </h2>

        <div className="grid grid-cols-4 border-[1.5px] border-slate-900 text-[10px] mb-8">
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

        <div className="space-y-6">
          <div className="border-[1.5px] border-slate-900 p-3">
             <p className="text-[10px] font-black mb-2 italic underline">إفادة الطالب / ولي الأمر (أو سبب الغياب):</p>
             <div className="h-16 border-b border-dashed border-slate-300"></div>
          </div>
          <div className="grid grid-cols-2 border-[1.5px] border-slate-900 p-4 text-[9px] gap-8">
             <div className="space-y-10"><p className="font-black underline">مصادقة لجنة الكنترول</p><div className="flex justify-between"><span>الاسم: .................</span><span>التوقيع: ........</span></div></div>
             <div className="space-y-10"><p className="font-black underline">اعتماد مدير المدرسة</p><div className="flex justify-between"><span>الاسم: .................</span><span>التوقيع: ........</span></div></div>
          </div>
        </div>
      </div>
    );
  };

  const renderComprehensiveRegister = (list: Absence[], title: string) => {
    return (
      <div className="bg-white p-4 font-['Tajawal'] text-slate-900 border-[1.5px] border-slate-900 m-0 print-form-container">
        <OfficialHeader />
        
        <h2 className="text-center text-[12px] font-black mb-6 underline">سجل {title} الشامل لكافة اللجان</h2>
        <table className="w-full text-center border-[1.5px] border-slate-900 border-collapse text-[9px]">
          <thead className="bg-slate-100 font-black">
            <tr>
              <th className="border border-slate-900 p-1.5">م</th>
              <th className="border border-slate-900 p-1.5">التاريخ</th>
              <th className="border border-slate-900 p-1.5">اسم الطالب</th>
              <th className="border border-slate-900 p-1.5">الصف</th>
              <th className="border border-slate-900 p-1.5">اللجنة</th>
              <th className="border border-slate-900 p-1.5">ملاحظات الإدارة</th>
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
                  <td className="border border-slate-900 p-1 w-24"></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="grid grid-cols-2 mt-10 px-10 text-[10px] font-black text-center">
           <div className="space-y-10"><p>رئيس الكنترول</p><p>.....................</p></div>
           <div className="space-y-10"><p>مدير المدرسة</p><p>.....................</p></div>
        </div>
      </div>
    );
  };

  const handlePrint = (type: any, id?: string) => {
    setSelectedForm({ type, absenceId: id });
    setIsPrinting(true);
    // تأخير بسيط لضمان اكتمال الرندر قبل فتح نافذة الطباعة
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 800);
  };

  return (
    <div className="space-y-8 animate-fade-in text-right pb-20 no-print">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-4 border-blue-600 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">مركز استخراج النماذج والسجلات</h2>
          <p className="text-slate-400 font-bold mt-1 italic">إصدار المحاضر والسجلات التراكمية</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group border-b-8 border-red-600">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full"></div>
            <div className="relative z-10 flex items-center justify-between">
               <div className="space-y-2">
                  <h3 className="text-xl font-black flex items-center gap-3"><History className="text-red-400" /> السجل العام للغياب</h3>
                  <p className="text-[10px] text-slate-400 font-bold italic">كشف تراكمي شامل لكافة حالات الغياب في النظام</p>
               </div>
               <div className="text-center">
                  <p className="text-3xl font-black text-red-500">{allAbsences.length}</p>
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">حالة</p>
               </div>
            </div>
            <button onClick={() => handlePrint('ABSENCE_REGISTER_ALL')} className="mt-8 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3">
               <Printer size={18}/> طباعة السجل التراكمي للغياب
            </button>
         </div>

         <div className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group border-b-8 border-amber-600">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>
            <div className="relative z-10 flex items-center justify-between">
               <div className="space-y-2">
                  <h3 className="text-xl font-black flex items-center gap-3"><Clock className="text-amber-400" /> السجل العام للتأخر</h3>
                  <p className="text-[10px] text-slate-400 font-bold italic">كشف تراكمي شامل لكافة حالات التأخير في النظام</p>
               </div>
               <div className="text-center">
                  <p className="text-3xl font-black text-amber-500">{allDelays.length}</p>
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">حالة</p>
               </div>
            </div>
            <button onClick={() => handlePrint('DELAY_REGISTER_ALL')} className="mt-8 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-3">
               <Printer size={18}/> طباعة السجل التراكمي للتأخير
            </button>
         </div>
      </div>

      <div className="flex items-center gap-4 border-b pb-4 mt-12">
         <ListChecks size={24} className="text-blue-600" />
         <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">محاضر اللجان الفردية لليوم المختار</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dailyAbsences.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
             <p className="text-xl font-black text-slate-300 italic">لا توجد بلاغات مسجلة لهذا التاريخ</p>
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

      {/* منطقة الطباعة المحسنة - تظهر فقط عند الطباعة وبدون فراغات */}
      {isPrinting && (
        <div className="print-visible-block print:block hidden">
           {selectedForm?.type === 'ABSENCE_REGISTER_ALL' && renderComprehensiveRegister(allAbsences, 'الغياب العام')}
           {selectedForm?.type === 'DELAY_REGISTER_ALL' && renderComprehensiveRegister(allDelays, 'التأخير العام')}
           
           {selectedForm?.type === 'PRINT_ALL_DAILY_FORMS' && dailyAbsences.map(a => 
              renderSingleForm(a, a.type === 'ABSENT' ? 'ABSENT' : 'LATE')
           )}

           {selectedForm?.type === 'ABSENCE' && dailyAbsences.find(a => a.id === selectedForm.absenceId) && renderSingleForm(dailyAbsences.find(a => a.id === selectedForm.absenceId)!, 'ABSENT')}
           {selectedForm?.type === 'DELAY' && dailyAbsences.find(a => a.id === selectedForm.absenceId) && renderSingleForm(dailyAbsences.find(a => a.id === selectedForm.absenceId)!, 'LATE')}
        </div>
      )}

      <style>{`
        @media print {
          @page { margin: 0.5cm; size: A4 portrait; }
          body { background: white !important; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-visible-block { display: block !important; visibility: visible !important; }
          .print-form-container { width: 100% !important; box-shadow: none !important; border: none !important; margin-bottom: 0 !important; }
          .page-break-after-always { page-break-after: always; }
        }
      `}</style>
    </div>
  );
};

export default AdminOfficialForms;
