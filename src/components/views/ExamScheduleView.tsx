import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  Building2,
  AlertCircle,
  Search,
  CheckCircle2,
  Hourglass,
  FileText,
  User,
  FileSpreadsheet,
  RefreshCw,
  Plus,
  Link2,
  X,
  Shield,
  ExternalLink,
  Edit2,
  Trash2,
  Layers,
  LayoutGrid,
  ListFilter,
  Check,
  ChevronDown,
  Info,
  CalendarCheck,
  Filter,
  CalendarDays,
  Sun,
  Sunset,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ExamSchedule, StudentClass, Lecturer, Room } from '../../types';

// Helper to determine Vietnamese weekday from date string (YYYY-MM-DD)
interface DayInfo {
  dayIndex: number; // 2: Thứ 2, 3: Thứ 3, 4: Thứ 4, 5: Thứ 5, 6: Thứ 6, 7: Thứ 7, 8: CN
  dayName: string; // 'Thứ Hai', 'Thứ Ba', etc.
  shortName: string; // 'Thứ 2', 'Thứ 3', etc.
  dateString: string;
  formattedDate: string; // DD/MM/YYYY
}

function getExamDayInfo(dateStr: string): DayInfo {
  if (!dateStr) {
    return {
      dayIndex: 2,
      dayName: 'Thứ Hai',
      shortName: 'Thứ 2',
      dateString: '',
      formattedDate: '',
    };
  }

  const parts = dateStr.split('-');
  let d: Date;
  if (parts.length === 3) {
    d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    d = new Date(dateStr);
  }

  if (isNaN(d.getTime())) {
    return {
      dayIndex: 2,
      dayName: 'Thứ Hai',
      shortName: 'Thứ 2',
      dateString: dateStr,
      formattedDate: dateStr,
    };
  }

  const jsDay = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const dayIndex = jsDay === 0 ? 8 : jsDay + 1; // 2 = Thứ 2, 3 = Thứ 3, 4 = Thứ 4, 5 = Thứ 5, 6 = Thứ 6, 7 = Thứ 7, 8 = CN

  const names: Record<number, { full: string; short: string }> = {
    2: { full: 'Thứ Hai', short: 'Thứ 2' },
    3: { full: 'Thứ Ba', short: 'Thứ 3' },
    4: { full: 'Thứ Tư', short: 'Thứ 4' },
    5: { full: 'Thứ Năm', short: 'Thứ 5' },
    6: { full: 'Thứ Sáu', short: 'Thứ 6' },
    7: { full: 'Thứ Bảy', short: 'Thứ 7' },
    8: { full: 'Chủ Nhật', short: 'Chủ Nhật' },
  };

  const dayObj = names[dayIndex] || { full: 'Thứ Hai', short: 'Thứ 2' };
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();

  return {
    dayIndex,
    dayName: dayObj.full,
    shortName: dayObj.short,
    dateString: dateStr,
    formattedDate: `${dd}/${mm}/${yyyy}`,
  };
}

// Calculate Monday of the week for grouping
function getMondayOfDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const ExamScheduleView: React.FC = () => {
  const { currentRole, setIsLoginModalOpen, setLoginTargetRole } = useAuth();
  const isAdminOrManager = currentRole === 'ADMIN' || currentRole === 'MANAGER';

  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // View Mode: 'grid' (Lưới Thứ 2 - Thứ 6) | 'cards' | 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'cards' | 'table'>('grid');

  // Multi-level Filters: Năm học -> Học kỳ -> Khóa đào tạo -> Lớp -> Phòng -> Tìm kiếm
  const [filterYear, setFilterYear] = useState<string>('2025-2026');
  const [filterSemester, setFilterSemester] = useState<string>('Học kỳ 2');
  const [filterCohort, setFilterCohort] = useState<string>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterRoom, setFilterRoom] = useState<string>('ALL');
  const [searchKey, setSearchKey] = useState<string>('');

  // Grid specific filters
  const [selectedWeek, setSelectedWeek] = useState<string>('ALL'); // 'ALL' or Monday date string
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON'>('ALL');
  const [showWeekend, setShowWeekend] = useState<boolean>(false);

  // Modal import Google Sheet with Upsert / Duplicate Detection
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(
    'https://docs.google.com/spreadsheets/d/1kCHr0jwbRtJ9oXhW9buBpRDX6XNOldvp08M5XqYpwEI/edit?usp=sharing'
  );
  const [importYear, setImportYear] = useState('2025-2026');
  const [importSemester, setImportSemester] = useState('Học kỳ 2');
  const [importCohort, setImportCohort] = useState('D22');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Modal Create / Edit Exam
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamSchedule | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    academicYear: '2025-2026',
    semesterName: 'Học kỳ 2',
    cohort: 'D22',
    courseCode: '',
    courseName: '',
    classCode: 'DCT22A',
    examDate: '2026-09-08',
    startTime: '07:30',
    endTime: '09:00',
    durationMinutes: 90,
    roomCode: 'H.101',
    building: 'Nhà H',
    examType: 'Tự luận (90 phút)',
    lecturerName: 'ThS. Phạm Văn Thơ',
    invigilator1: 'ThS. Phạm Văn Thơ',
    invigilator2: 'Cô Quỳnh',
    studentCount: 40,
    note: '',
  });

  // Modal Confirm Delete
  const [deletingExam, setDeletingExam] = useState<ExamSchedule | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchExams = () => {
    setLoading(true);
    const params: Record<string, any> = {};
    if (filterYear !== 'ALL') params.academicYear = filterYear;
    if (filterSemester !== 'ALL') params.semester = filterSemester;
    if (filterCohort !== 'ALL') params.cohort = filterCohort;
    if (filterClass !== 'ALL') params.classCode = filterClass;
    if (filterRoom !== 'ALL') params.roomCode = filterRoom;
    if (searchKey.trim()) params.search = searchKey.trim();

    api
      .getExams(params)
      .then((data) => {
        if (Array.isArray(data)) setExams(data);
      })
      .catch((err) => console.error('Fetch exams error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Load metadata
    Promise.all([
      api.getClasses().catch(() => []),
      api.getLecturers().catch(() => []),
      api.getRooms().catch(() => []),
    ]).then(([cls, lecs, rms]) => {
      if (Array.isArray(cls)) setClasses(cls);
      if (Array.isArray(lecs)) setLecturers(lecs);
      if (Array.isArray(rms)) setRooms(rms);
    });
  }, []);

  useEffect(() => {
    fetchExams();
  }, [filterYear, filterSemester, filterCohort, filterClass, filterRoom, searchKey]);

  // Extract distinct weeks for Grid selector
  const availableWeeks = useMemo(() => {
    const weekMap = new Map<string, { label: string; count: number; mondayDate: string; fridayDate: string }>();

    exams.forEach((exam) => {
      if (!exam.examDate) return;
      const mondayStr = getMondayOfDate(exam.examDate);
      const parts = mondayStr.split('-');
      if (parts.length === 3) {
        const mon = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const fri = new Date(mon);
        fri.setDate(mon.getDate() + 4);

        const formatD = (d: Date) =>
          `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

        const mondayFmt = formatD(mon);
        const fridayFmt = formatD(fri);

        const existing = weekMap.get(mondayStr);
        if (existing) {
          existing.count += 1;
        } else {
          weekMap.set(mondayStr, {
            mondayDate: mondayStr,
            fridayDate: `${fri.getFullYear()}-${String(fri.getMonth() + 1).padStart(2, '0')}-${String(fri.getDate()).padStart(2, '0')}`,
            label: `Tuần (${mondayFmt} - ${fridayFmt})`,
            count: 1,
          });
        }
      }
    });

    const sortedWeeks = Array.from(weekMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    return sortedWeeks.map(([key, val], idx) => ({
      key,
      label: `Tuần ${idx + 1}: ${val.label}`,
      count: val.count,
    }));
  }, [exams]);

  // Group exams by Monday-Friday columns for Grid view
  const weekdayColumns = useMemo(() => {
    // Standard Mon-Fri (dayIndex 2 to 6). If showWeekend is true, add 7 and 8.
    const days = [
      { dayIndex: 2, name: 'Thứ Hai', short: 'Thứ 2', code: 'T2' },
      { dayIndex: 3, name: 'Thứ Ba', short: 'Thứ 3', code: 'T3' },
      { dayIndex: 4, name: 'Thứ Tư', short: 'Thứ 4', code: 'T4' },
      { dayIndex: 5, name: 'Thứ Năm', short: 'Thứ 5', code: 'T5' },
      { dayIndex: 6, name: 'Thứ Sáu', short: 'Thứ 6', code: 'T6' },
    ];

    if (showWeekend) {
      days.push({ dayIndex: 7, name: 'Thứ Bảy', short: 'Thứ 7', code: 'T7' });
      days.push({ dayIndex: 8, name: 'Chủ Nhật', short: 'CN', code: 'CN' });
    }

    // Filter exams by selected week
    let filteredForGrid = exams;
    if (selectedWeek !== 'ALL') {
      filteredForGrid = filteredForGrid.filter((exam) => getMondayOfDate(exam.examDate) === selectedWeek);
    }

    // Filter by session
    if (sessionFilter === 'MORNING') {
      filteredForGrid = filteredForGrid.filter((exam) => {
        const h = parseInt((exam.startTime || '07:30').split(':')[0], 10);
        return h < 12;
      });
    } else if (sessionFilter === 'AFTERNOON') {
      filteredForGrid = filteredForGrid.filter((exam) => {
        const h = parseInt((exam.startTime || '13:30').split(':')[0], 10);
        return h >= 12;
      });
    }

    return days.map((day) => {
      // Find all exams matching this day index
      const dayExams = filteredForGrid.filter((exam) => {
        const info = getExamDayInfo(exam.examDate);
        return info.dayIndex === day.dayIndex;
      });

      // Sort by start time ascending
      dayExams.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

      // Calculate specific date if a week is selected
      let specificDateStr = '';
      if (selectedWeek !== 'ALL') {
        const parts = selectedWeek.split('-');
        if (parts.length === 3) {
          const mon = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          const target = new Date(mon);
          target.setDate(mon.getDate() + (day.dayIndex - 2));
          const dd = String(target.getDate()).padStart(2, '0');
          const mm = String(target.getMonth() + 1).padStart(2, '0');
          specificDateStr = `${dd}/${mm}`;
        }
      }

      // Group into Morning vs Afternoon
      const morningExams = dayExams.filter((e) => parseInt((e.startTime || '07:30').split(':')[0], 10) < 12);
      const afternoonExams = dayExams.filter((e) => parseInt((e.startTime || '13:30').split(':')[0], 10) >= 12);

      return {
        ...day,
        specificDateStr,
        exams: dayExams,
        morningExams,
        afternoonExams,
        totalCount: dayExams.length,
      };
    });
  }, [exams, selectedWeek, sessionFilter, showWeekend]);

  const handleAutoSync = async () => {
    setSyncing(true);
    try {
      const res = await api.autoSyncUrls();
      if (res.success) {
        setNotification({
          type: 'success',
          message: `Đã tự động đồng bộ lịch thi từ các nguồn URL (${res.examsCount} ca thi)!`,
        });
        fetchExams();
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Lỗi đồng bộ URL: ${err.message || 'Không thể kết nối URL'}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenImportModal = () => {
    if (!isAdminOrManager) {
      setLoginTargetRole('MANAGER');
      setIsLoginModalOpen(true);
      return;
    }
    setImportYear(filterYear !== 'ALL' ? filterYear : '2025-2026');
    setImportSemester(filterSemester !== 'ALL' ? filterSemester : 'Học kỳ 2');
    setImportCohort(filterCohort !== 'ALL' ? filterCohort : 'D22');
    setImportError(null);
    setIsImportModalOpen(true);
  };

  const handleImportSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) {
      setImportError('Vui lòng nhập đường link Google Sheet hợp lệ');
      return;
    }

    setImportLoading(true);
    setImportError(null);

    try {
      const res = await api.importExamsGoogleSheet({
        url: sheetUrl.trim(),
        academicYear: importYear,
        semesterName: importSemester,
        cohort: importCohort,
        replaceExisting,
      });

      if (res.success) {
        setIsImportModalOpen(false);
        setNotification({
          type: 'success',
          message:
            res.message ||
            `Đã xử lý lịch thi thành công: Cập nhật lại ${res.updatedCount || 0} ca thi trùng và thêm mới ${res.createdCount || 0} ca thi!`,
        });
        fetchExams();
      }
    } catch (err: any) {
      setImportError(err.message || 'Lỗi khi đọc file Google Sheet');
    } finally {
      setImportLoading(false);
    }
  };

  const handleOpenCreateModal = (prefilledDate?: string) => {
    if (!isAdminOrManager) {
      setLoginTargetRole('MANAGER');
      setIsLoginModalOpen(true);
      return;
    }
    setEditingExam(null);
    setFormData({
      academicYear: filterYear !== 'ALL' ? filterYear : '2025-2026',
      semesterName: filterSemester !== 'ALL' ? filterSemester : 'Học kỳ 2',
      cohort: filterCohort !== 'ALL' ? filterCohort : 'D22',
      courseCode: 'CNTT301',
      courseName: 'Cơ sở dữ liệu nâng cao',
      classCode: classes.length > 0 ? classes[0].classCode : 'DCT22A',
      examDate: prefilledDate || '2026-09-08',
      startTime: '07:30',
      endTime: '09:00',
      durationMinutes: 90,
      roomCode: 'H.101',
      building: 'Nhà H',
      examType: 'Tự luận (90 phút)',
      lecturerName: lecturers.length > 0 ? lecturers[0].fullName : 'ThS. Phạm Văn Thơ',
      invigilator1: lecturers.length > 0 ? lecturers[0].fullName : 'ThS. Phạm Văn Thơ',
      invigilator2: lecturers.length > 1 ? lecturers[1].fullName : 'Cô Quỳnh',
      studentCount: 40,
      note: '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (exam: ExamSchedule) => {
    if (!isAdminOrManager) {
      setLoginTargetRole('MANAGER');
      setIsLoginModalOpen(true);
      return;
    }
    setEditingExam(exam);
    setFormData({
      academicYear: exam.academicYear || '2025-2026',
      semesterName: exam.semesterName || 'Học kỳ 2',
      cohort: exam.cohort || 'D22',
      courseCode: exam.courseCode,
      courseName: exam.courseName,
      classCode: exam.classCode,
      examDate: exam.examDate,
      startTime: exam.startTime,
      endTime: exam.endTime,
      durationMinutes: exam.durationMinutes || 90,
      roomCode: exam.roomCode,
      building: exam.building || 'Nhà H',
      examType: exam.examType,
      lecturerName: exam.lecturerName,
      invigilator1: exam.invigilator1 || exam.lecturerName,
      invigilator2: exam.invigilator2 || 'Cán bộ coi thi 2',
      studentCount: exam.studentCount || 40,
      note: exam.note || exam.notes || '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseName.trim() || !formData.classCode.trim() || !formData.examDate) {
      setFormError('Vui lòng điền đầy đủ Tên môn thi, Lớp và Ngày thi');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingExam) {
        const res = await api.updateExam(editingExam.id, formData);
        if (res.success) {
          setIsFormModalOpen(false);
          setNotification({
            type: 'success',
            message: `Đã cập nhật ca thi ${formData.courseName} (${formData.classCode}) thành công!`,
          });
          fetchExams();
        }
      } else {
        const res = await api.createExam(formData);
        if (res.success) {
          setIsFormModalOpen(false);
          setNotification({
            type: 'success',
            message: res.message || `Đã lưu ca thi ${formData.courseName} (${formData.classCode})!`,
          });
          fetchExams();
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu ca thi');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!deletingExam) return;
    setDeleteLoading(true);
    try {
      const res = await api.deleteExam(deletingExam.id);
      if (res.success) {
        setNotification({
          type: 'success',
          message: `Đã xóa ca thi ${deletingExam.courseName} (${deletingExam.classCode})`,
        });
        setDeletingExam(null);
        fetchExams();
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Lỗi khi xóa ca thi',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Calculate countdown days relative to reference date 2026-08-27
  const getCountdown = (examDateStr: string) => {
    const today = new Date('2026-08-27');
    const examDate = new Date(examDateStr);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Đã hoàn thành', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    if (diffDays === 0) return { text: 'Hôm nay thi!', color: 'bg-red-500 text-white animate-pulse font-bold' };
    if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, color: 'bg-amber-500 text-white font-bold' };
    return { text: `Còn ${diffDays} ngày`, color: 'bg-blue-50 text-blue-800 border-blue-200 font-semibold' };
  };

  // Stats calculation
  const totalExams = exams.length;
  const uniqueRooms = Array.from(new Set(exams.map((e) => e.roomCode))).length;
  const uniqueCourses = Array.from(new Set(exams.map((e) => e.courseCode || e.courseName))).length;

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Multi-Level Academic Filter Bar & Integrated Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              Lịch Thi Theo Khóa & Ca Thi
            </h2>
          </div>

          <div className="flex items-center flex-wrap gap-2 self-start lg:self-auto">
            {/* Admin Management Tools */}
            {currentRole === 'ADMIN' && (
              <div className="flex items-center gap-1.5 mr-2">
                <button
                  onClick={handleAutoSync}
                  disabled={syncing}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Đồng bộ tự động từ URL"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{syncing ? 'Đang nạp...' : 'Đồng bộ URL'}</span>
                </button>

                <button
                  onClick={handleOpenImportModal}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Nạp Google Sheet</span>
                </button>

                <button
                  onClick={() => handleOpenCreateModal()}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Ca Thi</span>
                </button>
              </div>
            )}

            {/* View Mode Toggle: 2 Modes (Lưới Thứ 2 - Thứ 6 & Lưới thẻ) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-blue-700 shadow-xs ring-1 ring-black/5' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Xem dạng lưới từ Thứ 2 đến Thứ 6"
              >
                <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                <span>Lưới Thứ 2 - Thứ 6</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Xem dạng thẻ"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Lưới thẻ</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6 Basic Academic Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Năm học */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Năm học</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="2025-2026">2025 - 2026 (Hiện tại)</option>
              <option value="2024-2025">2024 - 2025</option>
              <option value="2026-2027">2026 - 2027</option>
              <option value="ALL">Tất cả năm học</option>
            </select>
          </div>

          {/* 2. Học kỳ */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Học kỳ</label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Học kỳ 2">Học kỳ 2</option>
              <option value="Học kỳ 1">Học kỳ 1</option>
              <option value="Học kỳ Hè">Học kỳ Hè (Phụ)</option>
              <option value="ALL">Tất cả học kỳ</option>
            </select>
          </div>

          {/* 3. Khóa đào tạo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Khóa đào tạo
            </label>
            <select
              value={filterCohort}
              onChange={(e) => setFilterCohort(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-blue-900 font-bold"
            >
              <option value="ALL">Tất cả các khóa</option>
              <option value="D21">Khóa D21 (Năm 4)</option>
              <option value="D22">Khóa D22 (Năm 3)</option>
              <option value="D23">Khóa D23 (Năm 2)</option>
              <option value="D24">Khóa D24 (Năm 1)</option>
              <option value="D25">Khóa D25 (Tân sinh viên)</option>
            </select>
          </div>

          {/* 4. Lớp */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Lớp</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Tất cả các lớp</option>
              {classes.map((c) => (
                <option key={c.id} value={c.classCode}>
                  {c.classCode} ({c.className})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Phòng Nhà H */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Phòng Nhà H</label>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Tất cả phòng</option>
              <option value="H.101">H.101</option>
              <option value="H.102">H.102</option>
              <option value="H.103">H.103 (Phòng máy)</option>
              <option value="H.201">H.201</option>
              <option value="H.202">H.202</option>
              <option value="H.203">H.203</option>
              <option value="H.204">H.204</option>
              <option value="H.301">H.301</option>
              <option value="H.302">H.302</option>
              <option value="H.303">H.303 (Phòng máy)</option>
              <option value="H.304">H.304</option>
            </select>
          </div>

          {/* 6. Tìm kiếm */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tìm kiếm</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                placeholder="Môn, GV, mã..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Secondary Sub-Toolbar for Grid Mode: Week Selector, Session Toggle & Weekend Checkbox */}
        {viewMode === 'grid' && (
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center flex-wrap gap-2.5">
              <span className="font-bold text-blue-950 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                <span>Chọn tuần thi:</span>
              </span>

              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-blue-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả các tuần thi (Tổng hợp Thứ 2 - Thứ 6)</option>
                {availableWeeks.map((w) => (
                  <option key={w.key} value={w.key}>
                    {w.label} — ({w.count} ca thi)
                  </option>
                ))}
              </select>

              {/* Session Quick Filter */}
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-blue-200">
                <button
                  onClick={() => setSessionFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                    sessionFilter === 'ALL' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ca
                </button>
                <button
                  onClick={() => setSessionFilter('MORNING')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    sessionFilter === 'MORNING' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  <span>Ca Sáng</span>
                </button>
                <button
                  onClick={() => setSessionFilter('AFTERNOON')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    sessionFilter === 'AFTERNOON' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sunset className="w-3 h-3" />
                  <span>Ca Chiều</span>
                </button>
              </div>
            </div>

            {/* Weekend toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={showWeekend}
                onChange={(e) => setShowWeekend(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
              <span>Hiển thị thêm Thứ 7 & CN</span>
            </label>
          </div>
        )}

        {/* Applied Filters Tags */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500 border-t border-slate-50">
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="font-semibold text-slate-700">Đang lọc:</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold border border-blue-100">
              {filterYear}
            </span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold border border-blue-100">
              {filterSemester}
            </span>
            {filterCohort !== 'ALL' && (
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-semibold border border-indigo-100">
                Khóa {filterCohort}
              </span>
            )}
            {filterClass !== 'ALL' && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                Lớp {filterClass}
              </span>
            )}
            {filterRoom !== 'ALL' && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold border border-emerald-100">
                Phòng {filterRoom}
              </span>
            )}
          </div>

          <div>
            Hiển thị <strong className="text-slate-900">{exams.length}</strong> ca thi phù hợp
          </div>
        </div>
      </div>

      {/* Main Content: Grid View (Thứ 2 - Thứ 6) OR Cards View OR Table View */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy lịch thi phù hợp</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Không có ca thi nào cho năm học <strong>{filterYear}</strong>, <strong>{filterSemester}</strong> và khóa{' '}
            <strong>{filterCohort}</strong>. Bạn có thể chọn "Tất cả các khóa" hoặc nạp thêm ca thi mới.
          </p>
          {isAdminOrManager && (
            <button
              onClick={handleOpenImportModal}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Nạp lịch thi cho học kỳ này</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ========================================================================= */
        /* 1. MONDAY TO FRIDAY GRID VIEW (LƯỚI THỨ 2 ĐẾN THỨ 6)                      */
        /* ========================================================================= */
        <div className="space-y-4 w-full min-w-0">
          {/* Day Columns Grid Container with smooth horizontal scroll on smaller viewports */}
          <div className="w-full overflow-x-auto pb-2">
            <div
              className={`grid gap-3.5 min-w-[850px] lg:min-w-0 ${
                showWeekend
                  ? 'grid-cols-7'
                  : 'grid-cols-5'
              }`}
            >
              {weekdayColumns.map((col) => {
                const isToday = false; // Could be checked with current day

                return (
                  <div
                    key={col.dayIndex}
                    className="bg-slate-50/80 border border-slate-200/90 rounded-2xl flex flex-col min-h-[480px] shadow-xs overflow-hidden min-w-0"
                  >
                    {/* Column Header */}
                    <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                            {col.name}
                          </h3>
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-medium mt-0.5 flex items-center gap-1 truncate">
                          <span>{col.short}</span>
                          {col.specificDateStr && (
                            <>
                              <span>•</span>
                              <span className="font-bold text-blue-700 font-mono truncate">{col.specificDateStr}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          col.totalCount > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {col.totalCount} ca
                      </span>
                    </div>

                    {/* Column Body: Morning & Afternoon slots */}
                    <div className="p-2 flex-1 space-y-2.5 overflow-y-auto max-h-[750px] min-w-0">
                      {col.totalCount === 0 ? (
                        /* Empty State */
                        <div className="h-44 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-3 text-center text-slate-400 space-y-2 my-auto">
                          <Calendar className="w-5 h-5 text-slate-300" />
                          <p className="text-[11px]">Chưa có ca thi {col.short}</p>
                          {isAdminOrManager && (
                            <button
                              onClick={() => handleOpenCreateModal()}
                              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Thêm ca thi</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        /* List of Exam Cards in this weekday */
                        col.exams.map((exam) => {
                          const countdown = getCountdown(exam.examDate);
                          const isMorning = parseInt((exam.startTime || '07:30').split(':')[0], 10) < 12;

                          return (
                            <div
                              key={exam.id}
                              className="bg-white rounded-xl p-2.5 border border-slate-300 shadow-md hover:shadow-lg hover:border-blue-600 transition-all space-y-2 group relative ring-1 ring-slate-100 min-w-0 overflow-hidden"
                            >
                              {/* Card Top: Time, Room & Countdown */}
                              <div className="flex items-start justify-between gap-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap min-w-0">
                                  {/* Time Badge */}
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono flex items-center gap-1 shrink-0 ${
                                      isMorning
                                        ? 'bg-amber-50 text-amber-900 border border-amber-300'
                                        : 'bg-indigo-50 text-indigo-900 border border-indigo-300'
                                    }`}
                                  >
                                    <Clock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                    <span>{exam.startTime}-{exam.endTime}</span>
                                  </span>

                                  {/* Room Badge */}
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-900 text-[10px] font-extrabold rounded border border-blue-300 flex items-center gap-0.5 shrink-0">
                                    <Building2 className="w-2.5 h-2.5 text-blue-700 shrink-0" />
                                    {exam.roomCode}
                                  </span>
                                </div>

                                {/* Action buttons on hover */}
                                {isAdminOrManager && (
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                                    <button
                                      onClick={() => handleOpenEditModal(exam)}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                                      title="Sửa ca thi"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingExam(exam)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                      title="Xóa ca thi"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Subject Name */}
                              <div className="min-w-0">
                                <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug break-words">
                                  {exam.courseName}
                                </h4>
                                <div className="flex items-center gap-1 text-[10px] text-slate-600 font-mono mt-0.5 flex-wrap min-w-0">
                                  <span className="shrink-0">{exam.courseCode}</span>
                                  <span>•</span>
                                  <span className="font-bold text-slate-800 font-sans truncate">Lớp {exam.classCode}</span>
                                  {exam.cohort && (
                                    <span className="px-1 bg-indigo-50 text-indigo-700 rounded font-bold font-sans text-[9px] border border-indigo-200 shrink-0">
                                      {exam.cohort}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Invigilators / CBCT */}
                              <div className="text-[10.5px] text-slate-700 bg-slate-50/90 p-1.5 rounded-lg border border-slate-200 space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1 min-w-0" title={`CBCT 1: ${exam.invigilator1 || exam.lecturerName}`}>
                                  <User className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                  <span className="truncate min-w-0">
                                    1. <strong>{exam.invigilator1 || exam.lecturerName}</strong>
                                  </span>
                                </div>
                                {exam.invigilator2 && (
                                  <div className="flex items-center gap-1 text-slate-600 pl-3.5 min-w-0" title={`CBCT 2: ${exam.invigilator2}`}>
                                    <span className="truncate min-w-0">2. {exam.invigilator2}</span>
                                  </div>
                                )}
                              </div>

                              {/* Format & Sĩ số */}
                              <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200 min-w-0">
                                <span className="truncate font-semibold min-w-0 pr-1">{exam.examType}</span>
                                <span className="font-bold text-slate-800 shrink-0">{exam.studentCount || 40} SV</span>
                              </div>

                              {/* Exact Date & Countdown */}
                              <div className="flex items-center justify-between text-[9.5px] pt-1 min-w-0">
                                <span className="font-semibold text-slate-700 font-mono flex items-center gap-0.5 shrink-0">
                                  <Calendar className="w-2.5 h-2.5 text-blue-600" />
                                  {exam.examDate}
                                </span>
                                <span className={`px-1.5 py-0.2 rounded font-bold border shadow-xs shrink-0 ${countdown.color}`}>
                                  {countdown.text}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* ========================================================================= */
        /* 2. CARDS VIEW                                                             */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => {
            const countdown = getCountdown(exam.examDate);
            const dayInfo = getExamDayInfo(exam.examDate);

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl p-5 border border-slate-300 shadow-md hover:border-blue-600 hover:shadow-lg transition-all space-y-3.5 relative group ring-1 ring-slate-100"
              >
                {/* Header: Course Code, Cohort Tag & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-mono text-xs font-bold rounded-md border border-blue-300">
                        {exam.courseCode}
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 font-bold text-xs rounded-md border border-indigo-200">
                        {dayInfo.shortName}
                      </span>
                      {exam.cohort && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 text-[11px] font-extrabold rounded-md border border-indigo-200">
                          Khóa {exam.cohort}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[11px] font-bold rounded-md border border-slate-200">
                        Lớp {exam.classCode}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1.5 leading-snug">
                      {exam.courseName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-xs ${countdown.color}`}>
                      {countdown.text}
                    </span>

                    {/* Admin Actions */}
                    {isAdminOrManager && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleOpenEditModal(exam)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Chỉnh sửa ca thi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingExam(exam)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Xóa ca thi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/90 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Ngày thi</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {dayInfo.shortName} • {exam.examDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Giờ thi & Thời lượng</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {exam.startTime} - {exam.endTime} ({exam.durationMinutes}p)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Phòng thi Nhà H</span>
                    <span className="font-bold text-blue-800 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      Phòng {exam.roomCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Hình thức thi</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      {exam.examType}
                    </span>
                  </div>
                </div>

                {/* CBCT 1 & 2 */}
                <div className="text-xs bg-blue-50/60 p-3 rounded-xl border border-blue-200/80 space-y-1">
                  <div className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                    Cán bộ coi thi (CBCT):
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-800 font-semibold">
                    <div>1. {exam.invigilator1 || exam.lecturerName}</div>
                    <div>2. {exam.invigilator2 || 'CBCT 2'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* 3. ACADEMIC TABLE VIEW                                                    */
        /* ========================================================================= */
        <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden ring-1 ring-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3.5 text-center w-12">STT</th>
                  <th className="py-3 px-3.5">Khóa & Lớp</th>
                  <th className="py-3 px-3.5">Mã & Học phần thi</th>
                  <th className="py-3 px-3.5">Thứ & Ngày thi</th>
                  <th className="py-3 px-3.5">Giờ thi</th>
                  <th className="py-3 px-3.5">Phòng thi Nhà H</th>
                  <th className="py-3 px-3.5">Cán bộ coi thi (CBCT)</th>
                  <th className="py-3 px-3.5">Hình thức & Sĩ số</th>
                  <th className="py-3 px-3.5 text-center">Trạng thái</th>
                  {isAdminOrManager && <th className="py-3 px-3.5 text-right w-20">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((exam, index) => {
                  const countdown = getCountdown(exam.examDate);
                  const dayInfo = getExamDayInfo(exam.examDate);

                  return (
                    <tr key={exam.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-3.5 text-center font-bold text-slate-400">{index + 1}</td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{exam.classCode}</div>
                        <div className="text-[10px] text-indigo-700 font-bold">
                          {exam.cohort ? `Khóa ${exam.cohort}` : 'Khóa D22'}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-extrabold text-slate-900">{exam.courseName}</div>
                        <div className="text-[10px] font-mono text-blue-700 font-bold">{exam.courseCode}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded font-bold text-[10px] border border-blue-200">
                            {dayInfo.shortName}
                          </span>
                          <span>{exam.examDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="text-slate-800 font-mono font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {exam.startTime} - {exam.endTime}
                        </div>
                        <div className="text-[10px] text-slate-400">{exam.durationMinutes} phút</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block border border-blue-100">
                          Phòng {exam.roomCode}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{exam.building || 'Nhà H'}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-800">1. {exam.invigilator1 || exam.lecturerName}</div>
                        {exam.invigilator2 && (
                          <div className="text-[11px] text-slate-500 mt-0.5">2. {exam.invigilator2}</div>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-700">{exam.examType}</div>
                        <div className="text-[10px] text-slate-400">Sĩ số: {exam.studentCount || 40} SV</div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${countdown.color}`}>
                          {countdown.text}
                        </span>
                      </td>
                      {isAdminOrManager && (
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(exam)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                              title="Sửa ca thi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingExam(exam)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Xóa ca thi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GOOGLE SHEET EXAM IMPORT MODAL WITH DEDUPLICATION / UPSERT LOGIC */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Nạp Lịch Thi từ Google Sheet</h3>
                  <p className="text-xs text-emerald-200/85">
                    Tự động nhận diện môn thi, lớp, phòng Nhà H & Cập nhật trùng lịch
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportSheet} className="p-6 space-y-4 overflow-y-auto">
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>{importError}</div>
                </div>
              )}

              {/* Hierarchy Scope Selector for Import */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Xác định Phạm vi Lịch thi sẽ nạp</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-900 mb-1">Năm học</label>
                    <select
                      value={importYear}
                      onChange={(e) => setImportYear(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg font-medium"
                    >
                      <option value="2025-2026">2025 - 2026</option>
                      <option value="2024-2025">2024 - 2025</option>
                      <option value="2026-2027">2026 - 2027</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-900 mb-1">Học kỳ</label>
                    <select
                      value={importSemester}
                      onChange={(e) => setImportSemester(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg font-medium"
                    >
                      <option value="Học kỳ 2">Học kỳ 2</option>
                      <option value="Học kỳ 1">Học kỳ 1</option>
                      <option value="Học kỳ Hè">Học kỳ Hè</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-900 mb-1">Khóa đào tạo</label>
                    <select
                      value={importCohort}
                      onChange={(e) => setImportCohort(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg font-bold text-emerald-900"
                    >
                      <option value="D22">Khóa D22</option>
                      <option value="D21">Khóa D21</option>
                      <option value="D23">Khóa D23</option>
                      <option value="D24">Khóa D24</option>
                      <option value="D25">Khóa D25</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sheet URL input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Link Google Sheet</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetUrl(
                        'https://docs.google.com/spreadsheets/d/1kCHr0jwbRtJ9oXhW9buBpRDX6XNOldvp08M5XqYpwEI/edit?usp=sharing'
                      );
                      setImportError(null);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer"
                  >
                    Dùng link mẫu
                  </button>
                </div>
                <input
                  type="url"
                  required
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              {/* Intelligent Upsert Strategy Option */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    id="opt_upsert"
                    name="importStrategy"
                    checked={!replaceExisting}
                    onChange={() => setReplaceExisting(false)}
                    className="w-4 h-4 text-emerald-600 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="opt_upsert" className="text-xs cursor-pointer">
                    <strong className="text-slate-900 block font-bold">
                      Tự động cập nhật nếu trùng lịch (Khuyên dùng)
                    </strong>
                    <span className="text-slate-500 text-[11px]">
                      Nếu ca thi môn/lớp đã có trong học kỳ, hệ thống sẽ <strong>cập nhật lại</strong> phòng thi, ngày thi, giờ thi và CBCT mới nhất thay vì tạo bản sao trùng lặp.
                    </span>
                  </label>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/60">
                  <input
                    type="radio"
                    id="opt_replace"
                    name="importStrategy"
                    checked={replaceExisting}
                    onChange={() => setReplaceExisting(true)}
                    className="w-4 h-4 text-emerald-600 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="opt_replace" className="text-xs cursor-pointer">
                    <strong className="text-slate-900 block font-bold">
                      Ghi đè thay thế toàn bộ
                    </strong>
                    <span className="text-slate-500 text-[11px]">
                      Xóa toàn bộ ca thi cũ của toàn trường và thay bằng dữ liệu trong Sheet.
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={importLoading}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={importLoading}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {importLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang nạp & đối soát...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Bắt đầu nạp lịch thi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EXAM FORM MODAL (Admin & Training Manager only) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingExam ? 'Chỉnh Sửa Ca Thi & CBCT' : 'Thêm Ca Thi Mới Nhà H'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Cập nhật trực tiếp vào cơ sở dữ liệu Nhà H của Khoa CNTT
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>{formError}</div>
                </div>
              )}

              {/* Course Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên môn thi / Học phần <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    placeholder="Ví dụ: Cơ sở dữ liệu nâng cao"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã học phần</label>
                  <input
                    type="text"
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                    placeholder="CNTT301"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              {/* Class, Date & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Lớp sinh viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.classCode}
                    onChange={(e) => setFormData({ ...formData, classCode: e.target.value })}
                    placeholder="DCT22A"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ngày thi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Thời lượng (Phút)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              {/* Start & End Time + Room */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giờ bắt đầu</label>
                  <input
                    type="text"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    placeholder="07:30"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giờ kết thúc</label>
                  <input
                    type="text"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    placeholder="09:00"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phòng thi Nhà H</label>
                  <select
                    value={formData.roomCode}
                    onChange={(e) => setFormData({ ...formData, roomCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-700"
                  >
                    <option value="H.101">H.101</option>
                    <option value="H.102">H.102</option>
                    <option value="H.103">H.103 (Phòng máy)</option>
                    <option value="H.201">H.201</option>
                    <option value="H.202">H.202</option>
                    <option value="H.203">H.203</option>
                    <option value="H.204">H.204</option>
                    <option value="H.301">H.301</option>
                    <option value="H.302">H.302</option>
                    <option value="H.303">H.303 (Phòng máy)</option>
                    <option value="H.304">H.304</option>
                  </select>
                </div>
              </div>

              {/* Invigilators (CBCT 1 & 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cán bộ coi thi 1 (CBCT 1)
                  </label>
                  <input
                    type="text"
                    value={formData.invigilator1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invigilator1: e.target.value,
                        lecturerName: e.target.value,
                      })
                    }
                    placeholder="ThS. Phạm Văn Thơ"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cán bộ coi thi 2 (CBCT 2)
                  </label>
                  <input
                    type="text"
                    value={formData.invigilator2}
                    onChange={(e) => setFormData({ ...formData, invigilator2: e.target.value })}
                    placeholder="Cô Quỳnh"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              {/* Form of Exam & Student count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hình thức thi</label>
                  <select
                    value={formData.examType}
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Tự luận (90 phút)">Tự luận (90 phút)</option>
                    <option value="Thực hành máy (120 phút)">Thực hành máy (120 phút)</option>
                    <option value="Trắc nghiệm trên máy (60 phút)">Trắc nghiệm trên máy (60 phút)</option>
                    <option value="Bảo vệ Đồ án / Báo cáo">Bảo vệ Đồ án / Báo cáo</option>
                    <option value="Vấn đáp trực tiếp">Vấn đáp trực tiếp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sĩ số sinh viên</label>
                  <input
                    type="number"
                    value={formData.studentCount}
                    onChange={(e) => setFormData({ ...formData, studentCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú ca thi</label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Ví dụ: Thi tại phòng máy Nhà H hoặc mang theo laptop cá nhân"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingExam ? 'Lưu Thay Đổi' : 'Thêm Ca Thi'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Xác nhận xóa ca thi?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa ca thi <strong>{deletingExam.courseName}</strong> - Lớp{' '}
                <strong>{deletingExam.classCode}</strong> (Ngày {deletingExam.examDate})?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingExam(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteExam}
                disabled={deleteLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xóa vĩnh viễn</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
