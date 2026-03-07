
import React, { useMemo, useState } from 'react';
import { ControlRequest } from '../../types';
import {
  History, Clock, CheckCircle2, Timer, UserCheck, Ghost,
  Zap, Filter, ArrowUpDown, TrendingUp, Package, AlertTriangle,
  MessageSquare, Stethoscope, FileText, Pencil, UserSearch,
  ChevronDown, ChevronUp, BarChart3, Circle
} from 'lucide-react';

interface Props {
  requests: ControlRequest[];
  userFullName: string;
}

// خريطة أنواع البلاغات
const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  'ورقة إجابة':   { label: 'ورقة إجابة',   icon: FileText,     color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100' },
  'معلم المادة':  { label: 'معلم المادة',   icon: UserSearch,   color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
  'مرسام':        { label: 'أدوات رسم',     icon: Pencil,       color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100' },
  'ورقة أسئلة':  { label: 'ورقة أسئلة',   icon: FileText,     color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
  'صحية':         { label: 'حالة صحية',     icon: Stethoscope,  color: 'text-red-600',    bg: 'bg-red-50 border-red-100' },
  'إنهاء':        { label: 'إنهاء اللجنة', icon: Package,      color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-100' },
  'default':      { label: 'بلاغ عام',      icon: MessageSquare,color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-100' },
};

function getCategoryMeta(text: string) {
  for (const key of Object.keys(CATEGORY_MAP)) {
    if (key !== 'default' && text.includes(key)) return CATEGORY_MAP[key];
  }
  return CATEGORY_MAP['default'];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_CONFIG = {
  DONE:        { label: 'مكتمل',          bg: 'bg-emerald-500', text: 'text-white', icon: CheckCircle2 },
  IN_PROGRESS: { label: 'قيد المباشرة',   bg: 'bg-blue-600',    text: 'text-white', icon: Timer },
  PENDING:     { label: 'في الانتظار',    bg: 'bg-amber-500',   text: 'text-white', icon: Clock },
};

const ProctorAlertsHistory: React.FC<Props> = ({ requests, userFullName }) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'DONE'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const myHistory = useMemo(() =>
    requests
      .filter(r => r.from === userFullName)
      .sort((a, b) => b.time.localeCompare(a.time)),
    [requests, userFullName]
  );

  const stats = useMemo(() => ({
    total:       myHistory.length,
    done:        myHistory.filter(r => r.status === 'DONE').length,
    pending:     myHistory.filter(r => r.status === 'PENDING').length,
    in_progress: myHistory.filter(r => r.status === 'IN_PROGRESS').length,
    committees:  new Set(myHistory.map(r => r.committee)).size,
  }), [myHistory]);

  const filtered = useMemo(() => {
    if (filterStatus === 'ALL') return myHistory;
    return myHistory.filter(r => r.status === filterStatus);
  }, [myHistory, filterStatus]);

  // تجميع حسب اليوم
  const grouped = useMemo(() => {
    const groups: Record<string, ControlRequest[]> = {};
    for (const req of filtered) {
      const day = req.time.split('T')[0];
      if (!groups[day]) groups[day] = [];
      groups[day].push(req);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fade-in text-right" dir="rtl">

      {/* الهيدر */}
      <div className="bg-slate-950 p-8 md:p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border-b-[8px] border-blue-600">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-[1.5rem] shadow-2xl ring-4 ring-blue-500/20 shrink-0">
              <History size={36} />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">سجل شخصي - {userFullName}</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter">أرشيف البلاغات الميدانية</h2>
              <p className="text-slate-500 font-bold text-xs italic mt-1 uppercase tracking-widest">تتبع سجل طلباتك والمباشرات السابقة</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
            <BarChart3 size={20} className="text-blue-400" />
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">إجمالي البلاغات</p>
              <p className="text-3xl font-black tabular-nums text-white">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* إحصائيات */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'مكتملة',       value: stats.done,        icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
            { label: 'قيد المتابعة', value: stats.in_progress, icon: Timer,        color: 'from-blue-500 to-blue-600',    shadow: 'shadow-blue-500/20' },
            { label: 'في الانتظار',  value: stats.pending,     icon: Clock,        color: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20' },
            { label: 'لجان مختلفة', value: stats.committees,   icon: TrendingUp,   color: 'from-slate-700 to-slate-900', shadow: 'shadow-slate-500/20' },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white p-6 rounded-[2.5rem] shadow-xl ${s.shadow} flex flex-col gap-3`}>
              <s.icon size={28} className="opacity-90" />
              <div>
                <p className="text-5xl font-black tabular-nums leading-none">{s.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* فلاتر الحالة */}
      {stats.total > 0 && (
        <div className="bg-white p-2 rounded-full shadow-md border border-slate-100 flex gap-2 overflow-x-auto">
          {([
            { id: 'ALL',         label: `الكل (${stats.total})`,            color: 'bg-slate-900 text-white' },
            { id: 'DONE',        label: `مكتمل (${stats.done})`,            color: 'bg-emerald-500 text-white' },
            { id: 'IN_PROGRESS', label: `قيد المتابعة (${stats.in_progress})`, color: 'bg-blue-600 text-white' },
            { id: 'PENDING',     label: `في الانتظار (${stats.pending})`,   color: 'bg-amber-500 text-white' },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`flex-1 min-w-[100px] py-3 px-4 rounded-full font-black text-sm transition-all whitespace-nowrap ${filterStatus === f.id ? f.color + ' shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* القائمة */}
      <div className="space-y-10">
        {grouped.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center gap-6 shadow-inner">
            <Ghost size={80} className="text-slate-200" />
            <div>
              <p className="text-2xl font-black text-slate-300 italic">لا توجد بلاغات</p>
              <p className="text-sm font-bold text-slate-300 mt-2">لا يوجد أي سجل يطابق الفلتر المحدد</p>
            </div>
          </div>
        ) : (
          grouped.map(([day, dayReqs]) => (
            <div key={day} className="space-y-4">
              {/* عنوان اليوم */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-100" />
                <div className="bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow flex items-center gap-2">
                  <Circle size={8} className="fill-blue-500 text-blue-500" />
                  {formatDate(dayReqs[0].time)}
                </div>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              {/* بلاغات اليوم */}
              <div className="space-y-4 relative">
                {/* خط الجدول الزمني */}
                <div className="absolute right-10 top-0 bottom-0 w-0.5 bg-slate-100 hidden md:block" />

                {dayReqs.map((req) => {
                  const meta = getCategoryMeta(req.text);
                  const statusCfg = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
                  const isExpanded = expandedId === req.id;
                  const StatusIcon = statusCfg.icon;
                  const MetaIcon = meta.icon;

                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-[2.5rem] shadow-lg border border-slate-50 hover:shadow-xl hover:border-slate-100 transition-all duration-300 overflow-hidden group relative md:mr-6"
                    >
                      {/* نقطة الجدول الزمني */}
                      <div className={`absolute -right-[1.85rem] top-10 w-5 h-5 rounded-full border-4 border-white shadow-md hidden md:block ${statusCfg.bg} ${statusCfg.text}`} />

                      {/* الحالة الجانبية */}
                      <div className={`absolute top-0 right-0 bottom-0 w-1.5 rounded-r-[2.5rem] ${req.status === 'DONE' ? 'bg-emerald-500' : req.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-amber-400'}`} />

                      <button
                        className="w-full p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-right"
                        onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      >
                        <div className="flex items-center gap-5 flex-1 min-w-0">
                          {/* أيقونة النوع */}
                          <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center shrink-0 border ${meta.bg} ${meta.color} shadow-sm`}>
                            <MetaIcon size={24} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-[10px] tabular-nums">لجنة {req.committee}</span>
                              <span className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest ${statusCfg.bg} ${statusCfg.text}`}>
                                {statusCfg.label}
                              </span>
                              <span className={`px-3 py-1 rounded-lg font-black text-[9px] border ${meta.bg} ${meta.color}`}>
                                {meta.label}
                              </span>
                            </div>
                            <p className="text-base font-black text-slate-800 leading-snug line-clamp-1 group-hover:text-blue-700 transition-colors">
                              {req.text}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-left">
                            <p className="text-xs font-black text-slate-400 font-mono">{formatTime(req.time)}</p>
                            {req.assistant_name && (
                              <p className="text-[10px] font-bold text-blue-500 mt-1 flex items-center gap-1 justify-end">
                                <UserCheck size={11} /> {req.assistant_name}
                              </p>
                            )}
                          </div>
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${req.status === 'DONE' ? 'bg-emerald-100 text-emerald-600' : req.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-amber-100 text-amber-600'}`}>
                            <StatusIcon size={20} />
                          </div>
                          <div className="text-slate-300">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                      </button>

                      {/* التفاصيل الموسعة */}
                      {isExpanded && (
                        <div className="px-6 md:px-8 pb-8 animate-fade-in border-t border-slate-50 pt-6 space-y-5">
                          {/* نص البلاغ الكامل */}
                          <div className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">نص البلاغ الكامل</p>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">{req.text}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">وقت الإرسال</p>
                              <p className="text-lg font-black text-slate-800 font-mono">{formatTime(req.time)}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatDate(req.time)}</p>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">رقم اللجنة</p>
                              <p className="text-3xl font-black text-slate-900 tabular-nums">{req.committee}</p>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">المتابع من الكنترول</p>
                              {req.assistant_name ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center"><UserCheck size={16} className="text-blue-600" /></div>
                                  <p className="text-sm font-black text-blue-700">{req.assistant_name}</p>
                                </div>
                              ) : (
                                <p className="text-sm font-bold text-slate-300 mt-1">لم يُتابع بعد</p>
                              )}
                            </div>
                          </div>

                          {/* شريط التقدم */}
                          <div className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">تتبع حالة البلاغ</p>
                            <div className="flex items-center gap-0 w-full">
                              {(['PENDING', 'IN_PROGRESS', 'DONE'] as const).map((step, i) => {
                                const STEP_LABELS = { PENDING: 'أُرسل', IN_PROGRESS: 'جاري المتابعة', DONE: 'مكتمل' };
                                const steps = ['PENDING', 'IN_PROGRESS', 'DONE'];
                                const currentIdx = steps.indexOf(req.status);
                                const stepIdx = steps.indexOf(step);
                                const isPast   = stepIdx <= currentIdx;
                                const isActive = step === req.status;
                                return (
                                  <React.Fragment key={step}>
                                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all ${isPast ? (isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-emerald-500 border-emerald-500 text-white') : 'bg-white border-slate-200 text-slate-300'}`}>
                                        {isPast && !isActive ? <CheckCircle2 size={18} /> : i + 1}
                                      </div>
                                      <p className={`text-[9px] font-black text-center whitespace-nowrap ${isPast ? 'text-slate-600' : 'text-slate-300'}`}>{STEP_LABELS[step]}</p>
                                    </div>
                                    {i < 2 && <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${stepIdx < currentIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .line-clamp-1 { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
      `}</style>
    </div>
  );
};

export default ProctorAlertsHistory;
