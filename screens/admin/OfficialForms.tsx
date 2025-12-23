
import React, { useState, useMemo } from 'react';
import { Absence, Student } from '../../types';
import { Printer, FileText, Clock, UserX, ArrowRightLeft, Calendar } from 'lucide-react';
import OfficialHeader from '../../components/OfficialHeader';

interface Props {
  absences: Absence[];
  students: Student[];
}

const AdminOfficialForms: React.FC<Props> = ({ absences, students }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedForm, setSelectedForm] = useState<{ type: 'ABSENCE' | 'DELAY', absenceId: string } | null>(null);
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  // تصفية البلاغات حسب التاريخ المختار
  const filteredAbsences = useMemo(() => {
    return absences.filter(a => a.date.startsWith(selectedDate));
  }, [absences, selectedDate]);

  const getDayName = (dateStr: string) => {
    return new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date(dateStr));
  };

  const renderSingleForm = (absence: Absence, type: 'ABSENCE' | 'DELAY') => {
    const student = students.find(s => s.national_id === absence.student_id);
    
    if (type === 'ABSENCE') {
      return (
        <div key={absence.id} className="bg-white p-8 font-['Tajawal'] text-slate-900 leading-relaxed border-[3px] border-slate-900 m-4 page-break-after-always">
          <OfficialHeader />
          <h1 className="text-3xl font-black text-center my-6 border-b-4 border-double border-slate-900 pb-4">محضر غياب طالب عن الاختبار</h1>
          
          <div className="grid grid-cols-2 gap-0 border-2 border-slate-900 mb-6 text-lg">
            <div className="border-l-2 border-slate-900 p-3 font-black bg-slate-50">اسم الطالب</div>
            <div className="p-3 font-bold">{absence.student_name}</div>
            
            <div className="border-t-2 border-l-2 border-slate-900 p-3 font-black bg-slate-50">رقم الجلوس</div>
            <div className="border-t-2 border-slate-900 p-3 font-bold">{student?.seating_number || '....................'}</div>
            
            <div className="border-t-2 border-l-2 border-slate-900 p-3 font-black bg-slate-50">اليوم</div>
            <div className="border-t-2 border-slate-900 p-3 font-bold">{getDayName(absence.date)}</div>
            
            <div className="border-t-2 border-l-2 border-slate-900 p-3 font-black bg-slate-50">التاريخ</div>
            <div className="border-t-2 border-slate-900 p-3 font-bold">{new Date(absence.date).toLocaleDateString('ar-SA')}</div>
            
            <div className="border-t-2 border-l-2 border-slate-900 p-3 font-black bg-slate-50">الفترة</div>
            <div className="border-t-2 border-slate-900 p-3 font-bold">{absence.period}</div>
            
            <div className="border-t-2 border-l-2 border-slate-900 p-3 font-black bg-slate-50">رقم اللجنة</div>
            <div className="border-t-2 border-slate-900 p-3 font-bold">{absence.committee_number}</div>
            
            <div className="border-t-2 border-l-2 border-slate-900 p-3 font-black bg-slate-50">المادة</div>
            <div className="border-t-2 border-slate-900 p-3 font-bold">................................</div>
            
            <div className="border-t-2 border-l-2 border-slate-900 p-3 font-black bg-slate-50">الصف</div>
            <div className="border-t-2 border-slate-900 p-3 font-bold">{student?.grade || '....................'}</div>
          </div>

          <div className="bg-slate-100 p-3 text-center font-black border-2 border-slate-900 border-b-0">مصادقة لجنة الإشراف والملاحظة</div>
          <table className="w-full border-2 border-slate-900 text-center mb-10 text-lg">
            <thead>
              <tr className="bg-slate-50">
                <th className="border-2 border-slate-900 p-3 font-black">م</th>
                <th className="border-2 border-slate-900 p-3 font-black">الاسم</th>
                <th className="border-2 border-slate-900 p-3 font-black">الصفة</th>
                <th className="border-2 border-slate-900 p-3 font-black">التوقيع</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border-2 border-slate-900 p-4">1</td><td className="border-2 border-slate-900 p-4"></td><td className="border-2 border-slate-900 p-4 font-bold">رئيس اللجنة</td><td className="border-2 border-slate-900 p-4"></td></tr>
              <tr><td className="border-2 border-slate-900 p-4">2</td><td className="border-2 border-slate-900 p-4"></td><td className="border-2 border-slate-900 p-4 font-bold">عضو</td><td className="border-2 border-slate-900 p-4"></td></tr>
              <tr><td className="border-2 border-slate-900 p-4">3</td><td className="border-2 border-slate-900 p-4"></td><td className="border-2 border-slate-900 p-4 font-bold">ملاحظ اللجنة</td><td className="border-2 border-slate-900 p-4"></td></tr>
            </tbody>
          </table>

          <div className="flex justify-between items-end mt-24 px-10">
            <div className="text-center"><p className="text-xl font-black mb-16">مدير المدرسة</p><p className="font-bold">التوقيع: ..........................</p></div>
            <div className="text-right text-sm font-bold border-r-4 border-slate-900 pr-4">
              <p className="mb-2 underline">ملاحظات هامة:</p>
              <p>• يوضع محضر الغياب حسب رقم جلوس الطالب في تسلسل أوراق الإجابة.</p>
              <p>• يسجل في بيان الغائبين الرسمي.</p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div key={absence.id} className="bg-white p-6 font-['Tajawal'] text-slate-900 leading-tight border-[3px] border-slate-900 m-2 text-sm page-break-after-always">
          <OfficialHeader />
          <h1 className="text-xl font-black text-center mb-4 border-b-2 border-slate-900 pb-1">محضر تأخر طالب عن الاختبار أكثر من خمس عشرة دقيقة وبما لا يتجاوز نصف الزمن</h1>
          
          <div className="grid grid-cols-4 gap-0 border-2 border-slate-900 mb-3">
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-black bg-slate-50">اسم الطالب</div>
            <div className="p-1.5 border-b-2 border-slate-900 col-span-3 font-bold">{absence.student_name}</div>
            
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-black bg-slate-50">رقم الهوية</div>
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-bold">{absence.student_id}</div>
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-black bg-slate-50">عدد مرات التأخير</div>
            <div className="p-1.5 border-b-2 border-slate-900 font-bold">....................</div>

            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-black bg-slate-50">الصف/ المستوى</div>
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-bold">{student?.grade || '................'}</div>
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-black bg-slate-50">المسار</div>
            <div className="p-1.5 border-b-2 border-slate-900 font-bold">....................</div>

            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-black bg-slate-50">اليوم</div>
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-bold">{getDayName(absence.date)}</div>
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-black bg-slate-50">التاريخ</div>
            <div className="p-1.5 border-b-2 border-slate-900 font-bold">{new Date(absence.date).toLocaleDateString('ar-SA')}</div>

            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-black bg-slate-50">المادة</div>
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-bold">....................</div>
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-black bg-slate-50">الفترة</div>
            <div className="p-1.5 border-b-2 border-slate-900 font-bold">{absence.period}</div>

            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-black bg-slate-50">وقت بدء الاختبار</div>
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-bold">....................</div>
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-black bg-slate-50">وقت حضور الطالب</div>
            <div className="p-1.5 border-b-2 border-slate-900 font-bold">....................</div>

            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-black bg-slate-50">مقدار التأخر</div>
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-bold">....................</div>
            <div className="p-1.5 border-l-2 border-b-2 border-slate-900 font-black bg-slate-50">توقيع الطالب</div>
            <div className="p-1.5 border-b-2 border-slate-900 font-bold">....................</div>

            <div className="p-1.5 border-l-2 border-slate-900 font-black bg-slate-50">اسم الملاحظ</div>
            <div className="p-1.5 border-l-2 border-slate-900 font-bold">....................</div>
            <div className="p-1.5 border-l-2 border-slate-900 font-black bg-slate-50">توقيع الملاحظ</div>
            <div className="p-1.5 font-bold">....................</div>
          </div>

          <div className="grid grid-cols-2 border-2 border-slate-900 mb-3">
            <div className="p-1.5 border-l-2 border-slate-900 font-black bg-slate-50 text-center">رئيس لجنة الإشراف والملاحظة</div>
            <div className="p-0 flex flex-col">
              <div className="p-1.5 border-b-2 border-slate-900">الاسم: ...................................</div>
              <div className="p-1.5">التوقيع: .................................</div>
            </div>
          </div>

          <div className="border-2 border-slate-900 p-3 mb-3">
            <p className="font-black mb-1">★ أسباب التأخر/ تكرار التأخر حسب إفادة الطالب/ ولي أمره/ أوراق رسمية:</p>
            <div className="h-16 border-b border-dashed border-slate-400"></div>
            <div className="h-6 border-b border-dashed border-slate-400"></div>
            <p className="mt-2 text-[10px] text-red-600 font-bold">★ من المستحسن دراسة عذر الطالب ومنحه الموافقة بشكل عاجل قبل السماح له بدخول الاختبار إذا سمح الوقت.</p>
          </div>

          <div className="border-2 border-slate-900 p-3 mb-3">
            <p className="font-black mb-1 italic">بعد دراسة أسباب التأخر المقدمة من الطالب فقد تقرر ما يلي:</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2"><div className="w-4 h-4 border border-slate-900"></div> قبول عذر الطالب ويدخل الاختبار</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 border border-slate-900"></div> عدم قبول عذر الطالب ولا يدخل الاختبار</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 border border-slate-900"></div> يخصم على الطالب درجة من درجات السلوك</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 border border-slate-900"></div> إجراء آخر: ...................................</div>
            </div>
            <div className="flex justify-between mt-4 font-black text-xs">
              <span>رئيس لجنة التحكم والضبط: ......................</span>
              <span>الاسم: ............................</span>
              <span>التوقيع: ............................</span>
            </div>
          </div>

          <div className="bg-slate-50 border-2 border-slate-900 p-3 text-center">
             <p className="font-black mb-2 underline">اعتماد مدير المدرسة</p>
             <div className="flex justify-around items-center text-xs">
                <span>الاسم: ....................................</span>
                <span>التوقيع: ...................................</span>
                <span>التاريخ:    /    /</span>
             </div>
          </div>

          <div className="flex justify-between mt-4 px-6 font-bold text-xs">
             <span>توقيع الطالب بالعلم: ............................</span>
             <span>توقيع ولي الأمر بالعلم: ............................</span>
          </div>
        </div>
      );
    }
  };

  const handlePrintAll = () => {
    setIsPrintingAll(true);
    setTimeout(() => {
      window.print();
      setIsPrintingAll(false);
    }, 500);
  };

  if (selectedForm && !isPrintingAll) {
    const absence = absences.find(a => a.id === selectedForm.absenceId);
    if (!absence) return null;

    return (
      <div className="space-y-8 animate-fade-in text-right">
        <button onClick={() => setSelectedForm(null)} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-all no-print">
          <ArrowRightLeft size={20}/> العودة للقائمة
        </button>

        <div className="bg-white p-10 rounded-2xl shadow-xl no-print text-center border-2 border-blue-100">
           <h3 className="text-2xl font-black mb-6">معاينة النموذج الرسمي قبل الطباعة</h3>
           <div className="flex gap-4 justify-center">
              <button onClick={() => window.print()} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all flex items-center gap-3">
                <Printer size={24} /> طباعة هذا النموذج
              </button>
           </div>
        </div>

        <div className="print-only">
          {renderSingleForm(absence, selectedForm.type)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in text-right pb-20 no-print">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">النماذج الرسمية للمحاضر</h2>
          <p className="text-slate-400 font-bold mt-1 italic">اختر التاريخ لإصدار المحاضر المرتبطة به</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date" 
              className="pr-12 pl-4 py-3 bg-white border-2 border-slate-100 rounded-2xl font-bold shadow-sm outline-none focus:border-blue-600" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          
          <button 
            disabled={filteredAbsences.length === 0}
            onClick={handlePrintAll}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            <Printer size={20} /> طباعة جميع محاضر اليوم ({filteredAbsences.length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border">
        <table className="w-full text-right border-collapse">
          <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="p-8">اسم الطالب</th>
              <th className="p-8">اللجنة</th>
              <th className="p-8">نوع البلاغ</th>
              <th className="p-8">رقم الجلوس</th>
              <th className="p-8 text-center">إصدار النموذج</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold">
            {filteredAbsences.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center text-slate-300 italic">لا توجد بلاغات مرصودة للتاريخ المختار.</td></tr>
            ) : (
              filteredAbsences.map((a) => {
                const s = students.find(student => student.national_id === a.student_id);
                return (
                  <tr key={a.id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="p-8">
                       <p className="font-black text-slate-800 text-lg">{a.student_name}</p>
                       <p className="text-[10px] text-slate-400 font-mono italic">{s?.grade || 'بدون صف'}</p>
                    </td>
                    <td className="p-8 text-slate-500 font-black">لجنة {a.committee_number}</td>
                    <td className="p-8">
                       <span className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 w-fit ${a.type === 'ABSENT' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                         {a.type === 'ABSENT' ? <UserX size={14}/> : <Clock size={14}/>}
                         {a.type === 'ABSENT' ? 'غياب' : 'تأخير'}
                       </span>
                    </td>
                    <td className="p-8 font-mono text-blue-600">{s?.seating_number || <span className="text-slate-200 italic">فارغ</span>}</td>
                    <td className="p-8">
                       <div className="flex justify-center gap-3">
                         <button 
                           onClick={() => setSelectedForm({ type: a.type === 'ABSENT' ? 'ABSENCE' : 'DELAY', absenceId: a.id })} 
                           className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-black transition-all shadow-md active:scale-95"
                         >
                           <FileText size={16}/> عرض النموذج
                         </button>
                       </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
         <p className="text-slate-400 font-bold italic mb-2">ملاحظة: يمكنك طباعة جميع المحاضر دفعة واحدة باستخدام الزر العلوي.</p>
         <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Automatic Report Generation Engine v2.0</p>
      </div>

      {/* الطباعة بالجملة */}
      {isPrintingAll && (
        <div className="print-only">
          {filteredAbsences.map(a => renderSingleForm(a, a.type === 'ABSENT' ? 'ABSENCE' : 'DELAY'))}
        </div>
      )}
    </div>
  );
};

export default AdminOfficialForms;
