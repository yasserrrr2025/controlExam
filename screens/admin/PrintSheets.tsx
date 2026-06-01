import React, { useMemo, useState } from 'react';
import { BookOpenCheck, FileSpreadsheet, Layers, Printer, Search, Signature, UsersRound } from 'lucide-react';
import { DeliveryLog, ExamSchedule, Student, Supervision, SystemConfig, User } from '../../types';
import { APP_CONFIG } from '../../constants';

interface Props {
  students: Student[];
  examSchedule: ExamSchedule[];
  systemConfig: SystemConfig;
  users?: User[];
  supervisions?: Supervision[];
  deliveryLogs?: DeliveryLog[];
}

type SheetType = 'signature' | 'marks';
type PrintScope = 'single' | 'batch';
type GroupMode = 'committee' | 'grade-alpha';

type SheetPage = {
  type: SheetType;
  students: Student[];
  committee: string;
  grade: string;
  subject: string;
  date?: string;
  period?: number;
  groupMode: GroupMode;
  part?: number;
  parts?: number;
};

const SCHOOL_NAME = 'مدرسة عماد الدين زنكي المتوسطة';
const DEFAULT_ACADEMIC_YEAR = '1447 / 1448';
const SIGNATURE_SINGLE_COLUMN_LIMIT = 34;
const SIGNATURE_ROWS_PER_PAGE = 68;
const MARK_ROWS_PER_PAGE = 29;

const dateKey = (value?: string | null) => String(value || '').slice(0, 10);
const sameDate = (value?: string | null, date?: string | null) => !!value && !!date && dateKey(value) === dateKey(date);

const unique = (values: Array<string | undefined | null>) =>
  Array.from(new Set(values.filter(Boolean).map(String))).sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));

const formatDate = (value?: string) => {
  if (!value) return 'حسب المادة';
  const d = new Date(`${dateKey(value)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const sortBySeat = (a: Student, b: Student) =>
  Number(a.seating_number || 0) - Number(b.seating_number || 0) || a.name.localeCompare(b.name, 'ar');

const sortByName = (a: Student, b: Student) =>
  a.name.localeCompare(b.name, 'ar') || sortBySeat(a, b);

const chunkRows = <T,>(rows: T[], size: number) => {
  if (!rows.length) return [[] as T[]];
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
};

const resolveUserName = (users: User[], teacherId?: string) =>
  users.find(user => user.id === teacherId || user.national_id === teacherId)?.full_name || '';

const firstRealName = (...values: Array<string | undefined | null>) =>
  values.map(value => String(value || '').trim()).find(value => value && value !== 'بانتظار الكنترول' && value !== '---') || '';

const OfficialHeader = ({
  title,
  date,
  subject,
  meta,
  academicYear,
}: {
  title: string;
  date?: string;
  subject?: string;
  meta?: string;
  academicYear?: string;
}) => (
  <header className="sheet-header">
    <div className="sheet-side sheet-side-right">
      <p>المملكة العربية السعودية</p>
      <p>وزارة التعليم</p>
      <p>إدارة التعليم بمحافظة جدة</p>
      <p>{SCHOOL_NAME}</p>
    </div>

    <div className="sheet-center">
      <img src={APP_CONFIG.LOGO_URL} alt="شعار وزارة التعليم" />
      <h2>{title}</h2>
      <p>{meta || 'كشوف الاختبارات الرسمية'}</p>
    </div>

    <div className="sheet-side sheet-side-left">
      <p>المادة: <span>{subject || 'جميع المواد'}</span></p>
      <p>التاريخ: <span>{date ? formatDate(date) : 'حسب المادة'}</span></p>
      <p>العام الدراسي: <span>{academicYear || DEFAULT_ACADEMIC_YEAR}</span></p>
    </div>
  </header>
);

const PageFooter = ({ page }: { page: number }) => (
  <footer className="sheet-footer">
    <span>تم إنشاء الكشف آلياً عبر نظام الكنترول الرقمي - مدرسة عماد الدين زنكي - بواسطة ياسر الحميدي</span>
    <span>صفحة {page}</span>
  </footer>
);

const SignatureBlock = ({ title, name }: { title: string; name: string }) => (
  <div>
    <b>{title}</b>
    <em>{name || ''}</em>
    <span></span>
  </div>
);

const SignatureSheetPage = ({
  students,
  committee,
  grade,
  subject,
  date,
  period,
  page,
  academicYear,
  users = [],
  supervisions = [],
}: {
  students: Student[];
  committee: string;
  grade: string;
  subject: string;
  date?: string;
  period?: number;
  page: number;
  academicYear?: string;
  users?: User[];
  supervisions?: Supervision[];
}) => {
  const rows = students;
  const useTwoColumn = rows.length > SIGNATURE_SINGLE_COLUMN_LIMIT;
  const splitIndex = Math.ceil(rows.length / 2);
  const rightRows = rows.slice(0, splitIndex);
  const leftRows = rows.slice(splitIndex);
  const twoColumnRows = Array.from({ length: splitIndex });

  const renderSignatureCells = (student?: Student, fallbackIndex = 0) => (
    <>
      <td>{student ? fallbackIndex + 1 : ''}</td>
      <td className="name-cell">{student?.name || ''}</td>
      <td>{student?.grade || ''}</td>
      <td>{student?.section || ''}</td>
      <td>{student?.seating_number || ''}</td>
      <td className="sign-cell"></td>
    </>
  );

  const supervision = supervisions.find(item =>
    String(item.committee_number) === String(committee) &&
    sameDate(item.date, date) &&
    (!period || Number(item.period || 1) === Number(period))
  ) || supervisions.find(item =>
    String(item.committee_number) === String(committee) &&
    sameDate(item.date, date)
  );
  const proctorName = resolveUserName(users, supervision?.teacher_id);
  const controlHeadName = users.find(user => user.role === 'CONTROL_MANAGER')?.full_name || '';
  const schoolManagerName = users.find(user => user.role === 'ADMIN')?.full_name || '';

  return (
    <section className="sheet-page signature-page">
      <OfficialHeader
        title="كشف توقيع لجنة الطلاب"
        date={date}
        subject={subject}
        meta={`اللجنة: ${committee} - الصف: ${grade}`}
        academicYear={academicYear}
      />

      <div className="sheet-band">
        <span>اللجنة: {committee}</span>
        <span>الصف: {grade}</span>
        <span>عدد الطلاب: {students.length}</span>
      </div>

      {useTwoColumn ? (
        <table className="sheet-table signature-table two-column-signature-table">
          <thead>
            <tr>
              <th>م</th>
              <th>اسم الطالب</th>
              <th>الصف</th>
              <th>الفصل</th>
              <th>المقعد</th>
              <th>التوقيع</th>
              <th className="splitter"></th>
              <th>م</th>
              <th>اسم الطالب</th>
              <th>الصف</th>
              <th>الفصل</th>
              <th>المقعد</th>
              <th>التوقيع</th>
            </tr>
          </thead>
          <tbody>
            {twoColumnRows.map((_, index) => (
              <tr key={`signature-row-${index}`}>
                {renderSignatureCells(rightRows[index], index)}
                <td className="splitter"></td>
                {renderSignatureCells(leftRows[index], splitIndex + index)}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="sheet-table signature-table single-signature-table">
          <thead>
            <tr>
              <th>م</th>
              <th>اسم الطالب</th>
              <th>الصف</th>
              <th>الفصل</th>
              <th>المقعد</th>
              <th>التوقيع</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((student, index) => (
              <tr key={student.id || index}>
                {renderSignatureCells(student, index)}
              </tr>
            ))}
            {!students.length && <tr><td colSpan={6}>لا يوجد طلاب في هذا الكشف.</td></tr>}
          </tbody>
        </table>
      )}

      <div className="sheet-signatures">
        <SignatureBlock title="مراقب اللجنة" name={proctorName} />
        <SignatureBlock title="رئيس الكنترول" name={controlHeadName} />
        <SignatureBlock title="مدير المدرسة" name={schoolManagerName} />
      </div>
      <PageFooter page={page} />
    </section>
  );
};

const MarksSheetPage = ({
  students,
  committee,
  grade,
  subject,
  date,
  period,
  page,
  groupMode,
  academicYear,
  users = [],
  supervisions = [],
  deliveryLogs = [],
}: {
  students: Student[];
  committee: string;
  grade: string;
  subject: string;
  date?: string;
  period?: number;
  page: number;
  groupMode: GroupMode;
  academicYear?: string;
  users?: User[];
  supervisions?: Supervision[];
  deliveryLogs?: DeliveryLog[];
}) => {
  const displayedRows = students;
  const matchingLogs = deliveryLogs.filter(log =>
    sameDate(log.time, date) &&
    (!period || Number(log.period || 1) === Number(period)) &&
    (groupMode === 'grade-alpha' || String(log.committee_number) === String(committee)) &&
    (grade === 'كل الصفوف' || String(log.grade || '') === String(grade))
  );
  const confirmedReceiveLog = matchingLogs.find(log => log.type === 'RECEIVE' && log.status === 'CONFIRMED');
  const pendingReceiveLog = matchingLogs.find(log => log.type === 'RECEIVE' && log.proctor_name);
  const supervision = supervisions.find(item =>
    String(item.committee_number) === String(committee) &&
    sameDate(item.date, date) &&
    (!period || Number(item.period || 1) === Number(period))
  );
  const controlForGrade = users.find(user =>
    user.role === 'CONTROL' &&
    (grade === 'كل الصفوف' || (user.assigned_grades || []).map(String).includes(String(grade)))
  ) || users.find(user => user.role === 'CONTROL');
  const subjectTeacherName = '';
  const reviewerName = '';
  const controlHeadName = users.find(user => user.role === 'CONTROL_MANAGER')?.full_name || '';

  return (
    <section className="sheet-page marks-page">
      <OfficialHeader
        title="كشف رصد مادة"
        date={date}
        subject={subject}
        meta={groupMode === 'grade-alpha' ? `كشف أبجدي للصف: ${grade}` : `اللجنة: ${committee} - الصف: ${grade}`}
        academicYear={academicYear}
      />

      <div className="sheet-band">
        <span>{groupMode === 'grade-alpha' ? 'النطاق: الصف كامل أبجدياً' : `اللجنة: ${committee}`}</span>
        <span>الصف: {grade}</span>
        <span>عدد الطلاب: {students.length}</span>
      </div>

      <table className="sheet-table marks-table">
        <thead>
          <tr>
            <th>م</th>
            <th>اسم الطالب</th>
            <th>الصف</th>
            <th>الفصل</th>
            <th>اللجنة</th>
            <th>المقعد</th>
            <th>الدرجة رقماً</th>
            <th>الدرجة كتابة</th>
            <th>المصحح</th>
            <th>المراجع</th>
            <th>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {displayedRows.map((student, index) => (
            <tr key={student.id || index} className={!student.name ? 'blank-row' : ''}>
              <td>{student.name ? index + 1 : ''}</td>
              <td className="name-cell">{student.name}</td>
              <td>{student.grade}</td>
              <td>{student.section}</td>
              <td>{student.committee_number}</td>
              <td>{student.seating_number}</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          ))}
          {!students.length && <tr><td colSpan={11}>لا يوجد طلاب في هذا الكشف.</td></tr>}
        </tbody>
      </table>

      <div className="sheet-signatures">
        <SignatureBlock title="معلم المادة" name={subjectTeacherName} />
        <SignatureBlock title="المراجع" name={reviewerName} />
        <SignatureBlock title="رئيس الكنترول" name={controlHeadName} />
      </div>
      <PageFooter page={page} />
    </section>
  );
};

const PrintSheets: React.FC<Props> = ({ students, examSchedule, systemConfig, users = [], supervisions = [], deliveryLogs = [] }) => {
  const today = systemConfig.active_exam_date || examSchedule.at(-1)?.exam_date || new Date().toISOString().slice(0, 10);
  const [sheetType, setSheetType] = useState<SheetType>('signature');
  const [printScope, setPrintScope] = useState<PrintScope>('single');
  const [groupMode, setGroupMode] = useState<GroupMode>('committee');
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedCommittee, setSelectedCommittee] = useState('ALL');
  const [query, setQuery] = useState('');

  const dates = unique(examSchedule.map(exam => dateKey(exam.exam_date)));
  const subjects = unique(examSchedule.filter(exam => !selectedDate || dateKey(exam.exam_date) === selectedDate).map(exam => exam.subject));
  const grades = unique(students.map(student => student.grade));
  const committees = unique(students.map(student => student.committee_number));

  const selectedExams = useMemo(() => {
    return examSchedule.filter(exam => {
      if (selectedDate && dateKey(exam.exam_date) !== selectedDate) return false;
      if (selectedSubject !== 'ALL' && exam.subject !== selectedSubject) return false;
      return true;
    });
  }, [examSchedule, selectedDate, selectedSubject]);

  const pages = useMemo<SheetPage[]>(() => {
    const exams = selectedSubject === 'ALL' ? selectedExams : selectedExams.slice(0, 1);
    const baseSubjects = exams.length
      ? exams
      : [{ id: 'manual', subject: selectedSubject === 'ALL' ? 'جميع المواد' : selectedSubject, exam_date: selectedDate, period: 1 } as ExamSchedule];
    const groups: SheetPage[] = [];

    baseSubjects.forEach(exam => {
      if (groupMode === 'grade-alpha') {
        const examGrades = selectedGrade === 'ALL' ? unique(exam.grades?.length ? exam.grades : students.map(s => s.grade)) : [selectedGrade];

        examGrades.forEach(grade => {
          const gradeStudents = students
            .filter(student => student.grade === grade)
            .filter(student => !query || student.name.includes(query) || String(student.seating_number || '').includes(query))
            .sort(sortByName);

          groups.push({
            type: sheetType,
            students: gradeStudents,
            committee: 'الصف كامل',
            grade,
            subject: exam.subject,
            date: dateKey(exam.exam_date),
            period: Number(exam.period || 1),
            groupMode,
          });
        });
        return;
      }

      const gradeFilter = selectedGrade === 'ALL' ? null : selectedGrade;
      const committeeSource = gradeFilter ? students.filter(student => student.grade === gradeFilter) : students;
      const targetCommittees = selectedCommittee === 'ALL'
        ? unique(committeeSource.map(student => student.committee_number))
        : [selectedCommittee];

      targetCommittees.forEach(committee => {
        const committeeStudents = students
          .filter(student => String(student.committee_number) === String(committee))
          .filter(student => !gradeFilter || student.grade === gradeFilter)
          .filter(student => !query || student.name.includes(query) || String(student.seating_number || '').includes(query))
          .sort(sortBySeat);

        groups.push({
          type: sheetType,
          students: committeeStudents,
          committee,
          grade: gradeFilter || 'كل الصفوف',
          subject: exam.subject,
          date: dateKey(exam.exam_date),
          period: Number(exam.period || 1),
          groupMode,
        });
      });
    });

    const selectedGroups = printScope === 'single' ? groups.slice(0, 1) : groups;
    return selectedGroups
      .flatMap(group => {
        const size = group.type === 'marks' ? MARK_ROWS_PER_PAGE : SIGNATURE_ROWS_PER_PAGE;
        const chunks = chunkRows(group.students, size);
        return chunks.map((chunk, index) => ({
          ...group,
          students: chunk,
          part: index + 1,
          parts: chunks.length,
        }));
      })
      .filter(page => page.students.length || printScope === 'single');
  }, [groupMode, printScope, query, selectedCommittee, selectedDate, selectedExams, selectedGrade, selectedSubject, sheetType, students]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 pb-20 text-right" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          body * { visibility: hidden !important; }
          .sheets-print-area, .sheets-print-area * { visibility: visible !important; }
          .sheets-print-area { position: absolute; inset: 0; width: 100%; background: white; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 6mm; }
          .sheet-page {
            width: 100%;
            height: 285mm;
            margin: 0;
            padding: 6mm 7mm 7mm;
            page-break-after: always;
            page-break-inside: avoid;
            box-sizing: border-box;
            position: relative;
            background: white;
            border: 1pt solid #0f172a;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .sheet-page:last-child { page-break-after: auto; }
        }

        @media screen {
          .sheet-page {
            width: min(100%, 940px);
            min-height: 1120px;
            margin: 0 auto 22px;
            padding: 34px 38px 28px;
            box-sizing: border-box;
            position: relative;
            background: white;
            border: 1px solid #dbe3ef;
            border-radius: 18px;
            box-shadow: 0 14px 40px rgba(15,23,42,.12);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
        }

        .sheet-header {
          display: grid;
          grid-template-columns: 1fr 1.18fr 1fr;
          align-items: center;
          gap: 12px;
          border-bottom: 3px double #0f172a;
          padding-bottom: 8px;
          margin-bottom: 10px;
          flex: 0 0 auto;
        }
        .sheet-side { font-size: 10.5px; line-height: 1.42; font-weight: 900; color: #0f172a; }
        .sheet-side p { margin: 0; }
        .sheet-side-left { text-align: left; color: #334155; }
        .sheet-side-left span { color: #0f172a; }
        .sheet-center { text-align: center; }
        .sheet-center img { width: 50px; height: 50px; object-fit: contain; margin: 0 auto 1px; }
        .sheet-center h2 { font-size: 19px; font-weight: 900; color: #0f172a; line-height: 1.1; margin: 0; }
        .sheet-center p { font-size: 10.5px; font-weight: 900; color: #64748b; margin: 2px 0 0; }

        .sheet-band {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 6px 10px;
          margin-bottom: 8px;
          font-size: 10.5px;
          font-weight: 900;
          color: #0f172a;
          flex: 0 0 auto;
        }

        .sheet-table { width: 100%; border-collapse: collapse; table-layout: fixed; direction: rtl; flex: 0 0 auto; }
        .sheet-table th, .sheet-table td {
          border: 1px solid #cbd5e1;
          padding: 1.4px 2px;
          text-align: center;
          font-size: 7.8px;
          font-weight: 800;
          color: #0f172a;
          vertical-align: middle;
        }
        .sheet-table th { background: #eef2f7; font-weight: 900; }
        .sheet-table .name-cell { text-align: right; font-size: 8.2px; line-height: 1.04; word-break: break-word; }
        .sheet-table .blank-row td { color: transparent; }

        .single-signature-table { flex: 0 0 auto; }
        .single-signature-table th:nth-child(1), .single-signature-table td:nth-child(1) { width: 24px; }
        .single-signature-table th:nth-child(2), .single-signature-table td:nth-child(2) { width: auto; }
        .single-signature-table th:nth-child(3), .single-signature-table td:nth-child(3) { width: 76px; }
        .single-signature-table th:nth-child(4), .single-signature-table td:nth-child(4) { width: 34px; }
        .single-signature-table th:nth-child(5), .single-signature-table td:nth-child(5) { width: 76px; }
        .single-signature-table th:nth-child(6), .single-signature-table td:nth-child(6) { width: 124px; }
        .single-signature-table td { height: 5.4mm; }
        .single-signature-table .sign-cell { background: white; }

        .two-column-signature-table { flex: 0 0 auto; }
        .two-column-signature-table th:nth-child(1), .two-column-signature-table td:nth-child(1),
        .two-column-signature-table th:nth-child(8), .two-column-signature-table td:nth-child(8) { width: 18px; }
        .two-column-signature-table th:nth-child(2), .two-column-signature-table td:nth-child(2),
        .two-column-signature-table th:nth-child(9), .two-column-signature-table td:nth-child(9) { width: auto; }
        .two-column-signature-table th:nth-child(3), .two-column-signature-table td:nth-child(3),
        .two-column-signature-table th:nth-child(10), .two-column-signature-table td:nth-child(10) { width: 54px; }
        .two-column-signature-table th:nth-child(4), .two-column-signature-table td:nth-child(4),
        .two-column-signature-table th:nth-child(11), .two-column-signature-table td:nth-child(11) { width: 26px; }
        .two-column-signature-table th:nth-child(5), .two-column-signature-table td:nth-child(5),
        .two-column-signature-table th:nth-child(12), .two-column-signature-table td:nth-child(12) { width: 54px; }
        .two-column-signature-table th:nth-child(6), .two-column-signature-table td:nth-child(6),
        .two-column-signature-table th:nth-child(13), .two-column-signature-table td:nth-child(13) { width: 72px; }
        .two-column-signature-table td { height: 5.25mm; }
        .two-column-signature-table .name-cell { font-size: 7.2px; line-height: 1.02; }
        .two-column-signature-table .splitter {
          width: 7px;
          min-width: 7px;
          padding: 0;
          background: white;
          border-top-color: transparent;
          border-bottom-color: transparent;
        }

        .marks-table { flex: 0 0 auto; }
        .marks-table th:nth-child(1), .marks-table td:nth-child(1) { width: 28px; }
        .marks-table th:nth-child(2), .marks-table td:nth-child(2) { width: 25%; }
        .marks-table th:nth-child(3), .marks-table td:nth-child(3) { width: 58px; }
        .marks-table th:nth-child(4), .marks-table td:nth-child(4),
        .marks-table th:nth-child(5), .marks-table td:nth-child(5) { width: 42px; }
        .marks-table th:nth-child(6), .marks-table td:nth-child(6) { width: 58px; }
        .marks-table th:nth-child(7), .marks-table td:nth-child(7) { width: 64px; }
        .marks-table th:nth-child(8), .marks-table td:nth-child(8) { width: 86px; }
        .marks-table th:nth-child(9), .marks-table td:nth-child(9),
        .marks-table th:nth-child(10), .marks-table td:nth-child(10) { width: 60px; }
        .marks-table th:nth-child(11), .marks-table td:nth-child(11) { width: 76px; }
        .marks-table td { height: 6.4mm; }

        .sheet-signatures {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16mm;
          text-align: center;
          font-size: 10.5px;
          font-weight: 900;
          color: #0f172a;
          margin: 7mm 12mm 6mm;
          flex: 0 0 auto;
        }
        .sheet-signatures b, .sheet-signatures em { display: block; font-style: normal; }
        .sheet-signatures em { min-height: 14px; margin-top: 3px; font-size: 9.5px; color: #334155; }
        .sheet-signatures span { display: block; height: 14px; margin-top: 7px; border-bottom: 1px solid #0f172a; }
        .sheet-footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 5px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 8.5px;
          font-weight: 800;
          color: #94a3b8;
          flex: 0 0 auto;
        }

        @media screen and (max-width: 760px) {
          .sheet-page { min-height: auto; padding: 22px 12px 24px; overflow-x: auto; border-radius: 16px; }
          .sheet-header { grid-template-columns: 1fr; text-align: center; }
          .sheet-side, .sheet-side-left { text-align: center; }
          .sheet-table { min-width: 760px; }
          .sheet-signatures { margin: 24px 0 12px; gap: 10px; }
          .sheet-footer { flex-direction: column; text-align: center; }
        }
      ` }} />

      <div className="no-print overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
        <div className="flex flex-col gap-5 p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-emerald-400 p-4 text-slate-950 shadow-xl"><BookOpenCheck size={34} /></div>
            <div>
              <h2 className="text-3xl font-black">كشوف الاختبارات</h2>
              <p className="mt-1 text-sm font-bold text-slate-300">كشوف توقيع ورصد رسمية، كل لجنة في صفحة مستقلة مع رأس وتذييل وترقيم جاهز للطباعة.</p>
            </div>
          </div>
          <button onClick={handlePrint} className="flex items-center justify-center gap-3 rounded-2xl bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-xl transition active:scale-95">
            <Printer size={20} /> طباعة الكشوف
          </button>
        </div>
      </div>

      <div className="no-print rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-4">
          <Control label="نوع الكشف">
            <Segment value={sheetType} onChange={setSheetType} items={[
              { value: 'signature', label: 'توقيع اللجان', icon: Signature },
              { value: 'marks', label: 'رصد مادة', icon: FileSpreadsheet },
            ]} />
          </Control>
          <Control label="طريقة الطباعة">
            <Segment value={printScope} onChange={setPrintScope} items={[
              { value: 'single', label: 'مفرد', icon: FileSpreadsheet },
              { value: 'batch', label: 'دفعة', icon: Layers },
            ]} />
          </Control>
          <Control label="النطاق">
            <Segment value={groupMode} onChange={setGroupMode} items={[
              { value: 'committee', label: 'حسب اللجنة', icon: UsersRound },
              { value: 'grade-alpha', label: 'أبجدي للصف', icon: Search },
            ]} />
          </Control>
          <Control label="بحث سريع">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="اسم الطالب أو رقم المقعد" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-400" />
          </Control>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Control label="التاريخ">
            <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="control-select">
              {dates.map(date => <option key={date} value={date}>{formatDate(date)}</option>)}
            </select>
          </Control>
          <Control label="المادة">
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="control-select">
              <option value="ALL">كل المواد</option>
              {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </Control>
          <Control label="الصف">
            <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="control-select">
              <option value="ALL">كل الصفوف</option>
              {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
            </select>
          </Control>
          <Control label="اللجنة">
            <select value={selectedCommittee} onChange={e => setSelectedCommittee(e.target.value)} disabled={groupMode === 'grade-alpha'} className="control-select disabled:opacity-50">
              <option value="ALL">كل اللجان</option>
              {committees.map(committee => <option key={committee} value={committee}>لجنة {committee}</option>)}
            </select>
          </Control>
          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-[11px] font-black text-slate-400">عدد الصفحات الجاهزة</p>
            <p className="mt-2 text-4xl font-black">{pages.length}</p>
          </div>
        </div>
      </div>

      <div className="sheets-print-area">
        {pages.map((page, index) => page.type === 'signature' ? (
          <SignatureSheetPage
            key={`${page.subject}-${page.grade}-${page.committee}-${index}`}
            students={page.students}
            committee={page.committee}
            grade={page.grade}
            subject={page.subject}
            date={page.date}
            period={page.period}
            page={index + 1}
            academicYear={systemConfig.academic_year}
            users={users}
            supervisions={supervisions}
          />
        ) : (
          <MarksSheetPage
            key={`${page.subject}-${page.grade}-${page.committee}-${index}`}
            students={page.students}
            committee={page.committee}
            grade={page.grade}
            subject={page.subject}
            date={page.date}
            period={page.period}
            page={index + 1}
            groupMode={page.groupMode}
            academicYear={systemConfig.academic_year}
            users={users}
            supervisions={supervisions}
            deliveryLogs={deliveryLogs}
          />
        ))}
      </div>
    </div>
  );
};

const Control = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black text-slate-500">{label}</span>
    {children}
  </label>
);

const Segment = <T extends string,>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (value: T) => void;
  items: Array<{ value: T; label: string; icon: React.ElementType }>;
}) => (
  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
    {items.map(item => {
      const Icon = item.icon;
      return (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-black transition ${value === item.value ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
        >
          <Icon size={15} /> {item.label}
        </button>
      );
    })}
  </div>
);

export default PrintSheets;
