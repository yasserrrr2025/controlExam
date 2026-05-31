import React, { useMemo } from 'react';
import { BookOpen, Printer, Download, FileText } from 'lucide-react';
import { Student, User, Supervision, SystemConfig, Absence, CommitteeReport, ExamSchedule, DeliveryLog, ControlRequest } from '../../types';
import { APP_CONFIG } from '../../constants';

interface Props {
  students: Student[];
  users: User[];
  supervisions: Supervision[];
  systemConfig: SystemConfig;
  absences: Absence[];
  committeeReports: CommitteeReport[];
  examSchedule?: ExamSchedule[];
  deliveryLogs?: DeliveryLog[];
  controlRequests?: ControlRequest[];
}

export const MasterPortfolio: React.FC<Props> = ({ 
  students, users, supervisions, systemConfig, absences, committeeReports, 
  examSchedule = [], deliveryLogs = [], controlRequests = [] 
}) => {

  const safeTime = (isoStr?: string) => {
    if (!isoStr) return '---';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '---';
      return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    } catch { return '---'; }
  };

  const matchesDate = (isoStr: string | undefined | null, date: string): boolean => {
    if (!isoStr || !date) return false;
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return String(isoStr).startsWith(date);
      return d.toISOString().startsWith(date);
    } catch { return String(isoStr).startsWith(date); }
  };

  const handlePrint = () => {
    window.print();
  };

  const committeesList = useMemo(() => {
    return Array.from(new Set(students.map(s => s.committee_number).filter(Boolean))).sort((a, b) => Number(a) - Number(b));
  }, [students]);

  const activeProctors = useMemo(() => {
    return Array.from(new Set(supervisions.map(s => s.teacher_id)));
  }, [supervisions]);

  const printDate = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8 animate-fade-in text-right">
      <div className="bg-slate-950 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white flex flex-col md:flex-row items-center justify-between gap-6 border-b-8 border-amber-500 no-print">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 blur-[100px] rounded-full"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="bg-amber-500 p-5 rounded-3xl shadow-xl text-slate-950"><BookOpen size={40} /></div>
          <div>
            <h2 className="text-4xl font-black tracking-tighter">ملف إنجاز الاختبارات الشامل</h2>
            <p className="text-amber-200 font-bold mt-1">تصدير كتاب PDF متكامل يحتوي على جميع بيانات وإحصائيات الاختبارات الميدانية</p>
          </div>
        </div>
        <button onClick={handlePrint} className="bg-white text-slate-950 px-8 py-4 rounded-[2rem] font-black flex items-center gap-3 hover:bg-amber-50 transition-all shadow-xl active:scale-95 relative z-10">
          <Printer size={24}/> طباعة / تصدير PDF
        </button>
      </div>

      <div className="print-only-container">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            .print-only-container, .print-only-container * { visibility: visible; }
            .print-only-container { position: absolute; left: 0; top: 0; width: 100%; }
            .portfolio-page { height: 297mm; width: 210mm; margin: 0 auto; padding: 15mm; page-break-after: always; box-sizing: border-box; background: white; position: relative; }
            .portfolio-page:last-child { page-break-after: avoid; }
            .cover-page { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100%; border: 10px double #cbd5e1; padding: 40px; border-radius: 20px; }
            .logo-large { width: 180px; margin-bottom: 40px; }
            .cover-title { font-size: 48px; font-weight: 900; color: #0f172a; margin-bottom: 20px; }
            .cover-subtitle { font-size: 24px; font-weight: bold; color: #475569; margin-bottom: 60px; }
            .cover-details { font-size: 20px; font-weight: bold; color: #1e293b; line-height: 2; border-top: 2px solid #e2e8f0; padding-top: 40px; width: 80%; }
            
            .content-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
            .content-title { font-size: 24px; font-weight: 900; text-align: center; }
            .content-info { font-size: 14px; font-weight: bold; text-align: left; }
            
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-box { border: 2px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: center; }
            .stat-value { font-size: 36px; font-weight: 900; color: #0f172a; }
            .stat-label { font-size: 16px; font-weight: bold; color: #64748b; }
            
            .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 13px; font-weight: bold; }
            .data-table th { background: #f1f5f9; font-weight: 900; color: #0f172a; }
            
            .footer { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            
            .student-table-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          }
          @media screen {
            .print-only-container { display: none; }
          }
        `}} />

        {/* الغلاف */}
        <div className="portfolio-page cover-page">
           <img src={APP_CONFIG.LOGO_URL} alt="الشعار" className="logo-large" />
           <h1 className="cover-title">ملف إنجاز أعمال الاختبارات</h1>
           <h2 className="cover-subtitle">نظام الكنترول الرقمي الموحد</h2>
           <div className="cover-details">
              <p>المملكة العربية السعودية</p>
              <p>وزارة التعليم</p>
              <p>إدارة التعليم بمحافظة جدة</p>
              <p>مدرسة عماد الدين زنكي المتوسطة</p>
              <p style={{marginTop: '40px', fontSize: '24px', color: '#0f172a'}}>العام الدراسي: {systemConfig.academic_year || '1446 / 1447'}</p>
           </div>
        </div>

        {/* الفهرس وإحصائيات عامة */}
        <div className="portfolio-page">
          <div className="content-header">
            <div style={{textAlign: 'right', fontWeight: 'bold'}}>المملكة العربية السعودية<br/>وزارة التعليم</div>
            <div className="content-title">إحصائيات الكنترول العامة</div>
            <div className="content-info">تاريخ الطباعة:<br/>{printDate}</div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-box">
               <div className="stat-value">{students.length}</div>
               <div className="stat-label">إجمالي الطلاب</div>
            </div>
            <div className="stat-box">
               <div className="stat-value">{committeesList.length}</div>
               <div className="stat-label">إجمالي اللجان الميدانية</div>
            </div>
            <div className="stat-box">
               <div className="stat-value">{users.length}</div>
               <div className="stat-label">أعضاء الكادر التعليمي</div>
            </div>
            <div className="stat-box">
               <div className="stat-value">{activeProctors.length}</div>
               <div className="stat-label">المراقبين المكلفين</div>
            </div>
            <div className="stat-box">
               <div className="stat-value">{absences.length}</div>
               <div className="stat-label">إجمالي حالات الغياب المسجلة</div>
            </div>
            <div className="stat-box">
               <div className="stat-value">{committeeReports.length}</div>
               <div className="stat-label">التقارير الميدانية المرفوعة</div>
            </div>
          </div>

          <h3 style={{fontSize: '20px', fontWeight: '900', marginTop: '40px', marginBottom: '20px'}}>محتويات الملف:</h3>
          <ul style={{listStyle: 'none', padding: 0, margin: 0, fontSize: '18px', lineHeight: 2, fontWeight: 'bold'}}>
            <li>1. الغلاف الرسمي</li>
            <li>2. الإحصائيات العامة</li>
            <li>3. كشف حالات الغياب الكلي</li>
            <li>4. سجل التقارير الميدانية للملاحظين</li>
            <li>5. تقارير المواد (المراقبون، التسليم، وكشوف الطلاب لكل مادة)</li>
          </ul>
          
          <div className="footer">تم إنشاء هذا الملف آلياً عبر نظام الكنترول الرقمي - مدرسة عماد الدين زنكي</div>
        </div>

        {/* كشف الغياب */}
        <div className="portfolio-page">
          <div className="content-header">
            <div style={{textAlign: 'right', fontWeight: 'bold'}}>المملكة العربية السعودية<br/>وزارة التعليم</div>
            <div className="content-title">كشف حالات الغياب الكلي</div>
            <div className="content-info">تاريخ الطباعة:<br/>{printDate}</div>
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>م</th>
                <th>اسم الطالب</th>
                <th>اللجنة</th>
                <th>المادة</th>
                <th>تاريخ الغياب</th>
                <th>نوع الحالة</th>
              </tr>
            </thead>
            <tbody>
              {absences.map((abs, idx) => (
                <tr key={abs.id}>
                  <td>{idx + 1}</td>
                  <td>{abs.student_name}</td>
                  <td>{abs.committee_number}</td>
                  <td>{abs.subject}</td>
                  <td>{abs.date}</td>
                  <td>{abs.type === 'ABSENT' ? 'غياب' : 'تأخر'}</td>
                </tr>
              ))}
              {absences.length === 0 && (
                <tr><td colSpan={6}>لا توجد حالات غياب مسجلة.</td></tr>
              )}
            </tbody>
          </table>
          <div className="footer">تم إنشاء هذا الملف آلياً عبر نظام الكنترول الرقمي - مدرسة عماد الدين زنكي</div>
        </div>
        
        {/* التقارير الميدانية */}
        <div className="portfolio-page">
          <div className="content-header">
            <div style={{textAlign: 'right', fontWeight: 'bold'}}>المملكة العربية السعودية<br/>وزارة التعليم</div>
            <div className="content-title">سجل التقارير الميدانية للملاحظين</div>
            <div className="content-info">تاريخ الطباعة:<br/>{printDate}</div>
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>م</th>
                <th>اللجنة</th>
                <th>تاريخ التقرير</th>
                <th>اسم الملاحظ</th>
                <th>الملاحظات / المخالفات</th>
                <th>الإجراء المتخذ</th>
              </tr>
            </thead>
            <tbody>
              {committeeReports.map((rep, idx) => (
                <tr key={rep.id}>
                  <td>{idx + 1}</td>
                  <td>{rep.committee_number}</td>
                  <td>{new Date(rep.date).toLocaleDateString('ar-SA')}</td>
                  <td>{rep.proctor_name}</td>
                  <td>{rep.observations} <br/> {rep.issues}</td>
                  <td>{rep.resolutions}</td>
                </tr>
              ))}
              {committeeReports.length === 0 && (
                <tr><td colSpan={6}>لا توجد تقارير ميدانية مسجلة.</td></tr>
              )}
            </tbody>
          </table>
          
          <div style={{marginTop: '50px', display: 'flex', justifyContent: 'space-around', fontWeight: 'bold'}}>
             <div style={{textAlign: 'center'}}>مدير المدرسة<br/><br/>______________________</div>
             <div style={{textAlign: 'center'}}>رئيس لجان الكنترول<br/><br/>______________________</div>
          </div>
          
          <div className="footer">تم إنشاء هذا الملف آلياً عبر نظام الكنترول الرقمي - مدرسة عماد الدين زنكي</div>
        </div>

        {/* تقارير المواد وكشوف الطلاب */}
        {examSchedule.map((exam, examIdx) => {
           const examGrades = exam.grades || [];
           const schedCommittees = exam.committees || [];
           const examStudents = students.filter(s => examGrades.includes(s.grade) && s.committee_number);
           const studCommittees = examStudents.map(s => String(s.committee_number));
           const supvCommittees = supervisions.filter(s => s.date === exam.exam_date && s.period === exam.period).map(s => String(s.committee_number));
           const examCommittees = Array.from(new Set([...schedCommittees, ...studCommittees, ...supvCommittees])).filter(Boolean).sort((a,b)=>Number(a)-Number(b));

           return (
             <React.Fragment key={exam.id}>
               {/* تقرير المادة العام (التقرير اليومي للمادة) */}
               <div className="portfolio-page">
                 <div className="content-header">
                   <div style={{textAlign: 'right', fontWeight: 'bold'}}>المملكة العربية السعودية<br/>وزارة التعليم</div>
                   <div className="content-title">التقرير الشامل للجان المادة</div>
                   <div className="content-info">المادة: {exam.subject}<br/>التاريخ: {new Date(exam.exam_date).toLocaleDateString('ar-SA')}</div>
                 </div>
                 
                 <div style={{marginBottom: '15px', fontWeight: 'bold', fontSize: '16px'}}>
                    الصف / الصفوف: {examGrades.join(' ، ')} | الفترة: {exam.period}
                 </div>

                 <table className="data-table">
                   <thead>
                     <tr>
                       <th>اللجنة</th>
                       <th>اسم المراقب</th>
                       <th>تسجيل الدخول</th>
                       <th>وقت الاغلاق</th>
                       <th>وقت التسليم</th>
                       <th>البلاغات</th>
                       <th>الغياب</th>
                       <th>التأخير</th>
                     </tr>
                   </thead>
                   <tbody>
                     {examCommittees.map(cNum => {
                        const supvs = supervisions.filter(s => s.committee === cNum && s.date === exam.exam_date && s.period === exam.period);
                        const proctors = supvs.map(s => {
                           const u = users.find(u => u.national_id === s.proctor_id);
                           return u ? u.full_name : s.proctor_id;
                        });
                        
                        const closeLog = deliveryLogs.find(l => String(l?.committee_number) === String(cNum) && matchesDate(l?.time, exam.exam_date) && l?.type === 'RECEIVE');
                        const receiptLog = deliveryLogs.find(l => String(l?.committee_number) === String(cNum) && matchesDate(l?.time, exam.exam_date) && l?.status === 'CONFIRMED');
                        const comAbsences = absences.filter(a => a.committee_number === cNum && a.date === exam.exam_date && a.type === 'ABSENT');
                        const comLates = absences.filter(a => a.committee_number === cNum && a.date === exam.exam_date && a.type === 'LATE');
                        const comRequests = controlRequests.filter(r => r.committee === cNum && matchesDate(r.time, exam.exam_date));

                        return (
                          <tr key={cNum}>
                            <td>{cNum}</td>
                            <td>{proctors.length ? proctors.join(' - ') : 'غير محدد'}</td>
                            <td style={{fontFamily: 'monospace'}}>{safeTime(supvs[0]?.date)}</td>
                            <td style={{fontFamily: 'monospace'}}>{safeTime(closeLog?.time)}</td>
                            <td style={{fontFamily: 'monospace'}}>{safeTime(receiptLog?.time)}</td>
                            <td>{comRequests.length}</td>
                            <td>{comAbsences.length}</td>
                            <td>{comLates.length}</td>
                          </tr>
                        );
                     })}
                     {examCommittees.length === 0 && (
                       <tr><td colSpan={5}>لا توجد لجان مسجلة لهذه المادة.</td></tr>
                     )}
                   </tbody>
                 </table>

                 <div style={{marginTop: '50px', display: 'flex', justifyContent: 'space-around', fontWeight: 'bold'}}>
                    <div style={{textAlign: 'center'}}>مستلم المظاريف<br/><br/>______________________</div>
                    <div style={{textAlign: 'center'}}>رئيس لجان الكنترول<br/><br/>______________________</div>
                 </div>
                 <div className="footer">تم إنشاء هذا الملف آلياً عبر نظام الكنترول الرقمي - مدرسة عماد الدين زنكي</div>
               </div>

               {/* كشوف الطلاب لكل لجنة داخل هذه المادة */}
               {examCommittees.map(cNum => {
                 const comStudents = examStudents.filter(s => s.committee_number === cNum).sort((a,b)=> a.name.localeCompare(b.name, 'ar'));
                 
                 // Split into two columns for the page layout
                 const half = Math.ceil(comStudents.length / 2);
                 const col1 = comStudents.slice(0, half);
                 const col2 = comStudents.slice(half);

                 return (
                   <div className="portfolio-page" key={`${exam.id}-students-${cNum}`}>
                     <div className="content-header">
                       <div style={{textAlign: 'right', fontWeight: 'bold'}}>المملكة العربية السعودية<br/>وزارة التعليم</div>
                       <div className="content-title">كشف مناداة ومطابقة الطلاب</div>
                       <div className="content-info">لجنة: {cNum}<br/>المادة: {exam.subject}</div>
                     </div>
                     
                     <div className="student-table-container">
                       <table className="data-table" style={{marginTop: 0}}>
                         <thead>
                           <tr>
                             <th style={{width: '40px'}}>م</th>
                             <th>اسم الطالب</th>
                             <th style={{width: '60px'}}>المقعد</th>
                           </tr>
                         </thead>
                         <tbody>
                           {col1.map((st, i) => (
                             <tr key={st.id}>
                               <td>{i + 1}</td>
                               <td>{st.name}</td>
                               <td>{st.seating_number || '-'}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>

                       {col2.length > 0 ? (
                         <table className="data-table" style={{marginTop: 0}}>
                           <thead>
                             <tr>
                               <th style={{width: '40px'}}>م</th>
                               <th>اسم الطالب</th>
                               <th style={{width: '60px'}}>المقعد</th>
                             </tr>
                           </thead>
                           <tbody>
                             {col2.map((st, i) => (
                               <tr key={st.id}>
                                 <td>{i + 1 + half}</td>
                                 <td>{st.name}</td>
                                 <td>{st.seating_number || '-'}</td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       ) : <div></div>}
                     </div>

                     <div className="footer">تم إنشاء هذا الملف آلياً عبر نظام الكنترول الرقمي - مدرسة عماد الدين زنكي</div>
                   </div>
                 );
               })}
             </React.Fragment>
           );
        })}

      </div>
      
      {/* عرض المعاينة في الشاشة */}
      <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 flex flex-col items-center justify-center py-20">
         <FileText size={80} className="text-slate-200 mb-6" />
         <h3 className="text-2xl font-black text-slate-800 mb-2">الملف جاهز للطباعة والتصدير</h3>
         <p className="text-slate-500 font-bold mb-8 max-w-md text-center leading-relaxed">
           اضغط على زر (طباعة / تصدير PDF) في الأعلى، وقم باختيار "حفظ كـ PDF" من خيارات الطباعة في متصفحك للحصول على نسختك الرقمية المعتمدة!
         </p>
         <button onClick={handlePrint} className="bg-slate-950 text-white px-8 py-4 rounded-[2rem] font-black flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-95">
           <Download size={20}/> تحميل نسخة PDF
         </button>
      </div>
    </div>
  );
};
