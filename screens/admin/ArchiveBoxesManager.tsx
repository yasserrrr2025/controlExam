import React, { useState, useEffect, useMemo } from 'react';
import { PackageSearch, Plus, Search, Printer, Calendar, Tag, Layers, UserCircle, Save, Trash2, X, RefreshCw, Archive, CheckSquare, Square } from 'lucide-react';
import { ArchiveBox, Student, ExamSchedule, DeliveryLog, Supervision, User } from '../../types';
import { db } from '../../supabase';

interface Props {
  students: Student[];
  examSchedule?: ExamSchedule[];
  deliveryLogs?: DeliveryLog[];
  supervisions?: Supervision[];
  users?: User[];
}

export const ArchiveBoxesManager: React.FC<Props> = ({
  students,
  examSchedule = [],
  deliveryLogs = [],
  supervisions = [],
  users = [],
}) => {
  const [boxes, setBoxes] = useState<ArchiveBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedBox, setSelectedBox] = useState<ArchiveBox | null>(null);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<ArchiveBox>>({
    box_number: '',
    grade: '',
    subject: '',
    exam_date: new Date().toISOString().split('T')[0],
    committees: [],
  });

  // All unique grades from students
  const allGrades = useMemo(() =>
    [...new Set(students.map(s => s.grade).filter(Boolean))].sort(),
    [students]
  );

  // All unique dates from exam schedule for the date picker
  const examDates = useMemo(() =>
    [...new Set(examSchedule.map(e => e.exam_date).filter(Boolean))].sort(),
    [examSchedule]
  );

  // Subjects available on the selected date (for auto-fill)
  const subjectsOnDate = useMemo(() => {
    if (!form.exam_date) return [];
    return examSchedule.filter(e => {
      if (!e.exam_date) return false;
      return e.exam_date === form.exam_date ||
        e.exam_date.startsWith(form.exam_date) ||
        form.exam_date.startsWith(e.exam_date.slice(0, 10));
    });
  }, [examSchedule, form.exam_date]);

  // Committees available for the selected grade
  const availableCommittees = useMemo(() => {
    if (!form.grade) return [];
    const gradeStudents = students.filter(s => s.grade === form.grade && s.committee_number);
    return [...new Set(gradeStudents.map(s => String(s.committee_number)))].sort((a, b) => Number(a) - Number(b));
  }, [students, form.grade]);

  // Auto-fill subject when grade + date selected
  useEffect(() => {
    if (form.grade && form.exam_date && subjectsOnDate.length > 0) {
      const matchingExam = subjectsOnDate.find(e =>
        !e.grades || e.grades.length === 0 || e.grades.includes(form.grade || '')
      ) || subjectsOnDate[0];
      if (matchingExam) {
        setForm(prev => ({ ...prev, subject: matchingExam.subject }));
      }
    }
  }, [form.grade, form.exam_date, subjectsOnDate]);

  // Students inside selected box
  const boxStudents = useMemo(() => {
    if (!selectedBox) return [];
    return students.filter(s =>
      s.grade === selectedBox.grade &&
      s.committee_number &&
      selectedBox.committees.includes(String(s.committee_number))
    ).sort((a, b) => {
      const ca = Number(a.committee_number), cb = Number(b.committee_number);
      if (ca !== cb) return ca - cb;
      return a.name.localeCompare(b.name, 'ar');
    });
  }, [selectedBox, students]);

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const loadBoxes = async () => {
    setLoading(true);
    try {
      const data = await db.archiveBoxes.getAll();
      setBoxes(data as ArchiveBox[]);
    } catch (e: any) {
      showAlert('فشل تحميل الصناديق: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBoxes(); }, []);

  const handleAddBox = async () => {
    if (!form.box_number || !form.grade || !form.subject || !form.exam_date) {
      showAlert('يرجى تعبئة جميع الحقول المطلوبة', 'error');
      return;
    }
    setSaving(true);
    const box: ArchiveBox = {
      id: crypto.randomUUID(),
      box_number: form.box_number!,
      grade: form.grade!,
      subject: form.subject!,
      exam_date: form.exam_date!,
      committees: form.committees || [],
      created_at: new Date().toISOString(),
    };
    try {
      await db.archiveBoxes.upsert(box);
      setBoxes(prev => [box, ...prev]);
      setIsAdding(false);
      setForm({
        box_number: '',
        grade: '',
        subject: '',
        exam_date: new Date().toISOString().split('T')[0],
        committees: [],
      });
      showAlert('✅ تم حفظ الصندوق بنجاح');
    } catch (e: any) {
      showAlert('فشل الحفظ: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBox = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصندوق؟')) return;
    try {
      await db.archiveBoxes.delete(id);
      setBoxes(prev => prev.filter(b => b.id !== id));
      if (selectedBox?.id === id) setSelectedBox(null);
      showAlert('تم حذف الصندوق');
    } catch (e: any) {
      showAlert('فشل الحذف: ' + e.message, 'error');
    }
  };

  const toggleCommittee = (c: string) => {
    const current = form.committees || [];
    if (current.includes(c)) {
      setForm({ ...form, committees: current.filter(x => x !== c) });
    } else {
      setForm({ ...form, committees: [...current, c].sort((a, b) => Number(a) - Number(b)) });
    }
  };

  const handleSelectAll = () => {
    setForm({ ...form, committees: [...availableCommittees] });
  };

  const handlePrintLabel = (box: ArchiveBox) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;
    const reportUrl = `${window.location.origin}/?box_report=${box.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(reportUrl)}&color=000000`;
    const dateStr = new Date(box.exam_date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>ملصق صندوق ${box.box_number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:'Cairo',sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; background:#fff; }
            .card { width:580px; border:4px solid #1e293b; border-radius:24px; overflow:hidden; }
            .header { background:#1e293b; color:white; padding:20px 28px; display:flex; justify-content:space-between; align-items:center; }
            .header-title { font-size:22px; font-weight:900; }
            .header-school { font-size:13px; opacity:0.7; text-align:left; }
            .box-num { text-align:center; padding:24px 0 10px; }
            .box-num-label { font-size:13px; color:#64748b; font-weight:bold; }
            .box-num-value { font-size:90px; font-weight:900; line-height:1; color:#1e293b; letter-spacing:-4px; }
            .details { display:grid; grid-template-columns:1fr 1fr; gap:16px; padding:0 28px 20px; }
            .detail { background:#f8fafc; border-radius:12px; padding:12px 16px; }
            .detail-label { font-size:11px; color:#94a3b8; font-weight:bold; margin-bottom:4px; }
            .detail-value { font-size:16px; font-weight:900; color:#1e293b; }
            .committees-bar { background:#4f46e5; color:white; margin:0 28px 20px; border-radius:12px; padding:14px 20px; text-align:center; font-size:18px; font-weight:900; }
            .qr-section { text-align:center; padding:0 28px 28px; }
            .qr-section img { width:160px; height:160px; border:2px solid #e2e8f0; border-radius:12px; padding:8px; }
            .qr-hint { font-size:11px; color:#94a3b8; margin-top:8px; }
            @media print { body { height:auto; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="header-title">📦 صندوق أرشيف اختبارات</div>
              <div class="header-school">مدرسة عماد الدين زنكي المتوسطة<br/>وزارة التعليم - المملكة العربية السعودية</div>
            </div>
            <div class="box-num">
              <div class="box-num-label">رقم الصندوق</div>
              <div class="box-num-value">${box.box_number}</div>
            </div>
            <div class="details">
              <div class="detail"><div class="detail-label">المادة</div><div class="detail-value">${box.subject}</div></div>
              <div class="detail"><div class="detail-label">الصف الدراسي</div><div class="detail-value">${box.grade}</div></div>
              <div class="detail" style="grid-column:span 2"><div class="detail-label">تاريخ الاختبار</div><div class="detail-value">${dateStr}</div></div>
            </div>
            <div class="committees-bar">اللجان داخل الصندوق: ${box.committees.length ? box.committees.join(' ، ') : 'لا يوجد'}</div>
            <div class="qr-section">
              <img src="${qrUrl}" alt="QR" onload="setTimeout(()=>{window.print();window.close();},400)" />
              <div class="qr-hint">امسح الكود QR للاطلاع على تقرير الصندوق الكامل</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredBoxes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return boxes;
    return boxes.filter(b =>
      b.box_number.toLowerCase().includes(q) ||
      b.grade.toLowerCase().includes(q) ||
      b.subject.toLowerCase().includes(q) ||
      b.exam_date.includes(q)
    );
  }, [boxes, searchTerm]);

  return (
    <div className="space-y-8 animate-fade-in text-right">
      {/* Alert */}
      {alert && (
        <div className={`fixed top-6 right-6 z-[9999] px-8 py-4 rounded-2xl font-black text-white shadow-2xl animate-fade-in ${alert.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {alert.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-950 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white flex flex-col md:flex-row items-center justify-between gap-6 border-b-8 border-indigo-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="bg-indigo-500 p-5 rounded-3xl shadow-xl"><PackageSearch size={40} /></div>
          <div>
            <h2 className="text-4xl font-black tracking-tighter">أرشيف الصناديق</h2>
            <p className="text-indigo-200 font-bold mt-1">نظام إدارة أوراق الاختبارات الميدانية والصناديق</p>
          </div>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <button onClick={loadBoxes} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all" title="تحديث">
            <RefreshCw size={22} />
          </button>
          <button onClick={() => setIsAdding(true)} className="bg-white text-slate-950 px-8 py-4 rounded-[2rem] font-black flex items-center gap-3 hover:bg-indigo-50 transition-all shadow-xl active:scale-95">
            <Plus size={24} /> إضافة صندوق جديد
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الصناديق', value: boxes.length, color: 'indigo' },
          { label: 'عدد المواد', value: new Set(boxes.map(b => b.subject)).size, color: 'violet' },
          { label: 'عدد الصفوف', value: new Set(boxes.map(b => b.grade)).size, color: 'blue' },
          { label: 'إجمالي اللجان المؤرشفة', value: boxes.reduce((s, b) => s + b.committees.length, 0), color: 'emerald' },
        ].map(stat => (
          <div key={stat.label} className={`bg-white rounded-3xl p-6 shadow-lg border border-slate-100 text-center`}>
            <div className={`text-4xl font-black text-${stat.color}-600 mb-1`}>{stat.value}</div>
            <div className="text-sm font-bold text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left: List */}
        <div className="flex-1 space-y-6">
          {/* Search */}
          <div className="bg-white p-4 rounded-[2.5rem] shadow-xl border border-slate-100 relative">
            <Search size={22} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث برقم الصندوق، المادة، الصف، أو التاريخ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-16 py-4 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-lg outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
              <RefreshCw size={40} className="animate-spin mb-4" />
              <p className="font-black text-lg">جاري تحميل الصناديق...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBoxes.map(box => (
                <div
                  key={box.id}
                  onClick={() => setSelectedBox(box)}
                  className={`bg-white rounded-[2.5rem] p-6 border-2 transition-all cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1 ${selectedBox?.id === box.id ? 'border-indigo-500 shadow-indigo-100' : 'border-slate-100 hover:border-indigo-300'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-slate-950 text-white w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                      {box.box_number}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handlePrintLabel(box); }}
                      className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                      title="طباعة ملصق"
                    >
                      <Printer size={20} />
                    </button>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2 truncate">{box.subject}</h3>
                  <div className="space-y-1.5 mb-4">
                    <p className="text-sm font-bold text-slate-600 flex items-center gap-2"><Layers size={15} className="text-indigo-400" /> {box.grade}</p>
                    <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                      <Calendar size={15} className="text-indigo-400" />
                      {new Date(box.exam_date).toLocaleDateString('ar-SA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-slate-400 uppercase">اللجان:</span>
                    {box.committees.slice(0, 6).map(c => (
                      <span key={c} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black">{c}</span>
                    ))}
                    {box.committees.length > 6 && <span className="text-xs text-slate-400 font-bold">+{box.committees.length - 6}</span>}
                    {box.committees.length === 0 && <span className="text-xs text-slate-400 font-bold">غير محدد</span>}
                  </div>
                </div>
              ))}
              {filteredBoxes.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400 font-black">
                  <Archive size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xl">لا توجد صناديق مسجلة بعد.</p>
                  <p className="text-sm font-bold mt-2 opacity-60">اضغط على "إضافة صندوق جديد" لبدء الأرشفة</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Detail panel */}
        {selectedBox && (
          <div className="w-full xl:w-[420px] shrink-0">
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden sticky top-8">
              <div className="bg-indigo-600 p-8 text-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">تفاصيل الصندوق</span>
                    <h3 className="text-3xl font-black">صندوق {selectedBox.box_number}</h3>
                    <p className="text-indigo-200 font-bold mt-1 text-sm">{selectedBox.subject} — {selectedBox.grade}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handlePrintLabel(selectedBox)} className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all" title="طباعة"><Printer size={18} /></button>
                    <button onClick={() => handleDeleteBox(selectedBox.id)} className="p-3 bg-red-500/20 hover:bg-red-500 rounded-xl transition-all"><Trash2 size={18} /></button>
                    <button onClick={() => setSelectedBox(null)} className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all"><X size={18} /></button>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-indigo-50 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-black text-indigo-700">{boxStudents.length}</div>
                    <div className="text-xs font-bold text-indigo-500 mt-1">عدد الطلاب</div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-black text-slate-800">{selectedBox.committees.length}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">عدد اللجان</div>
                  </div>
                </div>

                <div className="mb-4 pb-4 border-b border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 mb-2">اللجان داخل الصندوق</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBox.committees.map(c => (
                      <span key={c} className="px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-xl text-sm font-black">لجنة {c}</span>
                    ))}
                    {selectedBox.committees.length === 0 && <span className="text-sm text-slate-400 font-bold">لا توجد لجان</span>}
                  </div>
                </div>

                <h4 className="font-black text-slate-900 flex items-center gap-2 mb-3">
                  <UserCircle size={18} className="text-indigo-500" /> أسماء الطلاب داخل الصندوق
                </h4>
                <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                  {boxStudents.map(student => (
                    <div key={student.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-colors">
                      <span className="font-black text-sm text-slate-800">{student.name}</span>
                      <span className="text-[10px] font-black text-white bg-indigo-700 px-2 py-1 rounded-lg">لجنة {student.committee_number}</span>
                    </div>
                  ))}
                  {boxStudents.length === 0 && (
                    <p className="text-center text-slate-400 font-bold py-6 text-sm">لم يُعثر على طلاب للجان المحددة.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Box Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 w-full max-w-2xl shadow-2xl relative animate-slide-up border-b-[12px] border-indigo-600 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAdding(false)} className="absolute top-6 left-6 p-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full transition-all">
              <X size={24} />
            </button>

            <h3 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Plus size={28} /></div>
              تسجيل صندوق جديد
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Box number */}
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">رقم الصندوق / الكود *</label>
                  <input
                    type="text"
                    value={form.box_number}
                    onChange={e => setForm({ ...form, box_number: e.target.value })}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black focus:border-indigo-500 outline-none transition-all"
                    placeholder="مثال: A-1"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">تاريخ الاختبار *</label>
                  {examDates.length > 0 ? (
                    <select
                      value={form.exam_date}
                      onChange={e => setForm({ ...form, exam_date: e.target.value, subject: '', committees: [] })}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black focus:border-indigo-500 outline-none"
                    >
                      <option value="">اختر التاريخ...</option>
                      {examDates.map(d => (
                        <option key={d} value={d}>{new Date(d).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="date"
                      value={form.exam_date}
                      onChange={e => setForm({ ...form, exam_date: e.target.value, subject: '', committees: [] })}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black focus:border-indigo-500 outline-none"
                    />
                  )}
                </div>

                {/* Subject */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-black text-slate-700 mb-2">اسم المادة *</label>
                  {subjectsOnDate.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {subjectsOnDate.map(e => (
                        <button
                          key={e.id}
                          onClick={() => setForm({ ...form, subject: e.subject })}
                          className={`px-5 py-3 rounded-2xl font-black text-sm transition-all border-2 ${form.subject === e.subject ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                        >
                          {e.subject}
                          {e.grades && e.grades.length > 0 && <span className="mr-2 text-[10px] opacity-70">({e.grades.join(', ')})</span>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black focus:border-indigo-500 outline-none"
                      placeholder="أدخل اسم المادة يدوياً..."
                    />
                  )}
                </div>

                {/* Grade */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-black text-slate-700 mb-2">الصف الدراسي *</label>
                  <div className="flex flex-wrap gap-3">
                    {allGrades.map(g => (
                      <button
                        key={g}
                        onClick={() => setForm({ ...form, grade: g, committees: [] })}
                        className={`px-5 py-3 rounded-2xl font-black text-sm transition-all border-2 ${form.grade === g ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                      >
                        {g}
                      </button>
                    ))}
                    {allGrades.length === 0 && <p className="text-sm text-slate-400 font-bold">لا توجد صفوف دراسية مسجلة في بيانات الطلاب.</p>}
                  </div>
                </div>
              </div>

              {/* Committees */}
              {form.grade && (
                <div className="border-t border-slate-100 pt-6 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-black text-slate-700">
                      اللجان التابعة للصف ({form.grade}) الموجودة بالصندوق:
                    </label>
                    <button
                      onClick={handleSelectAll}
                      className="text-xs font-black text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <CheckSquare size={14} /> تحديد الكل
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {availableCommittees.map(c => {
                      const isSelected = form.committees?.includes(c);
                      return (
                        <button
                          key={c}
                          onClick={() => toggleCommittee(c)}
                          className={`px-5 py-3 rounded-2xl font-black text-sm transition-all border-2 flex items-center gap-2 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                        >
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          لجنة {c}
                        </button>
                      );
                    })}
                    {availableCommittees.length === 0 && (
                      <p className="text-sm font-bold text-red-400">⚠️ لا توجد لجان مسجلة لهذا الصف في بيانات الطلاب.</p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleAddBox}
                disabled={saving || !form.box_number || !form.grade || !form.subject || !form.exam_date}
                className="w-full py-5 rounded-[2rem] bg-indigo-600 text-white font-black text-xl flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all mt-4 active:scale-95"
              >
                {saving ? <RefreshCw size={24} className="animate-spin" /> : <Save size={24} />}
                {saving ? 'جاري الحفظ...' : 'حفظ بيانات الصندوق'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
