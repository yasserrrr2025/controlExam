import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Loader2, Sparkles, UserX, Clock, Map, AlertTriangle, Send, User, MessageSquare, TrendingUp, Scale } from 'lucide-react';
import { SystemConfig } from '../../types';
import { db } from '../../supabase';
import { fetchAIAnalysis, AiInsightsResult, fetchAIChat } from '../../services/aiService';

interface Props {
  systemConfig: SystemConfig;
}

const AiDashboard: React.FC<Props> = ({ systemConfig }) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('insights');
  const [dataContext, setDataContext] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Insights State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AiInsightsResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Chat State
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Fetch last 7 days of data for the AI context
        const [users, students, supervisions, absences, logs, requests, reports, exams, envelopes] = await Promise.all([
          db.users.getAll(),
          db.students.getAll(),
          db.supervision.getAll(),
          db.absences.getAll(),
          db.deliveryLogs.getAll(),
          db.controlRequests.getAll(),
          db.committeeReports.getAll(),
          db.examSchedule.getAll(),
          db.envelopeOpenings.getAll()
        ]);
        
        // Simply passing all the data for now since Supabase data here is usually scoped per school/exam period
        // Strict filtering to remove sensitive fields like national_id, phone numbers, and raw UUIDs where unnecessary
        setDataContext({
          users: users.map(u => ({ name: u.full_name, role: u.role, assigned_committees: u.assigned_committees })),
          students: students.map(s => ({ name: s.name, grade: s.grade, section: s.section, committee: s.committee_number })),
          supervisions: supervisions.map(s => ({ teacher: users.find(u => u.id === s.teacher_id)?.full_name || 'غير معروف', committee: s.committee_number, date: s.date, subject: s.subject })),
          absences: absences.map(a => ({ date: a.date, type: a.type, student: a.student_name, committee: a.committee_number, period: a.period })),
          logs: logs.map(l => ({ time: l.time, status: l.status, type: l.type, committee: l.committee_number, receiver: l.teacher_name, proctor: l.proctor_name })),
          alerts: requests.map(r => ({ time: r.time, text: r.text, status: r.status, committee: r.committee, from: r.from })),
          reports: reports.map(r => ({ date: r.date, committee: r.committee_number, notes: r.notes, issues: r.issues_found })),
          schedule: exams.map(e => ({ date: e.exam_date, subject: e.subject, period: e.period })),
          envelopes: envelopes.map(e => ({ time: e.time, grade: e.grade, opener: e.opened_by_name }))
        });
      } catch (err) {
        console.error('Failed to load DB data for AI', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadAllData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAnalyze = async (type: 'absence' | 'proctor' | 'receipt' | 'errors' | 'predictive' | 'auditor') => {
    if (!systemConfig.openrouter_api_key) {
      setErrorMsg('الرجاء إضافة مفتاح OpenRouter في إعدادات النظام أولاً.');
      return;
    }
    if (!dataContext) return;
    
    setIsAnalyzing(true);
    setAiResult(null);
    setErrorMsg('');

    try {
      const result = await fetchAIAnalysis(systemConfig.openrouter_api_key, dataContext, type);
      if (result) setAiResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ غير معروف');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    if (!systemConfig.openrouter_api_key) {
      setErrorMsg('الرجاء إضافة مفتاح OpenRouter في إعدادات النظام أولاً.');
      return;
    }

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatting(true);
    setErrorMsg('');

    try {
      const response = await fetchAIChat(systemConfig.openrouter_api_key, dataContext, userMsg);
      setChatMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'ai', content: `❌ خطأ: ${err.message}` }]);
    } finally {
      setIsChatting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'danger': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 size={40} className="text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold">جاري تحميل البيانات التاريخية للتحليل...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-right pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BrainCircuit size={36} className="text-blue-600" />
            المحلل الذكي (AI)
          </h2>
          <p className="text-slate-500 font-bold text-sm mt-2">
            مساعدك الذكي لقراءة بيانات النظام واستخراج التوصيات الدقيقة
          </p>
        </div>
        
        <div className="flex bg-slate-200/50 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('insights')} 
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'insights' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            التقارير السريعة
          </button>
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            الدردشة التفاعلية <Sparkles size={14} />
          </button>
        </div>
      </div>

      {activeTab === 'insights' ? (
        <div className="space-y-8">
          {/* الميزات المتقدمة */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <button onClick={() => handleAnalyze('predictive')} disabled={isAnalyzing} className="w-full group relative bg-gradient-to-r from-purple-900 to-indigo-900 p-8 rounded-[2.5rem] border border-purple-500/30 text-right overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50">
               <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none" />
               <div className="absolute top-6 left-6 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                  <TrendingUp size={32} className="text-purple-300 group-hover:scale-110 group-hover:text-purple-200 transition-all" />
               </div>
               <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold mb-4">
                    <Sparkles size={12} />
                    توقع المستقبل
                  </div>
                  <h4 className="text-white font-black text-2xl mb-2 tracking-tight">التنبؤ الاستباقي 🔮</h4>
                  <p className="text-purple-200/80 text-sm font-bold leading-relaxed max-w-[85%]">
                    يتنبأ بمشاكل الغد من غياب ونقص أوراق ليمنحك توصيات مبكرة.
                  </p>
               </div>
            </button>

            <button onClick={() => handleAnalyze('auditor')} disabled={isAnalyzing} className="w-full group relative bg-gradient-to-r from-teal-900 to-emerald-900 p-8 rounded-[2.5rem] border border-emerald-500/30 text-right overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50">
               <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none" />
               <div className="absolute top-6 left-6 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                  <Scale size={32} className="text-emerald-300 group-hover:scale-110 group-hover:text-emerald-200 transition-all" />
               </div>
               <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold mb-4">
                    <Sparkles size={12} />
                    تحليل العدالة
                  </div>
                  <h4 className="text-white font-black text-2xl mb-2 tracking-tight">المدقق الذكي (Auditor) ⚖️</h4>
                  <p className="text-emerald-200/80 text-sm font-bold leading-relaxed max-w-[85%]">
                    يراجع جدول المراقبة ويكتشف المعلمين المرهقين ويقترح لك التبديلات العادلة.
                  </p>
               </div>
            </button>
          </div>

          {/* أزرار التحليل السريع */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => handleAnalyze('absence')} disabled={isAnalyzing} className="group relative bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] border border-white/10 text-right overflow-hidden shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50">
               <div className="absolute top-0 right-0 p-4 bg-white/5 rounded-bl-[2rem]">
                  <UserX size={24} className="text-rose-400 group-hover:scale-110 transition-transform" />
               </div>
               <div className="mt-8 relative z-10">
                  <h4 className="text-white font-black text-lg mb-1">الغياب والتأخر</h4>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed">تحليل حالات غياب الطلاب اليوم وربطها باللجان لتقديم التوصيات.</p>
               </div>
            </button>

            <button onClick={() => handleAnalyze('proctor')} disabled={isAnalyzing} className="group relative bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] border border-white/10 text-right overflow-hidden shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50">
               <div className="absolute top-0 right-0 p-4 bg-white/5 rounded-bl-[2rem]">
                  <Clock size={24} className="text-amber-400 group-hover:scale-110 transition-transform" />
               </div>
               <div className="mt-8 relative z-10">
                  <h4 className="text-white font-black text-lg mb-1">انضباط المراقبين</h4>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed">تقييم سرعة تجاوب المراقبين في فتح اللجان وبدء الرصد.</p>
               </div>
            </button>

            <button onClick={() => handleAnalyze('receipt')} disabled={isAnalyzing} className="group relative bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] border border-white/10 text-right overflow-hidden shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50">
               <div className="absolute top-0 right-0 p-4 bg-white/5 rounded-bl-[2rem]">
                  <Map size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
               </div>
               <div className="mt-8 relative z-10">
                  <h4 className="text-white font-black text-lg mb-1">سرعة الاستلام</h4>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed">تحليل مسارات تسليم المظاريف وتقييم كفاءة الكنترول.</p>
               </div>
            </button>

            <button onClick={() => handleAnalyze('errors')} disabled={isAnalyzing} className="group relative bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] border border-white/10 text-right overflow-hidden shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50">
               <div className="absolute top-0 right-0 p-4 bg-white/5 rounded-bl-[2rem]">
                  <AlertTriangle size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
               </div>
               <div className="mt-8 relative z-10">
                  <h4 className="text-white font-black text-lg mb-1">ملخص الأخطاء</h4>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed">تدقيق البلاغات والمشاكل التقنية وتحديد اللجان الحرجة.</p>
               </div>
            </button>
          </div>

          {/* مساحة العرض */}
          <div className="bg-slate-950 rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/5 relative overflow-hidden min-h-[400px]">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />

            {errorMsg && (
              <div className="relative z-10 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-5 rounded-2xl font-bold flex items-center gap-3">
                <AlertTriangle size={20} />
                {errorMsg}
              </div>
            )}

            {!isAnalyzing && !aiResult && !errorMsg && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 relative z-10 py-20">
                <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                  <BrainCircuit size={48} className="text-blue-500 opacity-80" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">اللوحة الذكية بانتظار أمرك</h3>
                  <p className="text-slate-400 font-bold max-w-md mx-auto leading-relaxed">
                    اضغط على أحد أزرار التحليل بالأعلى ليقوم الذكاء الاصطناعي بدراسة البيانات ورسم لوحة إحصائيات فورية.
                  </p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 relative z-10 py-20">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-slate-800 rounded-full animate-spin border-t-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)]"></div>
                  <Sparkles size={28} className="text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">جاري قراءة وتحليل البيانات...</h3>
                  <p className="text-blue-400/80 font-bold animate-pulse">يتم الآن استنتاج التوصيات وبناء اللوحة</p>
                </div>
              </div>
            )}

            {aiResult && !isAnalyzing && (
              <div className="relative z-10 space-y-8 animate-slide-up">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {aiResult.metrics.map((metric, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl border backdrop-blur-md flex flex-col items-center justify-center text-center gap-2 ${getStatusColor(metric.status)}`}>
                      <span className="text-4xl font-black tabular-nums">{metric.value}</span>
                      <span className="text-xs font-bold uppercase tracking-widest opacity-80">{metric.title}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                  <h4 className="text-white font-black text-xl mb-6 flex items-center gap-3">
                    <Sparkles size={24} className="text-blue-400" />
                    توصيات الذكاء الاصطناعي
                  </h4>
                  <ul className="space-y-4">
                    {aiResult.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                        <p className="text-slate-300 font-bold leading-relaxed text-sm">{insight}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* واجهة الدردشة التفاعلية */
        <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] flex flex-col h-[600px] shadow-sm overflow-hidden">
          <div className="bg-white p-6 border-b border-slate-100 flex items-center gap-4 shadow-sm z-10 relative">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-900">اسأل المحلل الذكي</h3>
              <p className="text-xs font-bold text-slate-500">لديه الصلاحية لقراءة كل البيانات والإجابة بذكاء</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <BrainCircuit size={64} className="mb-4" />
                <p className="font-bold">مرحباً! اسألني أي سؤال عن إحصائيات النظام، غياب الطلاب، أو مشاكل المراقبين.</p>
              </div>
            )}
            
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 font-bold text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isChatting && (
              <div className="flex justify-end">
                <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-none p-4 shadow-sm flex gap-2 items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="bg-white p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[1.5rem] border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder="اسأل عن أي شيء يخطر ببالك..."
                className="flex-1 bg-transparent border-none p-3 outline-none font-bold text-sm"
                disabled={isChatting}
              />
              <button 
                onClick={handleSendChat}
                disabled={isChatting || !chatInput.trim()}
                className="bg-blue-600 text-white p-4 rounded-xl disabled:opacity-50 hover:bg-blue-700 hover:shadow-lg transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiDashboard;
