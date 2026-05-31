import React, { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  Link,
  Medal,
  MessageSquareWarning,
  Printer,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { Absence, CommitteeReport, ControlRequest, DeliveryLog, ExamSchedule, Student, Supervision, SystemConfig, User } from '../../types';

interface Props {
  students: Student[];
  users: User[];
  supervisions: Supervision[];
  absences: Absence[];
  deliveryLogs: DeliveryLog[];
  controlRequests: ControlRequest[];
  committeeReports: CommitteeReport[];
  examSchedule: ExamSchedule[];
  systemConfig: SystemConfig;
  publicMode?: boolean;
}

const dateKey = (value?: string | null) => {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return text.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const sameDate = (value: string | undefined | null, date: string) => dateKey(value) === date;
const sameCommittee = (a: unknown, b: unknown) => String(a || '') === String(b || '');

const safeTime = (value?: string | null) => {
  if (!value) return '---';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '---';
  return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
};

const minutesBetween = (start?: string | null, end?: string | null) => {
  if (!start || !end) return null;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 60000));
};

const avg = (values: Array<number | null>) => {
  const valid = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (!valid.length) return null;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
};

const formatMins = (value: number | null) => value === null ? '---' : `${value} د`;

export const ComprehensiveStats: React.FC<Props> = ({
  students,
  users,
  supervisions,
  absences,
  deliveryLogs,
  controlRequests,
  committeeReports,
  examSchedule,
  systemConfig,
  publicMode = false,
}) => {
  const allDates = useMemo(() => {
    return Array.from(new Set([
      ...examSchedule.map(item => dateKey(item.exam_date)),
      ...supervisions.map(item => dateKey(item.date)),
      ...absences.map(item => dateKey(item.date)),
      ...deliveryLogs.map(item => dateKey(item.time)),
      ...controlRequests.map(item => dateKey(item.time)),
    ].filter(Boolean))).sort();
  }, [absences, controlRequests, deliveryLogs, examSchedule, supervisions]);

  const defaultDate = systemConfig.active_exam_date || allDates.at(-1) || dateKey(new Date().toISOString());
  const [selectedDate, setSelectedDate] = useState(defaultDate);

  const data = useMemo(() => {
    const exams = examSchedule.filter(item => sameDate(item.exam_date, selectedDate));
    const gradeScope = new Set(exams.flatMap(item => item.grades || []));
    const committeeScope = new Set<string>([
      ...exams.flatMap(item => (item.committees || []).map(String)),
      ...supervisions.filter(item => sameDate(item.date, selectedDate)).map(item => String(item.committee_number)),
    ]);

    const scopedStudents = students.filter(student => {
      if (gradeScope.size && !gradeScope.has(student.grade)) return false;
      if (committeeScope.size && !committeeScope.has(String(student.committee_number))) return false;
      return true;
    });

    const dayAbsences = absences.filter(item => sameDate(item.date, selectedDate));
    const dayLogs = deliveryLogs.filter(item => sameDate(item.time, selectedDate));
    const dayRequests = controlRequests.filter(item => sameDate(item.time, selectedDate));
    const daySupervisions = supervisions.filter(item => sameDate(item.date, selectedDate));
    const dayReports = committeeReports.filter(item => sameDate(item.date, selectedDate));

    const absentIds = new Set(dayAbsences.filter(item => item.type === 'ABSENT').map(item => item.student_id));
    const lateIds = new Set(dayAbsences.filter(item => item.type === 'LATE').map(item => item.student_id));
    const present = Math.max(scopedStudents.length - absentIds.size, 0);
    const attendanceRate = scopedStudents.length ? Math.round((present / scopedStudents.length) * 100) : 0;

    const committees = Array.from(new Set([
      ...scopedStudents.map(item => String(item.committee_number)).filter(Boolean),
      ...daySupervisions.map(item => String(item.committee_number)),
      ...dayLogs.map(item => String(item.committee_number)),
      ...dayRequests.map(item => String(item.committee)),
    ])).sort((a, b) => Number(a) - Number(b));

    const committeeStats = committees.map(num => {
      const cStudents = scopedStudents.filter(student => sameCommittee(student.committee_number, num));
      const cAbsences = dayAbsences.filter(item => sameCommittee(item.committee_number, num));
      const cRequests = dayRequests.filter(item => sameCommittee(item.committee, num));
      const cLogs = dayLogs.filter(item => sameCommittee(item.committee_number, num));
      const cSupervisions = daySupervisions.filter(item => sameCommittee(item.committee_number, num));
      const proctors = Array.from(new Set(cSupervisions.map(item => users.find(user => user.id === item.teacher_id || user.national_id === item.teacher_id)?.full_name || item.teacher_id)));
      const joinTime = cSupervisions.map(item => item.date).filter(Boolean).sort()[0];
      const closeLog = cLogs.filter(item => item.type === 'RECEIVE').sort((a, b) => String(a.time).localeCompare(String(b.time)))[0];
      const receiptLogs = cLogs.filter(item => item.type === 'RECEIVE' && item.status === 'CONFIRMED').sort((a, b) => String(a.time).localeCompare(String(b.time)));
      const absent = cAbsences.filter(item => item.type === 'ABSENT').length;
      const late = cAbsences.filter(item => item.type === 'LATE').length;
      const openRequests = cRequests.filter(item => item.status !== 'DONE').length;
      const sessionMins = minutesBetween(joinTime, closeLog?.time);
      const receiptMins = minutesBetween(closeLog?.time, receiptLogs[0]?.time);
      const riskScore = absent * 4 + late * 2 + openRequests * 3 + (!proctors.length ? 4 : 0) + (!receiptLogs.length && closeLog ? 3 : 0);

      return {
        num,
        students: cStudents.length,
        present: Math.max(cStudents.length - absent, 0),
        absent,
        late,
        requests: cRequests.length,
        openRequests,
        proctors,
        joinTime,
        closeTime: closeLog?.time,
        receiptTime: receiptLogs[0]?.time,
        receivers: Array.from(new Set(receiptLogs.map(item => `${item.teacher_name}${item.grade ? ` (${item.grade})` : ''}`).filter(Boolean))),
        sessionMins,
        receiptMins,
        received: receiptLogs.length > 0,
        hasReport: dayReports.some(item => sameCommittee(item.committee_number, num)),
        riskScore,
      };
    });

    const received = committeeStats.filter(item => item.received).length;
    const completionRate = committeeStats.length ? Math.round((received / committeeStats.length) * 100) : 0;
    const unresolvedRate = dayRequests.length ? Math.round((dayRequests.filter(item => item.status !== 'DONE').length / dayRequests.length) * 100) : 0;
    const avgReceipt = avg(committeeStats.map(item => item.receiptMins));
    const avgSession = avg(committeeStats.map(item => item.sessionMins));
    const qualityScore = Math.max(0, Math.min(100,
      Math.round(
        completionRate * 0.34 +
        attendanceRate * 0.28 +
        (100 - unresolvedRate) * 0.18 +
        (avgReceipt === null ? 12 : Math.max(0, 12 - Math.min(12, avgReceipt / 4))) +
        (dayReports.length >= committeeStats.length ? 8 : committeeStats.length ? (dayReports.length / committeeStats.length) * 8 : 0)
      )
    ));

    const materialRecords = exams.map(exam => {
      const examCommittees = committeeStats.filter(item => {
        if (exam.committees?.length) return exam.committees.map(String).includes(item.num);
        return true;
      });
      const examStudents = scopedStudents.filter(student => !exam.grades?.length || exam.grades.includes(student.grade));
      const examAbsences = dayAbsences.filter(item => String(item.period) === String(exam.period));
      const examAbsent = examAbsences.filter(item => item.type === 'ABSENT').length;
      const examLate = examAbsences.filter(item => item.type === 'LATE').length;
      return {
        id: exam.id,
        subject: exam.subject,
        period: exam.period,
        grades: exam.grades || [],
        committees: examCommittees.length,
        students: examStudents.length,
        present: Math.max(examStudents.length - examAbsent, 0),
        absent: examAbsent,
        late: examLate,
        proctors: Array.from(new Set(examCommittees.flatMap(item => item.proctors))).slice(0, 8),
        avgClose: avg(examCommittees.map(item => item.sessionMins)),
        avgReceipt: avg(examCommittees.map(item => item.receiptMins)),
        requests: dayRequests.filter(item => examCommittees.some(c => sameCommittee(c.num, item.committee))).length,
        reports: dayReports.filter(item => examCommittees.some(c => sameCommittee(c.num, item.committee_number))).length,
      };
    });

    const proctors = users.filter(user => user.role === 'PROCTOR');
    const proctorCards = proctors.map(user => {
      const assignments = daySupervisions.filter(item => item.teacher_id === user.id || item.teacher_id === user.national_id);
      const relatedCommittees = committeeStats.filter(item => assignments.some(sv => sameCommittee(sv.committee_number, item.num)));
      const proctorAbsences = dayAbsences.filter(item => item.proctor_id === user.id || item.proctor_id === user.national_id);
      const proctorRequests = dayRequests.filter(item => item.from === user.full_name || relatedCommittees.some(c => sameCommittee(c.num, item.committee)));
      const avgClose = avg(relatedCommittees.map(item => item.sessionMins));
      const avgReceiptTime = avg(relatedCommittees.map(item => item.receiptMins));
      const noAlerts = relatedCommittees.length > 0 && proctorRequests.length === 0;
      const recordedAll = relatedCommittees.length > 0 && proctorAbsences.length >= 0;
      const quickReceipt = avgReceiptTime !== null && avgReceiptTime <= 10;
      const punctual = assignments.length > 0 && relatedCommittees.every(item => item.joinTime);
      const initiative = proctorRequests.length > 0;
      const score = Math.min(100, Math.round(
        (punctual ? 25 : 10) +
        (quickReceipt ? 25 : avgReceiptTime === null ? 10 : 15) +
        (noAlerts ? 20 : Math.max(0, 20 - proctorRequests.length * 4)) +
        (recordedAll ? 15 : 8) +
        Math.min(15, assignments.length * 5)
      ));
      const rating = score >= 85 ? 'متميز' : score >= 70 ? 'منضبط' : score >= 55 ? 'جيد' : 'يحتاج متابعة';
      const badges = [
        punctual && 'وسام الانضباط الزمني',
        quickReceipt && 'وسام سرعة التسليم',
        recordedAll && 'وسام دقة الرصد',
        noAlerts && 'وسام لجنة بلا بلاغات',
        initiative && 'وسام المبادرة في البلاغات',
      ].filter(Boolean) as string[];

      return {
        id: user.id,
        name: user.full_name,
        assignments: assignments.length,
        committees: relatedCommittees.map(item => item.num),
        firstJoin: relatedCommittees.map(item => item.joinTime).filter(Boolean).sort()[0],
        lastClose: relatedCommittees.map(item => item.closeTime).filter(Boolean).sort().at(-1),
        firstReceipt: relatedCommittees.map(item => item.receiptTime).filter(Boolean).sort()[0],
        avgClose,
        avgReceipt: avgReceiptTime,
        absent: proctorAbsences.filter(item => item.type === 'ABSENT').length,
        late: proctorAbsences.filter(item => item.type === 'LATE').length,
        requests: proctorRequests.length,
        rating,
        score,
        badges,
      };
    }).filter(item => item.assignments || item.requests || item.absent || item.late).sort((a, b) => b.score - a.score);

    const timeline = [
      ...exams.map(item => ({ time: `${selectedDate}T${item.start_time || '00:00'}`, title: `بداية اختبار ${item.subject}`, tone: 'blue' })),
      ...committeeStats.filter(item => item.joinTime).map(item => ({ time: item.joinTime!, title: `دخول مراقب لجنة ${item.num}`, tone: 'emerald' })),
      ...committeeStats.filter(item => item.closeTime).map(item => ({ time: item.closeTime!, title: `إغلاق لجنة ${item.num}`, tone: 'amber' })),
      ...committeeStats.filter(item => item.receiptTime).map(item => ({ time: item.receiptTime!, title: `استلام كنترول لجنة ${item.num}`, tone: 'indigo' })),
      ...dayRequests.map(item => ({ time: item.time, title: `بلاغ لجنة ${item.committee}: ${item.text}`, tone: item.status === 'DONE' ? 'slate' : 'red' })),
    ].sort((a, b) => String(a.time).localeCompare(String(b.time)));

    return {
      exams,
      scopedStudents,
      dayAbsences,
      dayLogs,
      dayRequests,
      dayReports,
      committeeStats,
      present,
      absent: absentIds.size,
      late: lateIds.size,
      attendanceRate,
      received,
      completionRate,
      openRequests: dayRequests.filter(item => item.status !== 'DONE').length,
      doneRequests: dayRequests.filter(item => item.status === 'DONE').length,
      criticalCommittees: [...committeeStats].sort((a, b) => b.riskScore - a.riskScore).slice(0, 6),
      materialRecords,
      proctorCards,
      timeline,
      qualityScore,
      avgReceipt,
      avgSession,
    };
  }, [absences, committeeReports, controlRequests, deliveryLogs, examSchedule, selectedDate, students, supervisions, users]);

  const liveUrl = `${window.location.origin}/?portfolio_live=1`;

  return (
    <div className={`min-h-screen text-right ${publicMode ? 'bg-slate-50 p-4 md:p-8' : 'space-y-8 pb-20'}`} dir="rtl">
      <div className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
        <div className="grid gap-6 p-7 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black text-blue-100">
              <Sparkles size={14} /> ملف الإنجاز الحي
            </div>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">إحصائيات شاملة ومباشرة</h2>
            <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-300">
              لوحة متابعة حية تجمع إنجاز المواد، جودة اليوم، حركة المراقبين، البلاغات، والاستلامات. تتحدث تلقائيًا مع تحديث بيانات النظام.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-black text-slate-400">رابط المتابعة الحي</p>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white p-2 text-slate-950">
              <input value={liveUrl} readOnly className="min-w-0 flex-1 bg-transparent px-2 text-left text-xs font-bold outline-none" dir="ltr" />
              <button onClick={() => navigator.clipboard?.writeText(liveUrl)} className="rounded-lg bg-blue-600 p-2 text-white"><Link size={16} /></button>
            </div>
            <div className="mt-4 flex gap-2">
              {!publicMode && (
                <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-3 text-xs font-black text-white outline-none">
                  {allDates.map(day => <option key={day} value={day} className="text-slate-900">{day}</option>)}
                </select>
              )}
              <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-xs font-black text-white"><Printer size={16} /> طباعة</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Metric title="مؤشر جودة اليوم" value={`${data.qualityScore}%`} icon={Gauge} tone="bg-emerald-50 text-emerald-700" />
        <Metric title="إجمالي اللجان" value={data.committeeStats.length} icon={Target} tone="bg-blue-50 text-blue-700" />
        <Metric title="الحضور" value={`${data.attendanceRate}%`} icon={UserCheck} tone="bg-teal-50 text-teal-700" />
        <Metric title="الاستلام المكتمل" value={`${data.completionRate}%`} icon={CheckCircle2} tone="bg-indigo-50 text-indigo-700" />
        <Metric title="بلاغات مفتوحة" value={data.openRequests} icon={MessageSquareWarning} tone="bg-rose-50 text-rose-700" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle icon={BarChart3} title="سجل إنجاز المواد" subtitle="مقارنة المواد والفترات في اليوم المحدد" />
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  {['المادة', 'الفترة', 'اللجان', 'الطلاب', 'الحضور', 'الغياب', 'التأخير', 'متوسط الإغلاق', 'متوسط الاستلام', 'بلاغات', 'تقارير'].map(head => (
                    <th key={head} className="border border-slate-200 p-3 font-black">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.materialRecords.map(item => (
                  <tr key={item.id} className="font-bold text-slate-700">
                    <td className="border border-slate-100 p-3 font-black text-slate-950">{item.subject}</td>
                    <td className="border border-slate-100 p-3 text-center">{item.period}</td>
                    <td className="border border-slate-100 p-3 text-center">{item.committees}</td>
                    <td className="border border-slate-100 p-3 text-center">{item.students}</td>
                    <td className="border border-slate-100 bg-emerald-50 p-3 text-center text-emerald-700">{item.present}</td>
                    <td className="border border-slate-100 bg-rose-50 p-3 text-center text-rose-700">{item.absent}</td>
                    <td className="border border-slate-100 bg-amber-50 p-3 text-center text-amber-700">{item.late}</td>
                    <td className="border border-slate-100 p-3 text-center">{formatMins(item.avgClose)}</td>
                    <td className="border border-slate-100 p-3 text-center">{formatMins(item.avgReceipt)}</td>
                    <td className="border border-slate-100 p-3 text-center">{item.requests}</td>
                    <td className="border border-slate-100 p-3 text-center">{item.reports}</td>
                  </tr>
                ))}
                {!data.materialRecords.length && <tr><td colSpan={11} className="p-8 text-center font-bold text-slate-400">لا توجد مواد في هذا اليوم.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle icon={Activity} title="خريطة اليوم الزمنية" subtitle="أبرز الأحداث مرتبة زمنيًا" />
          <div className="mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-1">
            {data.timeline.slice(0, 28).map((item, idx) => (
              <div key={`${item.time}-${idx}`} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                <div className="w-20 shrink-0 rounded-xl bg-white px-3 py-2 text-center text-xs font-black text-slate-600">{safeTime(item.time)}</div>
                <p className="text-sm font-bold leading-7 text-slate-700">{item.title}</p>
              </div>
            ))}
            {!data.timeline.length && <p className="py-10 text-center text-sm font-bold text-slate-400">لا توجد أحداث زمنية مسجلة.</p>}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle icon={UserX} title="اللجان الأكثر احتياجًا للمتابعة" subtitle="حسب الغياب والتأخير والبلاغات والاستلام" />
          <div className="mt-5 space-y-3">
            {data.criticalCommittees.map(item => (
              <div key={item.num} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-black text-slate-950">لجنة {item.num}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${item.riskScore >= 8 ? 'bg-rose-100 text-rose-700' : item.riskScore > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>مؤشر {item.riskScore}</span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <Mini label="طلاب" value={item.students} />
                  <Mini label="غياب" value={item.absent} tone="text-rose-700" />
                  <Mini label="تأخير" value={item.late} tone="text-amber-700" />
                  <Mini label="بلاغ" value={item.openRequests} tone="text-blue-700" />
                </div>
                <p className="mt-3 text-xs font-bold text-slate-400">المراقبون: {item.proctors.join('، ') || 'غير مسند'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle icon={Trophy} title="لوحة شغف المراقبين" subtitle="أوسمة تحفيزية وليست ترتيبًا عقابيًا" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {data.proctorCards.slice(0, 8).map(item => (
              <div key={item.id} className="rounded-[1.6rem] border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{item.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">لجان: {item.committees.join('، ') || '---'} · {item.rating}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 text-center">
                    <p className="text-2xl font-black text-blue-700">{item.score}</p>
                    <p className="text-[10px] font-black text-slate-400">نقطة</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                  <span>الدخول: {safeTime(item.firstJoin)}</span>
                  <span>الإغلاق: {safeTime(item.lastClose)}</span>
                  <span>متوسط الإغلاق: {formatMins(item.avgClose)}</span>
                  <span>متوسط الاستلام: {formatMins(item.avgReceipt)}</span>
                  <span>غياب: {item.absent}</span>
                  <span>تأخير: {item.late}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.badges.slice(0, 3).map(badge => (
                    <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] font-black text-amber-700"><Medal size={12} /> {badge}</span>
                  ))}
                </div>
              </div>
            ))}
            {!data.proctorCards.length && <p className="col-span-full py-10 text-center text-sm font-bold text-slate-400">لا توجد بيانات مراقبين لهذا اليوم.</p>}
          </div>
        </section>
      </div>

      <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionTitle icon={Award} title="بطاقات إنجاز المراقبين القابلة للطباعة" subtitle="ملخص يومي لكل مراقب" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.proctorCards.map(item => (
            <div key={`card-${item.id}`} className="rounded-[1.6rem] border-2 border-slate-100 p-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><ShieldCheck size={22} /></div>
                <div>
                  <p className="font-black text-slate-950">{item.name}</p>
                  <p className="text-xs font-bold text-slate-400">{item.rating} · {item.assignments} إسناد</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Mini label="متوسط الإغلاق" value={formatMins(item.avgClose)} />
                <Mini label="متوسط التسليم" value={formatMins(item.avgReceipt)} />
                <Mini label="غياب رصده" value={item.absent} tone="text-rose-700" />
                <Mini label="تأخير رصده" value={item.late} tone="text-amber-700" />
              </div>
              <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-center text-sm font-black text-blue-800">{item.badges[0] || 'شارة المشاركة والانضباط'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Metric = ({ title, value, icon: Icon, tone }: { title: string; value: string | number; icon: any; tone: string }) => (
  <div className={`rounded-[1.5rem] border border-slate-100 p-5 shadow-sm ${tone}`}>
    <div className="flex items-center justify-between gap-3">
      <Icon size={24} />
      <span className="text-xs font-black">{title}</span>
    </div>
    <p className="mt-4 text-4xl font-black tabular-nums">{value}</p>
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white"><Icon size={22} /></div>
    <div>
      <h3 className="text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-xs font-bold text-slate-400">{subtitle}</p>
    </div>
  </div>
);

const Mini = ({ label, value, tone = 'text-slate-700' }: { label: string; value: string | number; tone?: string }) => (
  <div className="rounded-xl bg-white p-3 text-center">
    <p className={`text-lg font-black ${tone}`}>{value}</p>
    <p className="text-[10px] font-black text-slate-400">{label}</p>
  </div>
);

export default ComprehensiveStats;
