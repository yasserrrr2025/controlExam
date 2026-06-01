
import React from 'react';
import { 
  LayoutDashboard, Users, GraduationCap, ClipboardList, LogOut, LayoutGrid,
  ShieldAlert, Inbox, FileText, Settings, X, ChevronRight, ChevronLeft,
  History, IdCard, UserCircle, ShieldCheck, ShieldHalf, Bell, Shield,
  Monitor, Fingerprint, MonitorPlay, Award, LayoutPanelTop, QrCode,
  FileSpreadsheet, MessageSquareQuote, CalendarDays, BrainCircuit, BookOpen, PackageSearch, BarChart3
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
    { id: 'print-sheets', label: 'كشوف', icon: FileSpreadsheet },
    { id: 'head-dash', label: 'ط؛ط±ظپط© ط§ظ„ط¹ظ…ظ„ظٹط§طھ', icon: LayoutPanelTop },
    { id: 'dashboard', label: 'ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ ط§ظ„ط¹ط§ظ…ط©', icon: LayoutDashboard },
    { id: 'control-monitor', label: 'ظ„ظˆط­ط© ط§ظ„ط¹ط±ط¶ (TV)', icon: MonitorPlay },
    { id: 'control-monitor-2', label: 'ظ„ظˆط­ط© ط§ظ„ط¹ط±ط¶ (TV2)', icon: Monitor },
    { id: 'control-manager', label: 'ظ…ط±ظƒط² ط§ظ„ظ‚ظٹط§ط¯ط©', icon: ShieldHalf },
    { id: 'ai-insights', label: 'ط§ظ„ظ…ط­ظ„ظ„ ط§ظ„ط°ظƒظٹ (AI)', icon: BrainCircuit },
    { id: 'comprehensive-stats', label: 'ط¥ط­طµط§ط¦ظٹط§طھ ط´ط§ظ…ظ„ط©', icon: BarChart3 },
    { id: 'master-portfolio', label: 'ظ…ظ„ظپ ط§ظ„ط¥ظ†ط¬ط§ط² ًں“ک', icon: BookOpen },
    { id: 'proctor-excellence', label: 'ط³ط¬ظ„ ط§ظ„طھظ…ظٹط²', icon: Award },
    { id: 'archive-boxes', label: 'ط£ط±ط´ظٹظپ ط§ظ„طµظ†ط§ط¯ظٹظ‚ ًں“¦', icon: PackageSearch },
    { id: 'committee-labels', label: 'ظ…ظ„طµظ‚ط§طھ ط§ظ„ظ„ط¬ط§ظ† (QR)', icon: QrCode },
    { id: 'door-labels', label: 'ظ…ظ„طµظ‚ط§طھ ط§ظ„ط£ط¨ظˆط§ط¨', icon: QrCode },
    { id: 'teachers', label: 'ط§ظ„طµظ„ط§ط­ظٹط§طھ', icon: Users },
    { id: 'students', label: 'ط§ظ„ط·ظ„ط§ط¨', icon: GraduationCap },
    { id: 'seating-planner', label: 'طھظˆط²ظٹط¹ ط§ظ„ظ…ظ‚ط§ط¹ط¯ ًںھ‘', icon: LayoutGrid },
    { id: 'committees', label: 'ط§ظ„ظ…ط±ط§ظ‚ط¨ط©', icon: ClipboardList },
    { id: 'daily-reports', label: 'ط§ظ„طھظ‚ط§ط±ظٹط± ط§ظ„ظٹظˆظ…ظٹط©', icon: FileSpreadsheet },
    { id: 'official-forms', label: 'ط§ظ„ظ†ظ…ط§ط°ط¬ (ط§ظ„ط؛ظٹط§ط¨ ظˆط§ظ„طھط£ط®ظٹط±)', icon: FileText },
    { id: 'envelope-opening', label: 'ظپطھط­ ط§ظ„ظ…ط¸ط§ط±ظٹظپ', icon: Inbox },
    { id: 'paper-logs', label: 'ط§ط³طھظ„ط§ظ… ط§ظ„ظ…ط¸ط§ط±ظٹظپ', icon: Inbox },
    { id: 'envelope-labels', label: 'ظ…ظ„طµظ‚ط§طھ ط§ظ„ظ…ط¸ط§ط±ظٹظپ', icon: QrCode },
    { id: 'settings', label: 'ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ†ط¸ط§ظ…', icon: Settings },
  ];

  const controlManagerLinks: SidebarLink[] = [
    { id: 'head-dash', label: 'ط؛ط±ظپط© ط§ظ„ط¹ظ…ظ„ظٹط§طھ', icon: LayoutPanelTop },
    { id: 'control-manager', label: 'ظ…ط±ظƒط² ط§ظ„ظ‚ظٹط§ط¯ط©', icon: ShieldHalf },
    { id: 'envelope-opening', label: 'ظپطھط­ ط§ظ„ظ…ط¸ط§ط±ظٹظپ', icon: Inbox },
    { id: 'paper-logs', label: 'ط§ط³طھظ„ط§ظ… ط§ظ„ظ…ط¸ط§ط±ظٹظپ', icon: Inbox },
    { id: 'receipt-history', label: 'ط³ط¬ظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ', icon: History },
  ];

  const proctorLinks: SidebarLink[] = [
    { id: 'my-tasks', label: 'ط±طµط¯ ط§ظ„ظ„ط¬ظ†ط©', icon: ClipboardList },
    { id: 'my-schedule', label: 'ط¬ط¯ظˆظ„ ظ…ط±ط§ظ‚ط¨طھظٹ', icon: CalendarDays },
    { id: 'proctor-alerts', label: 'ط³ط¬ظ„ ط§ظ„ط¨ظ„ط§ط؛ط§طھ', icon: MessageSquareQuote, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'digital-id', label: 'ط§ظ„ظ‡ظˆظٹط© ط§ظ„ط±ظ‚ظ…ظٹط©', icon: Fingerprint },
  ];

  const counselorLinks: SidebarLink[] = [
    { id: 'student-absences', label: 'ظ…طھط§ط¨ط¹ط© ط§ظ„ط؛ظٹط§ط¨', icon: Users },
  ];

  const controlLinks: SidebarLink[] = [
    { id: 'envelope-opening', label: 'ظپطھط­ ط§ظ„ظ…ط¸ط§ط±ظٹظپ', icon: Inbox },
    { id: 'paper-logs', label: 'ط§ط³طھظ„ط§ظ… ط§ظ„ظ…ط¸ط§ط±ظٹظپ', icon: Inbox },
    { id: 'receipt-history', label: 'ط³ط¬ظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ', icon: History },
  ];

  const assistantControlLinks: SidebarLink[] = [
    { id: 'assigned-requests', label: 'ط¨ظ„ط§ط؛ط§طھ ط§ظ„ظ„ط¬ط§ظ†', icon: ShieldAlert, badge: pendingCount > 0 ? pendingCount : null },
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

      <div
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        className={`fixed right-0 top-0 h-full bg-gradient-to-b from-[#020817] via-[#0a1628] to-[#020617] text-white shadow-2xl z-[110] flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0 w-80' : 'translate-x-full lg:translate-x-0'} ${!isOpen && isCollapsed ? 'lg:w-24' : 'lg:w-80'}`}
      >
        <div className="p-6 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-2 ring-white/10">
               <img src={APP_CONFIG.LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="animate-fade-in whitespace-nowrap text-right">
                <h1 className="text-lg font-black text-blue-400 leading-none tracking-tighter uppercase">ظƒظ†طھط±ظˆظ„ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ</h1>
                <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-widest">Smart Control System</p>
              </div>
            )}
          </div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex p-2 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-colors">
            {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => { setActiveTab(link.id); setIsOpen(false); }}
              className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${isCollapsed && !isOpen ? 'justify-center' : 'gap-3.5 flex-row-reverse'} ${activeTab === link.id ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)]' : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'}`}
            >
              <link.icon size={22} className={activeTab === link.id ? 'animate-pulse' : 'shrink-0 group-hover:scale-110 transition-transform'} />
              {(!isCollapsed || isOpen) && <span className="font-bold text-sm flex-1 text-right">{link.label}</span>}
              {link.badge && (
                <span className={`absolute ${isCollapsed && !isOpen ? 'top-2 right-2' : 'left-4'} bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce border-2 border-[#020817]`}>
                  {link.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {(!isCollapsed || isOpen) && (
          <div className="px-4 pb-4">
            <div className="relative rounded-[1.8rem] overflow-hidden">
              {/* ط®ظ„ظپظٹط© ط§ظ„ظƒط§ط±طھ */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0f1e35] to-[#0a1525] border border-blue-500/20 rounded-[1.8rem] shadow-[0_0_30px_rgba(37,99,235,0.15)]" />
              {/* طھظˆظ‡ط¬ ط£ط²ط±ظ‚ ط¹ظ„ظˆظٹ */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-12 bg-blue-600/30 blur-2xl rounded-full" />

              <div className="relative z-10 p-5 flex flex-col items-center gap-0">
                {/* ط§ظ„ط´ط¹ط§ط± ظ…ط¹ ط¥ط·ط§ط± ط¶ظˆط¦ظٹ */}
                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-md scale-110" />
                  <div className="relative w-16 h-16 bg-white rounded-2xl p-2 shadow-[0_4px_24px_rgba(37,99,235,0.25)] border border-white/20">
                    <img src={APP_CONFIG.LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  {/* ظ†ظ‚ط·ط© ط£ظˆظ† ظ„ط§ظٹظ† */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0f1729] shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                </div>

                {/* ط§ظ„ط§ط³ظ… ظƒط§ظ…ظ„ط§ظ‹ */}
                <h4 className="text-white font-black text-center text-sm leading-snug break-words w-full px-1 mb-3">
                  {user.full_name}
                </h4>

                {/* ط§ظ„ط¯ظˆط± */}
                <div className="inline-flex items-center gap-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck size={11} />
                  {ROLES_ARABIC[user.role]}
                </div>

                {/* ط´ط±ظٹط· ط§ظ„ط­ط§ظ„ط© */}
                <div className="mt-4 w-full border-t border-white/5 pt-3 flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">ظ…طھطµظ„ ط§ظ„ط¢ظ† آ· Smart Control</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className={`w-full flex items-center px-4 py-4 text-red-400 hover:bg-red-500/15 hover:text-red-400 rounded-2xl transition-all duration-200 font-bold text-sm ${isCollapsed && !isOpen ? 'justify-center' : 'gap-4 flex-row-reverse'}`}>
            <LogOut size={20} className="shrink-0" />
            {(!isCollapsed || isOpen) && <span className="flex-1 text-right">طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
