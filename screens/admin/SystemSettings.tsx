
import React, { useState } from 'react';
import { Trash2, ShieldAlert, RefreshCcw, AlertTriangle, Database, Users2, History, Clock, Save, Code, Copy, Check } from 'lucide-react';
import { SystemConfig } from '../../types';

interface Props {
  systemConfig: SystemConfig;
  setSystemConfig: (cfg: Partial<SystemConfig>) => Promise<void>;
  resetFunctions: {
    students: () => void;
    teachers: () => void;
    operations: () => void;
    fullReset: () => void;
  };
}

const AdminSystemSettings: React.FC<Props> = ({ systemConfig, setSystemConfig, resetFunctions }) => {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [tempStartTime, setTempStartTime] = useState(systemConfig.exam_start_time || '08:00');
  const [isSavingCfg, setIsSavingCfg] = useState(false);
  const [copied, setCopied] = useState(false);

  const sqlFix = `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'CONTROL_MANAGER', 'PROCTOR', 'CONTROL', 'ASSISTANT_CONTROL', 'COUNSELOR'));`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlFix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = (id: string, action: () => void) => {
    if (confirming === id) {
      action();
      setConfirming(null);
    } else {
      setConfirming(id);
      setTimeout(() => setConfirming(null), 5000);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingCfg(true);
    try {
      await setSystemConfig({ exam_start_time: tempStartTime });
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSavingCfg(false);
    }
  };

  const ActionCard = ({ id, title, description, icon: Icon, colorClass, action }: any) => {
    const isConfirming = confirming === id;
    
    return (
      <div className={`
        relative p-8 rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden
        ${isConfirming 
          ? 'bg-red-600 border-red-600 text-white scale-[1.02] shadow-2xl shadow-red-200' 
          : 'bg-white border-slate-50 shadow-xl hover:shadow-2xl'
        }
      `}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
             <div className={`
               w-16 h-16 rounded-2xl flex items-center justify-center shrink-0
               ${isConfirming ? 'bg-white/20' : 'bg-slate-50 text-slate-400'}
             `}>
                <Icon size={32} />
             </div>
             <div className="text-right">
                <h3 className={`text-xl font-black ${isConfirming ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
                <p className={`text-sm font-bold ${isConfirming ? 'text-white/80' : 'text-slate-400'}`}>{description}</p>
             </div>
          </div>
          
          <button 
            onClick={() => handleAction(id, action)}
            className={`
              px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shrink-0
              ${isConfirming 
                ? 'bg-white text-red-600 hover:bg-slate-100 animate-pulse' 
                : `${colorClass} text-white shadow-lg`
              }
            `}
          >
            {isConfirming ? <ShieldAlert size={20}/> : <Trash2 size={20}/>}
            {isConfirming ? 'اضغط مرة أخرى للتأكيد النهائي' : 'بدء الحذف'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-slide-up text-right pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter">إعدادات وتهيئة النظام</h2>
          <p className="text-slate-400 font-bold italic mt-1">إدارة قواعد البيانات وبدء المواسم الجديدة</p>
        </div>
      </div>

      {/* SQL Maintenance Section */}
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-black flex items-center gap-4 mb-4">
             <Code className="text-blue-400" /> صيانة هيكلة البيانات (SQL)
          </h3>
          <p className="text-slate-400 font-bold mb-6">إذا ظهر لك خطأ "violates check constraint" عند تغيير رتبة مستخدم، انسخ الكود التالي وتشغيله في SQL Editor في لوحة تحكم Supabase:</p>
          
          <div className="relative group">
            <pre className="bg-black/50 p-6 rounded-2xl font-mono text-xs text-blue-300 border border-white/10 overflow-x-auto text-left dir-ltr">
              {sqlFix}
            </pre>
            <button 
              onClick={handleCopy}
              className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
            >
              {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14} />}
              {copied ? 'تم النسخ' : 'نسخ الكود'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 space-y-8">
        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
           <Clock className="text-blue-600" /> إعدادات الاختبار الحالية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div className="space-y-3">
             <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">وقت بداية الاختبار</label>
             <input 
               type="time" 
               value={tempStartTime}
               onChange={(e) => setTempStartTime(e.target.value)}
               className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-5 font-black text-3xl text-slate-800 outline-none focus:border-blue-600 shadow-inner"
             />
          </div>
          <button 
            onClick={handleSaveConfig}
            disabled={isSavingCfg}
            className="bg-blue-600 text-white py-6 rounded-[1.5rem] font-black text-xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-4"
          >
            {isSavingCfg ? <RefreshCcw className="animate-spin" /> : <Save size={28} />}
            حفظ إعدادات التوقيت
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ActionCard id="ops" title="تصفير العمليات اليومية" description="حذف سجلات الاستلام والتسليم، البلاغات العاجلة، وحالات الغياب المرصودة لهذا اليوم." icon={History} colorClass="bg-slate-900" action={resetFunctions.operations} />
        <ActionCard id="students" title="حذف الطلاب واللجان" description="مسح كافة قوائم الطلاب، الصفوف، أرقام الجلوس، وتوزيع اللجان الحالي." icon={Database} colorClass="bg-slate-900" action={resetFunctions.students} />
        <ActionCard id="teachers" title="حذف الهيئة التعليمية" description="إزالة جميع المعلمين والمراقبين المسجلين (سيتم الحفاظ على حساب مدير النظام فقط)." icon={Users2} colorClass="bg-slate-900" action={resetFunctions.teachers} />
      </div>
    </div>
  );
};

export default AdminSystemSettings;
