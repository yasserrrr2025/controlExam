
import React, { useState, useEffect } from 'react';
import { User, Student, Absence, Supervision, ControlRequest, DeliveryLog } from './types';
import Sidebar from './components/Sidebar';
import Login from './screens/Login';
import AdminDashboardOverview from './screens/admin/DashboardOverview';
import AdminUsersManager from './screens/admin/UsersManager';
import AdminStudentsManager from './screens/admin/StudentsManager';
import AdminSupervisionMonitor from './screens/admin/SupervisionMonitor';
import AdminOfficialForms from './screens/admin/OfficialForms';
import AdminSystemSettings from './screens/admin/SystemSettings';
import ProctorDailyAssignmentFlow from './screens/proctor/DailyAssignmentFlow';
import TeacherBadgeView from './screens/proctor/TeacherBadgeView';
import CounselorAbsenceMonitor from './screens/counselor/AbsenceMonitor';
import ControlReceiptView from './screens/control/ReceiptView';
import AssistantControlView from './screens/control/AssistantControlView';
import { Bell, Menu, Download, Volume2 } from 'lucide-react';
import { db, supabase } from './supabase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // للجوال
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // للديسك توب
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [supervisions, setSupervisions] = useState<Supervision[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [notifications, setNotifications] = useState<{id: string, text: string, type?: 'broadcast'}[]>([]);
  const [controlRequests, setControlRequests] = useState<ControlRequest[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);

  const addNotification = (text: any, type?: 'broadcast') => {
    const safeText = typeof text === 'string' ? text : (text?.message || JSON.stringify(text));
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, text: safeText, type }, ...prev]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
  };

  const fetchData = async () => {
    try {
      const [u, s, sv, ab, cr, dl] = await Promise.all([
        db.users.getAll(),
        db.students.getAll(),
        db.supervision.getAll(),
        db.absences.getAll(),
        db.controlRequests.getAll(),
        db.deliveryLogs.getAll()
      ]);
      setUsers(u || []);
      setStudents(s || []);
      setSupervisions(sv || []);
      setAbsences(ab || []);
      setControlRequests(cr || []);
      setDeliveryLogs(dl || []);
    } catch (err: any) {
      const errorMsg = err?.message || "حدث خطأ غير معروف في الاتصال";
      addNotification(`خطأ في جلب البيانات: ${errorMsg}`);
    }
  };

  useEffect(() => {
    fetchData();
    const absencesSub = supabase.channel('realtime_absences').on('postgres_changes', { event: '*', table: 'absences', schema: 'public' }, () => fetchData()).subscribe();
    const requestsSub = supabase.channel('realtime_requests').on('postgres_changes', { event: '*', table: 'control_requests', schema: 'public' }, () => fetchData()).subscribe();
    const notificationsSub = supabase.channel('realtime_notifications').on('postgres_changes', { event: 'INSERT', table: 'notifications', schema: 'public' }, (payload) => addNotification(payload.new.text, 'broadcast')).subscribe();
    return () => {
      supabase.removeChannel(absencesSub);
      supabase.removeChannel(requestsSub);
      supabase.removeChannel(notificationsSub);
    };
  }, []);

  const handleBroadcast = async (msg: string, target: any) => {
    try {
      await db.notifications.broadcast(msg, target, currentUser?.full_name || 'مدير');
    } catch (err) {
      addNotification('فشل إرسال البث الجماعي');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      if (!confirm('هل أنت متأكد من حذف هذا المعلم؟')) return;
      await db.users.delete(id);
      fetchData();
      addNotification('تم حذف المعلم بنجاح');
    } catch (e) {
      addNotification(e);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
      await db.students.delete(id);
      fetchData();
      addNotification('تم حذف الطالب بنجاح');
    } catch (e) {
      addNotification(e);
    }
  };

  const renderContent = () => {
    if (!currentUser) return null;
    const commonProps = { onAlert: addNotification };

    switch (activeTab) {
      case 'dashboard':
        return (
          <AdminDashboardOverview 
            stats={{ students: students.length, users: users.length, activeSupervisions: supervisions.length }} 
            absences={absences} 
            supervisions={supervisions}
            users={users}
            deliveryLogs={deliveryLogs}
            studentsList={students}
            onBroadcast={handleBroadcast}
          />
        );
      case 'teachers':
        return <AdminUsersManager users={users} setUsers={async (u: any) => { try { await db.users.upsert(typeof u === 'function' ? u(users) : u); fetchData(); } catch(e) { addNotification(e); } }} students={students} onDeleteUser={deleteUser} {...commonProps} />;
      case 'students':
        return <AdminStudentsManager students={students} setStudents={async (s: any) => { try { await db.students.upsert(typeof s === 'function' ? s(students) : s); fetchData(); } catch(e) { addNotification(e); } }} onDeleteStudent={deleteStudent} {...commonProps} />;
      case 'committees':
        return <AdminSupervisionMonitor supervisions={supervisions} users={users} students={students} absences={absences} deliveryLogs={deliveryLogs} />;
      case 'official-forms':
        return <AdminOfficialForms absences={absences} students={students} />;
      case 'settings':
        return <AdminSystemSettings resetFunctions={{
          students: async () => { await supabase.from('students').delete().neq('id', '0000'); fetchData(); },
          teachers: async () => { await supabase.from('users').delete().neq('role', 'ADMIN'); fetchData(); },
          operations: async () => { await supabase.from('absences').delete().neq('id', '0000'); await supabase.from('delivery_logs').delete().neq('id', '0000'); fetchData(); },
          fullReset: async () => { alert('يرجى استخدام لوحة تحكم Supabase للتهيئة الكاملة'); }
        }} />;
      case 'assigned-requests':
        return <AssistantControlView user={currentUser} requests={controlRequests} setRequests={async (r: any) => { fetchData(); }} {...commonProps} />;
      case 'paper-logs':
        return <ControlReceiptView user={currentUser} students={students} absences={absences} deliveryLogs={deliveryLogs} setDeliveryLogs={async (l: any) => { 
          try {
            const newLog = typeof l === 'function' ? l(deliveryLogs)[0] : l[0];
            await db.deliveryLogs.insert(newLog);
            fetchData();
          } catch(e) { addNotification(e); }
        }} supervisions={supervisions} users={users} controlRequests={controlRequests} setControlRequests={async (r: any) => { fetchData(); }} {...commonProps} />;
      case 'digital-id':
        return <TeacherBadgeView user={currentUser} />;
      case 'student-absences':
        return <CounselorAbsenceMonitor absences={absences} students={students} supervisions={supervisions} users={users} />;
      case 'my-tasks':
        return <ProctorDailyAssignmentFlow user={currentUser} supervisions={supervisions} setSupervisions={async (sv: any) => {
          try {
            const newSv = typeof sv === 'function' ? sv(supervisions).pop() : sv.pop();
            if (newSv) await db.supervision.upsert(newSv);
            fetchData();
          } catch(e) { addNotification(e); }
        }} students={students} absences={absences} setAbsences={async (ab: any) => {
          try {
            const currentAbs = typeof ab === 'function' ? ab(absences) : ab;
            const lastChange = currentAbs[currentAbs.length - 1];
            if (absences.length > currentAbs.length) {
               const removed = absences.find(a => !currentAbs.some((ca:any) => ca.student_id === a.student_id));
               if (removed) await db.absences.delete(removed.student_id);
            } else {
               await db.absences.insert(lastChange);
            }
            fetchData();
          } catch(e) { addNotification(e); }
        }} deliveryLogs={deliveryLogs} sendRequest={async (txt: string, committee: string) => {
          try {
            await db.controlRequests.insert({ from: currentUser.full_name, committee: committee, text: txt, time: new Date().toLocaleTimeString('ar-SA'), status: 'PENDING' });
            fetchData();
            addNotification(`تم إرسال بلاغ اللجنة ${committee} للكنترول`);
          } catch(e) { addNotification(e); }
        }} {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Tajawal'] overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {currentUser && (
        <>
          <header className="fixed top-0 right-0 left-0 bg-white/80 backdrop-blur-md z-[90] lg:hidden border-b px-6 py-4 flex justify-between items-center no-print">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-100 rounded-xl">
               <Menu size={24} className="text-slate-700" />
             </button>
             <h1 className="font-black text-slate-900">كنترول الاختبارات</h1>
             {installPrompt && (
               <button onClick={() => installPrompt.prompt()} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20">
                 <Download size={20} />
               </button>
             )}
          </header>
          <Sidebar 
            role={currentUser?.role || 'PROCTOR'} 
            onLogout={() => setCurrentUser(null)} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            isOpen={isSidebarOpen} 
            setIsOpen={setIsSidebarOpen} 
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        </>
      )}

      <div className="fixed top-4 left-4 z-[200] flex flex-col gap-3 w-80 max-w-[calc(100vw-2rem)] no-print">
        {notifications.map(n => (
          <div key={n.id} className={`${n.type === 'broadcast' ? 'bg-blue-600 text-white border-white' : 'bg-slate-900 text-white border-blue-400'} border-r-4 shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-4 animate-slide-up`}>
             {n.type === 'broadcast' ? <Volume2 size={24} className="animate-bounce shrink-0" /> : <Bell size={20} className="text-blue-400 shrink-0" />}
             <span className="font-bold text-[13px]">{n.text}</span>
          </div>
        ))}
      </div>

      <main className={`transition-all duration-300 min-h-screen ${currentUser ? (isSidebarCollapsed ? 'lg:mr-20' : 'lg:mr-72') : ''} ${currentUser ? 'p-6 lg:p-10 pt-24 lg:pt-10' : ''}`}>
        {currentUser ? renderContent() : <Login users={users} onLogin={setCurrentUser} />}
      </main>
    </div>
  );
};

export default App;
