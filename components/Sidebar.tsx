
import React from 'react';
import { 
  LayoutDashboard, Users, GraduationCap, ClipboardList, LogOut,
  ShieldAlert, Inbox, FileText, Settings, X, ChevronRight, ChevronLeft,
  History, IdCard, UserCircle, ShieldCheck, ShieldHalf
} from 'lucide-react';
import { UserRole, User } from '../types';
import { APP_CONFIG, ROLES_ARABIC } from '../constants';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user, onLogout, activeTab, setActiveTab, isOpen, setIsOpen, isCollapsed, setIsCollapsed
}) => {
  const role = user?.role || 'PROCTOR';
  
  const adminLinks = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'control-manager', label: 'مركز قيادة الكنترول', icon: ShieldHalf },
    { id: 'teachers', label: 'الصلاحيات', icon: Users },
    { id: 'students', label: 'الطلاب', icon: GraduationCap },
    { id: 'committees', label: 'المراقبة', icon: ClipboardList },
    { id: 'official-forms', label: 'النماذج', icon: FileText },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings },
  ];

  const controlManagerLinks = [
    { id: 'control-manager', label: 'مركز قيادة الكنترول', icon: ShieldHalf },
    { id: 'paper-logs', label: 'استلام المظاريف', icon: Inbox },
    { id: 'receipt-history', label: 'سجل العمليات', icon: History },
    { id: 'digital-id', label: 'البطاقة الرقمية', icon: IdCard },
  ];

  const proctorLinks = [
    { id: 'my-tasks', label: 'رصد اللجنة', icon: ClipboardList },
    { id: 'digital-id', label: 'البطاقة الرقمية', icon: IdCard },
  ];

  const counselorLinks = [
    { id: 'student-absences', label: 'متابعة الغياب', icon: Users },
    { id: 'digital-id', label: 'بطاقتي الرقمية', icon: IdCard },
  ];

  const controlLinks = [
    { id: 'paper-logs', label: 'استلام المظاريف', icon: Inbox },
    { id: 'receipt-history', label: 'سجل العمليات', icon: History },
    { id: 'digital-id', label: 'البطاقة الرقمية', icon: IdCard },
  ];

  const assistantControlLinks = [
    { id: 'assigned-requests', label: 'طلباتي', icon: ShieldAlert },
    { id: 'digital-id', label: 'البطاقة الرقمية', icon: IdCard },
  ];

  const links = role === 'ADMIN' ? adminLinks : 
                role === 'CONTROL_MANAGER' ? controlManagerLinks :
                role === 'PROCTOR' ? proctorLinks : 
                role === 'COUNSELOR' ? counselorLinks : 
                role === 'ASSISTANT_CONTROL' ? assistantControlLinks :
                controlLinks;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsOpen(false)}/>
      )}

      <div className={`fixed right-0 top-0 h-full bg-slate-950 text-white shadow-2xl z-[110] flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0 w-80' : 'translate-x-full lg:translate-x-0'} ${!isOpen && isCollapsed ? 'lg:w-24' : 'lg:w-80'}`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shrink-0">
               <img src={APP_CONFIG.LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="animate-fade-in whitespace-nowrap text-right">
                <h1 className="text-lg font-black text-blue-400 leading-none">كنترول الاختبارات</h1>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">النظام الذكي</p>
              </div>
            )}
          </div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex p-2 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all">
            {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => { setActiveTab(link.id); setIsOpen(false); }}
              className={`w-full flex items-center px-4 py-4 rounded-2xl transition-all group ${isCollapsed && !isOpen ? 'justify-center' : 'gap-4 flex-row-reverse'} ${activeTab === link.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <link.icon size={22} className={activeTab === link.id ? 'animate-pulse' : 'shrink-0'} />
              {(!isCollapsed || isOpen) && <span className="font-bold text-sm flex-1 text-right">{link.label}</span>}
            </button>
          ))}
        </nav>

        {(!isCollapsed || isOpen) && (
          <div className="px-6 py-8 mt-auto">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden group/badge shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600"></div>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2 shadow-2xl border-2 border-white/5">
                  <img src={APP_CONFIG.LOGO_URL} className="w-full h-full object-contain" alt="User" />
                </div>
                <div className="w-full">
                  <h4 className="font-black text-sm text-white leading-tight mb-2 px-2 break-words">
                    {user?.full_name || 'موظف النظام'}
                  </h4>
                  <div className="inline-block bg-blue-600/20 text-blue-400 px-4 py-1 rounded-full text-[10px] font-black border border-blue-500/20">
                    {ROLES_ARABIC[role] || role}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest border-t border-white/5 pt-4 mt-4">
                <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-emerald-500"/> حساب مؤمن</span>
                <span>ID: {user?.national_id?.slice(-4) || '----'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className={`w-full flex items-center px-4 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all font-bold text-sm ${isCollapsed && !isOpen ? 'justify-center' : 'gap-4 flex-row-reverse'}`}>
            <LogOut size={20} className="shrink-0" />
            {(!isCollapsed || isOpen) && <span className="flex-1 text-right">تسجيل الخروج</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
