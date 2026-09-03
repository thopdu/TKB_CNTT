import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Filter,
  Download,
  Printer,
  ExternalLink,
  RefreshCw,
  Search,
  BookOpen,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  Layers,
  Table as TableIcon,
  ListFilter,
  GraduationCap,
  Sparkles,
  Info,
  CalendarDays,
  UserCheck,
  Building2,
  BarChart3,
  Check,
  FileSpreadsheet,
  Plus,
  Link2,
  Globe,
  AlertCircle,
  X,
  Database,
  ArrowRight,
  Shield,
  Pencil,
  Trash2,
  Star,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { WeeklyTimetableEntry, Lecturer } from '../../types';
import { TimetableWeekSelector } from '../TimetableWeekSelector';

export const TimetableView: React.FC = () => {
  const { currentRole, currentUser, selectedClass: authSelectedClass, setSelectedClass: setAuthSelectedClass, selectedLecturerId, setSelectedLecturerId, setIsLoginModalOpen, setLoginTargetRole } = useAuth();

  // Mode: By Class (Lớp sinh viên) or By Lecturer (Giảng viên)
  const isStudentRole = currentRole === 'STUDENT';
  const isAdminOrManager = currentRole === 'ADMIN' || currentRole === 'MANAGER';

  const [filterMode, setFilterMode] = useState<'CLASS' | 'LECTURER'>(
    isStudentRole ? 'CLASS' : currentRole === 'LECTURER' ? 'LECTURER' : 'LECTURER'
  );

  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('week_05');
  const [selectedClassName, setSelectedClassName] = useState<string>('DCT23A');
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('ThS. Phạm Văn Thơ');
  const [availableLecturers, setAvailableLecturers] = useState<string[]>([]);
  const [allLecturersData, setAllLecturersData] = useState<any[]>([]);
  const [lecturersRoster, setLecturersRoster] = useState<Lecturer[]>([]);
  
  const [weekDetails, setWeekDetails] = useState<any>(null);
  const [entries, setEntries] = useState<WeeklyTimetableEntry[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lecturerSearchTerm, setLecturerSearchTerm] = useState<string>('');
  const [lecturerGenderFilter, setLecturerGenderFilter] = useState<'ALL' | 'THAY' | 'CO'>('ALL');

  // Google Sheet Add Week Modal State
  const [isAddWeekModalOpen, setIsAddWeekModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1kCHr0jwbRtJ9oXhW9buBpRDX6XNOldvp08M5XqYpwEI/edit?gid=1221165864#gid=1221165864');
  const [weekNumberInput, setWeekNumberInput] = useState<number>(6);
  const [weekTitleInput, setWeekTitleInput] = useState('');
  const [isCurrentCheckbox, setIsCurrentCheckbox] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewInfo, setPreviewInfo] = useState<string | null>(null);

  // Edit Week Modal State
  const [isEditWeekModalOpen, setIsEditWeekModalOpen] = useState(false);
  const [editingWeekId, setEditingWeekId] = useState<string>('');
  const [editSheetUrl, setEditSheetUrl] = useState('');
  const [editWeekNumber, setEditWeekNumber] = useState<number>(6);
  const [editWeekTitle, setEditWeekTitle] = useState('');
  const [editIsCurrent, setEditIsCurrent] = useState(false);
  const [editReSync, setEditReSync] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Sync mode with role if role changes
  useEffect(() => {
    if (currentRole === 'STUDENT') {
      setFilterMode('CLASS');
    } else if (currentRole === 'LECTURER') {
      setFilterMode('LECTURER');
    }
  }, [currentRole]);

  // Auto Sync URLs
  const handleAutoSync = async () => {
    setSyncing(true);
    try {
      const res = await api.autoSyncUrls();
      if (res.success) {
        setSyncMessage(`Đã đồng bộ tự động từ URL thành công (${res.timetableWeeksCount} tuần, ${res.examsCount} ca thi) lúc ${res.lastSynced.substring(11, 19)}`);
        // Refresh weeks list
        const updatedWeeks = await api.getTimetableWeeks();
        if (Array.isArray(updatedWeeks)) setWeeks(updatedWeeks);
      }
    } catch (err: any) {
      setSyncMessage(`Lỗi đồng bộ tự động: ${err.message || 'Không thể kết nối URL'}`);
    } finally {
      setSyncing(false);
    }
  };

  // Import Google Sheet
  const handleImportGoogleSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) {
      setImportError('Vui lòng nhập đường link Google Sheet hợp lệ');
      return;
    }

    setImportLoading(true);
    setImportError(null);

    try {
      const res = await api.importTimetableGoogleSheet({
        url: sheetUrl.trim(),
        weekNumber: Number(weekNumberInput),
        title: weekTitleInput.trim() || undefined,
        isCurrent: isCurrentCheckbox,
      });

      if (res.success && res.week) {
        setIsAddWeekModalOpen(false);
        setSyncMessage(`Đã thêm thành công ${res.week.title} từ Google Sheet (${res.classesCount} lớp, ${res.entriesCount} buổi học)!`);
        
        // Refresh weeks and select newly imported week
        const updatedWeeks = await api.getTimetableWeeks();
        if (Array.isArray(updatedWeeks)) {
          setWeeks(updatedWeeks);
          setSelectedWeekId(res.week.weekId);
        }
      }
    } catch (err: any) {
      setImportError(err.message || 'Lỗi khi đọc file Google Sheet. Vui lòng kiểm tra lại liên kết hoặc quyền xem công khai.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleOpenAddWeekModal = () => {
    if (!isAdminOrManager) {
      setLoginTargetRole('MANAGER');
      setIsLoginModalOpen(true);
      return;
    }
    setImportError(null);
    setPreviewInfo(null);
    const existingNums = weeks.map((w) => w.weekNumber || 0);
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 6;
    setWeekNumberInput(nextNum);
    setWeekTitleInput(`Tuần ${nextNum < 10 ? '0' + nextNum : nextNum} (Đồng bộ Google Sheet)`);
    setIsAddWeekModalOpen(true);
  };

  // Open Edit Week Modal
  const handleOpenEditWeekModal = (week: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdminOrManager) {
      setLoginTargetRole('MANAGER');
      setIsLoginModalOpen(true);
      return;
    }
    setEditingWeekId(week.weekId);
    setEditSheetUrl(week.url || '');
    setEditWeekNumber(week.weekNumber || 1);
    setEditWeekTitle(week.title || '');
    setEditIsCurrent(!!week.current);
    setEditReSync(false);
    setEditError(null);
    setDeleteConfirmOpen(false);
    setIsEditWeekModalOpen(true);
  };

  // Save Week Edits
  const handleSaveWeekEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWeekId) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const res = await api.updateTimetableWeek(editingWeekId, {
        url: editSheetUrl.trim() || undefined,
        title: editWeekTitle.trim() || undefined,
        weekNumber: Number(editWeekNumber),
        current: editIsCurrent,
        reSync: editReSync,
      });

      if (res.success) {
        setIsEditWeekModalOpen(false);
        setSyncMessage(`Đã cập nhật thành công tuần thời khóa biểu "${editWeekTitle}"!`);
        
        // Refresh weeks list
        const updatedWeeks = await api.getTimetableWeeks();
        if (Array.isArray(updatedWeeks)) {
          setWeeks(updatedWeeks);
          if (res.week?.weekId) {
            setSelectedWeekId(res.week.weekId);
          }
        }
      }
    } catch (err: any) {
      setEditError(err.message || 'Lỗi khi cập nhật tuần thời khóa biểu');
    } finally {
      setEditLoading(false);
    }
  };

  // Set as Current Week
  const handleSetCurrentWeek = async (weekId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdminOrManager) {
      setLoginTargetRole('MANAGER');
      setIsLoginModalOpen(true);
      return;
    }

    try {
      const res = await api.setCurrentTimetableWeek(weekId);
      if (res.success) {
        setSyncMessage(res.message);
        const updatedWeeks = await api.getTimetableWeeks();
        if (Array.isArray(updatedWeeks)) setWeeks(updatedWeeks);
      }
    } catch (err: any) {
      setSyncMessage(`Lỗi đặt tuần hiện tại: ${err.message}`);
    }
  };

  // Helper function to extract and format date range for display in timetable week cards
  const getWeekDateInfo = (w: any) => {
    let startDate = w?.startDate || '';
    let endDate = w?.endDate || '';

    if (!startDate || !endDate) {
      const titleText = `${w?.parsedTitle || ''} ${w?.title || ''}`;
      const matchFull =
        titleText.match(/T[ƯỪ]\s*NG[AÀ]Y\s*([0-9]{1,2}\/[0-9]{1,2}(?:\/[0-9]{4})?)\s*Đ[ẾÊ]N\s*NG[AÀ]Y\s*([0-9]{1,2}\/[0-9]{1,2}(?:\/[0-9]{4})?)/i) ||
        titleText.match(/\(([0-9]{1,2}\/[0-9]{1,2}(?:\/[0-9]{4})?)\s*[-–]\s*([0-9]{1,2}\/[0-9]{1,2}(?:\/[0-9]{4})?)\)/i) ||
        titleText.match(/([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})\s*[-–]\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i);

      if (matchFull) {
        let d1 = matchFull[1].trim();
        let d2 = matchFull[2].trim();
        if (!d1.includes('/202')) d1 += '/2026';
        if (!d2.includes('/202')) d2 += '/2026';
        startDate = d1;
        endDate = d2;
      }
    }

    if (!startDate || !endDate) {
      const num = w?.weekNumber || 5;
      const baseDate = new Date(2026, 7, 24); // 24/08/2026
      const mon = new Date(baseDate.getTime() + (num - 5) * 7 * 86400000);
      const sat = new Date(mon.getTime() + 5 * 86400000);
      const pad = (n: number) => String(n).padStart(2, '0');
      startDate = `${pad(mon.getDate())}/${pad(mon.getMonth() + 1)}/${mon.getFullYear()}`;
      endDate = `${pad(sat.getDate())}/${pad(sat.getMonth() + 1)}/${sat.getFullYear()}`;
    }

    return {
      startDate,
      endDate,
      arrowText: `${startDate} → ${endDate}`,
      shortText: `${startDate} – ${endDate}`,
      fullText: `Từ ngày ${startDate} đến ngày ${endDate}`,
    };
  };

  // Delete Week
  const handleDeleteWeek = async (weekId: string) => {
    if (!isAdminOrManager) {
      setLoginTargetRole('MANAGER');
      setIsLoginModalOpen(true);
      return;
    }

    setEditLoading(true);
    try {
      const res = await api.deleteTimetableWeek(weekId);
      if (res.success) {
        setIsEditWeekModalOpen(false);
        setDeleteConfirmOpen(false);
        setSyncMessage(res.message);
        const updatedWeeks = await api.getTimetableWeeks();
        if (Array.isArray(updatedWeeks) && updatedWeeks.length > 0) {
          setWeeks(updatedWeeks);
          const nextSelected = updatedWeeks.find((w) => w.current) || updatedWeeks[0];
          setSelectedWeekId(nextSelected.weekId);
        }
      }
    } catch (err: any) {
      setEditError(err.message || 'Lỗi khi xóa tuần');
    } finally {
      setEditLoading(false);
    }
  };
  useEffect(() => {
    Promise.all([
      api.getTimetableWeeks(),
      api.getTimetableLecturers(),
      api.getLecturers(),
    ]).then(([weeksData, timetableLecs, lecsRoster]) => {
      if (Array.isArray(weeksData) && weeksData.length > 0) {
        setWeeks(weeksData);
        const currentWeek = weeksData.find((w) => w.current) || weeksData[0];
        setSelectedWeekId(currentWeek.weekId);

        // If user already had an active class
        if (authSelectedClass) {
          const matchClass = currentWeek.classes.find(
            (c: string) => c.toLowerCase() === authSelectedClass.replace('cls_', '').toLowerCase()
          );
          if (matchClass) {
            setSelectedClassName(matchClass);
          } else if (currentWeek.classes.length > 0) {
            setSelectedClassName(currentWeek.classes[0]);
          }
        } else if (currentWeek.classes.length > 0) {
          setSelectedClassName(currentWeek.classes[0]);
        }
      }

      if (Array.isArray(timetableLecs)) {
        setAllLecturersData(timetableLecs);
        const names = timetableLecs.map((l) => l.name);
        setAvailableLecturers(names);

        // Map initial teacher name if role is lecturer
        if (selectedLecturerId && Array.isArray(lecsRoster)) {
          const foundRoster = lecsRoster.find((l) => l.id === selectedLecturerId);
          if (foundRoster) {
            // Find closest match in timetable
            const match = names.find((n) => n.toLowerCase().includes(foundRoster.fullName.toLowerCase()) || foundRoster.fullName.toLowerCase().includes(n.toLowerCase()));
            if (match) {
              setSelectedTeacherName(match);
            }
          }
        } else if (names.length > 0 && !names.includes(selectedTeacherName)) {
          // If default 'ThS. Phạm Văn Thơ' is not in list, find or use first
          const defaultLec = names.find(n => n.includes('Thơ') || n.includes('Quỳnh')) || names[0];
          if (defaultLec) setSelectedTeacherName(defaultLec);
        }
      }

      if (Array.isArray(lecsRoster)) {
        setLecturersRoster(lecsRoster);
      }
    });
  }, []);

  // 2. Query timetable when parameters change
  useEffect(() => {
    if (!selectedWeekId) return;
    setLoading(true);

    if (filterMode === 'LECTURER') {
      api
        .queryTimetable(selectedWeekId, undefined, selectedTeacherName)
        .then((res) => {
          if (res) {
            setWeekDetails(res.week);
            setAvailableClasses(res.availableClasses || []);
            if (res.availableLecturers && res.availableLecturers.length > 0) {
              setAvailableLecturers(res.availableLecturers);
            }
            setEntries(res.entries || []);
            setWeeklyStats(res.weeklyStats || null);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      if (!selectedClassName) return;
      api
        .queryTimetable(selectedWeekId, selectedClassName)
        .then((res) => {
          if (res) {
            setWeekDetails(res.week);
            setAvailableClasses(res.availableClasses || []);
            if (res.availableLecturers && res.availableLecturers.length > 0) {
              setAvailableLecturers(res.availableLecturers);
            }
            setEntries(res.entries || []);
            setWeeklyStats(null);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedWeekId, selectedClassName, selectedTeacherName, filterMode]);

  // Handle class selection
  const handleSelectClass = (cls: string) => {
    setSelectedClassName(cls);
    if (setAuthSelectedClass) {
      setAuthSelectedClass(cls);
    }
  };

  // Handle lecturer selection
  const handleSelectLecturer = (teacher: string) => {
    setSelectedTeacherName(teacher);
    // Also sync with selectedLecturerId if match found
    const match = lecturersRoster.find((l) =>
      teacher.toLowerCase().includes(l.fullName.toLowerCase()) || l.fullName.toLowerCase().includes(teacher.toLowerCase())
    );
    if (match && setSelectedLecturerId) {
      setSelectedLecturerId(match.id);
    }
  };

  // Days list in order
  const days = [
    { dayOfWeek: 'Thứ 2', short: 'T2', fullLabel: 'Thứ Hai' },
    { dayOfWeek: 'Thứ 3', short: 'T3', fullLabel: 'Thứ Ba' },
    { dayOfWeek: 'Thứ 4', short: 'T4', fullLabel: 'Thứ Tư' },
    { dayOfWeek: 'Thứ 5', short: 'T5', fullLabel: 'Thứ Năm' },
    { dayOfWeek: 'Thứ 6', short: 'T6', fullLabel: 'Thứ Sáu' },
    { dayOfWeek: 'Thứ 7', short: 'T7', fullLabel: 'Thứ Bảy' },
    { dayOfWeek: 'Chủ nhật', short: 'CN', fullLabel: 'Chủ Nhật' },
  ];

  // Helper to find entry for day and session
  const getSessionEntry = (dayName: string, session: 'MORNING' | 'AFTERNOON') => {
    return entries.find(
      (e) =>
        e.dayOfWeek.toLowerCase() === dayName.toLowerCase() &&
        e.session === session &&
        (searchTerm.trim() === '' ||
          e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.room.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    if (entries.length === 0) return;
    const headers = ['Tuần', 'Lớp', 'Thứ', 'Ngày', 'Buổi', 'Tiết học', 'Giờ học', 'Môn học', 'Giáo viên', 'Phòng học'];
    const rows = entries.map((e) => [
      `"${weekDetails?.title || selectedWeekId}"`,
      e.className || selectedClassName,
      e.dayOfWeek,
      e.date,
      e.session === 'MORNING' ? 'Sáng' : 'Chiều',
      e.period,
      e.time,
      `"${e.subject}"`,
      `"${e.teacher}"`,
      e.room,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = filterMode === 'LECTURER'
      ? `PDU_TKB_GiangVien_${selectedTeacherName.replace(/\s+/g, '_')}_${selectedWeekId}.csv`
      : `PDU_TKB_Lop_${selectedClassName}_${selectedWeekId}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print schedule
  const handlePrint = () => {
    window.print();
  };

  // Find date for day of week if exists in entries
  const getDateForDay = (dayName: string) => {
    const found = entries.find((e) => e.dayOfWeek.toLowerCase() === dayName.toLowerCase());
    return found?.date || '';
  };

  const selectedWeekObj = weeks.find((w) => w.weekId === selectedWeekId);

  // Sanitized and filtered lecturers list (Strictly Thầy / Cô, no H203, no PLĐ3)
  const isInvalidTeacherName = (name: string) => {
    if (!name) return true;
    const trimmed = name.trim();
    if (trimmed.length < 2) return true;
    const lower = trimmed.toLowerCase();
    // Exclude rooms, codes, and placeholders
    if (/^h\s*[\.\s\-_]?\s*\d+/i.test(trimmed)) return true;
    if (/^[e|g|d|c|a|b|f]\s*[\.\s\-_]?\s*\d{2,4}$/i.test(trimmed)) return true;
    if (/^(lab|pm|xưởng|hội trường|khu|tầng|sân|nhà\s*h|phòng|phong|gđ|gd)\b/i.test(lower)) return true;
    if (lower.includes('h203') || lower.includes('plđ') || lower.includes('pld') || lower.includes('lớp hp') || lower.includes('lop hp')) return true;
    if (/^(d\d{2}|dct|dst|cntt|k\d{2})/i.test(trimmed)) return true;
    return false;
  };

  const sanitizedLecturers = useMemo(() => {
    const valid = availableLecturers.filter((l) => !isInvalidTeacherName(l));
    const unique = Array.from(new Set<string>(valid));
    return unique.sort((a: string, b: string) => a.localeCompare(b, 'vi'));
  }, [availableLecturers]);

  const thayLecturers = useMemo(() => {
    return sanitizedLecturers.filter((l) => /^thầy\b/i.test(l.trim()) || /thầy/i.test(l));
  }, [sanitizedLecturers]);

  const coLecturers = useMemo(() => {
    return sanitizedLecturers.filter((l) => /^cô\b/i.test(l.trim()) || /cô/i.test(l));
  }, [sanitizedLecturers]);

  const filteredLecturers = useMemo(() => {
    let baseList = sanitizedLecturers;
    if (lecturerGenderFilter === 'THAY') {
      baseList = thayLecturers;
    } else if (lecturerGenderFilter === 'CO') {
      baseList = coLecturers;
    }

    if (!lecturerSearchTerm.trim()) return baseList;
    const term = lecturerSearchTerm.toLowerCase().trim();
    return baseList.filter((l) => l.toLowerCase().includes(term));
  }, [sanitizedLecturers, thayLecturers, coLecturers, lecturerGenderFilter, lecturerSearchTerm]);

  return (
    <div className="space-y-6">
      {syncMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-2xl border border-emerald-200 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* TIMETABLE WEEK SELECTOR */}
      <TimetableWeekSelector
        weeks={weeks}
        selectedWeekId={selectedWeekId}
        onSelectWeek={(id) => setSelectedWeekId(id)}
        title="Chọn Tuần TKB"
        actions={
          isAdminOrManager ? (
            <div className="flex items-center gap-1.5 ml-1">
              {selectedWeekObj && (
                <button
                  type="button"
                  onClick={(e) => handleOpenEditWeekModal(selectedWeekObj, e)}
                  className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition cursor-pointer text-xs"
                  title="Sửa tuần đang chọn"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenAddWeekModal}
                className="p-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition cursor-pointer text-xs"
                title="Thêm tuần từ Google Sheet"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleAutoSync}
                disabled={syncing}
                className="p-1.5 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer text-xs disabled:opacity-50"
                title="Đồng bộ lại từ URL PDU"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          ) : undefined
        }
      />

      {/* MAIN TIMETABLE CONTAINER WITH STREAMLINED INTEGRATED CONTROLS */}
      <div
        className="rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5 bg-white"
      >
        {/* Top Control Bar: Filter Mode, Search and Tools */}
        <div className="flex flex-col gap-4 pb-4 border-b border-slate-100">
          {/* Row 1: Mode Switch & View & Export tools */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {!isStudentRole ? (
                <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterMode('LECTURER')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      filterMode === 'LECTURER'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Theo Giảng viên
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('CLASS')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      filterMode === 'CLASS'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Theo Lớp sinh viên
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  Lịch học Lớp Sinh Viên
                </span>
              )}
            </div>

            {/* View Mode & Actions (Search, Matrix/List, Export, Print) */}
            <div className="flex items-center gap-2.5 flex-wrap ml-auto">
              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={filterMode === 'LECTURER' ? 'Lọc môn, lớp, phòng...' : 'Lọc môn, giáo viên, phòng...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 sm:w-48 transition"
                />
              </div>

              {/* View Switch */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('matrix')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Xem dạng lưới ma trận tuần"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lưới tuần</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Xem dạng danh sách ca học"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Danh sách</span>
                </button>
              </div>

              {/* Export & Print */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="p-2 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200/80 rounded-xl transition cursor-pointer"
                  title="Xuất file CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="p-2 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200/80 rounded-xl transition cursor-pointer"
                  title="In thời khóa biểu"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Target Entity Selector (Lecturer with gender filters / Class pills) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3 flex-wrap">
              {!isStudentRole && (
                <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterMode('LECTURER')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      filterMode === 'LECTURER'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Theo Giảng viên
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('CLASS')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      filterMode === 'CLASS'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Theo Lớp sinh viên
                  </button>
                </div>
              )}

              {filterMode === 'LECTURER' ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Gender Filter Pills */}
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setLecturerGenderFilter('ALL')}
                      className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${
                        lecturerGenderFilter === 'ALL'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tất cả ({sanitizedLecturers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLecturerGenderFilter('THAY')}
                      className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${
                        lecturerGenderFilter === 'THAY'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Thầy ({thayLecturers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLecturerGenderFilter('CO')}
                      className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${
                        lecturerGenderFilter === 'CO'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Cô ({coLecturers.length})
                    </button>
                  </div>

                  {/* Lecturer Search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm tên Thầy / Cô..."
                      value={lecturerSearchTerm}
                      onChange={(e) => setLecturerSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-36 sm:w-44"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-medium">
                  Chọn lớp học phần để xem thời khóa biểu:
                </span>
              )}
            </div>

            {/* Currently selected info tag */}
            <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <span>Đang xem:</span>
              <span className={`font-bold px-2.5 py-0.5 rounded-lg ${
                filterMode === 'LECTURER'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
              }`}>
                {filterMode === 'LECTURER' ? selectedTeacherName : `Lớp ${selectedClassName}`}
              </span>
            </div>
          </div>

          {/* Row 3: Quick Selectable Badges for Teachers or Classes */}
          {filterMode === 'LECTURER' ? (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {filteredLecturers.map((lec: string) => {
                const isSelected = lec.toLowerCase() === selectedTeacherName.toLowerCase();
                const isCo = /^cô\b/i.test(lec.trim()) || /cô/i.test(lec);
                return (
                  <button
                    key={lec}
                    type="button"
                    onClick={() => handleSelectLecturer(lec)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? isCo
                          ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600/30'
                          : 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    <UserCheck className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : isCo ? 'text-rose-500' : 'text-emerald-600'}`} />
                    <span>{lec}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set<string>(availableClasses)).map((cls: string) => {
                const isSelected = cls.toLowerCase() === selectedClassName.toLowerCase();
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => handleSelectClass(cls)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/30'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    <GraduationCap className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`} />
                    <span>Lớp {cls}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* THỐNG KÊ THEO TUẦN (WEEKLY STATISTICS FOR LECTURER) */}
        {filterMode === 'LECTURER' && weeklyStats && (
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Thống Kê Giảng Dạy Tuần Này • <span className="text-emerald-700">{selectedTeacherName}</span>
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {weekDetails?.title || selectedWeekId}
              </span>
            </div>

            {/* Quick KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                <div className="card-header px-3.5 py-2 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tổng tiết dạy</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="card-body p-3.5 flex-1 flex flex-col justify-center">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {weeklyStats.totalPeriods} <span className="text-xs font-semibold text-slate-500">tiết / tuần</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-blue-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                <div className="card-header px-3.5 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                    <span>Số ca dạy</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                </div>
                <div className="card-body p-3.5 flex-1 flex flex-col justify-center">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {weeklyStats.totalSessions} <span className="text-xs font-semibold text-slate-500">buổi</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                    ({weeklyStats.morningSessions} Sáng / {weeklyStats.afternoonSessions} Chiều)
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-indigo-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                <div className="card-header px-3.5 py-2 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Số lớp đảm nhiệm</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                </div>
                <div className="card-body p-3.5 flex-1 flex flex-col justify-center">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {weeklyStats.classesCount} <span className="text-xs font-semibold text-slate-500">lớp</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-amber-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                <div className="card-header px-3.5 py-2 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Phòng học Nhà H</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                </div>
                <div className="card-body p-3.5 flex-1 flex flex-col justify-center">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {weeklyStats.roomsCount} <span className="text-xs font-semibold text-slate-500">phòng</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Badges Row: Classes, Subjects, Rooms & Days Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 min-w-[80px]">Các lớp dạy:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {weeklyStats.classesList.map((c: string) => (
                      <span key={c} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md border border-indigo-200/60">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 min-w-[80px]">Môn phụ trách:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {weeklyStats.subjectsList.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md border border-blue-200/60">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 min-w-[80px]">Phòng giảng:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {weeklyStats.roomsList.map((r: string) => (
                      <span key={r} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded-md border border-emerald-200/60">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Day Distribution Breakdown */}
              <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 text-xs">
                <div className="font-bold text-slate-700 mb-2">Phân bố số tiết theo thứ trong tuần:</div>
                <div className="grid grid-cols-6 gap-1.5 text-center">
                  {(weeklyStats.dayStats || []).slice(0, 6).map((d: any) => {
                    const hasTeaching = d.periodsCount > 0;
                    return (
                      <div
                        key={d.dayOfWeek}
                        className={`p-1.5 rounded-lg border flex flex-col items-center justify-between ${
                          hasTeaching
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200/60 text-slate-400'
                        }`}
                      >
                        <span className="text-[10px]">{d.dayOfWeek.replace('Thứ ', 'T')}</span>
                        <span className={`text-xs mt-0.5 ${hasTeaching ? 'text-emerald-700 font-extrabold' : 'text-slate-300'}`}>
                          {d.periodsCount > 0 ? `${d.periodsCount}t` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-[15px] font-semibold">Đang tải thời khóa biểu từ cơ sở dữ liệu PDU...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Info className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-[15px] font-semibold text-slate-700">Không có lịch học trong tuần này</p>
            <p className="text-[15px] text-slate-500 mt-1">
              {filterMode === 'LECTURER'
                ? `Giảng viên ${selectedTeacherName} không có lịch giảng dạy trong ${weekDetails?.title || 'tuần này'}.`
                : `Lớp ${selectedClassName} không có ca học nào được xếp trong ${weekDetails?.title || 'tuần này'}.`}
            </p>
          </div>
        ) : viewMode === 'matrix' ? (
          /* MATRIX TIMETABLE GRID (7 DAYS x 2 SESSIONS) */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#d6dad8] text-[#111076] border-b border-[#0c2240]">
                  <th className="py-3 px-4 rounded-tl-2xl font-bold uppercase tracking-wider w-28 text-center bg-[#d6dad8] text-[#111076] border-r border-[#0c2240]">
                    Buổi / Tiết
                  </th>
                  {days.map((d, index) => {
                    const dateStr = getDateForDay(d.dayOfWeek);
                    const isLast = index === days.length - 1;
                    return (
                      <th
                        key={d.dayOfWeek}
                        className={`py-3 px-3.5 font-bold bg-[#d6dad8] text-[#111076] border-r border-[#0c2240] ${
                          isLast ? 'rounded-tr-2xl border-r-0' : ''
                        }`}
                      >
                        <div className="text-sm font-extrabold">{d.fullLabel}</div>
                        {dateStr && (
                          <div className="text-[11px] font-semibold text-[#111076]/80">
                            {dateStr}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 border-x border-b border-slate-200">
                {/* MORNING ROW */}
                <tr className="hover:bg-slate-50/40 transition">
                  <td className="py-4 px-3 bg-amber-50/80 border-r border-slate-200 align-top text-center">
                    <span className="inline-block px-2.5 py-1 bg-amber-200 text-amber-900 rounded-md font-extrabold text-[11px] uppercase tracking-wider mb-1">
                      Sáng
                    </span>
                    <div className="text-[11px] font-bold text-slate-700">Tiết 1 - 4</div>
                    <div className="text-[10px] text-slate-500">07:00 - 10:30</div>
                  </td>
                  {days.map((d) => {
                    const entry = getSessionEntry(d.dayOfWeek, 'MORNING');
                    return (
                      <td key={d.dayOfWeek} className="p-2.5 border-r border-slate-200 align-top h-32 w-1/7">
                        {entry ? (
                          <div className="h-full p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50/50 border-2 border-blue-300 hover:border-blue-500 flex flex-col justify-between shadow-sm hover:shadow-md transition-all hover:scale-[1.01] shadow-blue-900/5">
                            <div>
                              <div className="text-xs font-black text-blue-950 line-clamp-2 leading-tight">
                                {entry.subject}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-800 font-bold mt-1.5">
                                {filterMode === 'LECTURER' ? (
                                  <>
                                    <GraduationCap className="w-3 h-3 text-indigo-700 shrink-0" />
                                    <span className="truncate font-extrabold text-indigo-900">Lớp {entry.className}</span>
                                  </>
                                ) : (
                                  <>
                                    <User className="w-3 h-3 text-blue-700 shrink-0" />
                                    <span className="truncate">{entry.teacher}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 pt-1.5 border-t border-blue-200 flex items-center justify-center">
                              <span className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1 bg-blue-700 text-white rounded-lg text-[11px] font-black shadow-xs tracking-wide">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{entry.room}</span>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-300 text-xs italic">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* AFTERNOON ROW */}
                <tr className="hover:bg-slate-50/40 transition">
                  <td className="py-4 px-3 bg-indigo-50/80 border-r border-slate-200 align-top text-center">
                    <span className="inline-block px-2.5 py-1 bg-indigo-200 text-indigo-900 rounded-md font-extrabold text-[11px] uppercase tracking-wider mb-1">
                      Chiều
                    </span>
                    <div className="text-[11px] font-bold text-slate-700">Tiết 6 - 9</div>
                    <div className="text-[10px] text-slate-500">13:00 - 16:30</div>
                  </td>
                  {days.map((d) => {
                    const entry = getSessionEntry(d.dayOfWeek, 'AFTERNOON');
                    return (
                      <td key={d.dayOfWeek} className="p-2.5 border-r border-slate-200 align-top h-32 w-1/7">
                        {entry ? (
                          <div className="h-full p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border-2 border-emerald-300 hover:border-emerald-500 flex flex-col justify-between shadow-sm hover:shadow-md transition-all hover:scale-[1.01] shadow-emerald-900/5">
                            <div>
                              <div className="text-xs font-black text-emerald-950 line-clamp-2 leading-tight">
                                {entry.subject}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-800 font-bold mt-1.5">
                                {filterMode === 'LECTURER' ? (
                                  <>
                                    <GraduationCap className="w-3 h-3 text-emerald-800 shrink-0" />
                                    <span className="truncate font-extrabold text-emerald-950">Lớp {entry.className}</span>
                                  </>
                                ) : (
                                  <>
                                    <User className="w-3 h-3 text-emerald-700 shrink-0" />
                                    <span className="truncate">{entry.teacher}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 pt-1.5 border-t border-emerald-200 flex items-center justify-center">
                              <span className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-black shadow-xs tracking-wide">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{entry.room}</span>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-300 text-xs italic">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          /* CARD LIST VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/90 hover:border-blue-300 bg-white shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
              >
                {/* CARD HEADER */}
                <div
                  className={`card-header px-4 py-2.5 border-b flex items-center justify-between gap-2 ${
                    item.session === 'MORNING'
                      ? 'bg-amber-50/80 border-amber-100/90 text-amber-950'
                      : 'bg-indigo-50/80 border-indigo-100/90 text-indigo-950'
                  }`}
                >
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${
                      item.session === 'MORNING'
                        ? 'bg-amber-100 text-amber-900 border-amber-200'
                        : 'bg-indigo-100 text-indigo-900 border-indigo-200'
                    }`}
                  >
                    {item.dayOfWeek} • {item.session === 'MORNING' ? 'Ca Sáng' : 'Ca Chiều'}
                  </span>
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-slate-400" />
                    <span>{item.date}</span>
                  </span>
                </div>

                {/* CARD BODY */}
                <div className="card-body p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{item.subject}</h3>
                    <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-1.5">
                      {filterMode === 'LECTURER' ? (
                        <>
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-bold text-indigo-900">Lớp {item.className}</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-800">{item.teacher}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.time} ({item.period})</span>
                    </div>
                    <div className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 shadow-2xs">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      <span>{item.room}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SOURCE CITATION & FOOTER */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Dữ liệu được cập nhật từ <strong>Khoa Công nghệ Thông tin – Trường Đại học Phạm Văn Đồng</strong>.
            </span>
          </div>
          {selectedWeekObj?.url && (
            <a
              href={selectedWeekObj.url}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              <span>Xem bài gốc trên cntt.pdu.edu.vn</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* MODAL: THÊM TUẦN TRỰC TIẾP TỪ LINK GOOGLE SHEET (ADMIN & QUẢN LÝ) */}
      {isAddWeekModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Thêm Tuần Thời Khóa Biểu</h3>
                  <p className="text-xs text-emerald-200/80">Nhập trực tiếp từ liên kết Google Sheet</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddWeekModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleImportGoogleSheet} className="p-6 space-y-4 overflow-y-auto">
              {importError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Không thể tải dữ liệu:</strong> {importError}
                  </div>
                </div>
              )}

              {/* Google Sheet URL Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đường link Google Sheet (URL)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetUrl('https://docs.google.com/spreadsheets/d/1kCHr0jwbRtJ9oXhW9buBpRDX6XNOldvp08M5XqYpwEI/edit?usp=sharing');
                      setImportError(null);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition cursor-pointer"
                  >
                    Dùng link mẫu (Tuần mới)
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
                <p className="text-[11px] text-slate-500">
                  Hỗ trợ định dạng bảng tính Google Sheet chia sẻ công khai chứa cột Thứ, Tiết, Môn học, Giảng viên, Lớp và Phòng Nhà H.
                </p>
              </div>

              {/* Week Number and Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Số thứ tự tuần <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    required
                    value={weekNumberInput}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setWeekNumberInput(val);
                      setWeekTitleInput(`Tuần ${val < 10 ? '0' + val : val} (Đồng bộ Google Sheet)`);
                    }}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Tên hiển thị tuần
                  </label>
                  <input
                    type="text"
                    value={weekTitleInput}
                    onChange={(e) => setWeekTitleInput(e.target.value)}
                    placeholder="VD: Tuần 06 (31/08/2026 - 05/09/2026)"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Set Current Week Checkbox */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Đặt làm Tuần Hiện Tại (Active Week)</div>
                  <div className="text-[11px] text-slate-500">Mặc định hiển thị tuần này đầu tiên cho toàn bộ sinh viên và giảng viên</div>
                </div>
                <input
                  type="checkbox"
                  checked={isCurrentCheckbox}
                  onChange={(e) => setIsCurrentCheckbox(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Guide card */}
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-[11px] text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Quy trình tự động hóa:</span>
                </div>
                <p>
                  1. Hệ thống tự động trích xuất các cột Học phần, Tiết học, Giảng viên và chuẩn hóa 12 phòng tại cơ sở Nhà H (H.101 – H.304).
                </p>
                <p>
                  2. Ngay sau khi thêm, thời khóa biểu của tất cả các lớp (DCT21, DCT22, DCT23, DCT24) và tải giảng dạy của Giảng viên sẽ được cập nhật tức thì.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddWeekModalOpen(false)}
                  disabled={importLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={importLoading}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-emerald-700/20 cursor-pointer disabled:opacity-50"
                >
                  {importLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang nạp Google Sheet...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Nhập & Tạo tuần mới</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHỈNH SỬA THỜI KHÓA BIỂU TUẦN (URL, TÊN TUẦN, TUẦN HIỆN TẠI) */}
      {isEditWeekModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-800 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Chỉnh Sửa Tuần Thời Khóa Biểu</h3>
                  <p className="text-xs text-blue-200/80">Thay đổi liên kết URL, tiêu đề hoặc trạng thái tuần hiện tại</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditWeekModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveWeekEdits} className="p-6 space-y-4 overflow-y-auto">
              {editError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Lỗi:</strong> {editError}
                  </div>
                </div>
              )}

              {/* Google Sheet URL Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Đường link Google Sheet (URL)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditSheetUrl('https://docs.google.com/spreadsheets/d/1kCHr0jwbRtJ9oXhW9buBpRDX6XNOldvp08M5XqYpwEI/edit?gid=1221165864#gid=1221165864')}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 transition cursor-pointer"
                  >
                    Dán link Google Sheet PDU
                  </button>
                </div>
                <input
                  type="url"
                  value={editSheetUrl}
                  onChange={(e) => setEditSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit?gid=..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  Bạn có thể cập nhật liên kết Google Sheet mới cho tuần này. Khi lưu, dữ liệu sẽ được đọc chính xác không tự thêm họ tên giảng viên.
                </p>
              </div>

              {/* Week Number and Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Số thứ tự tuần <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    required
                    value={editWeekNumber}
                    onChange={(e) => setEditWeekNumber(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Tên hiển thị tuần <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editWeekTitle}
                    onChange={(e) => setEditWeekTitle(e.target.value)}
                    placeholder="VD: TUẦN 06 - TỪ NGÀY 31/08/2026 ĐẾN NGÀY 05/09/2026"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Set Current Week Checkbox */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>Đặt làm Tuần Hiện Tại (Active Week)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Hệ thống sẽ mặc định mở tuần này trước tiên khi sinh viên và giảng viên truy cập
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editIsCurrent}
                  onChange={(e) => setEditIsCurrent(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Re-sync Checkbox */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-700" />
                    <span>Tải & làm mới toàn bộ dữ liệu từ URL Google Sheet</span>
                  </div>
                  <div className="text-[11px] text-blue-800/80 mt-0.5">
                    Đọc lại nội dung lớp, tiết và phòng học từ liên kết bảng tính
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editReSync}
                  onChange={(e) => setEditReSync(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Danger Zone: Delete Week */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                {deleteConfirmOpen ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-700 font-bold">Xác nhận xóa tuần này?</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteWeek(editingWeekId)}
                      disabled={editLoading}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Xác nhận xóa
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(false)}
                      className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-lg text-xs transition cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa tuần này</span>
                  </button>
                )}

                {/* Modal Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditWeekModalOpen(false)}
                    disabled={editLoading}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-700/20 cursor-pointer disabled:opacity-50"
                  >
                    {editLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Lưu thay đổi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
