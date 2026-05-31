import React, { useMemo } from 'react';
import { Package, Calendar, Tag, AlertCircle, Clock, Users, Database } from 'lucide-react';
import { ArchiveBox, Student, Supervision, DeliveryLog, User, ExamSchedule } from '../../types';

interface Props {
  boxId: string;
  students: Student[];
  supervisions?: Supervision[];
  deliveryLogs?: DeliveryLog[];
  users?: User[];
  examSchedule?: ExamSchedule[];
  systemConfig?: any;
}

export const PublicBoxReport: React.FC<Props> = ({ 
  boxId, students, supervisions = [], deliveryLogs = [], users = [], systemConfig 
}) => {
  const box: ArchiveBox | undefined = useMemo(() => {
    try {
      const stored = localStorage.getItem('control_archive_boxes');
      if (stored) {
        const boxes: ArchiveBox[] = JSON.parse(stored);
        return boxes.find(b => b.id === boxId);
      }
    } catch (e) {}
    return undefined;
  }, [boxId]);

  if (!box) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-['Tajawal']" dir="rtl">
        <div className="text-center space-y-4">
          <AlertCircle size={64} className="mx-auto text-slate-400" />
          <h2 className="text-2xl font-black text-slate-700">الصندوق غير موجود</h2>
          <p className="text-slate-500 font-bold">تأكد من مسح الرمز بشكل صحيح أو أن الصندوق لم يتم حذفه.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-['Tajawal'] p-4 md:p-8 text-right" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        
        {/* رأس التقرير */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-[40px]"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[40px]"></div>
          
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] relative z-10">
            <Package size={48} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 relative z-10">التقرير العام للصندوق</h1>
          <p className="text-slate-500 font-bold text-lg">الصندوق رقم <span className="text-indigo-600 font-black">{box.box_number}</span></p>
        </div>

        {/* معلومات الصندوق الأساسية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Calendar size={24} /></div>
            <div>
              <span className="block text-sm font-bold text-slate-400">تاريخ الاختبار</span>
              <span className="block font-black text-lg text-slate-800">{new Date(box.exam_date).toLocaleDateString('ar-SA')}</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Tag size={24} /></div>
            <div>
              <span className="block text-sm font-bold text-slate-400">المادة</span>
              <span className="block font-black text-lg text-slate-800">{box.subject}</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Database size={24} /></div>
            <div>
              <span className="block text-sm font-bold text-slate-400">الصف</span>
              <span className="block font-black text-lg text-slate-800">{box.grade}</span>
            </div>
          </div>
        </div>

        {/* تفاصيل اللجان المشمولة */}
        {box.committees.map(committeeNum => {
          // جلب بيانات اللجنة
          const committeeSupervisions = supervisions.filter(s => s.committee === committeeNum && s.date === box.exam_date);
          const proctorNames = committeeSupervisions.map(s => {
             const user = users.find(u => u.national_id === s.proctor_id);
             return user ? user.full_name : s.proctor_id;
          });

          const log = deliveryLogs.find(l => l.committee === committeeNum && l.date === box.exam_date);
          const committeeStudents = students.filter(s => s.grade === box.grade && s.committee_number === committeeNum)
                                             .sort((a,b) => a.name.localeCompare(b.name, 'ar'));

          return (
            <div key={committeeNum} className="bg-white rounded-[2.5rem] shadow-lg border border-slate-100 overflow-hidden">
              <div className="bg-slate-900 p-6 flex items-center justify-between">
                <h3 className="text-2xl font-black text-white">لجنة {committeeNum}</h3>
                <div className="flex gap-4">
                  {log && (
                     <div className="text-sm font-bold text-slate-300 flex items-center gap-3">
                       <span className="flex items-center gap-1"><Clock size={16} className="text-emerald-400"/> الدخول: {new Date(log.received_time).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}</span>
                       {log.delivered_time && (
                         <span className="flex items-center gap-1"><Clock size={16} className="text-rose-400"/> الانتهاء: {new Date(log.delivered_time).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}</span>
                       )}
                     </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
                 <div className="p-3 bg-white shadow-sm rounded-xl text-slate-600"><Users size={24} /></div>
                 <div>
                    <span className="block text-[11px] font-black text-slate-400 mb-1">الملاحظون</span>
                    <div className="flex gap-2 flex-wrap">
                      {proctorNames.length > 0 ? proctorNames.map((n, i) => (
                        <span key={i} className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-sm font-bold shadow-sm">{n}</span>
                      )) : <span className="text-slate-400 text-sm font-bold">غير محدد</span>}
                    </div>
                 </div>
              </div>

              <div className="p-6">
                 <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">أسماء الطلاب ({committeeStudents.length})</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                   {committeeStudents.map((st, idx) => (
                     <div key={st.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-3">
                       <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">{idx + 1}</span>
                       <div>
                         <span className="block text-sm font-bold text-slate-800">{st.name}</span>
                         <span className="block text-[10px] font-bold text-slate-400">المقعد: {st.seating_number || '-'}</span>
                       </div>
                     </div>
                   ))}
                   {committeeStudents.length === 0 && (
                     <p className="text-slate-400 text-sm font-bold py-4 col-span-full text-center">لا يوجد طلاب لهذه اللجنة في هذا الصف.</p>
                   )}
                 </div>
              </div>
            </div>
          );
        })}
        
      </div>
    </div>
  );
};
