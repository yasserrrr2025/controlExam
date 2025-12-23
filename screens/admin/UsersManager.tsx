
import React, { useState, useMemo } from 'react';
import { User, UserRole, Student } from '../../types';
import { ROLES_ARABIC, APP_CONFIG } from '../../constants';
import { parseExcel } from '../../services/excelService';
import { Upload, Search, Trash2, Layers, Check, Plus } from 'lucide-react';

interface Props {
  users: User[];
  setUsers: any;
  onAlert: any;
  students: Student[];
}

const AdminUsersManager: React.FC<Props> = ({ users, setUsers, onAlert, students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const availableGrades = useMemo(() => Array.from(new Set(students.map(s => s.grade))).filter(Boolean).sort(), [students]);
  const availableCommittees = useMemo(() => Array.from(new Set(students.map(s => s.committee_number))).filter(Boolean).sort((a,b) => Number(a)-Number(b)), [students]);

  const updateRole = (userId: string, role: UserRole) => {
    setUsers((prev: User[]) => prev.map(u => u.id === userId ? { ...u, role } : u));
    onAlert(`تم تحديث الدور الوظيفي بنجاح`);
  };

  const handleStaffUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await parseExcel(file);
        
        const processedUsers: User[] = data.map((row: any) => {
          const nId = String(row['رقم الهوية'] || row['الهوية'] || row['السجل المدني'] || '').trim();
          // البحث عن المعلم في القائمة الحالية لمنع التكرار
          const existingUser = users.find(u => u.national_id === nId);
          
          return {
            // استخدام المعرف القديم إذا وجد، أو إنشاء واحد جديد
            id: existingUser?.id || crypto.randomUUID(),
            national_id: nId,
            full_name: String(row['الاسم'] || row['اسم المعلم'] || row['الاسم الكامل'] || '').trim(),
            phone: String(row['الجوال'] || row['رقم الجوال'] || '').trim(),
            role: (row['الدور'] || existingUser?.role || 'PROCTOR') as UserRole,
            assigned_committees: row['اللجان'] ? String(row['اللجان']).split(',') : (existingUser?.assigned_committees || []),
            assigned_grades: row['الصفوف'] ? String(row['الصفوف']).split(',') : (existingUser?.assigned_grades || []),
          };
        });

        // تصفية السجلات الفارغة من الهوية
        const validUsers = processedUsers.filter(u => u.national_id.length > 5);
        
        if (validUsers.length > 0) {
          setUsers(validUsers);
          onAlert(`تم استيراد وتحديث بيانات ${validUsers.length} من الهيئة التعليمية بنجاح.`);
        }
      } catch (err: any) { 
        onAlert(err); 
      }
    }
    e.target.value = '';
  };

  const toggleGrade = (userId: string, grade: string) => {
    setUsers((prev: User[]) => prev.map(u => {
      if (u.id === userId) {
        const current = u.assigned_grades || [];
        const updated = current.includes(grade) ? current.filter(g => g !== grade) : [...current, grade];
        return { ...u, assigned_grades: updated };
      }
      return u;
    }));
  };

  const toggleCommittee = (userId: string, committee: string) => {
    setUsers((prev: User[]) => prev.map(u => {
      if (u.id === userId) {
        const current = u.assigned_committees || [];
        const updated = current.includes(committee) ? current.filter(c => c !== committee) : [...current, committee];
        return { ...u, assigned_committees: updated };
      }
      return u;
    }));
  };

  const filtered = users.filter((u: any) => u.full_name.includes(searchTerm) || u.national_id.includes(searchTerm));

  return (
    <div className="space-y-10 animate-fade-in text-right pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">إدارة الهيئة التعليمية والصلاحيات</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <label className="bg-slate-900 text-white px-6 py-4 rounded-2xl cursor-pointer flex items-center gap-3 shadow-xl hover:bg-black transition-all">
            <Upload size={20}/> 
            <span className="font-black text-sm">رفع الهيئة التعليمية (Excel)</span>
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleStaffUpload} />
          </label>
          <div className="relative w-full md:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="بحث..." className="w-full pr-12 pl-4 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold shadow-sm outline-none focus:border-blue-600" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8">
        {filtered.map((u: User) => (
          <div key={u.id} className="bg-white p-10 rounded-[3rem] shadow-2xl border-2 border-slate-50 flex flex-col items-stretch gap-10 transition-all">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
              <div className="flex items-center gap-8 text-right flex-1">
                <div className="w-20 h-20 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shrink-0">
                  <img src={APP_CONFIG.LOGO_URL} alt="User" className="w-12 h-12 object-contain invert" />
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-black text-slate-900 mb-1">{u.full_name}</h4>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 italic">
                    <span>الهوية: {u.national_id}</span>
                    <span className="text-blue-600 bg-blue-50 px-3 py-0.5 rounded-full font-black not-italic">{ROLES_ARABIC[u.role] || u.role}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center lg:w-96 p-2 bg-slate-50 rounded-2xl border border-dashed">
                {Object.keys(ROLES_ARABIC).map(role => (
                  <button key={role} onClick={() => updateRole(u.id, role as UserRole)} className={`px-4 py-2.5 rounded-xl font-black text-[10px] transition-all ${u.role === role ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-blue-50'}`}>{ROLES_ARABIC[role]}</button>
                ))}
              </div>
              <button onClick={() => setUsers((p:any) => p.filter((x:any)=>x.id!==u.id))} className="text-red-200 hover:text-red-600 transition-all p-4 hover:scale-110 shrink-0"><Trash2 size={24}/></button>
            </div>
            {(u.role === 'ASSISTANT_CONTROL' || u.role === 'CONTROL') && (
              <div className="bg-blue-50/30 p-8 rounded-[2.5rem] border border-blue-100/50">
                <h5 className="font-black text-slate-800 text-xl mb-6 flex items-center gap-3"><Layers size={20} className="text-blue-600"/> {u.role === 'ASSISTANT_CONTROL' ? 'إسناد لجان المساعد' : 'إسناد صفوف الكنترول'}</h5>
                <div className="flex flex-wrap gap-3">
                  {u.role === 'CONTROL' ? (
                    availableGrades.map(grade => {
                      const isAssigned = u.assigned_grades?.includes(grade);
                      return <button key={grade} onClick={() => toggleGrade(u.id, grade)} className={`px-6 py-3 rounded-2xl font-black text-sm transition-all border-2 ${isAssigned ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-200'}`}>{isAssigned ? <Check size={16} className="inline ml-2"/> : <Plus size={16} className="inline ml-2"/>}{grade}</button>;
                    })
                  ) : (
                    availableCommittees.map(committee => {
                      const isAssigned = u.assigned_committees?.includes(committee);
                      return <button key={committee} onClick={() => toggleCommittee(u.id, committee)} className={`px-5 py-3 rounded-2xl font-black text-sm transition-all border-2 ${isAssigned ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}>{isAssigned ? <Check size={16} className="inline ml-2"/> : <Plus size={16} className="inline ml-2"/>}لجنة {committee}</button>;
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsersManager;
