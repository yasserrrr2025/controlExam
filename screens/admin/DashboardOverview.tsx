
import React, { useState, useMemo, useEffect } from 'react';
import { GraduationCap, UserCheck, AlertCircle, Users, ArrowUpRight, Send, Radio, Activity, Search, ShieldAlert, Timer, UserX, Clock, UserCircle, CheckCircle2, AlertTriangle, PackageCheck, Bookmark, Info, ShieldCheck, Map, Truck } from 'lucide-react';
import { Supervision, Absence, DeliveryLog, User, Student, UserRole, SystemConfig } from '../../types';
import { ROLES_ARABIC } from '../../constants';

interface AdminDashboardProps {
  stats: { students: number; users: number; activeSupervisions: number };
  absences?: Absence[];
  supervisions?: Supervision[];
  users?: User[];
  deliveryLogs?: DeliveryLog[];
  studentsList?: Student[];
  onBroadcast: (msg: string, target: UserRole | 'ALL') => void;
  systemConfig: SystemConfig;
}

interface CommitteeStatus {
  num: string;
  proctor?: User;
  absences: number;
  lates: number;
  totalStudents: number;
  status: 'IDLE' | 'ACTIVE' | 'PROBLEM' | 'DONE' | 'SUBMITTED';
  isAnomaly: boolean;
  receivedGrades: { grade: string, receiver: string }[];
}

const StatCard = ({ title, value, icon, bgColor, iconColor }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all animate-fade-in">
    <div className={`p-3 ${bgColor} ${iconColor} rounded-xl shrink-0`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-tight mb-0.5 truncate">{title}</p>
      <p className="text-xl font-black text-slate-900 tabular-nums">{value}</p>
    </div>
  </div>
);

const AdminDashboardOverview = ({ 
  stats, 
  absences = [], 
  supervisions = [], 
  users = [], 
  deliveryLogs = [], 
  studentsList = [], 
  onBroadcast, 
  systemConfig 
}: AdminDashboardProps) => {
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [targetRole, setTargetRole] = useState<UserRole | 'ALL'>('ALL');
  const [liveSearch, setLiveSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const liveCommittees = useMemo<CommitteeStatus[]>(() => {
    const committeeNums = Array.from(new Set(studentsList.map((s: Student) => s.committee_number))).filter(Boolean).sort((a: any, b: any) => Number(a) - Number(b));
    const now = new Date();
    const [startHour, startMin] = (systemConfig.exam_start_time || '08:00').split(':').map(Number);
    const examStartTimeDate = new Date();
    examStartTimeDate.setHours(startHour, startMin, 0);
    const isAfterGrace = now > new Date(examStartTimeDate.getTime() + 10 * 60 * 1000);

    return committeeNums.map(num => {
      const sv = supervisions.find((s: Supervision) => s.committee_number === num);
      const proctor = users.find((u: User) => u.id === sv?.teacher_id);
      const committeeStudents = studentsList.filter(s => s.committee_number === num);
      const committeeAbsences = absences.filter((a: Absence) => a.committee_number === num && a.type === 'ABSENT');
      const committeeLates = absences.filter((a: Absence) => a.committee_number === num && a.type === 'LATE');
      
      const allLogs = deliveryLogs.filter(l => l.committee_number === num);
      const confirmedLogs = allLogs.filter(l => l.status === 'CONFIRMED');
      const pendingLogs = allLogs.filter(l => l.status === 'PENDING');
      
      const receivedGrades = confirmedLogs.map(l => ({ grade: l.grade, receiver: l.teacher_name }));
      
      let status: 'IDLE' | 'ACTIVE' | 'PROBLEM' | 'DONE' | 'SUBMITTED' = 'IDLE';
      
      if (confirmedLogs.length > 0 && confirmedLogs.length >= Array.from(new Set(committeeStudents.map(s => s.grade))).length) {
        status = 'DONE';
      } else if (pendingLogs.length > 0) {
        status = 'SUBMITTED';
      } else if (committeeAbsences.length > 0 || committeeLates.length > 0) {
        status = 'PROBLEM';
      } else if (sv) {
        status = 'ACTIVE';
      }

      return { 
        num, proctor, absences: committeeAbsences.length, lates: committeeLates.length,
        totalStudents: committeeStudents.length, status, isAnomaly: isAfterGrace && !sv && status !== 'DONE' && status !== 'SUBMITTED',
        receivedGrades
      };
    });
  }, [studentsList, supervisions, users, absences, deliveryLogs, systemConfig, currentTime]);

  const filteredCommittees = liveCommittees.filter(c => 
    c.num.includes(liveSearch) || (c.proctor?.full_name && c.proctor.full_name.includes(liveSearch))
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">مركز القيادة</h2>
          <p className="text-slate-500 text-xs font-medium flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></div>
            بث مباشر ميداني للجان
          </p>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-xl text-white text-xs font-black flex items-center gap-3">
           <Clock size={14} className="text-indigo-400"/>
           <span className="tabular-nums">{currentTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
         <StatCard title="الطلاب" value={stats.students} icon={<GraduationCap size={20} />} bgColor="bg-slate-50" iconColor="text-slate-600" />
         <StatCard title="لجان نشطة" value={liveCommittees.filter(c => c.status === 'ACTIVE' || c.status === 'PROBLEM').length} icon={<Radio size={20} />} bgColor="bg-indigo-50" iconColor="text-indigo-600" />
         <StatCard title="في الطريق" value={liveCommittees.filter(c => c.status === 'SUBMITTED').length} icon={<Truck size={20} />} bgColor="bg-amber-50" iconColor="text-amber-600" />
         <StatCard title="إجمالي الغياب" value={absences.filter(a => a.type === 'ABSENT').length} icon={<UserX size={20} />} bgColor="bg-rose-50" iconColor="text-rose-600" />
      </div>

      <div className="space-y-4">
           <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-sm font-black text-slate-800 w-full md:w-auto">حائط اللجان المباشر</h3>
              <div className="relative w-full md:w-64">
                <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="بحث..." className="w-full pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-indigo-600" value={liveSearch} onChange={e => setLiveSearch(e.target.value)} />
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCommittees.map(committee => {
                let statusLabel = "قيد العمل";
                let statusColor = "bg-slate-100 text-slate-500";

                if (committee.isAnomaly) {
                  statusLabel = "بدون مراقب";
                  statusColor = "bg-rose-600 text-white animate-pulse";
                } else if (committee.status === 'DONE') {
                  statusLabel = "مكتملة";
                  statusColor = "bg-emerald-500 text-white";
                } else if (committee.status === 'SUBMITTED') {
                  statusLabel = "متجهة للكنترول";
                  statusColor = "bg-amber-500 text-white animate-pulse";
                } else if (committee.status === 'PROBLEM') {
                  statusLabel = "رصد حالات";
                  statusColor = "bg-rose-500 text-white";
                } else if (committee.status === 'ACTIVE') {
                  statusLabel = "مراقبة نشطة";
                  statusColor = "bg-indigo-600 text-white";
                }

                return (
                  <div key={committee.num} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all hover:border-indigo-100 group">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">اللجنة</span>
                          <span className="text-2xl font-black text-slate-900 tabular-nums">{committee.num}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight ${statusColor}`}>
                          {statusLabel}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 mb-1">المراقب</p>
                        <p className="text-xs font-bold text-slate-800 truncate">{committee.proctor?.full_name || 'بانتظار المباشرة'}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50/50 p-2 rounded-lg text-center border border-slate-100"><p className="text-[8px] font-black text-slate-400 mb-0.5">طلاب</p><p className="text-sm font-black">{committee.totalStudents}</p></div>
                        <div className={`p-2 rounded-lg text-center border ${committee.absences > 0 ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50/50 border-slate-100 text-slate-400'}`}><p className="text-[8px] font-black mb-0.5">غياب</p><p className="text-sm font-black">{committee.absences}</p></div>
                        <div className={`p-2 rounded-lg text-center border ${committee.lates > 0 ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50/50 border-slate-100 text-slate-400'}`}><p className="text-[8px] font-black mb-0.5">تأخر</p><p className="text-sm font-black">{committee.lates}</p></div>
                    </div>
                  </div>
                );
              })}
           </div>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
