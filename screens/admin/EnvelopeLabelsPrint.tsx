import React, { useMemo, useState, useEffect } from 'react';
import { Printer, Package, LayoutGrid } from 'lucide-react';

const ALLOWED_SUBJECTS = ['الرياضيات', 'اللغة العربية', 'العلوم', 'اللغة الإنجليزية'];

interface Props {
  students: any[];
}

const EnvelopeLabelsPrint: React.FC<Props> = ({ students }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const uniqueGrades = useMemo(() => {
    return Array.from(new Set(students.map(s => s.grade))).filter(Boolean);
  }, [students]);

  // Generate a label for each Subject x Grade
  const labels = useMemo(() => {
    const arr = [];
    for (const grade of uniqueGrades) {
      for (const subject of ALLOWED_SUBJECTS) {
        arr.push({ grade, subject });
      }
    }
    return arr;
  }, [uniqueGrades]);

  const handlePrint = async () => {
    setIsPrinting(true);

    const imageUrlsToPreload: string[] = [];
    labels.forEach(lbl => {
      const data = `ENV|${lbl.subject}|${lbl.grade}`;
      imageUrlsToPreload.push(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data)}&color=000000`);
    });

    await Promise.allSettled(
      imageUrlsToPreload.map(url => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); 
          img.src = url;
        });
      })
    );

    setTimeout(() => window.print(), 500);
  };

  useEffect(() => {
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in text-right">
       <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border-b-[8px] border-blue-600 no-print">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full"></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h2 className="text-4xl font-black mb-2 flex items-center gap-4">
                 <Package className="text-blue-400" size={40} />
                 ملصقات مظاريف الأسئلة
              </h2>
              <p className="text-slate-400 font-bold max-w-lg">
                يتم إصدار ملصقات مخصصة لمظاريف الأسئلة لتسهيل عملية مسحها عبر النظام وتوثيق فتحها.
              </p>
            </div>
            <button 
              onClick={handlePrint}
              disabled={isPrinting || labels.length === 0}
              className={`px-8 py-5 rounded-[2rem] font-black text-xl flex items-center gap-4 transition-all shadow-xl active:scale-95 whitespace-nowrap ${isPrinting || labels.length === 0 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 hover:-translate-y-1 hover:shadow-blue-600/20'}`}
            >
              {isPrinting ? <><svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> جاري التجهيز...</> : <><Printer size={28}/> طباعة {labels.length} ملصق</>}
            </button>
         </div>
       </div>

       <div className="print-only" style={{ direction: 'rtl' }}>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            {labels.map((lbl, idx) => {
              const data = `ENV|${lbl.subject}|${lbl.grade}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data)}&color=000000`;
              return (
                <div key={idx} style={{ border: '2px solid #000', borderRadius: '15px', padding: '15px', textAlign: 'center', pageBreakInside: 'avoid', height: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '2px solid #000', paddingBottom: '5px', width: '100%' }}>
                       مظروف أسئلة
                    </div>
                    <img src={qrUrl} alt="QR" style={{ width: '130px', height: '130px', margin: '10px 0' }} />
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}>
                       المادة: {lbl.subject}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#444' }}>
                       الصف: {lbl.grade}
                    </div>
                </div>
              );
            })}
         </div>
       </div>
    </div>
  );
};

export default EnvelopeLabelsPrint;
