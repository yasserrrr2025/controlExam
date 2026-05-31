import React, { useState, useEffect, useMemo } from 'react';
import { PackageSearch, Plus, Search, Printer, Calendar, Tag, Layers, UserCircle, Save, Trash2, X } from 'lucide-react';
import { ArchiveBox, Student } from '../../types';

interface Props {
  students: Student[];
}

export const ArchiveBoxesManager: React.FC<Props> = ({ students }) => {
  const [boxes, setBoxes] = useState<ArchiveBox[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedBox, setSelectedBox] = useState<ArchiveBox | null>(null);

  // Form State
  const [newBox, setNewBox] = useState<Partial<ArchiveBox>>({
    box_number: '',
    grade: '',
    subject: '',
    exam_date: new Date().toISOString().split('T')[0],
    committees: [],
  });
  
  // Available committees based on selected grade
  const availableCommittees = useMemo(() => {
    if (!newBox.grade) return [];
    // Find all unique committees for this grade from students list
    const gradeStudents = students.filter(s => s.grade === newBox.grade && s.committee_number);
    return Array.from(new Set(gradeStudents.map(s => s.committee_number))).sort((a, b) => Number(a) - Number(b));
  }, [students, newBox.grade]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('control_archive_boxes');
      if (stored) setBoxes(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load boxes', e);
    }
  }, []);

  const saveBoxes = (newBoxes: ArchiveBox[]) => {
    setBoxes(newBoxes);
    localStorage.setItem('control_archive_boxes', JSON.stringify(newBoxes));
  };

  const handleAddBox = () => {
    if (!newBox.box_number || !newBox.grade || !newBox.subject || !newBox.exam_date) return;
    
    const box: ArchiveBox = {
      id: crypto.randomUUID(),
      box_number: newBox.box_number,
      grade: newBox.grade,
      subject: newBox.subject,
      exam_date: newBox.exam_date,
      committees: newBox.committees || [],
      created_at: new Date().toISOString()
    };
    
    saveBoxes([...boxes, box]);
    setIsAdding(false);
    setNewBox({
      box_number: '',
      grade: '',
      subject: '',
      exam_date: new Date().toISOString().split('T')[0],
      committees: [],
    });
  };

  const handleDeleteBox = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الصندوق؟')) {
      saveBoxes(boxes.filter(b => b.id !== id));
      if (selectedBox?.id === id) setSelectedBox(null);
    }
  };

  const filteredBoxes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return boxes.filter(b => 
      b.box_number.toLowerCase().includes(q) ||
      b.grade.toLowerCase().includes(q) ||
      b.subject.toLowerCase().includes(q) ||
      b.exam_date.includes(q)
    ).sort((a, b) => b.created_at!.localeCompare(a.created_at!));
  }, [boxes, searchTerm]);

  const boxStudents = useMemo(() => {
    if (!selectedBox) return [];
    return students.filter(s => 
      s.grade === selectedBox.grade && 
      s.committee_number && 
      selectedBox.committees.includes(s.committee_number)
    ).sort((a, b) => {
      if (a.committee_number !== b.committee_number) return Number(a.committee_number) - Number(b.committee_number);
      return a.name.localeCompare(b.name, 'ar');
    });
  }, [selectedBox, students]);

  const handlePrintBarcode = (box: ArchiveBox) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>طباعة ملصق الصندوق ${box.box_number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
            .label-container { width: 100%; max-width: 600px; border: 4px solid #0f172a; border-radius: 24px; padding: 40px; text-align: center; position: relative; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; }
            .school-info { text-align: right; font-weight: bold; font-size: 14px; }
            .title { font-size: 24px; font-weight: 900; }
            .box-number { font-size: 80px; font-weight: 900; letter-spacing: -2px; margin: 20px 0; color: #0f172a; line-height: 1; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: right; background: #f8fafc; padding: 20px; border-radius: 16px; margin-bottom: 30px; }
            .detail-item { font-size: 18px; font-weight: bold; }
            .detail-label { font-size: 12px; color: #64748b; display: block; margin-bottom: 4px; }
            .committees { background: #0f172a; color: white; padding: 20px; border-radius: 16px; font-size: 20px; font-weight: bold; margin-bottom: 30px; }
            .barcode { font-family: monospace; font-size: 24px; letter-spacing: 10px; opacity: 0.5; margin-top: 20px; }
            @media print {
               body { height: auto; }
               .label-container { border: 2px solid #000; box-shadow: none; max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="header">
              <div class="title">صندوق أرشيف اختبارات</div>
              <div class="school-info">
                مدرسة عماد الدين زنكي
              </div>
            </div>
            
            <div class="detail-label">رقم الصندوق</div>
            <div class="box-number">${box.box_number}</div>
            
            <div class="details">
              <div class="detail-item"><span class="detail-label">المادة</span>${box.subject}</div>
              <div class="detail-item"><span class="detail-label">الصف</span>${box.grade}</div>
              <div class="detail-item" style="grid-column: span 2"><span class="detail-label">تاريخ الاختبار</span>${new Date(box.exam_date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            
            <div class="committees">
              اللجان: ${box.committees.length ? box.committees.join(' ، ') : 'لا يوجد'}
            </div>
            
            <div class="barcode">
              *${box.id.split('-')[0].toUpperCase()}*
            </div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
  };

  return (
    <div className="space-y-8 animate-fade-in text-right">
      <div className="bg-slate-950 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white flex flex-col md:flex-row items-center justify-between gap-6 border-b-8 border-indigo-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="bg-indigo-500 p-5 rounded-3xl shadow-xl"><PackageSearch size={40} /></div>
          <div>
            <h2 className="text-4xl font-black tracking-tighter">أرشيف الصناديق</h2>
            <p className="text-indigo-200 font-bold mt-1">نظام إدارة أوراق الاختبارات الميدانية والصناديق</p>
          </div>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-white text-slate-950 px-8 py-4 rounded-[2rem] font-black flex items-center gap-3 hover:bg-indigo-50 transition-all shadow-xl active:scale-95 relative z-10">
          <Plus size={24}/> إضافة صندوق جديد
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 relative">
             <Search size={22} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="ابحث برقم الصندوق، المادة، الصف، أو التاريخ..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-6 pr-16 py-4 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-lg outline-none focus:border-indigo-500 transition-all"
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBoxes.map(box => (
              <div 
                key={box.id} 
                onClick={() => setSelectedBox(box)}
                className={\`bg-white rounded-[2.5rem] p-6 border-2 transition-all cursor-pointer group shadow-xl hover:shadow-2xl hover:-translate-y-1 \${selectedBox?.id === box.id ? 'border-indigo-500 shadow-indigo-200' : 'border-slate-100 hover:border-indigo-300'}\`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-slate-950 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                    {box.box_number}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePrintBarcode(box); }} 
                    className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                    title="طباعة ملصق"
                  >
                    <Printer size={20}/>
                  </button>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-2 truncate">{box.subject}</h3>
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-bold text-slate-600 flex items-center gap-2"><Layers size={16} className="text-slate-400"/> {box.grade}</p>
                  <p className="text-sm font-bold text-slate-600 flex items-center gap-2"><Calendar size={16} className="text-slate-400"/> {box.exam_date}</p>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black text-slate-400 uppercase">اللجان:</span>
                  {box.committees.map(c => (
                     <span key={c} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-black">{c}</span>
                  ))}
                  {box.committees.length === 0 && <span className="text-xs text-slate-400 font-bold">غير محدد</span>}
                </div>
              </div>
            ))}
            
            {filteredBoxes.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-400 font-black">
                <PackageSearch size={64} className="mx-auto mb-4 opacity-20" />
                <p>لا توجد صناديق مطابقة للبحث.</p>
              </div>
            )}
          </div>
        </div>

        {selectedBox && (
          <div className="w-full xl:w-[450px] shrink-0 animate-slide-right">
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden sticky top-8">
              <div className="bg-indigo-600 p-8 text-white relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                 <div className="flex justify-between items-start relative z-10">
                    <div>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">تفاصيل الصندوق</span>
                      <h3 className="text-3xl font-black">صندوق {selectedBox.box_number}</h3>
                    </div>
                    <button onClick={() => handleDeleteBox(selectedBox.id)} className="p-3 bg-red-500/20 text-white hover:bg-red-500 rounded-xl transition-all"><Trash2 size={20}/></button>
                 </div>
              </div>
              
              <div className="p-8">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">عدد الطلاب بالصندوق</p>
                    <p className="text-3xl font-black text-indigo-600">{boxStudents.length}</p>
                  </div>
                  <div className="text-left">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">عدد اللجان</p>
                     <p className="text-3xl font-black text-slate-900">{selectedBox.committees.length}</p>
                  </div>
                </div>

                <div className="space-y-4">
                   <h4 className="font-black text-slate-900 flex items-center gap-2"><UserCircle size={18} className="text-indigo-500"/> أسماء الطلاب داخل الصندوق</h4>
                   <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                     {boxStudents.map(student => (
                       <div key={student.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:bg-indigo-50 hover:border-indigo-100 transition-colors">
                         <span className="font-black text-sm text-slate-800">{student.name}</span>
                         <span className="text-[10px] font-black text-white bg-slate-900 px-2 py-1 rounded-lg">لجنة {student.committee_number}</span>
                       </div>
                     ))}
                     {boxStudents.length === 0 && (
                       <p className="text-center text-slate-400 font-bold py-6 text-sm">لم يتم العثور على طلاب للجان المحددة في هذا الصف.</p>
                     )}
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 w-full max-w-2xl shadow-2xl relative animate-slide-up border-b-[12px] border-indigo-600">
            <button onClick={() => setIsAdding(false)} className="absolute top-6 left-6 p-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full transition-all"><X size={24}/></button>
            
            <h3 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Plus size={28}/></div>
              تسجيل صندوق جديد
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-black text-slate-700 mb-2">رقم الصندوق / الكود</label>
                   <input type="text" value={newBox.box_number} onChange={e => setNewBox({...newBox, box_number: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black focus:border-indigo-500 outline-none" placeholder="مثال: A-1" />
                 </div>
                 <div>
                   <label className="block text-sm font-black text-slate-700 mb-2">تاريخ الاختبار</label>
                   <input type="date" value={newBox.exam_date} onChange={e => setNewBox({...newBox, exam_date: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black focus:border-indigo-500 outline-none" />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-black text-slate-700 mb-2">اسم المادة</label>
                   <input type="text" value={newBox.subject} onChange={e => setNewBox({...newBox, subject: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black focus:border-indigo-500 outline-none" placeholder="مثال: لغتي الخالدة" />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-black text-slate-700 mb-2">الصف الدراسي</label>
                   <select value={newBox.grade} onChange={e => {
                      setNewBox({...newBox, grade: e.target.value, committees: []});
                   }} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black focus:border-indigo-500 outline-none">
                     <option value="">اختر الصف...</option>
                     <option value="الاول المتوسط">الاول المتوسط</option>
                     <option value="الثاني المتوسط">الثاني المتوسط</option>
                     <option value="الثالث المتوسط">الثالث المتوسط</option>
                   </select>
                 </div>
              </div>
              
              {newBox.grade && (
                <div className="border-t border-slate-100 pt-6 animate-fade-in">
                   <label className="block text-sm font-black text-slate-700 mb-3">حدد اللجان التابعة للصف ({newBox.grade}) الموجودة بالصندوق:</label>
                   <div className="flex flex-wrap gap-3">
                     {availableCommittees.map(c => {
                       const isSelected = newBox.committees?.includes(c);
                       return (
                         <button
                           key={c}
                           onClick={() => {
                             const current = newBox.committees || [];
                             if (isSelected) {
                               setNewBox({...newBox, committees: current.filter(x => x !== c)});
                             } else {
                               setNewBox({...newBox, committees: [...current, c].sort((a,b)=>Number(a)-Number(b))});
                             }
                           }}
                           className={\`px-6 py-3 rounded-2xl font-black text-sm transition-all border-2 \${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}\`}
                         >
                           لجنة {c}
                         </button>
                       );
                     })}
                     {availableCommittees.length === 0 && <p className="text-sm font-bold text-slate-400">لا توجد لجان مسجلة لهذا الصف في بيانات الطلاب.</p>}
                   </div>
                </div>
              )}
              
              <button 
                onClick={handleAddBox}
                disabled={!newBox.box_number || !newBox.grade || !newBox.subject || !newBox.exam_date}
                className="w-full py-5 rounded-[2rem] bg-indigo-600 text-white font-black text-xl flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all mt-8 active:scale-95"
              >
                <Save size={24}/> حفظ بيانات الصندوق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
