
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  ClipboardList, 
  LogOut,
  ShieldAlert,
  Inbox,
  Contact2,
  FileText,
  Settings,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { UserRole } from '../types';
import { APP_CONFIG } from '../constants';

interface SidebarProps {
  role: UserRole;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  role, 
  onLogout, 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen,
  isCollapsed,
  setIsCollapsed
}) => {
  const adminLinks = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'teachers', label: 'الصلاحيات', icon: Users },
    { id: 'students', label: 'الطلاب', icon: GraduationCap },
    { id: 'committees', label: 'المراقبة', icon: ClipboardList },
    { id: 'official-forms', label: 'النماذج', icon: FileText },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings },
  ];

  const proctorLinks = [
    { id: 'my-tasks', label: 'رصد اللجنة', icon: ClipboardList },
    { id: 'digital-id', label: 'البطاقة الرقمية', icon: Contact2 },
  ];

  const counselorLinks = [
    { id: 'student-absences', label: 'متابعة الغياب', icon: Users },
  ];

  const controlLinks = [
    { id: 'paper-logs', label: 'الاستلام', icon: Inbox },
  ];

  const assistantControlLinks = [
    { id: 'assigned-requests', label: 'طلباتي', icon: ShieldAlert },
  ];

  const links = role === 'ADMIN' ? adminLinks : 
                role === 'PROCTOR' ? proctorLinks : 
                role === 'COUNSELOR' ? counselorLinks : 
                role === 'ASSISTANT_CONTROL' ? assistantControlLinks :
                controlLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <div className={`
        fixed right-0 top-0 h-full bg-slate-900 text-white shadow-2xl z-[110] flex flex-col
        transition-all duration-300 ease-in-out no-print
        ${isOpen ? 'translate-x-0 w-72' : 'translate-x-full lg:translate-x-0'}
        ${!isOpen && isCollapsed ? 'lg:w-20' : 'lg:w-72'}
      `}>
        <div className={`p-6 flex items-center border-b border-slate-800 transition-all ${isCollapsed && !isOpen ? 'justify-center' : 'justify-between'}`}>
          <div className="text-right flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
               <img src={APP_CONFIG.LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="animate-fade-in whitespace-nowrap">
                <h1 className="text-lg font-black text-blue-400 leading-none">كنترول الاختبارات</h1>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{role}</p>
              </div>
            )}
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="hidden lg:flex p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
          >
            {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center px-4 py-4 rounded-2xl transition-all duration-200 group relative ${
                isCollapsed && !isOpen ? 'justify-center' : 'gap-4'
              } ${
                activeTab === link.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <link.icon size={22} className={activeTab === link.id ? 'animate-pulse' : ''} />
              {(!isCollapsed || isOpen) && (
                <span className="font-bold text-sm whitespace-nowrap animate-fade-in">{link.label}</span>
              )}
              {isCollapsed && !isOpen && (
                <div className="absolute right-full mr-4 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-50">
                  {link.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
           <button
            onClick={onLogout}
            className={`w-full flex items-center px-4 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors font-bold text-sm group relative ${
              isCollapsed && !isOpen ? 'justify-center' : 'gap-4'
            }`}
          >
            <LogOut size={20} />
            {(!isCollapsed || isOpen) && <span className="animate-fade-in">تسجيل الخروج</span>}
            {isCollapsed && !isOpen && (
              <div className="absolute right-full mr-4 px-3 py-2 bg-red-600 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-50">
                تسجيل الخروج
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
