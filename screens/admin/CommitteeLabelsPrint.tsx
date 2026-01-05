
import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Student } from '../../types';
import { APP_CONFIG } from '../../constants';
// Added ListChecks to the imports
import { Printer, QrCode, LayoutGrid, Info, Tag, Loader2, Package, Search, Plus, Trash2, CheckCircle2, XCircle, ListChecks } from 'lucide-react';

interface Props {
  students: Student[];
}

interface EnvelopeItem {
    id: string;
    grade: string;
    subject: string;
    period: string;
}

const CommitteeLabelsPrint: React.FC<Props> = ({ students }) => {
  const [activeTab, setActiveTab] = useState<'COMMITTEE' | 'ENVELOPE'>('COMMITTEE');
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Envelope Form State
  const [envSubject, setEnvSubject] = useState('');
  const [envPeriod, setEnvPeriod] = useState('الأولى');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  
  // Envelope Queue State (The "Cart")
  const [envelopeQueue, setEnvelopeQueue] = useState<EnvelopeItem[]>([]);

  const uniqueCommittees = useMemo(() => {
    return Array.from(new Set(students.map(s => s.committee_number)))
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b));
  }, [students]);

  const allGrades = useMemo(() => {
    return Array.from(new Set(students.map(s => s.grade))).filter(Boolean).sort();
  }, [students]);

  const comPages = useMemo(() => {
    const p = [];
    for (let i = 0; i < uniqueCommittees.length; i += 21) {
      p.push(uniqueCommittees.slice(i, i + 21));
    }
    return p;
  }, [uniqueCommittees]);

  // تقسيم قائمة المظاريف إلى صفحات (21 ملصق لكل صفحة)
  const envPages = useMemo(() => {
    const p = [];
    for (let i = 0; i < envelopeQueue.length; i += 21) {
      p.push(envelopeQueue.slice(i, i + 21));
    }
    return p;
  }, [envelopeQueue]);

  const addToQueue = () => {
    if (!envSubject || selectedGrades.length === 0) {
        alert('يرجى كتابة المادة واختيار صف واحد على الأقل');
        return;
    }
    
    const newItems = selectedGrades.map(grade => ({
        id: Math.random().toString(36).substr(2, 9),
        grade,
        subject: envSubject,
        period: envPeriod
    }));

    setEnvelopeQueue(prev => [...prev, ...newItems]);
    // إعادة ضبط الحقول للاستعداد للإضافة التالية
    setSelectedGrades([]);
  };

  const removeFromQueue = (id: string) => {
    setEnvelopeQueue(prev => prev.filter(item => item.id !== id));
  };

  const clearQueue = () => {
    if(confirm('هل تريد تفريغ قائمة الطباعة بالكامل؟')) setEnvelopeQueue([]);
  };

  const handlePrint = () => {
    if (activeTab === 'ENVELOPE' && envelopeQueue.length === 0) {
        alert('قائمة الطباعة فارغة! أضف مواد أولاً');
        return;
    }
    if (activeTab === 'COMMITTEE' && uniqueCommittees.length === 0) {
        alert('لا توجد لجان لطباعتها');
        return;
    }
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrinting(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const getLiveStatusUrl = (comNum: string) => {
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.search = ''; 
      currentUrl.hash = `status-${comNum}`;
      return currentUrl.toString();
    } catch (e) {
      return `${window.location.origin}${window.location.pathname}#status-${comNum}`;
    }
  };

  const getEnvelopeOpenUrl = (grade: string, subject: string, period: string) => {
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.search = '';
      const params = new URLSearchParams();
      params.set('grade', grade);
      params.set('subject', subject);
      params.set('period', period);
      currentUrl.hash = `open-env?${params.toString()}`;
      return currentUrl.toString();
    } catch (e) {
      return `${window.location.origin}${window.location.pathname}#open-env`;
    }
  };

  return (
    <div className="space-y-10 animate-fade-in text-right pb-24">
      
      {/* البوابة الخاصة بالطباعة */}
      {isPrinting && createPortal(
        <div id="labels-print-portal">
          <style>{`
            @media screen { #labels-print-portal { display: none !important; } }
            @media print {
              @page { size: A4 portrait; margin: 0; }
              body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact; color: black !important; }
              #root, #app-root, header, nav, .no-print { display: none !important; }
              #labels-print-portal { display: block !important; position: absolute; top: 0; left: 0; width: 100%; z-index: 9999; }
              .gs-1021-sheet { width: 210mm; height: 297mm; display: grid; grid-template-columns: repeat(3, 70mm); grid-template-rows: repeat(7, 42.4mm); page-break-after: always; box-sizing: border-box; padding: 0; margin: 0; }
              .gs-1021-label { width: 70mm; height: 42.4mm; box-sizing: border-box; border: 0.1pt solid #ddd; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; background: white; }
              .label-content { width: 100%; height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 4mm; }
              .text-black-bold { color: #000 !important; font-weight: 900 !important; }
              .env-label-inner { border: 1.5pt solid black; width: 92%; height: 90%; display: flex; flex-direction: column; padding: 2mm; text-align: center; justify-content: space-between; }
            }
          `}</style>
          
          <div className="print-only-labels">
            {activeTab === 'COMMITTEE' ? (
                comPages.map((pageCommittees, pageIdx) => (
                    <div key={pageIdx} className="gs-1021-sheet">
                      {pageCommittees.map((comNum) => (
                        <div key={comNum} className="gs-1021-label">
                          <div className="label-content">
                            <div className="flex-1 flex flex-col items-center justify-center gap-1 border-l border-black h-[85%] relative">
                              <img src={APP_CONFIG.LOGO_URL} alt="Logo" className="w-8 h-8 object-contain mb-1" />
                              <span className="text-[7pt] font-black text-black-bold">لجنة رقم</span>
                              <span className="text-[28pt] font-black text-black-bold leading-none tabular-nums">{comNum}</span>
                              <span className="text-[5pt] font-black text-black-bold mt-1 uppercase tracking-tighter">كنترول الاختبارات الذكي</span>
                            </div>
                            <div className="w-[40%] flex items-center justify-center">
                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getLiveStatusUrl(comNum))}&color=000000`} alt="QR" className="w-16 h-16" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                ))
            ) : (
                envPages.map((pageItems, pageIdx) => (
                    <div key={pageIdx} className="gs-1021-sheet">
                        {pageItems.map((item) => (
                            <div key={item.id} className="gs-1021-label">
                                <div className="env-label-inner">
                                    <div className="flex justify-between items-center px-1">
                                        <img src={APP_CONFIG.LOGO_URL} className="w-5 h-5 object-contain" alt="Logo" />
                                        <span className="text-[6pt] font-black">محضر فتح مظروف أسئلة</span>
                                    </div>
                                    <div className="flex-1 flex items-center justify-between gap-2 border-y border-black/20 my-1 py-1 px-1">
                                        <div className="flex-1 text-right space-y-0.5">
                                            <p className="text-[6pt] font-black leading-none">الصف: <span className="text-[8pt]">{item.grade}</span></p>
                                            <p className="text-[6pt] font-black leading-none">المادة: <span className="text-[7pt]">{item.subject}</span></p>
                                            <p className="text-[6pt] font-black leading-none">الفترة: {item.period}</p>
                                        </div>
                                        <div className="w-12 h-12">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(getEnvelopeOpenUrl(item.grade, item.subject, item.period))}&color=000000`} alt="EnvQR" className="w-full h-full" />
                                        </div>
                                    </div>
                                    <p className="text-[5pt] font-bold text-slate-500 italic uppercase">Smart Exam V7.0 System</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ))
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Tabs Control Area */}
      <div className="flex justify-center mb-10">
        <div className="bg-white p-2 rounded-[2.5rem] shadow-xl border flex gap-2 w-full max-w-xl">
           <button onClick={() => setActiveTab('COMMITTEE')} className={`flex-1 py-4 px-6 rounded-[1.8rem] font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'COMMITTEE' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
              <QrCode size={20} /> ملصقات اللجان
           </button>
           <button onClick={() => setActiveTab('ENVELOPE')} className={`flex-1 py-4 px-6 rounded-[1.8rem] font-black text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'ENVELOPE' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Package size={20} /> ملصقات المظاريف
           </button>
        </div>
      </div>

      <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-2xl no-print relative overflow-hidden border-b-[10px] border-blue-600">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full"></div>
        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-10">
          
          <div className="space-y-6 flex-1 w-full">
             <div className="flex items-center gap-6">
                <div className="bg-blue-600 p-4 rounded-3xl shadow-xl text-white">
                    {activeTab === 'COMMITTEE' ? <QrCode size={32} /> : <Package size={32} />}
                </div>
                <h3 className="text-3xl font-black tracking-tighter">
                    {activeTab === 'COMMITTEE' ? 'طباعة ملصقات اللجان (QR)' : 'توليد ملصقات المظاريف الذكية'}
                </h3>
             </div>
             
             {activeTab === 'COMMITTEE' ? (
                <p className="text-slate-400 font-bold max-w-xl leading-relaxed text-lg italic">
                    أكواد المسح توجه المشرف والزوار لصفحة الحالة المباشرة للجنة المختارة.
                </p>
             ) : (
                <div className="space-y-6 animate-slide-up bg-slate-50 p-8 rounded-[3rem] border-2 border-dashed">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 mr-2 uppercase">اسم المادة الحالية</label>
                            <input type="text" value={envSubject} onChange={e => setEnvSubject(e.target.value)} placeholder="مثلاً: لغتي، رياضيات..." className="w-full p-5 bg-white border rounded-2xl font-black outline-none focus:border-blue-600 shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 mr-2 uppercase">الفترة</label>
                            <select value={envPeriod} onChange={e => setEnvPeriod(e.target.value)} className="w-full p-5 bg-white border rounded-2xl font-black outline-none appearance-none shadow-sm">
                                <option>الأولى</option>
                                <option>الثانية</option>
                                <option>الثالثة</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 mr-2 uppercase">اختر الصفوف للمادة المكتوبة أعلاه:</label>
                        <div className="flex flex-wrap gap-2">
                            {allGrades.map(grade => (
                                <button key={grade} onClick={() => setSelectedGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade])} className={`px-5 py-2 rounded-xl font-black text-xs transition-all border-2 ${selectedGrades.includes(grade) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-200'}`}>
                                    {grade}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button 
                        onClick={addToQueue}
                        className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        <Plus size={24}/> إضافة المادة المحددة للقائمة
                    </button>
                </div>
             )}
          </div>
          
          <div className="flex flex-col gap-4 w-full xl:w-80">
            <div className={`bg-slate-900 p-8 rounded-[2.5rem] text-white text-center shadow-2xl border-b-4 border-blue-500 ${activeTab === 'ENVELOPE' && envelopeQueue.length === 0 ? 'opacity-40' : ''}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-50">إجمالي الملصقات</p>
                <p className="text-5xl font-black tabular-nums">{activeTab === 'COMMITTEE' ? uniqueCommittees.length : envelopeQueue.length}</p>
                <p className="text-[10px] mt-2 font-bold text-blue-400">({activeTab === 'COMMITTEE' ? comPages.length : envPages.length} ورقة ملصقات)</p>
            </div>
            
            <button 
                onClick={handlePrint}
                disabled={isPrinting || (activeTab === 'ENVELOPE' && envelopeQueue.length === 0)}
                className="bg-blue-600 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-5 active:scale-95 disabled:opacity-50"
            >
                {isPrinting ? <Loader2 size={32} className="animate-spin" /> : <Printer size={32} />} 
                {isPrinting ? 'جاري التحضير...' : 'بدء الطباعة'}
            </button>
            
            {activeTab === 'ENVELOPE' && envelopeQueue.length > 0 && (
                <button onClick={clearQueue} className="text-red-500 font-black text-sm hover:underline flex items-center justify-center gap-2">
                    <Trash2 size={16}/> تفريغ القائمة بالكامل
                </button>
            )}
          </div>
        </div>
      </div>

      {/* Queue View Section (Only for Envelopes) */}
      {activeTab === 'ENVELOPE' && envelopeQueue.length > 0 && (
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border no-print animate-slide-up">
            <div className="flex items-center justify-between mb-8 border-b pb-4">
                {/* Fixed the missing ListChecks usage below */}
                <h4 className="text-2xl font-black text-slate-800 flex items-center gap-4"><ListChecks size={28} className="text-blue-600" /> قائمة الطباعة الحالية</h4>
                <span className="text-xs font-bold text-slate-400">يمكنك حذف أي ملصق من هنا قبل الطباعة</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {envelopeQueue.map(item => (
                    <div key={item.id} className="p-4 bg-slate-50 border rounded-2xl flex justify-between items-center group hover:border-red-200 transition-all">
                        <div className="text-right">
                            <p className="text-xs font-black text-slate-900">{item.grade}</p>
                            <p className="text-[10px] font-bold text-blue-600 truncate max-w-[150px]">{item.subject}</p>
                        </div>
                        <button onClick={() => removeFromQueue(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <XCircle size={20}/>
                        </button>
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* Preview Section */}
      <div className="no-print space-y-8">
         <div className="flex items-center gap-4 border-b pb-4">
            <LayoutGrid className="text-slate-400" />
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">معاينة تخطيط الورق (A4)</h4>
         </div>
         
         <div className="grid grid-cols-1 gap-12">
            {(activeTab === 'COMMITTEE' ? comPages : envPages).map((page, pageIdx) => (
                <div key={pageIdx} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-8 py-2 rounded-bl-[2rem] font-black text-[10px] uppercase tracking-widest shadow-lg">صفحة رقم {pageIdx + 1}</div>
                    
                    <div className="grid grid-cols-3 gap-1 border-2 border-slate-200 bg-slate-100 p-2 shadow-inner rounded-xl">
                        {page.map((item: any, idx: number) => (
                            <div key={idx} className="w-[160px] h-[100px] bg-white border border-slate-300 rounded-lg flex flex-col items-center justify-center p-3 shadow-sm relative group hover:border-blue-400 transition-colors">
                                {activeTab === 'COMMITTEE' ? (
                                    <>
                                        <img src={APP_CONFIG.LOGO_URL} alt="Logo" className="w-6 h-6 object-contain mb-1" />
                                        <span className="text-[7pt] font-black leading-none mb-0.5 text-slate-400 uppercase">لجنة رقم</span>
                                        <span className="text-2xl font-black text-slate-900 leading-none tabular-nums">{item}</span>
                                    </>
                                ) : (
                                    <div className="text-center w-full">
                                        <div className="flex justify-between w-full mb-1">
                                            <img src={APP_CONFIG.LOGO_URL} className="w-4 h-4 object-contain" alt="Logo" />
                                            <span className="text-[5pt] font-black bg-slate-100 px-1 rounded">مظروف أسئلة</span>
                                        </div>
                                        <p className="text-[9pt] font-black text-blue-600 leading-none mb-1 truncate">{item.grade}</p>
                                        <p className="text-[6pt] font-bold text-slate-500 truncate">{item.subject}</p>
                                        <div className="mt-2 w-8 h-8 mx-auto bg-slate-50 rounded p-1">
                                            <QrCode size={24} className="text-slate-300" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            
            {(activeTab === 'COMMITTEE' ? uniqueCommittees.length === 0 : envelopeQueue.length === 0) && (
                <div className="bg-white p-32 rounded-[4rem] border-4 border-dashed border-slate-100 text-center flex flex-col items-center gap-8">
                    <Tag size={80} className="text-slate-100" />
                    <p className="text-3xl font-black text-slate-200 italic">بانتظار إضافة ملصقات لتوليد المعاينة</p>
                </div>
            )}
         </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default CommitteeLabelsPrint;
