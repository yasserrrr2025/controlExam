
import React, { useState } from 'react';
import { Student } from '../../types';
import { parseExcel } from '../../services/excelService';
import { Upload, Phone, Search, Hash, AlertTriangle } from 'lucide-react';

interface Props {
  students: Student[];
  setStudents: any;
  onAlert: any;
}

const AdminStudentsManager: React.FC<Props> = ({ students, setStudents, onAlert }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  const normalizeText = (text: string) => {
    if (!text) return '';
    return text.trim()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ');
  };

  const handlePrimaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await parseExcel(file);
        
        const newStudents: Student[] = data.map((row: any) => {
          const nId = String(row['رقم الهوية'] || row['الهوية'] || row['السجل المدني'] || '').trim();
          const existingStudent = students.find(s => s.national_id === nId);
          
          return {
            // استخدام UUID حقيقي بدلاً من s-
            id: existingStudent?.id || crypto.randomUUID(),
            national_id: nId,
            name: String(row['الاسم'] || row['اسم الطالب'] || '').trim(),
            grade: String(row['الصف'] || row['المرحلة'] || ''),
            section: String(row['الفصل'] || row['الشعبة'] || ''),
            committee_number: String(row['اللجنة'] || row['رقم اللجنة'] || ''),
            seating_number: String(row['رقم الجلوس'] || row['رقم جلوس'] || row['جلوس'] || row['Seating Number'] || '').trim(),
            parent_phone: existingStudent?.parent_phone || '', 
          };
        });

        setStudents(newStudents);
        onAlert(`تم تحديث بيانات ${newStudents.length} طالب بنجاح.`);
      } catch (err: any) { 
        onAlert(err); 
      }
    }
    e.target.value = '';
  };

  const handlePhoneMerge = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (students.length === 0) { onAlert('يرجى رفع كشوف اللجان أولاً قبل دمج الجوالات'); return; }
    
    setIsMerging(true);
    try {
      const phoneData = await parseExcel(file);
      let matchCount = 0;
      
      const updated = students.map((s: Student) => {
        const sId = s.national_id.replace(/\D/g, '');
        const sNameNorm = normalizeText(s.name);

        const match = phoneData.find((p: any) => {
          const pId = String(p['رقم الهوية'] || p['الهوية'] || p['السجل المدني'] || p['ID'] || '').replace(/\D/g, '');
          const pName = normalizeText(String(p['الاسم'] || p['اسم الطالب'] || p['Name'] || ''));
          
          if (sId !== '' && pId === sId) return true;
          if (sNameNorm.split(' ').length >= 2 && pName === sNameNorm) return true;
          return false;
        });

        if (match) {
          matchCount++;
          const phone = String(match['الجوال'] || match['رقم جوال'] || match['رقم الجوال'] || match['جوال ولي الامر'] || match['جوال الطالب'] || match['Phone'] || '').trim();
          return { ...s, parent_phone: phone };
        }
        return s;
      });

      setStudents(updated);
      onAlert(`اكتمل الدمج! تم ربط ${matchCount} رقم جوال بنجاح.`);
    } catch (err: any) { 
      onAlert(err); 
    } finally { setIsMerging(false); }
    e.target.value = '';
  };

  const filtered = students.filter(s => s.name.includes(searchTerm) || s.national_id.includes(searchTerm));

  return (
    <div className="space-y-8 animate-fade-in text-right pb-20">
       <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">إدارة بيانات الطلاب والجوالات</h2>
            <p className="text-slate-400 font-bold text-sm mt-1 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500"/> الرفع الجديد سيقوم بتحديث البيانات وحذف أي طالب غير موجود في الملف.
            </p>
          </div>
          <div className="flex gap-4">
             <label className="bg-slate-900 text-white p-4 rounded-2xl cursor-pointer flex items-center gap-3 shadow-xl hover:bg-black transition-all font-black text-sm">
               <Upload size={20}/> تحديث كشوف اللجان
               <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handlePrimaryUpload} />
             </label>
             <label className={`bg-blue-600 text-white p-4 rounded-2xl cursor-pointer flex items-center gap-3 shadow-xl hover:bg-blue-700 transition-all font-black text-sm ${isMerging ? 'animate-pulse' : ''}`}>
               <Phone size={20}/> دمج الجوالات
               <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handlePhoneMerge} />
             </label>
          </div>
       </div>

       <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border">
          <div className="p-8 border-b bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="بحث باسم الطالب أو الهوية..." className="w-full pr-12 py-3 bg-white border rounded-xl font-bold outline-none focus:border-blue-600 shadow-sm" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
             </div>
             <div className="flex gap-10 font-black">
                <div className="text-center"><p className="text-[10px] text-slate-400 uppercase mb-1">إجمالي الطلاب</p><p className="text-2xl">{students.length}</p></div>
                <div className="text-center"><p className="text-[10px] text-slate-400 uppercase mb-1">بأرقام جلوس</p><p className="text-2xl text-blue-600">{students.filter(s=>s.seating_number).length}</p></div>
                <div className="text-center"><p className="text-[10px] text-slate-400 uppercase mb-1">بأرقام جوال</p><p className="text-2xl text-emerald-600">{students.filter(s=>s.parent_phone).length}</p></div>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[800px]">
               <thead className="bg-slate-50 border-b font-black text-[10px] text-slate-400 uppercase tracking-widest">
                 <tr>
                   <th className="p-8">اسم الطالب</th>
                   <th className="p-8">الصف/الفصل</th>
                   <th className="p-8">رقم الجلوس</th>
                   <th className="p-8">اللجنة</th>
                   <th className="p-8">رقم الجوال</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 font-bold">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center text-slate-300 italic font-bold">لا يوجد طلاب مطابقين للبحث أو لم يتم الرفع بعد.</td></tr>
                  ) : (
                    filtered.map((s) => (
                      <tr key={s.id} className="hover:bg-blue-50/20 transition-all group">
                         <td className="p-8 font-black text-slate-800">
                           {s.name}
                           <br/>
                           <span className="text-[10px] font-mono text-slate-400">ID: {s.national_id}</span>
                         </td>
                         <td className="p-8 text-slate-500">{s.grade} - {s.section}</td>
                         <td className="p-8">
                            {s.seating_number ? (
                              <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-xl text-xs flex items-center gap-2 w-fit border border-blue-100 font-black">
                                <Hash size={12}/> {s.seating_number}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic text-[10px]">-- غير متوفر --</span>
                            )}
                         </td>
                         <td className="p-8 font-black text-slate-700">لجنة {s.committee_number}</td>
                         <td className="p-8">
                           {s.parent_phone ? (
                             <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-xs flex items-center gap-2 w-fit border border-emerald-100">
                               <Phone size={12}/> {s.parent_phone}
                             </span>
                           ) : (
                             <span className="text-red-300 italic text-[10px]">-- بانتظار الدمج --</span>
                           )}
                         </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
          </div>
       </div>
    </div>
  );
};

export default AdminStudentsManager;
