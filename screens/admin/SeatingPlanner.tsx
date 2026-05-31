import React, { useState, useEffect } from 'react';
import { Users, Save, RefreshCw, LayoutGrid, Settings2, ShieldCheck, Info, Loader2, ArrowLeftRight } from 'lucide-react';
import { db } from '../../supabase';
import { Student } from '../../types';

interface CommitteePreview {
  number: string;
  students: Student[];
  columns: Student[][];
}

const SeatingPlanner = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [committeesCount, setCommitteesCount] = useState<number>(20);
  const [gradeCounts, setGradeCounts] = useState<Record<string, number>>({});
  const [randomize, setRandomize] = useState<boolean>(true);
  const [committees, setCommittees] = useState<CommitteePreview[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const data = await db.students.getAll();
      setStudents(data);
      
      // Auto-calculate initial grade counts
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
    if (students.length === 0) {
      alert('لا يوجد طلاب لتوزيعهم');
      return;
    }
    if (committeesCount < 1) {
      alert('يجب تحديد لجنة واحدة على الأقل');
      return;
    }

    const availableGrades = Object.keys(gradeCounts).sort();
    
    // 1. Equal Division across committees
    const committeeAllocations: Record<string, Student[]>[] = Array.from({length: committeesCount}, () => ({}));
    const unassignedByGrade: Record<string, Student[]> = {};
    
    availableGrades.forEach(g => {
       const studentsOfGrade = students.filter(s => s.grade === g);
       if (randomize) {
         studentsOfGrade.sort(() => Math.random() - 0.5);
       } else {
         studentsOfGrade.sort((a,b) => a.name.localeCompare(b.name, 'ar'));
       }
       
       // Limit to user input count
       unassignedByGrade[g] = studentsOfGrade.slice(0, gradeCounts[g] || 0);
    });

    // Round-robin distribution
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

    // 2. Build the Croquis columns
    const newCommittees: CommitteePreview[] = [];
    
    committeeAllocations.forEach((allocation, index) => {
        const gradesInCommittee = Object.keys(allocation).filter(g => allocation[g].length > 0);
        
        // We want to interleave the grades in columns. e.g. [G1, G2, G3, G1, G2, G3]
        // First, split each grade's students into chunks (columns)
        const tempCols: Student[][] = [];
        
        gradesInCommittee.forEach(g => {
            const studentsForG = allocation[g];
            // Decide how many columns this grade needs. Let's say max 5-6 students per column.
            const columnsNeeded = Math.ceil(studentsForG.length / 5); 
            const chunkSize = Math.ceil(studentsForG.length / columnsNeeded);
            
            for (let i = 0; i < studentsForG.length; i += chunkSize) {
                const chunk = studentsForG.slice(i, i + chunkSize);
                tempCols.push(chunk);
            }
        });
        
        // Interleave the columns by grade
        const colsByGrade: Record<string, Student[][]> = {};
        tempCols.forEach(col => {
            const g = col[0].grade;
            if(!colsByGrade[g]) colsByGrade[g] = [];
            colsByGrade[g].push(col);
        });
        
        const finalCols: Student[][] = [];
        let added = true;
        
        // Custom sort for visual pleasing (e.g. mix 1st, 3rd, 2nd)
        // If we have 'الأول المتوسط', 'الثاني المتوسط', 'الثالث المتوسط'
        // Let's just use the keys in a specific interleaved order if possible
        const order = [...gradesInCommittee];
        if (order.length >= 3) {
           // Swap last two to mix it up (A, C, B instead of A, B, C)
           const temp = order[1];
           order[1] = order[2];
           order[2] = temp;
        }

        while(added) {
            added = false;
            order.forEach(g => {
                if(colsByGrade[g] && colsByGrade[g].length > 0) {
                    finalCols.push(colsByGrade[g].shift()!);
                    added = true;
                }
            });
        }
        
        // Assign seating numbers column by column
        let seatNum = 1;
        const committeeStudents: Student[] = [];
        
        finalCols.forEach(col => {
            col.forEach(s => {
                const assignedStudent = { ...s };
                assignedStudent.committee_number = (index + 1).toString();
                assignedStudent.seating_number = seatNum.toString();
                committeeStudents.push(assignedStudent);
                
                // Update the reference in the col array so the UI gets the seat number
                Object.assign(s, assignedStudent);
                
                seatNum++;
            });
        });
        
        newCommittees.push({
            number: (index + 1).toString(),
            students: committeeStudents,
            columns: finalCols
        });
    });

    setCommittees(newCommittees);
    alert('تم بناء الكروكي وتوزيع اللجان بنجاح!');
  };

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
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (grade: string) => {
    const colors = ['bg-blue-100 text-blue-800 border-blue-200', 'bg-emerald-100 text-emerald-800 border-emerald-200', 'bg-purple-100 text-purple-800 border-purple-200', 'bg-orange-100 text-orange-800 border-orange-200', 'bg-rose-100 text-rose-800 border-rose-200'];
    let hash = 0;
    for (let i = 0; i < grade.length; i++) hash = grade.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const totalSelectedStudents = Object.values(gradeCounts).reduce((a,b) => a + (b||0), 0);

  return (
    <div className="space-y-8 animate-fade-in text-right pb-20">
      <div className="bg-gradient-to-br from-[#020817] via-[#0a1628] to-[#050d1a] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-blue-900/30">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <LayoutGrid size={200} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-bold mb-6">
            <ShieldCheck size={16} />
            خوارزمية الكروكي المتطابقة (نظام الأعمدة)
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">توزيع اللجان والمقاعد 🪑</h2>
          <p className="text-slate-400 text-sm md:text-base font-bold max-w-2xl leading-relaxed">
            محاكاة كاملة لطريقة (الإكسل). يتم إدخال عدد اللجان، ليقوم النظام أوتوماتيكياً بالقسمة العادلة، وبناء "كروكي" للمقاعد على شكل مسارات (أعمدة) طولية تمنع الغش 100%.
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* إعدادات اللجان */}
            <div className="space-y-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                 <Settings2 className="text-blue-500" />
                 إعدادات التوزيع
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

            {/* إحصائية الطلاب */}
            <div className="space-y-4">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                 <Users className="text-blue-500" />
                 إحصائية وعدد الطلاب
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
              {committees.length > 0 ? 'إعادة بناء الكروكي' : 'توليد كروكي اللجان'}
            </button>
            
            {committees.length > 0 && (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black text-base shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                حفظ الكروكي في قاعدة البيانات
              </button>
            )}
        </div>
      </div>

      {/* عرض الكروكي */}
      {committees.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-slate-800">
            <LayoutGrid className="text-blue-600" />
            <h3 className="text-2xl font-black">المعاينة البصرية للكروكي ({committees.length} لجان)</h3>
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
                        {committee.students.length} طالب <ArrowLeftRight size={14} className="mx-1" /> {committee.columns.length} مسارات
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 overflow-x-auto">
                  <div className="flex justify-between gap-3 min-w-max">
                    {committee.columns.map((col, cIdx) => (
                        <div key={cIdx} className="flex flex-col gap-2 w-28 shrink-0">
                           <div className="text-center font-black text-xs bg-slate-100 text-slate-600 py-2 rounded-xl mb-1 border border-slate-200">
                             مسار {cIdx + 1}
                           </div>
                           {col.map(student => (
                               <div 
                                 key={student.id} 
                                 className={`rounded-2xl border p-3 text-center relative group cursor-help transition-all hover:-translate-y-1 hover:shadow-md ${getStatusColor(student.grade)}`}
                               >
                                  <div className="absolute top-1 right-2 text-[10px] opacity-60 font-black">{student.seating_number}</div>
                                  <div className="mt-2 text-sm font-black truncate">{student.grade.split(' ')[0]}</div>
                                  <div className="text-[10px] font-bold mt-1 bg-white/50 py-0.5 px-2 rounded-full inline-block">{student.section}</div>
                                  
                                  {/* Tooltip */}
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
  );
};

export default SeatingPlanner;
