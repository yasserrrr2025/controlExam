
import React, { useState } from 'react';
import { Trash2, ShieldAlert, RefreshCcw, AlertTriangle, Database, Users2, History } from 'lucide-react';

interface Props {
  resetFunctions: {
    students: () => void;
    teachers: () => void;
    operations: () => void;
    fullReset: () => void;
  };
}

const AdminSystemSettings: React.FC<Props> = ({ resetFunctions }) => {
  const [confirming, setConfirming] = useState<string | null>(null);

  const handleAction = (id: string, action: () => void) => {
    if (confirming === id) {
      action();
      setConfirming(null);
    } else {
      setConfirming(id);
      // تلقائياً نلغي حالة التأكيد بعد 5 ثواني
      setTimeout(() => setConfirming(null), 5000);
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
        
        {isConfirming && (
          <div className="absolute top-2 left-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
            تنبيه: لا يمكن التراجع!
          </div>
        )}
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
        <div className="bg-amber-50 border-2 border-amber-200 px-6 py-4 rounded-2xl flex items-center gap-4 text-amber-700">
           <AlertTriangle size={24} className="shrink-0" />
           <p className="text-xs font-black leading-relaxed">تحذير: هذه الإجراءات ستقوم بحذف بيانات دائمة من قاعدة البيانات. <br/> يرجى التأكد من تصدير التقارير قبل البدء.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ActionCard 
          id="ops"
          title="تصفير العمليات اليومية" 
          description="حذف سجلات الاستلام والتسليم، البلاغات العاجلة، وحالات الغياب المرصودة لهذا اليوم."
          icon={History}
          colorClass="bg-slate-900"
          action={resetFunctions.operations}
        />

        <ActionCard 
          id="students"
          title="حذف الطلاب واللجان" 
          description="مسح كافة قوائم الطلاب، الصفوف، أرقام الجلوس، وتوزيع اللجان الحالي."
          icon={Database}
          colorClass="bg-slate-900"
          action={resetFunctions.students}
        />

        <ActionCard 
          id="teachers"
          title="حذف الهيئة التعليمية" 
          description="إزالة جميع المعلمين والمراقبين المسجلين (سيتم الحفاظ على حساب مدير النظام فقط)."
          icon={Users2}
          colorClass="bg-slate-900"
          action={resetFunctions.teachers}
        />

        <div className="mt-10 p-1 bg-red-50 rounded-[3.5rem] border-4 border-dashed border-red-200 overflow-hidden">
           <div className={`
             p-12 rounded-[3rem] transition-all flex flex-col items-center text-center gap-8
             ${confirming === 'full' ? 'bg-red-600 text-white' : 'bg-white'}
           `}>
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl ${confirming === 'full' ? 'bg-white/20' : 'bg-red-50 text-red-600'}`}>
                 <RefreshCcw size={48} className={confirming === 'full' ? 'animate-spin' : ''} />
              </div>
              <div>
                 <h3 className={`text-3xl font-black mb-2 ${confirming === 'full' ? 'text-white' : 'text-slate-900'}`}>تهيئة النظام الشاملة (Factory Reset)</h3>
                 <p className={`font-bold max-w-xl mx-auto ${confirming === 'full' ? 'text-white/80' : 'text-slate-400'}`}>
                   سيتم مسح "كل شيء" حرفياً وإعادة النظام إلى الحالة الافتراضية. سيتم حذف الطلاب، المعلمين، اللجان، والعمليات. 
                   استخدم هذا الخيار فقط في بداية العام الدراسي الجديد.
                 </p>
              </div>
              <button 
                onClick={() => handleAction('full', resetFunctions.fullReset)}
                className={`
                  px-16 py-6 rounded-[2rem] font-black text-xl transition-all shadow-2xl
                  ${confirming === 'full' ? 'bg-white text-red-600' : 'bg-red-600 text-white hover:bg-red-700'}
                `}
              >
                {confirming === 'full' ? 'أنا متأكد تماماً، ابدأ المسح الكلي' : 'تهيئة النظام بالكامل'}
              </button>
           </div>
        </div>
      </div>
      
      <div className="text-center text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">
         System Management Console v5.2 • Security Level 4
      </div>
    </div>
  );
};

export default AdminSystemSettings;
