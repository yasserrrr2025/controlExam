import React, { useMemo, useState } from 'react';
import { BookOpenCheck, FileSpreadsheet, Layers, Printer, Search, Signature, UsersRound } from 'lucide-react';
import { ExamSchedule, Student, SystemConfig } from '../../types';
import { APP_CONFIG } from '../../constants';

interface Props {
  students: Student[];
  examSchedule: ExamSchedule[];
  systemConfig: SystemConfig;
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
  groupMode: GroupMode;
};

const SCHOOL_NAME = 'مدرسة عماد الدين زنكي المتوسطة';
const DEFAULT_ACADEMIC_YEAR = '1447 / 1448';

const dateKey = (value?: string | null) => String(value || '').slice(0, 10);

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

const splitColumns = <T,>(items: T[]) => {
  const half = Math.ceil(items.length / 2);
  return [items.slice(0, half), items.slice(half)];
};

const blankRows = (count: number) => Array.from({ length: Math.max(0, count) });

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

const SignatureSheetPage = ({
  students,
  committee,
  grade,
  subject,
  date,
  page,
  academicYear,
}: {
  students: Student[];
  committee: string;
  grade: string;
  subject: string;
  date?: string;
  page: number;
  academicYear?: string;
}) => {
  const [right, left] = splitColumns(students);
  const rowsPerColumn = Math.max(16, right.length, left.length);

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

      <table className="sheet-table signature-table">
        <thead>
          <tr>
            <th>م</th>
            <th>اسم الطالب</th>
            <th>الصف</th>
            <th>الفصل</th>
            <th>المقعد</th>
            <th>التوقيع</th>
            <th className="splitter" aria-hidden="true"></th>
            <th>م</th>
            <th>اسم الطالب</th>
            <th>الصف</th>
            <th>الفصل</th>
            <th>المقعد</th>
            <th>التوقيع</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowsPerColumn }).map((_, index) => {
            const rightStudent = right[index];
            const leftStudent = left[index];
            return (
              <tr key={index}>
                {rightStudent ? (
                  <>
                    <td>{index + 1}</td>
                    <td className="name-cell">{rightStudent.name}</td>
                    <td>{rightStudent.grade}</td>
                    <td>{rightStudent.section || '-'}</td>
                    <td>{rightStudent.seating_number || '-'}</td>
                    <td className="sign-cell"></td>
                  </>
                ) : (
                  <>
                    <td></td><td></td><td></td><td></td><td></td><td className="sign-cell"></td>
                  </>
                )}
                <td className="splitter" aria-hidden="true"></td>
                {leftStudent ? (
                  <>
                    <td>{right.length + index + 1}</td>
                    <td className="name-cell">{leftStudent.name}</td>
                    <td>{leftStudent.grade}</td>
                    <td>{leftStudent.section || '-'}</td>
                    <td>{leftStudent.seating_number || '-'}</td>
                    <td className="sign-cell"></td>
                  </>
                ) : (
                  <>
                    <td></td><td></td><td></td><td></td><td></td><td className="sign-cell"></td>
                  </>
                )}
              </tr>
            );
          })}
          {!students.length && (
            <tr><td colSpan={13}>لا يوجد طلاب في هذا الكشف.</td></tr>
          )}
        </tbody>
      </table>

      <div className="sheet-signatures">
        <div><b>مراقب اللجنة</b><span></span></div>
        <div><b>رئيس الكنترول</b><span></span></div>
        <div><b>مدير المدرسة</b><span></span></div>
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
  page,
  groupMode,
  academicYear,
}: {
  students: Student[];
  committee: string;
  grade: string;
  subject: string;
  date?: string;
  page: number;
  groupMode: GroupMode;
  academicYear?: string;
}) => {
  const minimumRows = groupMode === 'committee' ? 24 : Math.max(24, students.length);
  const displayedRows = [...students, ...blankRows(minimumRows - students.length).map((_, index) => ({
    id: `blank-${index}`,
    name: '',
    grade: '',
    section: '',
    committee_number: '',
    seating_number: '',
  } as Student))];

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
          {!students.length && (
            <tr><td colSpan={11}>لا يوجد طلاب في هذا الكشف.</td></tr>
          )}
        </tbody>
      </table>

      <div className="sheet-signatures">
        <div><b>معلم المادة</b><span></span></div>
        <div><b>المراجع</b><span></span></div>
        <div><b>رئيس الكنترول</b><span></span></div>
      </div>
      <PageFooter page={page} />
    </section>
  );
};

const PrintSheets: React.FC<Props> = ({ students, examSchedule, systemConfig }) => {
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
      : [{ id: 'manual', subject: selectedSubject === 'ALL' ? 'جميع المواد' : selectedSubject, exam_date: selectedDate } as ExamSchedule];
    const output: SheetPage[] = [];

    baseSubjects.forEach(exam => {
      if (groupMode === 'grade-alpha') {
        const examGrades = selectedGrade === 'ALL' ? unique(exam.grades?.length ? exam.grades : students.map(s => s.grade)) : [selectedGrade];

        examGrades.forEach(grade => {
          const gradeStudents = students
            .filter(student => student.grade === grade)
            .filter(student => !query || student.name.includes(query) || String(student.seating_number || '').includes(query))
            .sort(sortByName);

          output.push({
            type: sheetType,
            students: gradeStudents,
            committee: 'الصف كامل',
            grade,
            subject: exam.subject,
            date: dateKey(exam.exam_date),
            groupMode,
          });
        });
        return;
      }

      const gradeFilter = selectedGrade === 'ALL' ? null : selectedGrade;
      const committeeSource = gradeFilter
        ? students.filter(student => student.grade === gradeFilter)
        : students;
      const targetCommittees = selectedCommittee === 'ALL'
        ? unique(committeeSource.map(student => student.committee_number))
        : [selectedCommittee];

      targetCommittees.forEach(committee => {
        const committeeStudents = students
          .filter(student => String(student.committee_number) === String(committee))
          .filter(student => !gradeFilter || student.grade === gradeFilter)
          .filter(student => !query || student.name.includes(query) || String(student.seating_number || '').includes(query))
          .sort(sortBySeat);

        output.push({
          type: sheetType,
          students: committeeStudents,
          committee,
          grade: gradeFilter || 'كل الصفوف',
          subject: exam.subject,
          date: dateKey(exam.exam_date),
          groupMode,
        });
      });
    });

    const filtered = printScope === 'single' ? output.slice(0, 1) : output;
    return filtered.filter(page => page.students.length || printScope === 'single');
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
            padding: 7mm 8mm 8mm;
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
            padding: 38px 44px 34px;
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
          grid-template-columns: 1fr 1.2fr 1fr;
          align-items: center;
          gap: 14px;
          border-bottom: 3px double #0f172a;
          padding-bottom: 10px;
          margin-bottom: 12px;
          flex: 0 0 auto;
        }
        .sheet-side { font-size: 11px; line-height: 1.55; font-weight: 900; color: #0f172a; }
        .sheet-side p { margin: 0; }
        .sheet-side-left { text-align: left; color: #334155; }
        .sheet-side-left span { color: #0f172a; }
        .sheet-center { text-align: center; }
        .sheet-center img { width: 54px; height: 54px; object-fit: contain; margin: 0 auto 2px; }
        .sheet-center h2 { font-size: 20px; font-weight: 900; color: #0f172a; line-height: 1.15; margin: 0; }
        .sheet-center p { font-size: 11px; font-weight: 900; color: #64748b; margin: 3px 0 0; }

        .sheet-band {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 8px 12px;
          margin-bottom: 10px;
          font-size: 11px;
          font-weight: 900;
          color: #0f172a;
          flex: 0 0 auto;
        }

        .sheet-table { width: 100%; border-collapse: collapse; table-layout: fixed; direction: rtl; }
        .sheet-table th, .sheet-table td {
          border: 1px solid #cbd5e1;
          padding: 3.5px 4px;
          text-align: center;
          font-size: 9.5px;
          font-weight: 800;
          color: #0f172a;
          vertical-align: middle;
        }
        .sheet-table th { background: #eef2f7; font-weight: 900; }
        .sheet-table .name-cell { text-align: right; font-size: 10px; line-height: 1.2; word-break: break-word; }
        .sheet-table .blank-row td { color: transparent; }

        .signature-table { flex: 1 1 auto; }
        .signature-table th:nth-child(1), .signature-table td:nth-child(1),
        .signature-table th:nth-child(8), .signature-table td:nth-child(8) { width: 24px; }
        .signature-table th:nth-child(3), .signature-table td:nth-child(3),
        .signature-table th:nth-child(10), .signature-table td:nth-child(10) { width: 44px; }
        .signature-table th:nth-child(4), .signature-table td:nth-child(4),
        .signature-table th:nth-child(11), .signature-table td:nth-child(11) { width: 34px; }
        .signature-table th:nth-child(5), .signature-table td:nth-child(5),
        .signature-table th:nth-child(12), .signature-table td:nth-child(12) { width: 58px; }
        .signature-table th:nth-child(6), .signature-table td:nth-child(6),
        .signature-table th:nth-child(13), .signature-table td:nth-child(13) { width: 72px; }
        .signature-table .splitter {
          width: 12px;
          min-width: 12px;
          padding: 0;
          border-top: 0;
          border-bottom: 0;
          background: white;
          border-color: transparent;
        }
        .signature-table td { height: 28px; }
        .signature-table .sign-cell { background: white; }

        .marks-table { flex: 1 1 auto; }
        .marks-table th:nth-child(1), .marks-table td:nth-child(1) { width: 28px; }
        .marks-table th:nth-child(3), .marks-table td:nth-child(3) { width: 56px; }
        .marks-table th:nth-child(4), .marks-table td:nth-child(4),
        .marks-table th:nth-child(5), .marks-table td:nth-child(5) { width: 42px; }
        .marks-table th:nth-child(6), .marks-table td:nth-child(6) { width: 58px; }
        .marks-table th:nth-child(7), .marks-table td:nth-child(7) { width: 68px; }
        .marks-table th:nth-child(8), .marks-table td:nth-child(8) { width: 92px; }
        .marks-table th:nth-child(9), .marks-table td:nth-child(9),
        .marks-table th:nth-child(10), .marks-table td:nth-child(10) { width: 64px; }
        .marks-table th:nth-child(11), .marks-table td:nth-child(11) { width: 82px; }
        .marks-table td { height: 23px; }

        .sheet-signatures {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18mm;
          text-align: center;
          font-size: 11px;
          font-weight: 900;
          color: #0f172a;
          margin: auto 14mm 8mm;
          flex: 0 0 auto;
        }
        .sheet-signatures span { display: block; height: 18px; margin-top: 10px; border-bottom: 1px solid #0f172a; }
        .sheet-footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 5px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 9px;
          font-weight: 800;
          color: #94a3b8;
          flex: 0 0 auto;
        }

        @media screen and (max-width: 760px) {
          .sheet-page { min-height: auto; padding: 22px 12px 24px; overflow-x: auto; border-radius: 16px; }
          .sheet-header { grid-template-columns: 1fr; text-align: center; }
          .sheet-side, .sheet-side-left { text-align: center; }
          .sheet-table { min-width: 860px; }
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
            page={index + 1}
            academicYear={systemConfig.academic_year}
          />
        ) : (
          <MarksSheetPage
            key={`${page.subject}-${page.grade}-${page.committee}-${index}`}
            students={page.students}
            committee={page.committee}
            grade={page.grade}
            subject={page.subject}
            date={page.date}
            page={index + 1}
            groupMode={page.groupMode}
            academicYear={systemConfig.academic_year}
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
