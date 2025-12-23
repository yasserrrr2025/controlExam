
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
  Menu
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
}

const Sidebar: React.FC<SidebarProps> = ({ role, onLogout, activeTab, setActiveTab, isOpen, setIsOpen }) => {
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
        fixed right-0 top-0 h-full w-72 bg-slate-900 text-white shadow-2xl z-[110] flex flex-col
        transition-transform duration-300 ease-in-out no-print
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 flex items-center justify-between border-b border-slate-800">
          <div className="text-right flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
               <img src={APP_CONFIG.LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black text-blue-400 leading-none">كنترول الاختبارات</h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{role}</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <X size={24} />
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
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 ${
                activeTab === link.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-[-4px]' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <link.icon size={22} className={activeTab === link.id ? 'animate-pulse' : ''} />
              <span className="font-bold text-sm">{link.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-4">
           <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors font-bold text-sm"
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
