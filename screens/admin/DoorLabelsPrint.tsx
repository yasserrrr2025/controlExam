import React, { useMemo } from 'react';
import { Student } from '../../types';
import { APP_CONFIG } from '../../constants';

interface Props {
  students: Student[];
}

const DoorLabelsPrint: React.FC<Props> = ({ students }) => {
  const committees = useMemo(() => {
    const nums = Array.from(new Set(students.map(s => s.committee_number)))
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b));
    return nums.map(num => {
      const commStudents = students.filter(s => s.committee_number === num);
      const grades = Array.from(new Set(commStudents.map(s => s.grade))).join(' - ');
      return { num, grades, count: commStudents.length };
    });
  }, [students]);

  const siteUrl = window.location.origin;

  return (
    <div className="bg-slate-100 min-h-screen p-8 text-right font-['Tajawal']" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6 no-print">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex justify-between items-center border-b-4 border-blue-600">
          <div>
            <h2 className="text-2xl font-black text-slate-800">طباعة ملصقات أبواب اللجان (بالباركود)</h2>
            <p className="text-slate-500 mt-2 font-bold">كل ملصق سيطبع في صفحة مستقلة A4 للصقه على باب اللجنة.</p>
          </div>
          <button 
            onClick={() => window.print()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            طباعة الملصقات
          </button>
        </div>
      </div>

      <div className="print-only">
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body {
              background: white !important;
              margin: 0;
              padding: 0;
            }
            .no-print { display: none !important; }
            .door-label-page {
              width: 210mm;
              height: 297mm;
              page-break-after: always;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20mm;
              box-sizing: border-box;
              position: relative;
            }
            .door-label-page:last-child {
              page-break-after: auto;
            }
          }
        `}</style>

        {committees.map((committee, idx) => {
          const publicUrl = `${siteUrl}?public_committee=${committee.num}`;
          return (
            <div key={idx} className="door-label-page bg-white">
              {/* ترويسة علوية بسيطة */}
              <div className="absolute top-12 w-full px-12 flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-bold text-lg">المملكة العربية السعودية</p>
                  <p className="font-bold text-lg">وزارة التعليم</p>
                  <p className="font-bold text-lg">إدارة التعليم</p>
                </div>
                <img src={APP_CONFIG.LOGO_URL} alt="Ministry Logo" className="w-24 h-24 object-contain opacity-90" />
              </div>

              {/* محتوى الملصق في المنتصف */}
              <div className="w-full max-w-2xl border-4 border-slate-900 rounded-[3rem] p-16 text-center space-y-12 relative bg-white shadow-2xl">
                 <div className="space-y-4">
                    <h1 className="text-8xl font-black tracking-tighter text-blue-900">لجنة رقم</h1>
                    <div className="text-[12rem] font-black leading-none text-blue-600 block tabular-nums">{committee.num}</div>
                 </div>

                 <div className="space-y-6 pt-8 border-t-[3px] border-dashed border-slate-300">
                    <div className="text-4xl font-black text-slate-800">{committee.grades}</div>
                    <div className="bg-slate-100 py-4 px-10 rounded-full inline-block text-2xl font-bold text-slate-600">
                      عدد الطلاب: <span className="text-3xl font-black text-slate-900 mx-2">{committee.count}</span> طالب
                    </div>
                 </div>

                 <div className="pt-10 flex flex-col items-center gap-6">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(publicUrl)}&color=0f172a`} 
                      alt="QR Code" 
                      className="w-48 h-48 border-4 border-slate-200 rounded-3xl shadow-sm p-2"
                      crossOrigin="anonymous"
                    />
                    <div className="space-y-2">
                       <p className="text-xl font-black text-slate-800">امسح الباركود لعرض تفاصيل اللجنة</p>
                       <p className="text-md font-bold text-slate-500">حضور الطلاب - وقت الدخول - معلومات المراقب</p>
                    </div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DoorLabelsPrint;
