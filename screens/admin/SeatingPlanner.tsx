import React, { useState, useEffect } from 'react';
import { Users, Save, RefreshCw, LayoutGrid, Settings2, ShieldCheck, Info, Loader2, ArrowLeftRight, Printer, FileText, Database } from 'lucide-react';
import { db } from '../../supabase';
import { Student } from '../../types';

interface CommitteePreview {
  number: string;
  students: Student[];
  columns: Student[][];
  stats: Record<string, number>;
}

const SeatingPlanner = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [committeesCount, setCommitteesCount] = useState<number>(20);
  const [gradeCounts, setGradeCounts] = useState<Record<string, number>>({});
  const [randomize, setRandomize] = useState<boolean>(true);
  const [committees, setCommittees] = useState<CommitteePreview[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'generator' | 'current'>('generator');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const data = await db.students.getAll();
      setStudents(data);
      
      const counts: Record<string, number> = {};
      data.forEach(s => {
        counts[s.grade] = (counts[s.grade] || 0) + 1;
      });
      setGradeCounts(counts);
    } catch (err) {
      alert('فشل في جلب بيانات الطلاب');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeCountChange = (grade: string, count: number) => {
    setGradeCounts(prev => ({...prev, [grade]: count}));
  };

  const generateCroquisSeating = () => {
    if (students.length === 0) return alert('لا يوجد طلاب لتوزيعهم');
    if (committeesCount < 1) return alert('يجب تحديد لجنة واحدة على الأقل');

    const availableGrades = Object.keys(gradeCounts).sort();
    const committeeAllocations: Record<string, Student[]>[] = Array.from({length: committeesCount}, () => ({}));
    const unassignedByGrade: Record<string, Student[]> = {};
    
    availableGrades.forEach(g => {
       const studentsOfGrade = students.filter(s => s.grade === g);
       if (randomize) studentsOfGrade.sort(() => Math.random() - 0.5);
       else studentsOfGrade.sort((a,b) => a.name.localeCompare(b.name, 'ar'));
       unassignedByGrade[g] = studentsOfGrade.slice(0, gradeCounts[g] || 0);
    });

    availableGrades.forEach(g => {
       const list = unassignedByGrade[g];
       let cIdx = 0;
       while (list.length > 0) {
          const s = list.shift()!;
          if (!committeeAllocations[cIdx][g]) committeeAllocations[cIdx][g] = [];
          committeeAllocations[cIdx][g].push(s);
          cIdx = (cIdx + 1) % committeesCount;
       }
    });

    const newCommittees: CommitteePreview[] = [];
    
    committeeAllocations.forEach((allocation, index) => {
        const gradesInCommittee = Object.keys(allocation).filter(g => allocation[g].length > 0);
        
        // --- 6 Columns Logic ---
        // We must have exactly 6 columns.
        const numCols = 6;
        const tempCols: Student[][] = Array.from({ length: numCols }, () => []);
        
        // We want to interleave the grades. 
        // e.g. Col 0: G1, Col 1: G2, Col 2: G3, Col 3: G1, Col 4: G2, Col 5: G3
        const pattern: string[] = [];
        let pIdx = 0;
        for (let i = 0; i < numCols; i++) {
           pattern.push(gradesInCommittee[pIdx % gradesInCommittee.length]);
           pIdx++;
        }

        // Now we have the target grade for each of the 6 columns.
        // E.g. ['Grade1', 'Grade2', 'Grade3', 'Grade1', 'Grade2', 'Grade3']
        // We will distribute the students of each grade evenly into their designated columns.
        gradesInCommittee.forEach(g => {
            const studentsForG = allocation[g];
            // Find which columns are designated for this grade
            const colIndicesForG = pattern.map((patG, idx) => patG === g ? idx : -1).filter(idx => idx !== -1);
            if (colIndicesForG.length === 0) return; // shouldn't happen
            
            // Distribute studentsForG evenly into these colIndices
            let targetColIdx = 0;
            studentsForG.forEach(s => {
                const actualCol = colIndicesForG[targetColIdx];
                tempCols[actualCol].push(s);
                targetColIdx = (targetColIdx + 1) % colIndicesForG.length;
            });
        });

        // Assign seating numbers
        let seatNum = 1;
        const committeeStudents: Student[] = [];
        
        tempCols.forEach(col => {
            col.forEach(s => {
                const assignedStudent = { ...s };
                assignedStudent.committee_number = (index + 1).toString();
                assignedStudent.seating_number = seatNum.toString();
                committeeStudents.push(assignedStudent);
                Object.assign(s, assignedStudent);
                seatNum++;
            });
        });

        // Calculate Stats
        const stats: Record<string, number> = {};
        committeeStudents.forEach(s => {
           stats[s.grade] = (stats[s.grade] || 0) + 1;
        });
        
        newCommittees.push({
            number: (index + 1).toString(),
            students: committeeStudents,
            columns: tempCols,
            stats
        });
    });

    setCommittees(newCommittees);
    alert('تم بناء الكروكي وتوزيع اللجان بـ 6 مسارات بنجاح!');
  };

  const loadExistingCroquis = () => {
    // Read from DB and construct committees array
    const assignedStudents = students.filter(s => s.committee_number);
    if (assignedStudents.length === 0) {
      alert('لا يوجد طلاب موزعين في قاعدة البيانات لعرضهم.');
      return;
    }

    const committeesMap: Record<string, Student[]> = {};
    assignedStudents.forEach(s => {
      if (!committeesMap[s.committee_number!]) committeesMap[s.committee_number!] = [];
      committeesMap[s.committee_number!].push(s);
    });

    const existingCommittees: CommitteePreview[] = [];

    Object.keys(committeesMap).sort((a,b) => Number(a) - Number(b)).forEach(comNum => {
       const comStudents = committeesMap[comNum];
       // Sort by seating number so we can reconstruct columns correctly
       comStudents.sort((a, b) => Number(a.seating_number) - Number(b.seating_number));
       
       // Force 6 columns
       const numCols = 6;
       const finalCols: Student[][] = Array.from({ length: numCols }, () => []);
       
       // If we assume seat numbers are sequential top-to-bottom in columns, 
       // we divide by the expected column size.
       const chunkSize = Math.ceil(comStudents.length / numCols);
       comStudents.forEach((s, idx) => {
          const targetCol = Math.floor(idx / chunkSize);
          if (targetCol < numCols) {
            finalCols[targetCol].push(s);
          } else {
            finalCols[numCols - 1].push(s); // safety fallback
          }
       });

       const stats: Record<string, number> = {};
       comStudents.forEach(s => {
          stats[s.grade] = (stats[s.grade] || 0) + 1;
       });

       existingCommittees.push({
         number: comNum,
         students: comStudents,
         columns: finalCols,
         stats
       });
    });

    setCommittees(existingCommittees);
  };

  // When tab changes, load or clear
  useEffect(() => {
     if (activeTab === 'current') {
       loadExistingCroquis();
     } else {
       setCommittees([]); // Clear for generator
     }
  }, [activeTab]);

  const handleSave = async () => {
    if (committees.length === 0) return;
    try {
      setIsSaving(true);
      const updatedStudents = committees.flatMap(c => c.students);
      await db.students.upsert(updatedStudents);
      alert('تم اعتماد الكروكي وتحديث قاعدة البيانات بنجاح!');
      setStudents(updatedStudents);
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintAll = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const getStatusColor = (grade: string) => {
    const colors = ['bg-blue-100 text-blue-800 border-blue-200', 'bg-emerald-100 text-emerald-800 border-emerald-200', 'bg-purple-100 text-purple-800 border-purple-200', 'bg-orange-100 text-orange-800 border-orange-200', 'bg-rose-100 text-rose-800 border-rose-200'];
    let hash = 0;
    for (let i = 0; i < grade.length; i++) hash = grade.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const totalSelectedStudents = Object.values(gradeCounts).reduce((a,b) => a + (b||0), 0);

  // Helper to generate QR data string
  const getQrData = (com: CommitteePreview) => {
     let text = `لجنة رقم: ${com.number}\nالطلاب: ${com.students.length}\n`;
     Object.entries(com.stats).forEach(([grade, count]) => {
        text += `${grade}: ${count}\n`;
     });
     return encodeURIComponent(text);
  };

  return (
    <div className="space-y-8 animate-fade-in text-right pb-20">
      
      {/* --- Print Styles & Invisible Render --- */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .page-break { page-break-after: always; }
        }
      `}</style>

      <div className="hidden print-only print:block" dir="rtl">
        {committees.map((com, idx) => (
           <div key={com.number} className="page-break flex flex-col h-[180mm] bg-white p-6 relative">
              
              {/* Header: Table and QR */}
              <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-6">
                 <div className="flex items-center gap-6">
                    <img 
                       src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${getQrData(com)}&color=000000`}
                       alt="QR"
                       className="w-32 h-32 border-4 border-black p-1 rounded-xl shadow-lg"
                       crossOrigin="anonymous"
                    />
                    <div>
                       <h1 className="text-6xl font-black text-black">لجنة رقم {com.number}</h1>
                       <p className="text-2xl font-bold mt-3 text-slate-700 bg-slate-100 px-4 py-1 rounded-full inline-block">كروكي توزيع مقاعد الطلاب</p>
                    </div>
                 </div>

                 {/* Stats Table */}
                 <div className="border-4 border-black rounded-2xl overflow-hidden shadow-lg">
                   <table className="border-collapse text-center min-w-[350px]">
                      <thead>
                         <tr className="bg-slate-800 text-white">
                            <th className="border-b-2 border-black px-6 py-3 font-black text-lg">المرحلة / الصف</th>
                            <th className="border-b-2 border-black px-6 py-3 font-black text-lg border-r-2 border-slate-600">العدد</th>
                         </tr>
                      </thead>
                      <tbody>
                         {Object.entries(com.stats).map(([grade, count]) => (
                            <tr key={grade} className="bg-white">
                               <td className="border-b border-black px-6 py-2 font-bold text-lg">{grade}</td>
                               <td className="border-b border-black px-6 py-2 font-black text-xl border-r-2 border-black">{count}</td>
                            </tr>
                         ))}
                         <tr className="bg-slate-200">
                            <td className="border-b-0 border-black px-6 py-3 font-black text-xl">الإجمالي الكلي</td>
                            <td className="border-b-0 border-black px-6 py-3 font-black text-3xl border-r-2 border-black">{com.students.length}</td>
                         </tr>
                      </tbody>
                   </table>
                 </div>
              </div>

              {/* Croquis Layout */}
              <div className="flex-1 flex justify-between gap-6 relative px-10">
                 {/* Door */}
                 <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <div className="text-6xl filter drop-shadow-md">🚪</div>
                    <div className="font-black text-2xl rotate-180 bg-slate-800 text-white px-2 py-6 rounded-full" style={{ writingMode: 'vertical-rl' }}>باب اللجنة</div>
                 </div>

                 {com.columns.map((col, cIdx) => (
                    <div key={cIdx} className="flex-1 flex flex-col border-4 border-slate-300 rounded-[2rem] p-4 bg-slate-50 relative shadow-sm">
                       <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white text-center font-black py-3 rounded-xl mb-6 text-xl shadow-md">
                          مسار {cIdx + 1}
                       </div>
                       <div className="flex flex-col gap-4 flex-1">
                          {col.map((student) => (
                             <div key={student.id} className="bg-white border-2 border-slate-400 p-5 rounded-2xl flex flex-col items-center justify-center text-center relative shadow-sm h-full max-h-[110px]">
                                <div className="absolute top-2 right-3 text-lg font-black text-slate-400 bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center">{student.seating_number}</div>
                                <div className="font-black text-xl truncate w-full px-4">{student.name}</div>
                                <div className="text-sm font-bold text-slate-500 mt-2 bg-slate-100 px-3 py-1 rounded-md">{student.grade} - {student.section}</div>
                             </div>
                          ))}
                          {/* Empty Seats Filler */}
                          {Array.from({ length: Math.max(0, 5 - col.length) }).map((_, i) => (
                             <div key={`emp-${i}`} className="border-4 border-dashed border-slate-200 bg-white/30 rounded-2xl flex items-center justify-center h-full max-h-[110px] text-slate-300 font-black text-lg">
                                مقعد فارغ
                             </div>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        ))}
      </div>
      {/* --- End Print --- */}

      <div className="no-print">
        <div className="bg-gradient-to-br from-[#020817] via-[#0a1628] to-[#050d1a] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-blue-900/30 mb-8">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <LayoutGrid size={200} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-bold mb-6">
                <ShieldCheck size={16} />
                كروكي لجان الاختبارات (6 مسارات)
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">إدارة الكروكي وطباعة اللجان 🪑</h2>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-white/10 p-2 rounded-2xl border border-white/10 flex-wrap gap-2">
               <button 
                 onClick={() => setActiveTab('generator')}
                 className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black transition-all ${activeTab === 'generator' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
               >
                 <Settings2 size={18} /> الموزع الآلي (توليد)
               </button>
               <button 
                 onClick={() => setActiveTab('current')}
                 className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black transition-all ${activeTab === 'current' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
               >
                 <Database size={18} /> البيانات الحالية للجان
               </button>
            </div>
          </div>
        </div>

        {activeTab === 'generator' && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 mb-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                   <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                     <Settings2 className="text-blue-500" />
                     إعدادات التوزيع (6 مسارات إجبارية)
                   </h3>
                   
                   <div className="space-y-3">
                     <label className="text-sm font-bold text-slate-700">العدد الإجمالي للجان المطلوبة</label>
                     <input 
                       type="number" min="1" max="100" value={committeesCount}
                       onChange={(e) => setCommitteesCount(parseInt(e.target.value) || 1)}
                       className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 font-black text-lg outline-none focus:border-blue-500 transition-all text-left dir-ltr shadow-sm"
                     />
                     <p className="text-xs text-slate-500 font-bold">متوسط الطلاب لكل لجنة: {Math.round(totalSelectedStudents / (committeesCount || 1))} طالب</p>
                   </div>

                   <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" className="sr-only peer" checked={randomize} onChange={e => setRandomize(e.target.checked)} />
                       <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       <span className="ms-3 text-sm font-bold text-slate-700">خلط الأسماء عشوائياً (Shuffle)</span>
                     </label>
                   </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                     <Users className="text-blue-500" />
                     تخصيص أعداد الطلاب
                   </h3>
                   <div className="space-y-3">
                     {Object.entries(gradeCounts).map(([grade, count]) => (
                        <div key={grade} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                           <span className="font-bold text-sm text-slate-700">{grade}</span>
                           <div className="flex items-center gap-2">
                             <input 
                                type="number" value={count}
                                onChange={(e) => handleGradeCountChange(grade, parseInt(e.target.value) || 0)}
                                className="w-20 text-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-black text-sm outline-none focus:border-blue-500"
                             />
                             <span className="text-xs text-slate-400">طالب</span>
                           </div>
                        </div>
                     ))}
                     <div className="flex justify-between items-center p-3 bg-blue-50 text-blue-800 rounded-xl font-black border border-blue-100">
                        <span>الإجمالي:</span>
                        <span className="text-lg">{totalSelectedStudents}</span>
                     </div>
                   </div>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button 
                  onClick={generateCroquisSeating}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-xl font-black text-base shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                  توليد كروكي اللجان
                </button>
                
                {committees.length > 0 && (
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black text-base shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    حفظ التوزيع في قاعدة البيانات
                  </button>
                )}
            </div>
          </div>
        )}

        {/* عرض الكروكي والطباعة */}
        {committees.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
               <div className="flex items-center gap-3 text-slate-800">
                 <LayoutGrid className="text-blue-600" />
                 <h3 className="text-2xl font-black">معاينة وتجهيز الطباعة ({committees.length} لجان)</h3>
               </div>
               
               <button 
                 onClick={handlePrintAll}
                 disabled={isPrinting}
                 className="w-full md:w-auto bg-slate-900 text-white px-8 py-3.5 rounded-xl font-black text-base shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
               >
                 <Printer size={20} /> طباعة جميع اللجان (PDF / ورق بالعرض)
               </button>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {committees.map((committee) => (
                <div key={committee.number} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-600 text-white rounded-[1.2rem] flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-600/20">
                        {committee.number}
                      </div>
                      <div>
                        <h4 className="font-black text-xl text-slate-800">لجنة رقم {committee.number}</h4>
                        <p className="text-slate-500 text-sm font-bold flex items-center gap-1">
                          {committee.students.length} طالب <ArrowLeftRight size={14} className="mx-1" /> 6 مسارات
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 overflow-x-auto relative">
                    <div className="absolute top-1/2 right-2 -translate-y-1/2 text-2xl opacity-50 select-none hidden md:block">🚪</div>
                    <div className="flex justify-between gap-3 min-w-max md:pr-10">
                      {committee.columns.map((col, cIdx) => (
                          <div key={cIdx} className="flex flex-col gap-2 w-24 shrink-0">
                             <div className="text-center font-black text-xs bg-slate-100 text-slate-600 py-2 rounded-xl mb-1 border border-slate-200">
                               مسار {cIdx + 1}
                             </div>
                             {col.map(student => (
                                 <div 
                                   key={student.id} 
                                   className={`rounded-2xl border p-2 text-center relative group cursor-help transition-all hover:-translate-y-1 hover:shadow-md ${getStatusColor(student.grade)}`}
                                 >
                                    <div className="absolute top-1 right-2 text-[10px] opacity-60 font-black">{student.seating_number}</div>
                                    <div className="mt-2 text-[11px] font-black truncate">{student.grade.split(' ')[0]}</div>
                                    <div className="text-[9px] font-bold mt-0.5 bg-white/50 py-0.5 px-1.5 rounded-full inline-block">{student.section}</div>
                                    
                                    <div className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bottom-full mb-2 right-1/2 translate-x-1/2 bg-slate-900 text-white text-xs p-2.5 rounded-xl whitespace-nowrap z-20 shadow-xl font-bold">
                                       {student.name}
                                    </div>
                                 </div>
                             ))}
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatingPlanner;
