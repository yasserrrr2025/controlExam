
import React from 'react';
import { 
  LayoutDashboard, Users, GraduationCap, ClipboardList, LogOut,
  ShieldAlert, Inbox, FileText, Settings, X, ChevronRight, ChevronLeft,
  History, IdCard, UserCircle, ShieldCheck, ShieldHalf, Bell, Shield,
  Monitor, Fingerprint, MonitorPlay, Award, LayoutPanelTop, QrCode,
  FileSpreadsheet, MessageSquareQuote
} from 'lucide-react';
import { UserRole, User, ControlRequest } from '../types';
import { APP_CONFIG, ROLES_ARABIC } from '../constants';

interface SidebarLink {
  id: string;
  label: string;
  icon: any;
  badge?: number | null;
}

interface SidebarProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  controlRequests?: ControlRequest[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user, onLogout, activeTab, setActiveTab, isOpen, setIsOpen, isCollapsed, setIsCollapsed, controlRequests = []
}) => {
  const role = user?.role || 'PROCTOR';
  
  const pendingCount = controlRequests.filter(r => 
    (role === 'PROCTOR' ? r.from === user.full_name : user.assigned_committees?.includes(r.committee)) && 
    (r.status === 'PENDING' || r.status === 'IN_PROGRESS')
  ).length;

  const adminLinks: SidebarLink[] = [
    { id: 'head-dash', label: 'غرفة العمليات', icon: LayoutPanelTop },
    { id: 'dashboard', label: 'الإحصائيات العامة', icon: LayoutDashboard },
    { id: 'control-monitor', label: 'لوحة العرض (TV)', icon: MonitorPlay },
    { id: 'control-manager', label: 'مركز القيادة', icon: ShieldHalf },
    { id: 'proctor-excellence', label: 'سجل التميز', icon: Award },
    { id: 'committee-labels', label: 'ملصقات اللجان (QR)', icon: QrCode },
    { id: 'teachers', label: 'الصلاحيات', icon: Users },
    { id: 'students', label: 'الطلاب', icon: GraduationCap },
    { id: 'committees', label: 'المراقبة', icon: ClipboardList },
    { id: 'daily-reports', label: 'التقارير اليومية', icon: FileSpreadsheet },
    { id: 'official-forms', label: 'النماذج', icon: FileText },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings },
  ];

  const controlManagerLinks: SidebarLink[] = [
    { id: 'head-dash', label: 'غرفة العمليات', icon: LayoutPanelTop },
    { id: 'control-manager', label: 'مركز القيادة', icon: ShieldHalf },
    { id: 'paper-logs', label: 'استلام المظاريف', icon: Inbox },
    { id: 'receipt-history', label: 'سجل العمليات', icon: History },
  ];

  const proctorLinks: SidebarLink[] = [
    { id: 'my-tasks', label: 'رصد اللجنة', icon: ClipboardList },
    { id: 'proctor-alerts', label: 'سجل البلاغات', icon: MessageSquareQuote, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'digital-id', label: 'الهوية الرقمية', icon: Fingerprint },
  ];

  const counselorLinks: SidebarLink[] = [
    { id: 'student-absences', label: 'متابعة الغياب', icon: Users },
  ];

  const controlLinks: SidebarLink[] = [
    { id: 'paper-logs', label: 'استلام المظاريف', icon: Inbox },
    { id: 'receipt-history', label: 'سجل العمليات', icon: History },
  ];

  const assistantControlLinks: SidebarLink[] = [
    { id: 'assigned-requests', label: 'بلاغات اللجان', icon: ShieldAlert, badge: pendingCount > 0 ? pendingCount : null },
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden animate-fade-in" onClick={() => setIsOpen(false)}/>
      )}

      <div className={`fixed right-0 top-0 h-full bg-[#0f172a] text-white shadow-2xl z-[110] flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0 w-72' : 'translate-x-full lg:translate-x-0'} ${!isOpen && isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between h-20">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center p-1.5 shrink-0">
               <img src={APP_CONFIG.LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="animate-fade-in whitespace-nowrap">
                <h1 className="text-sm font-black text-white leading-none">كنترول الاختبارات</h1>
                <p className="text-[10px] text-slate-500 font-bold mt-1">Smart Control System</p>
              </div>
            )}
          </div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex p-1.5 bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors">
            {isCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => { setActiveTab(link.id); setIsOpen(false); }}
              className={`w-full flex items-center p-3 rounded-xl transition-all group relative ${isCollapsed && !isOpen ? 'justify-center' : 'gap-3'} ${activeTab === link.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <link.icon size={20} className={activeTab === link.id ? '' : 'shrink-0 group-hover:scale-110 transition-transform'} />
              {(!isCollapsed || isOpen) && <span className="font-bold text-[13px] flex-1 text-right">{link.label}</span>}
              {link.badge && (
                <span className={`absolute ${isCollapsed && !isOpen ? 'top-1 right-1' : 'left-3'} bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#0f172a]`}>
                  {link.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-900/50">
          {(!isCollapsed || isOpen) && (
            <div className="mb-4 px-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">المستخدم</p>
              <h4 className="text-xs font-black text-white truncate">{user.full_name}</h4>
              <p className="text-[9px] text-indigo-400 font-bold mt-1 uppercase tracking-tighter">{ROLES_ARABIC[user.role]}</p>
            </div>
          )}
          <button onClick={onLogout} className={`w-full flex items-center p-3 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-all font-bold text-xs ${isCollapsed && !isOpen ? 'justify-center' : 'gap-3'}`}>
            <LogOut size={18} className="shrink-0" />
            {(!isCollapsed || isOpen) && <span className="flex-1 text-right">تسجيل الخروج</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
