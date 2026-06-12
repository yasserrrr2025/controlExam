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

const dateKey = (value?: string | null) => String(value || '').slice(0, 10);

const unique = (values: Array<string | number | undefined | null>) =>
  Array.from(new Set(values.filter(Boolean).map(String))).sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));

const formatDate = (value?: string) => {
  if (!value) return '---';
  const d = new Date(`${dateKey(value)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const splitRows = <T,>(items: T[]) => {
  const half = Math.ceil(items.length / 2);
  return [items.slice(0, half), items.slice(half)];
};

const chunkRows = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks.length ? chunks : [[]];
};

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
  <div className="sheet-header">
    <div className="sheet-side sheet-side-right">
      <p>المملكة العربية السعودية</p>
      <p>{APP_CONFIG.MINISTRY_NAME || 'وزارة التعليم'}</p>
      <p>{APP_CONFIG.ADMINISTRATION_NAME || 'إدارة التعليم بمحافظة جدة'}</p>
      <p>{APP_CONFIG.SCHOOL_NAME || 'مدرسة عماد الدين زنكي المتوسطة'}</p>
    </div>
    <div className="sheet-center">
      <img src={APP_CONFIG.LOGO_URL} alt="شعار وزارة التعليم" />
      <h2>{title}</h2>
      <p>{meta || 'كشوف الاختبارات الرسمية'}</p>
    </div>
    <div className="sheet-side sheet-side-left">
      <p>المادة: <span>{subject || 'جميع المواد'}</span></p>
      <p>التاريخ: <span>{date ? formatDate(date) : 'حسب المادة'}</span></p>
      <p>العام الدراسي: <span>{academicYear || '1446 / 1447'}</span></p>
    </div>
  </div>
);

const PageFooter = ({ page }: { page: number }) => (
  <div className="sheet-footer">
    <span>تم إنشاء الكشف آلياً عبر نظام الكنترول الرقمي - مدرسة عماد الدين زنكي - بواسطة ياسر الحميدي</span>
    <span>صفحة {page}</span>
  </div>
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
  const [right, left] = splitRows(students);
  const renderTable = (rows: Student[], offset: number) => (
    <table className="sheet-table compact">
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
          <tr key={student.id}>
            <td>{offset + index + 1}</td>
            <td className="name-cell">{student.name}</td>
            <td>{student.grade}</td>
            <td>{student.section || '-'}</td>
            <td>{student.seating_number || '-'}</td>
            <td className="sign-cell"></td>
          </tr>
        ))}
        {!rows.length && <tr><td colSpan={6}>لا يوجد طلاب في هذا الكشف.</td></tr>}
      </tbody>
    </table>
  );

  return (
    <div className="sheet-page signature-page">
      <OfficialHeader title="كشف توقيع لجنة الطلاب" date={date} subject={subject} meta={`اللجنة: ${committee} - الصف: ${grade}`} academicYear={academicYear} />
      <div className="sheet-band">
        <span>اللجنة: {committee}</span>
        <span>الصف: {grade}</span>
        <span>عدد الطلاب: {students.length}</span>
      </div>
      <div className="two-tables">
        {renderTable(right, 0)}
        {renderTable(left, right.length)}
      </div>
      <div className="sheet-signatures">
        <div><b>مراقب اللجنة</b><span></span></div>
        <div><b>رئيس الكنترول</b><span></span></div>
        <div><b>مدير المدرسة</b><span></span></div>
      </div>
      <PageFooter page={page} />
    </div>
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
}) => (
  <div className="sheet-page marks-page">
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
          <th>الدرجة رقمًا</th>
          <th>ملاحظات</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student, index) => (
          <tr key={student.id}>
            <td>{index + 1}</td>
            <td className="name-cell">{student.name}</td>
            <td>{student.grade}</td>
            <td>{student.section || '-'}</td>
            <td>{student.committee_number || '-'}</td>
            <td>{student.seating_number || '-'}</td>
            <td></td>
            <td></td>
          </tr>
        ))}
        {!students.length && <tr><td colSpan={8}>لا يوجد طلاب في هذا الكشف.</td></tr>}
      </tbody>
    </table>
    <div className="sheet-signatures marks-signatures">
      <div><b>معلم المادة</b><span></span></div>
      <div><b>المصحح</b><span></span></div>
      <div><b>المراجع</b><span></span></div>
      <div><b>رئيس الكنترول</b><span></span></div>
    </div>
    <PageFooter page={page} />
  </div>
);

const PrintSheets: React.FC<Props> = ({ students, examSchedule, systemConfig }) => {
  const today = systemConfig.active_exam_date || examSchedule.at(-1)?.exam_date || new Date().toISOString().slice(0, 10);
  const [sheetType, setSheetType] = useState<SheetType>('signature');
  const [printScope, setPrintScope] = useState<PrintScope>('single');
  const [groupMode, setGroupMode] = useState<GroupMode>('committee');
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedCommittee, setSelectedCommittee] = useState('ALL');
  const [query, setQuery] = useState('');

  const dates = unique(examSchedule.map(exam => dateKey(exam.exam_date)));
  const subjects = unique(examSchedule.filter(exam => !selectedDate || dateKey(exam.exam_date) === selectedDate).map(exam => exam.subject));
  const grades = unique(students.map(student => student.grade));
  const sections = unique(students.filter(student => selectedGrade === 'ALL' || student.grade === selectedGrade).map(student => student.section));
  const committees = unique(students.map(student => student.committee_number));

  const selectedExams = useMemo(() => {
    return examSchedule.filter(exam => {
      if (selectedDate && dateKey(exam.exam_date) !== selectedDate) return false;
      if (selectedSubject !== 'ALL' && exam.subject !== selectedSubject) return false;
      return true;
    });
  }, [examSchedule, selectedDate, selectedSubject]);

  const pages = useMemo(() => {
    const exams = selectedSubject === 'ALL' ? selectedExams : selectedExams.slice(0, 1);
    const baseSubjects = exams.length
      ? exams
      : [{ id: 'manual', subject: selectedSubject === 'ALL' ? 'جميع المواد' : selectedSubject, exam_date: selectedDate } as ExamSchedule];
    const output: Array<{
      type: SheetType;
      students: Student[];
      committee: string;
      grade: string;
      subject: string;
      date?: string;
      groupMode: GroupMode;
    }> = [];

    baseSubjects.forEach(exam => {
      const examGrades = selectedGrade === 'ALL' ? unique(exam.grades?.length ? exam.grades : students.map(student => student.grade)) : [selectedGrade];
      examGrades.forEach(grade => {
        if (groupMode === 'grade-alpha') {
          const gradeStudents = students
            .filter(student => student.grade === grade)
            .filter(student => selectedSection === 'ALL' || student.section === selectedSection)
            .filter(student => !query || student.name.includes(query) || String(student.seating_number || '').includes(query))
            .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

          chunkRows(gradeStudents, sheetType === 'marks' ? 32 : 34).forEach(chunk => {
            output.push({
              type: sheetType,
              students: chunk,
              committee: 'الصف كامل',
              grade,
              subject: exam.subject,
              date: dateKey(exam.exam_date),
              groupMode,
            });
          });
          return;
        }

        const targetCommittees = selectedCommittee === 'ALL'
          ? unique(students.filter(student => student.grade === grade).map(student => student.committee_number))
          : [selectedCommittee];

        targetCommittees.forEach(committee => {
          const committeeStudents = students
            .filter(student => student.grade === grade && String(student.committee_number) === String(committee))
            .filter(student => selectedSection === 'ALL' || student.section === selectedSection)
            .filter(student => !query || student.name.includes(query) || String(student.seating_number || '').includes(query))
            .sort((a, b) => Number(a.seating_number || 0) - Number(b.seating_number || 0) || a.name.localeCompare(b.name, 'ar'));

          chunkRows(committeeStudents, sheetType === 'marks' ? 32 : 34).forEach(chunk => {
            output.push({
              type: sheetType,
              students: chunk,
              committee,
              grade,
              subject: exam.subject,
              date: dateKey(exam.exam_date),
              groupMode,
            });
          });
        });
      });
    });

    const filtered = printScope === 'single' ? output.slice(0, 1) : output;
    return filtered.filter(page => page.students.length || printScope === 'single');
  }, [examSchedule, groupMode, printScope, query, selectedCommittee, selectedDate, selectedExams, selectedGrade, selectedSection, selectedSubject, sheetType, students]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 pb-20 text-right" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .sheets-print-area, .sheets-print-area * { visibility: visible; }
          .sheets-print-area { position: absolute; inset: 0; width: 100%; background: white; }
          @page { size: A4 portrait; margin: 8mm; }
          .sheet-page { width: 194mm; min-height: 281mm; margin: 0 auto; padding: 9mm 10mm 16mm; page-break-after: always; box-sizing: border-box; position: relative; background: white; border: 1.2pt solid #0f172a; overflow: hidden; }
          .sheet-page:last-child { page-break-after: avoid; }
        }
        @media screen {
          .sheet-page { width: min(100%, 900px); min-height: 1120px; margin: 0 auto 22px; padding: 38px 44px 60px; box-sizing: border-box; position: relative; background: white; border: 1px solid #dbe3ef; border-radius: 22px; box-shadow: 0 14px 40px rgba(15,23,42,.12); overflow: hidden; }
        }
        .sheet-header { display: grid; grid-template-columns: 1fr 1.25fr 1fr; align-items: center; gap: 18px; border-bottom: 3px double #0f172a; padding-bottom: 14px; margin-bottom: 16px; }
        .sheet-side { font-size: 12px; line-height: 1.65; font-weight: 900; color: #0f172a; }
        .sheet-side-left { text-align: left; color: #334155; }
        .sheet-side-left span { color: #0f172a; }
        .sheet-center { text-align: center; }
        .sheet-center img { width: 62px; height: 62px; object-fit: contain; margin: 0 auto 4px; }
        .sheet-center h2 { font-size: 21px; font-weight: 900; color: #0f172a; line-height: 1.2; }
        .sheet-center p { font-size: 11px; font-weight: 900; color: #64748b; margin-top: 4px; }
        .sheet-band { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 10px 14px; margin-bottom: 14px; font-size: 12px; font-weight: 900; color: #0f172a; }
        .two-tables { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
        .sheet-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .sheet-table th, .sheet-table td { border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center; font-size: 10.5px; font-weight: 800; color: #0f172a; line-height: 1.25; }
        .sheet-table th { background: #f1f5f9; font-weight: 900; }
        .sheet-table .name-cell { text-align: right; font-size: 10.5px; word-break: break-word; }
        .compact th:nth-child(1), .compact td:nth-child(1) { width: 24px; }
        .compact th:nth-child(3), .compact td:nth-child(3) { width: 52px; }
        .compact th:nth-child(4), .compact td:nth-child(4) { width: 36px; }
        .compact th:nth-child(5), .compact td:nth-child(5) { width: 54px; }
        .compact th:nth-child(6), .compact td:nth-child(6) { width: 66px; }
        .sign-cell { height: 22px; }
        .marks-table th:nth-child(1), .marks-table td:nth-child(1) { width: 28px; }
        .marks-table th:nth-child(3), .marks-table td:nth-child(3) { width: 62px; }
        .marks-table th:nth-child(4), .marks-table td:nth-child(4),
        .marks-table th:nth-child(5), .marks-table td:nth-child(5) { width: 48px; }
        .marks-table th:nth-child(6), .marks-table td:nth-child(6) { width: 66px; }
        .marks-table th:nth-child(7), .marks-table td:nth-child(7) { width: 76px; }
        .marks-table th:nth-child(8), .marks-table td:nth-child(8) { width: 110px; }
        .sheet-signatures { position: absolute; left: 18mm; right: 18mm; bottom: 24mm; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18mm; text-align: center; font-size: 12px; font-weight: 900; color: #0f172a; }
        .marks-signatures { grid-template-columns: repeat(4, 1fr); gap: 12mm; }
        .sheet-signatures span { display: block; height: 22px; margin-top: 16px; border-bottom: 1px solid #0f172a; }
        .sheet-footer { position: absolute; bottom: 9mm; left: 12mm; right: 12mm; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; gap: 10px; font-size: 10px; font-weight: 800; color: #94a3b8; }
        @media screen and (max-width: 760px) {
          .sheet-page { min-height: auto; padding: 22px 12px 72px; overflow-x: auto; border-radius: 16px; }
          .sheet-header { grid-template-columns: 1fr; text-align: center; }
          .sheet-side, .sheet-side-left { text-align: center; }
          .two-tables { grid-template-columns: 1fr; }
          .sheet-table { min-width: 650px; }
          .sheet-signatures { position: static; margin-top: 28px; grid-template-columns: 1fr; gap: 10px; }
          .sheet-footer { position: static; margin-top: 20px; flex-direction: column; text-align: center; }
        }
      ` }} />

      <div className="no-print overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
        <div className="flex flex-col gap-5 p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-emerald-400 p-4 text-slate-950 shadow-xl"><BookOpenCheck size={34} /></div>
            <div>
              <h2 className="text-3xl font-black">كشوف الاختبارات</h2>
              <p className="mt-1 text-sm font-bold text-slate-300">توقيع الطلاب ورصد المواد بطباعة مفردة أو دفعة واحدة مع الكليشة الرسمية والترقيم.</p>
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

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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
          <Control label="الفصل">
            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="control-select">
              <option value="ALL">كل الفصول</option>
              {sections.map(section => <option key={section} value={section}>{section}</option>)}
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

const Segment = <T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (value: T) => void;
  items: Array<{ value: T; label: string; icon: any }>;
}) => (
  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
    {items.map(item => {
      const Icon = item.icon;
      return (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${value === item.value ? 'bg-slate-950 text-white shadow-xl' : 'text-slate-500 hover:bg-white'}`}
        >
          <Icon size={18} /> {item.label}
        </button>
      );
    })}
  </div>
);

export default PrintSheets;
