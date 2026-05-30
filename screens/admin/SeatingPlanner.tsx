import React, { useState, useEffect, useMemo } from 'react';
import { Users, Save, RefreshCw, LayoutGrid, AlertCircle, Settings2, ShieldCheck, Info, Loader2 } from 'lucide-react';
import { db } from '../../supabase';
import { Student } from '../../types';
import toast from 'react-hot-toast';

interface CommitteePreview {
  number: string;
  students: Student[];
}

const SeatingPlanner = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [capacity, setCapacity] = useState<number>(20);
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
    } catch (err) {
      toast.error('فشل في جلب بيانات الطلاب');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSeating = () => {
    if (students.length === 0) {
      toast.error('لا يوجد طلاب لتوزيعهم');
      return;
    }
    if (capacity < 5) {
      toast.error('سعة اللجنة يجب أن تكون 5 على الأقل');
      return;
    }

    // Smart Algorithm: Group by Grade + Section
    // E.g., '1-أ', '1-ب', '2-أ'
    const groups: { [key: string]: Student[] } = {};
    const unassigned = [...students];
    
    // Sort students by name to keep some order
    unassigned.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    unassigned.forEach(s => {
      const key = `${s.grade}-${s.section}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    const groupKeys = Object.keys(groups);
    let currentCommitteeIndex = 1;
    let currentSeatNumber = 1;
    
    const newCommittees: CommitteePreview[] = [];
    let currentCommittee: Student[] = [];

    // Helper to get next available student from the "longest" remaining group 
    // to avoid leaving a huge chunk of same-section students at the very end
    const getNextStudent = (lastGroupKey: string | null): Student | null => {
      // Sort keys by remaining length descending
      const availableKeys = groupKeys
        .filter(k => groups[k].length > 0)
        .sort((a, b) => groups[b].length - groups[a].length);
      
      if (availableKeys.length === 0) return null;
      
      // Try to pick a different group than the last one if possible
      let chosenKey = availableKeys[0];
      if (chosenKey === lastGroupKey && availableKeys.length > 1) {
        chosenKey = availableKeys[1];
      }
      
      return groups[chosenKey].shift() || null;
    };

    let totalRemaining = unassigned.length;
    let lastKey: string | null = null;

    while (totalRemaining > 0) {
      const student = getNextStudent(lastKey);
      if (!student) break; // Should not happen if totalRemaining > 0
      
      lastKey = `${student.grade}-${student.section}`;
      
      const assignedStudent = {
        ...student,
        committee_number: currentCommitteeIndex.toString(),
        seating_number: currentSeatNumber.toString()
      };
      
      currentCommittee.push(assignedStudent);
      totalRemaining--;
      currentSeatNumber++;

      // If committee is full, wrap up and start next
      if (currentCommittee.length === capacity) {
        newCommittees.push({
          number: currentCommitteeIndex.toString(),
          students: currentCommittee
        });
        currentCommitteeIndex++;
        currentCommittee = [];
        currentSeatNumber = 1;
      }
    }

    // Push the last partial committee if any
    if (currentCommittee.length > 0) {
      newCommittees.push({
        number: currentCommitteeIndex.toString(),
        students: currentCommittee
      });
    }

    setCommittees(newCommittees);
    toast.success('تم بناء التوزيع الذكي بنجاح! راجع اللجان قبل الاعتماد.');
  };

  const handleSave = async () => {
    if (committees.length === 0) return;
    
    try {
      setIsSaving(true);
      // Flatten committees back into a single array
      const updatedStudents = committees.flatMap(c => c.students);
      
      // Upsert to database
      await db.students.upsert(updatedStudents);
      toast.success('تم اعتماد التوزيع وتحديث أرقام الجلوس بنجاح!');
      
      // Update local state
      setStudents(updatedStudents);
    } catch (err) {
      toast.error('حدث خطأ أثناء الحفظ');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (grade: string) => {
    const colors = ['bg-blue-100 text-blue-700 border-blue-200', 'bg-emerald-100 text-emerald-700 border-emerald-200', 'bg-purple-100 text-purple-700 border-purple-200', 'bg-orange-100 text-orange-700 border-orange-200', 'bg-rose-100 text-rose-700 border-rose-200'];
    // hash string to color
    let hash = 0;
    for (let i = 0; i < grade.length; i++) hash = grade.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-8 animate-fade-in text-right pb-20">
      <div className="bg-gradient-to-br from-[#020817] via-[#0a1628] to-[#050d1a] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-blue-900/30">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <LayoutGrid size={200} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-bold mb-6">
            <ShieldCheck size={16} />
            خوارزمية منع التكدس الذكية
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">المهندس الذكي لتوزيع المقاعد 🪑</h2>
          <p className="text-slate-400 text-sm md:text-base font-bold max-w-2xl leading-relaxed">
            تقوم هذه الخوارزمية بتوزيع {students.length} طالب على اللجان تلقائياً. 
            تضمن لك الخوارزمية (تباعد الطلاب من نفس الفصل) لتقليل فرص الغش، وتقسيمهم بشكل متوازن على المقاعد حسب سعة كل لجنة.
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-black text-slate-700 flex items-center gap-2">
              <Settings2 size={16} className="text-blue-500" />
              سعة اللجنة الواحدة (عدد المقاعد)
            </label>
            <input 
              type="number" 
              min="5" 
              max="100"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 20)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-black text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-left dir-ltr"
            />
          </div>
          <div className="flex-1 w-full flex gap-3">
             <button 
               onClick={generateSeating}
               disabled={isLoading}
               className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-xl font-black text-base shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
             >
               <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
               {committees.length > 0 ? 'إعادة التوزيع' : 'بدء التوزيع الذكي'}
             </button>
             
             {committees.length > 0 && (
               <button 
                 onClick={handleSave}
                 disabled={isSaving}
                 className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black text-base shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                 حفظ واعتماد التوزيع
               </button>
             )}
          </div>
        </div>
      </div>

      {committees.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-slate-800">
            <LayoutGrid className="text-blue-600" />
            <h3 className="text-2xl font-black">المعاينة البصرية ({committees.length} لجان)</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {committees.map((committee) => (
              <div key={committee.number} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-[1.2rem] flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/20">
                      {committee.number}
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-slate-800">لجنة رقم {committee.number}</h4>
                      <p className="text-slate-500 text-xs font-bold">{committee.students.length} طالب</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Visual Grid representing seats */}
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {committee.students.map((student) => (
                      <div 
                        key={student.id} 
                        className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 text-center group relative cursor-help transition-all hover:scale-110 hover:shadow-lg ${getStatusColor(student.grade)}`}
                        title={`${student.name} - ${student.grade} (${student.section})`}
                      >
                        <span className="text-[10px] opacity-70 font-bold mb-0.5">{student.seating_number}</span>
                        <span className="text-xs font-black truncate w-full">{student.grade.substring(0, 3)}</span>
                        <span className="text-[10px] font-bold mt-0.5">{student.section}</span>
                        
                        {/* Tooltip */}
                        <div className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bottom-full mb-2 bg-slate-900 text-white text-xs p-2 rounded-xl whitespace-nowrap z-20 shadow-xl">
                           {student.name}
                        </div>
                      </div>
                    ))}
                    {/* Fill empty seats visually if committee isn't full */}
                    {Array.from({ length: capacity - committee.students.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
                         <span className="text-slate-300 text-xs font-bold">فارغ</span>
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
