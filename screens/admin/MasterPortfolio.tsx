import React, { useMemo } from 'react';
import { BookOpen, Printer, Download, FileText, CheckCircle2, Award } from 'lucide-react';
import { Student, User, Supervision, SystemConfig, Absence, CommitteeReport } from '../../types';
import { APP_CONFIG } from '../../constants';

interface Props {
  students: Student[];
  users: User[];
  supervisions: Supervision[];
  systemConfig: SystemConfig;
  absences: Absence[];
  committeeReports: CommitteeReport[];
}

export const MasterPortfolio: React.FC<Props> = ({ students, users, supervisions, systemConfig, absences, committeeReports }) => {

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
            .portfolio-page { height: 297mm; width: 210mm; margin: 0 auto; padding: 20mm; page-break-after: always; box-sizing: border-box; background: white; position: relative; }
            .portfolio-page:last-child { page-break-after: avoid; }
            .cover-page { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100%; border: 10px double #cbd5e1; padding: 40px; border-radius: 20px; }
            .logo-large { width: 180px; margin-bottom: 40px; }
            .cover-title { font-size: 48px; font-weight: 900; color: #0f172a; margin-bottom: 20px; }
            .cover-subtitle { font-size: 24px; font-weight: bold; color: #475569; margin-bottom: 60px; }
            .cover-details { font-size: 20px; font-weight: bold; color: #1e293b; line-height: 2; border-top: 2px solid #e2e8f0; padding-top: 40px; width: 80%; }
            
            .content-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f172a; padding-bottom: 15px; margin-bottom: 30px; }
            .content-header img { height: 60px; }
            .content-title { font-size: 24px; font-weight: 900; text-align: center; }
            .content-info { font-size: 14px; font-weight: bold; text-align: left; }
            
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-box { border: 2px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: center; }
            .stat-value { font-size: 36px; font-weight: 900; color: #0f172a; }
            .stat-label { font-size: 16px; font-weight: bold; color: #64748b; }
            
            .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 12px; text-align: center; font-size: 14px; }
            .data-table th { background: #f1f5f9; font-weight: 900; }
            
            .footer { position: absolute; bottom: 20mm; left: 20mm; right: 20mm; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
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
            <li>2. الإحصائيات العامة (هذه الصفحة)</li>
            <li>3. كشف حالات الغياب الكلي</li>
            <li>4. بيان التقارير الميدانية للملاحظين</li>
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
