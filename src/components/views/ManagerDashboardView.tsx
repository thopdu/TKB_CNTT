import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Users,
  Building2,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Clock,
  GraduationCap,
  ShieldAlert,
  Lock,
  LogIn,
  Shield,
  BarChart3,
  Bell,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Sparkles,
  Info,
  X,
  MapPin,
  ExternalLink,
  Laptop,
  Presentation,
  School,
  AlertCircle,
  Table as TableIcon,
  Download,
  Printer,
  CalendarDays,
  Sun,
  Moon,
  ListFilter,
  FileSpreadsheet,
  Maximize2,
  ChevronDown,
  User,
  UserCheck,
  TrendingUp,
  Award,
  Activity,
  CheckSquare,
  Zap,
  FileText,
  PieChart,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  ScheduleConflict,
  RoomUtilizationStat,
  CohortOverviewStat,
  CohortClassTimetableSlot,
  BuildingHAllocationStat,
  BuildingHConflictEvaluation,
  BuildingHConflictItem,
} from '../../types';
import { TimetableWeekSelector } from '../TimetableWeekSelector';

export const ManagerDashboardView: React.FC = () => {
  const { currentUser, setIsLoginModalOpen, setLoginTargetRole, setActiveTab, setSelectedClass } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [roomStats, setRoomStats] = useState<RoomUtilizationStat[]>([]);
  const [cohortOverview, setCohortOverview] = useState<CohortOverviewStat[]>([]);
  const [buildingHAllocations, setBuildingHAllocations] = useState<BuildingHAllocationStat[]>([]);
  const [conflictEval, setConflictEval] = useState<BuildingHConflictEvaluation | null>(null);

  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Timetable Weeks & View Controls
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('week_05');
  const [cohortViewMode, setCohortViewMode] = useState<'matrix' | 'daily' | 'cards'>('matrix');
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON'>('ALL');
  const [cohortSearchQuery, setCohortSearchQuery] = useState<string>('');
  const [loadingCohortSchedule, setLoadingCohortSchedule] = useState<boolean>(false);

  // Executive Synthesis Tab
  const [synthesisTab, setSynthesisTab] = useState<'cohorts' | 'days' | 'rooms' | 'recommendations'>('cohorts');

  // Selected Cohort filter
  const [selectedCohort, setSelectedCohort] = useState<string>('ALL');

  // Selected Room for detail modal & view mode
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');
  const [buildingHSessionFilter, setBuildingHSessionFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON'>('ALL');
  const [buildingHViewMode, setBuildingHViewMode] = useState<'table' | 'cards'>('table');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('ALL');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [inspectedRoom, setInspectedRoom] = useState<BuildingHAllocationStat | null>(null);

  // Selected Slot for detail modal
  const [inspectedSlot, setInspectedSlot] = useState<{
    className: string;
    classCode: string;
    cohort: string;
    studentCount: number;
    slot: CohortClassTimetableSlot;
  } | null>(null);

  const isAuthorized = currentUser && (currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sum, conf, rStats, cohorts, hAlloc, hConflicts, timetableWeeks] = await Promise.all([
        api.getSummaryStats(),
        api.getConflicts(),
        api.getRoomStats(),
        api.getCohortOverview(selectedWeekId),
        api.getBuildingHAllocation(selectedWeekId),
        api.getBuildingHConflictEvaluation(selectedWeekId),
        api.getTimetableWeeks(),
      ]);

      setSummary(sum);
      if (Array.isArray(conf)) setConflicts(conf);
      if (Array.isArray(rStats)) setRoomStats(rStats);
      if (Array.isArray(cohorts)) setCohortOverview(cohorts);
      if (Array.isArray(hAlloc)) setBuildingHAllocations(hAlloc);
      if (hConflicts) setConflictEval(hConflicts);
      if (Array.isArray(timetableWeeks) && timetableWeeks.length > 0) {
        setWeeks(timetableWeeks);
        const curWeek = timetableWeeks.find((w: any) => w.current) || timetableWeeks[0];
        if (curWeek && !selectedWeekId) {
          setSelectedWeekId(curWeek.weekId);
        }
      }
    } catch (err) {
      console.error('Error loading manager dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    loadAllData();
  }, [isAuthorized]);

  const handleSelectWeek = async (weekId: string) => {
    setSelectedWeekId(weekId);
    setLoadingCohortSchedule(true);
    try {
      const [cohorts, hAlloc, hConflicts] = await Promise.all([
        api.getCohortOverview(weekId),
        api.getBuildingHAllocation(weekId),
        api.getBuildingHConflictEvaluation(weekId),
      ]);
      if (Array.isArray(cohorts)) {
        setCohortOverview(cohorts);
      }
      if (Array.isArray(hAlloc)) {
        setBuildingHAllocations(hAlloc);
      }
      if (hConflicts) {
        setConflictEval(hConflicts);
      }
    } catch (err) {
      console.error('Error loading week cohort and room overview:', err);
    } finally {
      setLoadingCohortSchedule(false);
    }
  };

  const handleSelectPreviousWeek = () => {
    if (weeks.length === 0) return;
    const curIdx = weeks.findIndex((w) => w.weekId === selectedWeekId);
    if (curIdx > 0) {
      handleSelectWeek(weeks[curIdx - 1].weekId);
    }
  };

  const handleSelectNextWeek = () => {
    if (weeks.length === 0) return;
    const curIdx = weeks.findIndex((w) => w.weekId === selectedWeekId);
    if (curIdx >= 0 && curIdx < weeks.length - 1) {
      handleSelectWeek(weeks[curIdx + 1].weekId);
    }
  };

  const handleScanBuildingH = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await api.scanBuildingHConflicts(selectedWeekId);
      if (res && res.evaluation) {
        setConflictEval(res.evaluation);
        setScanMessage(res.message || 'Đã quét và đánh giá lại trùng phòng Nhà H theo TKB thành công!');
        setTimeout(() => setScanMessage(null), 5000);
      }
    } catch (err: any) {
      setScanMessage('Lỗi khi quét xung đột: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // Auth Gatekeeper for Academic Management (MANAGER / ADMIN)
  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 max-w-xl mx-auto text-center border border-slate-200/80 shadow-lg space-y-5 my-8 sm:my-12 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-md shadow-amber-500/10">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-semibold border border-amber-200 mb-2">
            <Shield className="w-3.5 h-3.5" />
            Phân hệ Bảo mật
          </span>
          <h2 className="text-xl font-bold text-slate-900">Yêu Cầu Đăng Nhập Quản Lý Đào Tạo</h2>
          <p className="text-[15px] text-slate-600 leading-relaxed mt-2">
            Dashboard giám sát đào tạo, kiểm tra xung đột phòng học Nhà H (12 phòng), thời khóa biểu tổng thể toàn khóa và KPI đào tạo chỉ dành riêng cho Ban Chủ nhiệm Khoa và Cán bộ Quản lý Đào tạo đã xác thực.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setLoginTargetRole('MANAGER');
              setIsLoginModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-[#0C2340] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập Quản lý Đào tạo</span>
          </button>
        </div>

        <div className="text-[12px] text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
          Tài khoản mẫu: <span className="font-mono font-bold text-slate-700">manager</span> / Mật khẩu: <span className="font-mono font-bold text-slate-700">daotao123</span>
        </div>
      </div>
    );
  }

  // Days of Week definition for Master Timetable
  const DAYS_OF_WEEK = [
    { key: 'Thứ 2', label: 'Thứ Hai', short: 'T2' },
    { key: 'Thứ 3', label: 'Thứ Ba', short: 'T3' },
    { key: 'Thứ 4', label: 'Thứ Tư', short: 'T4' },
    { key: 'Thứ 5', label: 'Thứ Năm', short: 'T5' },
    { key: 'Thứ 6', label: 'Thứ Sáu', short: 'T6' },
    { key: 'Thứ 7', label: 'Thứ Bảy', short: 'T7' },
    { key: 'Chủ Nhật', label: 'Chủ Nhật', short: 'CN' },
  ];

  // Active Sessions according to filter
  const activeSessions = useMemo(() => {
    if (sessionFilter === 'MORNING') {
      return [
        {
          key: 'MORNING' as const,
          label: 'Sáng',
          periodText: 'Tiết 1 - 5 (07:00 - 11:30)',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
          headerBg: 'bg-amber-50/80 text-amber-900',
        },
      ];
    }
    if (sessionFilter === 'AFTERNOON') {
      return [
        {
          key: 'AFTERNOON' as const,
          label: 'Chiều',
          periodText: 'Tiết 6 - 10 (13:00 - 17:30)',
          badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
          headerBg: 'bg-indigo-50/80 text-indigo-900',
        },
      ];
    }
    return [
      {
        key: 'MORNING' as const,
        label: 'Sáng',
        periodText: 'Tiết 1 - 5 (07:00 - 11:30)',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
        headerBg: 'bg-amber-50/80 text-amber-900',
      },
      {
        key: 'AFTERNOON' as const,
        label: 'Chiều',
        periodText: 'Tiết 6 - 10 (13:00 - 17:30)',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        headerBg: 'bg-indigo-50/80 text-indigo-900',
      },
    ];
  }, [sessionFilter]);

  // Filtered Cohorts with search query and cohort selection
  const filteredCohorts = useMemo(() => {
    return cohortOverview
      .filter((c) => selectedCohort === 'ALL' || c.cohort === selectedCohort)
      .map((c) => {
        if (!cohortSearchQuery.trim()) return c;
        const q = cohortSearchQuery.toLowerCase().trim();
        const matchingClasses = c.classes.filter((cls) => {
          const matchName = cls.className.toLowerCase().includes(q);
          const matchCode = cls.classCode.toLowerCase().includes(q);
          const matchSubjects = cls.subjects?.some((s) => s.toLowerCase().includes(q));
          const matchTeachers = cls.teachers?.some((t) => t.toLowerCase().includes(q));
          const matchSlots = cls.scheduleSlots?.some(
            (s) =>
              s.subject.toLowerCase().includes(q) ||
              s.teacher.toLowerCase().includes(q) ||
              s.room.toLowerCase().includes(q)
          );
          return matchName || matchCode || matchSubjects || matchTeachers || matchSlots;
        });
        return {
          ...c,
          classes: matchingClasses,
        };
      })
      .filter((c) => c.classes.length > 0);
  }, [cohortOverview, selectedCohort, cohortSearchQuery]);

  // Total classes count across filtered cohorts
  const totalFilteredClassesCount = useMemo(() => {
    return filteredCohorts.reduce((acc, c) => acc + c.classes.length, 0);
  }, [filteredCohorts]);

  // Count assigned class slots per column (day + session) to dynamically collapse empty columns
  const columnSlotCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DAYS_OF_WEEK.forEach((day) => {
      activeSessions.forEach((session) => {
        const colKey = `${day.key}-${session.key}`;
        let count = 0;
        filteredCohorts.forEach((cohort) => {
          cohort.classes.forEach((cls) => {
            if (
              cls.scheduleSlots?.some(
                (s) => s.dayOfWeek === day.key && s.session === session.key
              )
            ) {
              count++;
            }
          });
        });
        counts[colKey] = count;
      });
    });
    return counts;
  }, [DAYS_OF_WEEK, activeSessions, filteredCohorts]);

  // Export CSV Handler
  const handleExportCohortCSV = () => {
    const rows: string[][] = [
      ['KHOA CNTT - TRUONG DAI HOC PHUONG DONG'],
      ['THOI KHOA BIEU TONG THE TOAN KHOA'],
      [`Tuan hoc: ${selectedWeekId}`],
      ['Khoa', 'Ma Lop', 'Ten Lop', 'So SV', 'Tong Tiet/Tuan', 'Thu', 'Ca', 'Tiet Hoc', 'Gio Hoc', 'Hoc Phan', 'Giang Vien', 'Phong Hoc'],
    ];

    filteredCohorts.forEach((c) => {
      c.classes.forEach((cls) => {
        if (cls.scheduleSlots && cls.scheduleSlots.length > 0) {
          cls.scheduleSlots.forEach((slot) => {
            rows.push([
              c.cohort,
              cls.classCode,
              cls.className,
              String(cls.studentCount),
              String(cls.periodsPerWeek),
              slot.dayOfWeek,
              slot.session === 'MORNING' ? 'Sang' : 'Chieu',
              slot.period,
              slot.time,
              slot.subject,
              slot.teacher,
              slot.room,
            ]);
          });
        } else {
          rows.push([
            c.cohort,
            cls.classCode,
            cls.className,
            String(cls.studentCount),
            String(cls.periodsPerWeek),
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
          ]);
        }
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TKB_TongThe_KhoaCNTT_${selectedWeekId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Building H Export CSV Handler
  const handleExportBuildingHCSV = () => {
    const rows: string[][] = [
      ['KHOA CNTT - TRUONG DAI HOC PHUONG DONG'],
      ['BANG PHAN BO LOP HOC TAI 12 PHONG HOC NHA H (THEO TANG)'],
      [`Tuan hoc: ${selectedWeekId}`],
      ['Tang', 'Ma Phong', 'Loai Phong', 'Suc Chua', 'Thu', 'Ca', 'Tiet Hoc', 'Gio Hoc', 'Lop Hoc', 'Hoc Phan', 'Giang Vien'],
    ];

    [1, 2, 3].forEach((fl) => {
      const flRooms = buildingHAllocations.filter((r) => r.floor === fl);
      flRooms.forEach((r) => {
        if (r.assignedClasses && r.assignedClasses.length > 0) {
          r.assignedClasses.forEach((cls) => {
            rows.push([
              `Tang ${r.floor}`,
              r.roomCode,
              r.roomType,
              String(r.capacity),
              cls.dayOfWeek,
              cls.session === 'MORNING' ? 'Sang' : 'Chieu',
              cls.period || '-',
              cls.time || '-',
              cls.className,
              cls.subject,
              cls.teacher,
            ]);
          });
        } else {
          rows.push([
            `Tang ${r.floor}`,
            r.roomCode,
            r.roomType,
            String(r.capacity),
            '-',
            '-',
            '-',
            '-',
            'Trong lich',
            '-',
            '-',
          ]);
        }
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PhanBo_NhaH_12Phong_${selectedWeekId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Normalize day helper for room schedules
  const normalizeDayHelper = (d: string) => {
    if (!d) return '';
    const lower = d.toLowerCase().trim();
    if (lower.includes('2') || lower.includes('hai')) return 'Thứ 2';
    if (lower.includes('3') || lower.includes('ba')) return 'Thứ 3';
    if (lower.includes('4') || lower.includes('tư') || lower.includes('tu')) return 'Thứ 4';
    if (lower.includes('5') || lower.includes('năm') || lower.includes('nam')) return 'Thứ 5';
    if (lower.includes('6') || lower.includes('sáu') || lower.includes('sau')) return 'Thứ 6';
    if (lower.includes('7') || lower.includes('bảy') || lower.includes('bay')) return 'Thứ 7';
    if (lower.includes('nhật') || lower.includes('nhat') || lower.includes('cn') || lower.includes('sun')) return 'Chủ Nhật';
    return d;
  };

  // Helper to match and merge schedule for a room on a given day and session
  // Rà soát và gộp các học phần giống nhau trong cùng 1 buổi
  const getRoomScheduleForDayAndSession = (
    room: BuildingHAllocationStat,
    day: string,
    session: 'MORNING' | 'AFTERNOON'
  ) => {
    if (!room.assignedClasses || room.assignedClasses.length === 0) return [];
    
    // Filter matching day and session
    const matched = room.assignedClasses.filter((item) => {
      const itemDay = normalizeDayHelper(item.dayOfWeek);
      if (itemDay !== day) return false;

      const isMorning =
        item.session === 'MORNING' ||
        (item.period && (item.period.startsWith('1') || item.period.startsWith('2') || item.period.startsWith('3') || item.period.startsWith('4') || item.period.startsWith('5'))) ||
        (item.time && (item.time.startsWith('07') || item.time.startsWith('08') || item.time.startsWith('09') || item.time.startsWith('10') || item.time.startsWith('11')));
      const itemSession = isMorning ? 'MORNING' : 'AFTERNOON';
      if (itemSession !== session) return false;

      if (roomSearchQuery.trim()) {
        const q = roomSearchQuery.toLowerCase();
        const matchQ =
          item.className.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          item.teacher.toLowerCase().includes(q) ||
          room.roomCode.toLowerCase().includes(q);
        if (!matchQ) return false;
      }

      return true;
    });

    if (matched.length <= 1) return matched;

    // Group & Merge identical subjects in the same room during this session
    const groupMap = new Map<
      string,
      {
        classNames: Set<string>;
        subject: string;
        teachers: Set<string>;
        dayOfWeek: string;
        session: 'MORNING' | 'AFTERNOON';
        periods: number[];
        rawPeriods: Set<string>;
        rawTimes: Set<string>;
      }
    >();

    matched.forEach((item) => {
      const subj = (item.subject || 'Học phần').trim();
      // Normalize subject key for grouping (case-insensitive & whitespace-normalized)
      const subjKey = subj.toLowerCase().replace(/\s+/g, ' ');

      if (!groupMap.has(subjKey)) {
        groupMap.set(subjKey, {
          classNames: new Set<string>(),
          subject: subj,
          teachers: new Set<string>(),
          dayOfWeek: item.dayOfWeek,
          session: session,
          periods: [],
          rawPeriods: new Set<string>(),
          rawTimes: new Set<string>(),
        });
      }

      const grp = groupMap.get(subjKey)!;
      if (item.className && item.className !== '-' && item.className !== '...') {
        item.className.split(/[,;\+]/).forEach((c) => {
          const trimmed = c.trim();
          if (trimmed) grp.classNames.add(trimmed);
        });
      }
      if (item.teacher && item.teacher !== '-' && item.teacher !== '...' && item.teacher !== 'Chưa phân công') {
        grp.teachers.add(item.teacher.trim());
      }
      if (item.period && item.period !== '-') {
        grp.rawPeriods.add(item.period.trim());
        const nums = item.period.match(/\d+/g);
        if (nums) {
          nums.forEach((n) => grp.periods.push(parseInt(n, 10)));
        }
      }
      if (item.time && item.time !== '-') {
        grp.rawTimes.add(item.time.trim());
      }
    });

    const mergedList: typeof room.assignedClasses = [];

    groupMap.forEach((grp) => {
      // Compute consolidated period string
      let unifiedPeriod = '';
      if (grp.periods.length > 0) {
        const minP = Math.min(...grp.periods);
        const maxP = Math.max(...grp.periods);
        unifiedPeriod = minP === maxP ? `${minP}` : `${minP} - ${maxP}`;
      } else if (grp.rawPeriods.size > 0) {
        unifiedPeriod = Array.from(grp.rawPeriods).join(', ');
      } else {
        unifiedPeriod = session === 'MORNING' ? '1 - 4' : '6 - 9';
      }

      // Compute consolidated time string
      let unifiedTime = '';
      if (grp.rawTimes.size === 1) {
        unifiedTime = Array.from(grp.rawTimes)[0];
      } else if (grp.rawTimes.size > 1) {
        const timesArr = Array.from(grp.rawTimes);
        let minStart = '';
        let maxEnd = '';
        timesArr.forEach((t) => {
          const parts = t.split('-').map((p) => p.trim());
          if (parts.length === 2) {
            if (!minStart || parts[0] < minStart) minStart = parts[0];
            if (!maxEnd || parts[1] > maxEnd) maxEnd = parts[1];
          }
        });
        if (minStart && maxEnd) {
          unifiedTime = `${minStart} - ${maxEnd}`;
        } else {
          unifiedTime = session === 'MORNING' ? '07:00 - 11:30' : '13:00 - 17:30';
        }
      } else {
        unifiedTime = session === 'MORNING' ? '07:00 - 11:30' : '13:00 - 17:30';
      }

      const unifiedClass = grp.classNames.size > 0 ? Array.from(grp.classNames).join(', ') : 'Lớp học phần';
      const unifiedTeacher = grp.teachers.size > 0 ? Array.from(grp.teachers).join(', ') : 'Chưa phân công';

      mergedList.push({
        className: unifiedClass,
        subject: grp.subject,
        teacher: unifiedTeacher,
        dayOfWeek: grp.dayOfWeek,
        time: unifiedTime,
        period: unifiedPeriod,
        session: grp.session,
      });
    });

    return mergedList;
  };

  // Filtered Building H Rooms
  const filteredRooms = buildingHAllocations.filter((r) => {
    if (selectedFloor !== 'ALL' && r.floor !== selectedFloor) return false;
    if (selectedRoomType !== 'ALL' && r.roomType !== selectedRoomType) return false;
    if (roomSearchQuery.trim()) {
      const q = roomSearchQuery.toLowerCase();
      const matchCode = r.roomCode.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchClass = (r.classNames || []).some((c) => c.toLowerCase().includes(q));
      const matchSubj = (r.subjects || []).some((s) => s.toLowerCase().includes(q));
      const matchTeacher = (r.teachers || []).some((t) => t.toLowerCase().includes(q));
      if (!matchCode && !matchDesc && !matchClass && !matchSubj && !matchTeacher) return false;
    }
    return true;
  });

  // Comprehensive Weekly Timetable Synthesis & Evaluation Computation
  const weeklySynthesis = useMemo(() => {
    const currentWeekObj = weeks.find((w) => w.weekId === selectedWeekId) ||
      weeks.find((w) => w.current) || {
        weekId: selectedWeekId,
        weekNumber: 5,
        weekTitle: `Tuần ${selectedWeekId.replace('week_', '')}`,
        dateRange: '24/08/2026 - 30/08/2026',
        current: true,
      };

    let totalClasses = 0;
    let totalPeriods = 0;
    let totalStudents = 0;
    let morningPeriods = 0;
    let afternoonPeriods = 0;
    const uniqueSubjects = new Set<string>();
    const uniqueTeachers = new Set<string>();
    const uniqueRooms = new Set<string>();
    let totalSlots = 0;
    let assignedRoomsSlots = 0;

    // Day breakdown
    const daysMap: Record<
      string,
      { periods: number; morningPeriods: number; afternoonPeriods: number; classes: Set<string>; subjects: Set<string> }
    > = {
      'Thứ 2': { periods: 0, morningPeriods: 0, afternoonPeriods: 0, classes: new Set(), subjects: new Set() },
      'Thứ 3': { periods: 0, morningPeriods: 0, afternoonPeriods: 0, classes: new Set(), subjects: new Set() },
      'Thứ 4': { periods: 0, morningPeriods: 0, afternoonPeriods: 0, classes: new Set(), subjects: new Set() },
      'Thứ 5': { periods: 0, morningPeriods: 0, afternoonPeriods: 0, classes: new Set(), subjects: new Set() },
      'Thứ 6': { periods: 0, morningPeriods: 0, afternoonPeriods: 0, classes: new Set(), subjects: new Set() },
      'Thứ 7': { periods: 0, morningPeriods: 0, afternoonPeriods: 0, classes: new Set(), subjects: new Set() },
      'Chủ Nhật': { periods: 0, morningPeriods: 0, afternoonPeriods: 0, classes: new Set(), subjects: new Set() },
    };

    cohortOverview.forEach((c) => {
      totalClasses += c.classes.length;
      totalPeriods += c.totalPeriods;
      totalStudents += c.studentsCount;
      morningPeriods += c.morningPeriods;
      afternoonPeriods += c.afternoonPeriods;

      c.classes.forEach((cls) => {
        (cls.subjects || []).forEach((s) => uniqueSubjects.add(s));
        (cls.teachers || []).forEach((t) => uniqueTeachers.add(t));
        (cls.scheduleSlots || []).forEach((slot) => {
          totalSlots++;
          if (slot.room && slot.room !== '-' && slot.room !== '...') {
            assignedRoomsSlots++;
            uniqueRooms.add(slot.room);
          }
          if (slot.teacher && slot.teacher !== '-' && slot.teacher !== 'Chưa phân công') {
            uniqueTeachers.add(slot.teacher);
          }
          if (slot.subject) {
            uniqueSubjects.add(slot.subject);
          }

          const d = slot.dayOfWeek;
          if (daysMap[d]) {
            let pCount = 3;
            if (slot.period && slot.period.includes('-')) {
              const parts = slot.period.replace(/[^0-9-]/g, '').split('-');
              if (parts.length === 2) {
                const s = parseInt(parts[0], 10);
                const e = parseInt(parts[1], 10);
                if (!isNaN(s) && !isNaN(e)) pCount = Math.max(1, e - s + 1);
              }
            }
            daysMap[d].periods += pCount;
            if (slot.session === 'MORNING') {
              daysMap[d].morningPeriods += pCount;
            } else {
              daysMap[d].afternoonPeriods += pCount;
            }
            daysMap[d].classes.add(cls.className);
            daysMap[d].subjects.add(slot.subject);
          }
        });
      });
    });

    const roomCoveragePct = totalSlots > 0 ? Math.round((assignedRoomsSlots / totalSlots) * 100) : 100;
    const morningPct = totalPeriods > 0 ? Math.round((morningPeriods / totalPeriods) * 100) : 55;
    const afternoonPct = totalPeriods > 0 ? Math.round((afternoonPeriods / totalPeriods) * 100) : 45;

    // Building H room utilization
    let bHUtilizationSum = 0;
    let bHTotalPeriods = 0;
    buildingHAllocations.forEach((r) => {
      bHUtilizationSum += r.utilizationRate;
      bHTotalPeriods += r.totalPeriods;
    });
    const avgBuildingHUtil =
      buildingHAllocations.length > 0 ? Math.round(bHUtilizationSum / buildingHAllocations.length) : 65;

    // Days list with calculations
    const DAYS_ORDER = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const maxDayPeriods = Math.max(...Object.values(daysMap).map((d) => d.periods), 1);
    const dayStatsList = DAYS_ORDER.map((dName) => {
      const dData = daysMap[dName];
      const loadPct = Math.round((dData.periods / maxDayPeriods) * 100);
      let status: 'PEAK' | 'NORMAL' | 'LIGHT' | 'OFF' = 'NORMAL';
      if (dData.periods === 0) status = 'OFF';
      else if (loadPct >= 80) status = 'PEAK';
      else if (loadPct <= 35) status = 'LIGHT';

      return {
        dayName: dName,
        label: dName,
        short: dName === 'Chủ Nhật' ? 'CN' : `T${dName.replace('Thứ ', '')}`,
        periods: dData.periods,
        morningPeriods: dData.morningPeriods,
        afternoonPeriods: dData.afternoonPeriods,
        classesCount: dData.classes.size,
        subjectsCount: dData.subjects.size,
        loadPct,
        status,
      };
    });

    const busiestDay = [...dayStatsList].sort((a, b) => b.periods - a.periods)[0];
    const activeDays = dayStatsList.filter((d) => d.periods > 0);
    const lightestDay = [...activeDays].sort((a, b) => a.periods - b.periods)[0] || dayStatsList[0];

    // Cohort breakdown
    const cohortStats = cohortOverview.map((c) => {
      const sharePct = totalPeriods > 0 ? Math.round((c.totalPeriods / totalPeriods) * 100) : 0;
      const avgPerClass = c.classes.length > 0 ? Math.round(c.totalPeriods / c.classes.length) : 0;
      let loadLevel: 'HIGH' | 'BALANCED' | 'MODERATE' = 'BALANCED';
      if (c.totalPeriods > 70) loadLevel = 'HIGH';
      else if (c.totalPeriods < 30) loadLevel = 'MODERATE';

      return {
        cohort: c.cohort,
        cohortName: c.cohortName,
        classesCount: c.classes.length,
        studentsCount: c.studentsCount,
        totalPeriods: c.totalPeriods,
        coursesCount: c.coursesCount,
        morningPeriods: c.morningPeriods,
        afternoonPeriods: c.afternoonPeriods,
        sharePct,
        avgPerClass,
        loadLevel,
      };
    });

    // Floor stats
    const floorStats = [1, 2, 3].map((fl) => {
      const flRooms = buildingHAllocations.filter((r) => r.floor === fl);
      const flPeriods = flRooms.reduce((acc, r) => acc + r.totalPeriods, 0);
      const flAvgUtil =
        flRooms.length > 0
          ? Math.round(flRooms.reduce((acc, r) => acc + r.utilizationRate, 0) / flRooms.length)
          : 0;
      const busiest = [...flRooms].sort((a, b) => b.totalPeriods - a.totalPeriods)[0];
      const available = flRooms.filter((r) => r.status === 'AVAILABLE' || r.totalPeriods < 15);

      return {
        floor: fl,
        floorLabel: `Tầng ${fl} Nhà H`,
        roomsCount: flRooms.length,
        totalPeriods: flPeriods,
        avgUtil: flAvgUtil,
        busiestRoom: busiest ? busiest.roomCode : '-',
        busiestPeriods: busiest ? busiest.totalPeriods : 0,
        availableRooms: available.map((r) => r.roomCode),
        rooms: flRooms,
      };
    });

    // Health Score Calculation
    let healthScore = 100;
    if (conflictEval) {
      healthScore -= conflictEval.conflictCount * 20;
      healthScore -= conflictEval.highLoadCount * 4;
    }
    if (roomCoveragePct < 100) {
      healthScore -= (100 - roomCoveragePct) * 2;
    }
    healthScore = Math.max(45, Math.min(100, healthScore));

    let healthStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' = 'EXCELLENT';
    let healthLabel = 'Xuất sắc • Vận hành chuẩn hóa';
    if (healthScore >= 95) {
      healthStatus = 'EXCELLENT';
      healthLabel = 'Xuất sắc • 100% Khớp phòng & Giảng viên';
    } else if (healthScore >= 85) {
      healthStatus = 'GOOD';
      healthLabel = 'Tốt • Lịch học ổn định, phân bổ đều';
    } else if (healthScore >= 70) {
      healthStatus = 'WARNING';
      healthLabel = 'Cần lưu ý • Một số phòng đạt tải tối đa';
    } else {
      healthStatus = 'CRITICAL';
      healthLabel = 'Cảnh báo • Có xung đột cần điều phối ngay';
    }

    // Automated Executive Recommendations
    const recommendations: {
      id: string;
      type: 'SUCCESS' | 'INFO' | 'WARNING' | 'SUGGESTION';
      title: string;
      desc: string;
    }[] = [];

    if (!conflictEval || conflictEval.conflictCount === 0) {
      recommendations.push({
        id: 'rec_safe',
        type: 'SUCCESS',
        title: 'Độ an toàn phòng học đạt 100%',
        desc: `Toàn bộ 12 phòng học tại Nhà H trong ${currentWeekObj.weekTitle || 'tuần này'} tuân thủ tuyệt đối quy tắc phân bổ ≤ 2 lớp/buổi, không xảy ra xung đột hay chồng chéo lịch học.`,
      });
    } else {
      recommendations.push({
        id: 'rec_conflict',
        type: 'WARNING',
        title: `Phát hiện ${conflictEval.conflictCount} xung đột trùng phòng`,
        desc: `Cần điều phối khẩn cấp các lớp học phần bị trùng lịch tại các phòng ${conflictEval.conflicts.map((c) => c.roomCode).join(', ')} sang các phòng khả dụng.`,
      });
    }

    // Find empty / low-load rooms for booking recommendation
    const lowLoadRooms = buildingHAllocations.filter((r) => r.utilizationRate < 45);
    if (lowLoadRooms.length > 0) {
      recommendations.push({
        id: 'rec_empty_rooms',
        type: 'SUGGESTION',
        title: `Khả năng tiếp nhận học bù & chuyên đề: ${lowLoadRooms.length} phòng khả dụng`,
        desc: `Các phòng ${lowLoadRooms.slice(0, 4).map((r) => r.roomCode).join(', ')} có tải sử dụng dưới 45% (nhiều ca chiều & cuối tuần còn trống), sẵn sàng tiếp nhận lịch học bù, thi bù hoặc seminar NCKH.`,
      });
    }

    // Cohort load insights
    const highestLoadCohort = [...cohortStats].sort((a, b) => b.totalPeriods - a.totalPeriods)[0];
    if (highestLoadCohort) {
      recommendations.push({
        id: 'rec_cohort_load',
        type: 'INFO',
        title: `Khóa ${highestLoadCohort.cohort} chiếm tải đào tạo lớn nhất (${highestLoadCohort.totalPeriods} tiết, ${highestLoadCohort.sharePct}% toàn khoa)`,
        desc: `Khóa ${highestLoadCohort.cohort} (${highestLoadCohort.cohortName}) có ${highestLoadCohort.classesCount} lớp với ${highestLoadCohort.studentsCount} sinh viên. Lịch học tập trung chủ yếu vào các buổi sáng tại Tầng 1 và Tầng 2 Nhà H.`,
      });
    }

    // Day distribution insight
    if (busiestDay && busiestDay.periods > 0) {
      recommendations.push({
        id: 'rec_peak_day',
        type: 'INFO',
        title: `Ngày cao điểm trong tuần: ${busiestDay.label} (${busiestDay.periods} tiết, ${busiestDay.classesCount} lớp)`,
        desc: `${busiestDay.label} là ngày có mật độ giảng dạy cao nhất tuần. Đề nghị bộ phận kỹ thuật túc trực kiểm tra thiết bị âm thanh, máy chiếu và hệ thống điện phòng học từ 06:45.`,
      });
    }

    return {
      weekObj: currentWeekObj,
      totalClasses,
      totalPeriods,
      totalStudents,
      morningPeriods,
      afternoonPeriods,
      morningPct,
      afternoonPct,
      uniqueSubjectsCount: uniqueSubjects.size,
      uniqueTeachersCount: uniqueTeachers.size,
      uniqueRoomsCount: uniqueRooms.size,
      roomCoveragePct,
      bHTotalPeriods,
      avgBuildingHUtil,
      dayStatsList,
      busiestDay,
      lightestDay,
      cohortStats,
      floorStats,
      healthScore,
      healthStatus,
      healthLabel,
      recommendations,
    };
  }, [weeks, selectedWeekId, cohortOverview, buildingHAllocations, conflictEval]);

  const handleExportWeeklySynthesisCSV = () => {
    const ws = weeklySynthesis;
    const rows: string[][] = [
      ['TRUONG DAI HOC PHUONG DONG - KHOA CONG NGHE THONG TIN'],
      ['BAO CAO TONG HOP VA DANH GIA THOI KHOA BIEU DIEU HANH DAO TAO'],
      [`Tuan hoc: ${ws.weekObj.weekTitle || selectedWeekId} (${ws.weekObj.dateRange || ''})`],
      [`Ngay xuat bao cao: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`],
      [''],
      ['1. CHI SO TONG HOP HOAT DONG DAO TAO TRONG TUAN'],
      ['Chi so', 'Gia tri', 'Don vi', 'Ghi chu'],
      ['Tong so lop hoc phan van hanh', String(ws.totalClasses), 'Lop', 'Toan bo cac khoa K21 - K24, DST'],
      ['Tong so tiet giang day trong tuan', String(ws.totalPeriods), 'Tiet', `${ws.morningPeriods} tiet Sang / ${ws.afternoonPeriods} tiet Chieu`],
      ['Tong quy mo sinh vien tac nghiep', String(ws.totalStudents), 'Sinh vien', 'Luu luong sinh vien trong tuan'],
      ['Ty le bo tri phong hoc', `${ws.roomCoveragePct}%`, 'Phan tram', 'Lop da duoc xac dinh phong'],
      ['Ty le lap day 12 phong Nha H', `${ws.avgBuildingHUtil}%`, 'Phan tram', `${ws.bHTotalPeriods} tiet tai co so Nha H`],
      ['Doi ngu giang vien len lop', String(ws.uniqueTeachersCount), 'Giang vien', 'Giang vien co lich trong tuan'],
      ['Hoc phan dang giang day', String(ws.uniqueSubjectsCount), 'Hoc phan', 'Cac mon ly thuyet & thuc hanh'],
      ['Diem danh gia suc khoe TKB', `${ws.healthScore}/100`, 'Diem', ws.healthLabel],
      [''],
      ['2. DANH GIA TAI DAO TAO THEO KHOA SINH VIEN'],
      ['Khoa', 'Ten khoa', 'So lop', 'So SV', 'Tong tiet', 'Tiet Sang', 'Tiet Chieu', 'Ty trong (%)'],
      ...ws.cohortStats.map((c) => [
        c.cohort,
        c.cohortName,
        String(c.classesCount),
        String(c.studentsCount),
        String(c.totalPeriods),
        String(c.morningPeriods),
        String(c.afternoonPeriods),
        `${c.sharePct}%`,
      ]),
      [''],
      ['3. DANH GIA MAT DO THEO THU TRONG TUAN'],
      ['Thu', 'Tong so tiet', 'Tiet Sang', 'Tiet Chieu', 'So lop co lich', 'Muc tai'],
      ...ws.dayStatsList.map((d) => [
        d.label,
        String(d.periods),
        String(d.morningPeriods),
        String(d.afternoonPeriods),
        String(d.classesCount),
        d.status === 'PEAK' ? 'Cao diem' : d.status === 'LIGHT' ? 'Thap diem' : d.status === 'OFF' ? 'Khong co lich' : 'Binh thuong',
      ]),
      [''],
      ['4. DANH GIA TAI 12 PHONG HOC NHA H THEO TANG'],
      ['Tang', 'So phong', 'Tong tiet/tuan', 'Ty le su dung trung binh (%)', 'Phong su dung nhieu nhat', 'Phong con trong'],
      ...ws.floorStats.map((f) => [
        f.floorLabel,
        String(f.roomsCount),
        String(f.totalPeriods),
        `${f.avgUtil}%`,
        `${f.busiestRoom} (${f.busiestPeriods} tiet)`,
        f.availableRooms.length > 0 ? f.availableRooms.join(', ') : 'Khong con phong trong',
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BaoCao_TongHop_DanhGia_TKB_${selectedWeekId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-center"
        style={{ backgroundColor: '#054369' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-3 border border-white/10">
              <Layers className="w-3.5 h-3.5 text-blue-300" />
              Ban Quản lý & Chủ nhiệm Khoa CNTT • PDU
            </div>
            <h1 className="text-[24px] sm:text-[28px] font-extrabold tracking-tight leading-tight">
              Dashboard Giám Sát & Điều Hành Đào Tạo
            </h1>
            <p className="text-[14px] sm:text-[15px] text-blue-100/80 mt-1 max-w-2xl">
              Thời khóa biểu toàn khóa • Phân bổ 12 phòng học Nhà H • Kiểm tra & Đánh giá trùng phòng thời gian thực
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="cursor-pointer px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-2 backdrop-blur-md border border-white/20 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-200 ${loading ? 'animate-spin' : ''}`} />
              <span>Cập nhật số liệu</span>
            </button>

            <button
              onClick={() => setActiveTab('workload')}
              className="cursor-pointer px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-2 backdrop-blur-md border border-white/20 shadow-xs"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-200" />
              <span>Thống kê giảng dạy</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className="cursor-pointer px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-2 backdrop-blur-md border border-white/20 shadow-xs"
            >
              <Bell className="w-3.5 h-3.5 text-amber-200" />
              <span>Quản lý thông báo</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards (4 Cards/row on desktop) */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-blue-200 text-xs uppercase font-bold">
                <span>Học phần đang mở</span>
                <BookOpen className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">{summary.totalCourses}</div>
              <div className="text-[11px] text-blue-200/70 mt-1">{summary.totalWeeklyPeriods} tiết giảng dạy/tuần</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-blue-200 text-xs uppercase font-bold">
                <span>Quy mô sinh viên</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">{summary.totalStudents}</div>
              <div className="text-[11px] text-blue-200/70 mt-1">{summary.totalClasses} Lớp học phần toàn khoa</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-blue-200 text-xs uppercase font-bold">
                <span>Cơ sở Nhà H</span>
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">12 Phòng</div>
              <div className="text-[11px] text-blue-200/70 mt-1">3 Tầng • Sức chứa 480 SV/ca</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-amber-200 text-xs uppercase font-bold">
                <span>Đánh giá trùng phòng</span>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
                {conflictEval ? `${conflictEval.conflictCount} Xung đột` : '0 Xung đột'}
              </div>
              <div className="text-[11px] text-amber-200/70 mt-1">
                {conflictEval?.status === 'SAFE' ? '100% Phòng an toàn' : 'Cần điều phối phòng học'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 0. TRUNG TÂM ĐIỀU HÀNH: CHỌN THỜI KHÓA BIỂU TUẦN HỌC (ĐỒNG BỘ TOÀN BỘ TRANG) */}
      {/* ========================================================================= */}
      <TimetableWeekSelector
        weeks={weeks}
        selectedWeekId={selectedWeekId}
        onSelectWeek={(id) => handleSelectWeek(id)}
        title="Chọn Thời Khóa Biểu Tuần Học"
        subtitle="Chọn tuần học tại đây để đồng bộ tức thì toàn bộ trang: Dashboard Giám sát, Đánh giá trùng phòng Nhà H, Thời khóa biểu toàn khóa & Phân bổ 12 phòng học."
        variant="white"
      />

      {/* ========================================================================= */}
      {/* 1. CARD: KIỂM TRA VÀ ĐÁNH GIÁ TRÙNG PHÒNG TẠI NHÀ H (Live Conflict Evaluator) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Kiểm Tra & Đánh Giá Trùng Phòng Học Tại Nhà H
                </h2>
                {conflictEval && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      conflictEval.status === 'SAFE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : conflictEval.status === 'WARNING'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {conflictEval.status === 'SAFE'
                      ? '✓ Hoàn toàn an toàn'
                      : conflictEval.status === 'WARNING'
                      ? '⚠ Cảnh báo tải cao'
                      : '🚨 Phát hiện xung đột'}
                  </span>
                )}
              </div>
              <p className="text-[14px] text-slate-500 mt-0.5">
                Thuật toán quét tự động phát hiện trùng phòng (Double booking), trùng lịch giảng viên và phòng quá tải tại 12 phòng Nhà H
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {/* Synchronized Week Status Badge */}
            <div className="flex items-center gap-2 bg-blue-50/80 px-3 py-2 rounded-xl border border-blue-200 shadow-2xs">
              <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-500 font-medium">TKB: </span>
                <span className="font-extrabold text-blue-950">
                  {weeklySynthesis.weekObj.weekTitle || selectedWeekId}
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ml-1">
                ✓ Đồng bộ
              </span>
            </div>

            <button
              onClick={handleScanBuildingH}
              disabled={isScanning}
              className="cursor-pointer px-4 py-2.5 bg-[#0C2340] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2"
            >
              <Sparkles className={`w-4 h-4 text-amber-300 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Đang quét toàn bộ Nhà H...' : 'Quét & Đánh giá lại Nhà H'}</span>
            </button>
          </div>
        </div>

        {scanMessage && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}

        {/* Evaluation Summary KPIs */}
        {conflictEval && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold">Phòng đã kiểm tra</div>
              <div className="text-xl font-black text-slate-800 mt-0.5">
                {conflictEval.totalRoomsChecked}/12 Phòng
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">100% Nhà H (Tầng 1-3)</div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${conflictEval.conflictCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="text-xs font-semibold text-slate-600">Số vụ trùng phòng / lịch</div>
              <div className={`text-xl font-black mt-0.5 ${conflictEval.conflictCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {conflictEval.conflictCount} Xung đột
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {conflictEval.conflictCount === 0 ? 'Không bị chồng chéo tiết' : 'Cần phân bổ lại'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="text-xs font-semibold text-amber-800">Phòng tải cao (&gt;80%)</div>
              <div className="text-xl font-black text-amber-700 mt-0.5">
                {conflictEval.highLoadCount} Phòng
              </div>
              <div className="text-[11px] text-amber-600 mt-0.5">Đề xuất giãn cách thiết bị</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="text-xs font-semibold text-blue-800">Phòng hoạt động tối ưu</div>
              <div className="text-xl font-black text-blue-700 mt-0.5">
                {conflictEval.optimalRoomsCount} Phòng
              </div>
              <div className="text-[11px] text-blue-600 mt-0.5">Phân bổ hợp lý</div>
            </div>
          </div>
        )}

        {/* Detailed Conflicts List if any */}
        {conflictEval && conflictEval.conflicts.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chi tiết các xung đột phát hiện:
            </h4>
            {conflictEval.conflicts.map((c: BuildingHConflictItem) => (
              <div
                key={c.id}
                className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-extrabold rounded-md uppercase">
                      {c.type === 'DOUBLE_BOOKING' ? 'Trùng phòng học' : 'Trùng giảng viên'}
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-900">{c.roomCode}</span>
                    <span className="text-xs text-slate-500 font-medium">• {c.dayOfWeek} ({c.period})</span>
                  </div>
                  <p className="text-[14px] text-slate-700 font-medium">{c.description}</p>

                  <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200 text-xs text-slate-700 space-y-1">
                    <div className="font-semibold text-rose-800">Đề xuất giải quyết thông minh:</div>
                    <div>{c.suggestedSolution}</div>
                    {c.suggestedRooms && c.suggestedRooms.length > 0 && (
                      <div className="text-[11px] text-slate-500 pt-1">
                        Phòng thay thế gợi ý: <span className="font-mono font-bold text-blue-700">{c.suggestedRooms.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => {
                      alert(`Đã gửi yêu cầu điều chuyển lịch phòng ${c.roomCode} sang phòng khả dụng!`);
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Điều phối ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. CARD: THỜI KHÓA BIỂU TỔNG THỂ TOÀN KHÓA (Master Cohort Timetable)       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        {/* Header & Primary Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <TableIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Thời Khóa Biểu Tổng Thể Toàn Khóa (Khoa CNTT)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black uppercase tracking-wider">
                  {totalFilteredClassesCount} Lớp học phần
                </span>
              </div>
              <p className="text-[13px] sm:text-[14px] text-slate-500 mt-1 max-w-3xl">
                Bảng ma trận thời khóa biểu từ Thứ 2 đến Chủ Nhật, phân chia theo ca Sáng (Tiết 1-5) và Chiều (Tiết 6-10) cho toàn bộ các khóa K21, K22, K23, K24 và DST.
              </p>
            </div>
          </div>

          {/* Top Actions: Synchronized Week Indicator & Export & Print */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Synchronized Week Status Badge (Synced with top master selector) */}
            <div className="flex items-center gap-2 bg-blue-50/80 px-3 py-2 rounded-xl border border-blue-200 shadow-2xs">
              <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-500 font-medium">TKB: </span>
                <span className="font-extrabold text-blue-950">
                  {weeklySynthesis.weekObj.weekTitle || selectedWeekId}
                </span>
                {weeklySynthesis.weekObj.current && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                    Hiện tại
                  </span>
                )}
              </div>
              {loadingCohortSchedule ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin ml-1" />
              ) : (
                <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ml-1">
                  ✓ Đồng bộ
                </span>
              )}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCohortCSV}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Xuất bảng thời khóa biểu ra tệp CSV / Excel"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="In bản thời khóa biểu tổng thể"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">In biểu</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar: View Mode Switcher, Cohort Tabs, Session Tabs, Quick Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-slate-50/70 p-3 sm:p-4 rounded-2xl border border-slate-200/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <button
                onClick={() => setCohortViewMode('matrix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  cohortViewMode === 'matrix'
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Bảng Ma Trận (T2 - CN)</span>
              </button>
              <button
                onClick={() => setCohortViewMode('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  cohortViewMode === 'daily'
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Lịch Theo Ngày</span>
              </button>
              <button
                onClick={() => setCohortViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  cohortViewMode === 'cards'
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Thống Kê Khóa</span>
              </button>
            </div>

            {/* Session Filter */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <button
                onClick={() => setSessionFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  sessionFilter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cả 2 Ca
              </button>
              <button
                onClick={() => setSessionFilter('MORNING')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  sessionFilter === 'MORNING'
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-600 hover:text-amber-800'
                }`}
              >
                <Sun className="w-3 h-3" />
                <span>Sáng (T1-5)</span>
              </button>
              <button
                onClick={() => setSessionFilter('AFTERNOON')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  sessionFilter === 'AFTERNOON'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:text-indigo-800'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>Chiều (T6-10)</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Cohort Tabs */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200/80 overflow-x-auto shadow-2xs">
              {['ALL', 'K21', 'K22', 'K23', 'K24', 'DST'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedCohort(tab)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCohort === tab
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'ALL' ? 'Tất cả' : tab}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm lớp, môn, GV, phòng..."
                value={cohortSearchQuery}
                onChange={(e) => setCohortSearchQuery(e.target.value)}
                className="pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 w-44 sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
              {cohortSearchQuery && (
                <button
                  onClick={() => setCohortSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW MODE 1: MASTER MATRIX TABLE (Monday -> Sunday, Morning & Afternoon)  */}
        {/* ========================================================================= */}
        {cohortViewMode === 'matrix' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs max-h-[75vh]">
              <table className="w-full text-left border-collapse min-w-[1300px] text-xs">
                {/* Table Header */}
                <thead className="sticky top-0 z-30 bg-slate-100 border-b border-slate-200 shadow-xs">
                  {/* Header Row 1: Columns for Class Info & 7 Days */}
                  <tr>
                    <th
                      rowSpan={2}
                      className="sticky left-0 z-40 bg-slate-100 py-2.5 px-2 font-bold text-slate-800 border-r border-slate-200 min-w-[105px] w-[105px] max-w-[110px] text-center align-middle shadow-r-sm"
                    >
                      <div className="flex items-center justify-center gap-1 text-slate-900 font-bold text-xs">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span>Lớp</span>
                      </div>
                    </th>

                    {/* 7 Days: Thứ 2 -> Chủ Nhật */}
                    {DAYS_OF_WEEK.map((day) => {
                      const isDayCompletelyEmpty = activeSessions.every(
                        (s) => columnSlotCounts[`${day.key}-${s.key}`] === 0
                      );

                      return (
                        <th
                          key={day.key}
                          colSpan={activeSessions.length}
                          className={`py-2 px-1 font-black text-center border-r border-slate-200 ${
                            isDayCompletelyEmpty ? 'bg-slate-100/60' : 'bg-slate-100/95 text-slate-800'
                          }`}
                        >
                          <div
                            className={`inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-lg border text-xs font-bold ${
                              isDayCompletelyEmpty
                                ? 'bg-slate-50 border-slate-200/60 text-slate-400'
                                : 'bg-white border-slate-200/80 shadow-2xs text-slate-900'
                            }`}
                          >
                            <Calendar
                              className={`w-3.5 h-3.5 ${
                                isDayCompletelyEmpty ? 'text-slate-400' : 'text-blue-600'
                              }`}
                            />
                            <span>{day.label}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>

                  {/* Header Row 2: Sub-columns for Morning and Afternoon Sessions */}
                  <tr className="border-t border-slate-200/60">
                    {DAYS_OF_WEEK.map((day) =>
                      activeSessions.map((session) => {
                        const isColEmpty = columnSlotCounts[`${day.key}-${session.key}`] === 0;

                        if (isColEmpty) {
                          return (
                            <th
                              key={`${day.key}-${session.key}`}
                              className="py-1 px-0.5 text-center border-r border-slate-200 w-[50px] min-w-[50px] max-w-[54px] bg-slate-50/70"
                              title={`${day.label} - Ca ${session.label}: Trống lịch toàn khóa`}
                            >
                              <div className="flex flex-col items-center justify-center py-0.5 text-slate-400">
                                <span className="text-[10px] font-bold">
                                  {session.key === 'MORNING' ? 'Sáng' : 'Chiều'}
                                </span>
                                <span className="text-[9px] text-slate-300 font-mono">Trống</span>
                              </div>
                            </th>
                          );
                        }

                        return (
                          <th
                            key={`${day.key}-${session.key}`}
                            className={`py-1.5 px-2 text-center text-[11px] font-bold border-r border-slate-200 min-w-[130px] max-w-[165px] ${session.headerBg}`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              {session.key === 'MORNING' ? (
                                <Sun className="w-3 h-3 text-amber-600" />
                              ) : (
                                <Moon className="w-3 h-3 text-indigo-600" />
                              )}
                              <span>{session.label}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({session.key === 'MORNING' ? '1-5' : '6-10'})
                              </span>
                            </div>
                          </th>
                        );
                      })
                    )}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredCohorts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={1 + DAYS_OF_WEEK.length * activeSessions.length}
                        className="py-16 text-center text-slate-400 bg-slate-50/50"
                      >
                        <div className="max-w-md mx-auto space-y-2">
                          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-sm font-semibold text-slate-600">
                            Không tìm thấy lớp học nào khớp với bộ lọc hiện tại.
                          </p>
                          <button
                            onClick={() => {
                              setSelectedCohort('ALL');
                              setCohortSearchQuery('');
                              setSessionFilter('ALL');
                            }}
                            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Xóa bộ lọc để xem tất cả
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCohorts.map((cohortGroup) => (
                      <React.Fragment key={cohortGroup.cohort}>
                        {/* Class Rows within this Cohort */}
                        {cohortGroup.classes.map((cls) => (
                          <tr
                            key={cls.classCode}
                            className="hover:bg-blue-50/20 transition group border-b border-slate-200"
                          >
                            {/* Sticky Column: Class Name & Code with Cohort Tag */}
                            <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/95 py-2.5 px-2 min-w-[105px] w-[105px] max-w-[110px] border-r border-slate-200 font-medium shadow-r-xs">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono font-black text-xs text-blue-950 truncate" title={cls.className}>
                                    {cls.className}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setSelectedClass(cls.className);
                                      setActiveTab('timetable');
                                    }}
                                    className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition cursor-pointer shrink-0"
                                    title={`Xem lịch riêng lớp ${cls.className}`}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex items-center justify-between gap-1 text-[9.5px]">
                                  <span className="px-1 py-0.2 bg-blue-100/90 text-blue-800 font-extrabold rounded text-[9px]">
                                    {cohortGroup.cohort}
                                  </span>
                                  <span className="text-slate-400 font-mono truncate" title={cls.classCode}>
                                    {cls.classCode}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 7 Days x Active Sessions Cells */}
                            {DAYS_OF_WEEK.map((day) =>
                              activeSessions.map((session) => {
                                const isColEmpty = columnSlotCounts[`${day.key}-${session.key}`] === 0;
                                const matchingSlot = cls.scheduleSlots?.find(
                                  (s) => s.dayOfWeek === day.key && s.session === session.key
                                );

                                if (isColEmpty) {
                                  return (
                                    <td
                                      key={`${cls.classCode}-${day.key}-${session.key}`}
                                      className="p-1 border-r border-slate-100 text-center w-[50px] min-w-[50px] max-w-[54px] bg-slate-50/40 align-middle"
                                    >
                                      <div className="h-[80px] flex items-center justify-center text-slate-200 text-xs font-light select-none">
                                        ·
                                      </div>
                                    </td>
                                  );
                                }

                                return (
                                  <td
                                    key={`${cls.classCode}-${day.key}-${session.key}`}
                                    className={`p-1.5 border-r border-slate-200 align-top min-w-[130px] max-w-[165px] ${
                                      session.key === 'MORNING' ? 'bg-amber-50/15' : 'bg-indigo-50/15'
                                    }`}
                                  >
                                    {matchingSlot ? (
                                      <div
                                        onClick={() =>
                                          setInspectedSlot({
                                            className: cls.className,
                                            classCode: cls.classCode,
                                            cohort: cohortGroup.cohort,
                                            studentCount: cls.studentCount,
                                            slot: matchingSlot,
                                          })
                                        }
                                        className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between min-h-[96px] shadow-sm hover:shadow-md hover:scale-[1.015] ${
                                          session.key === 'MORNING'
                                            ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-300 hover:border-amber-500 shadow-amber-900/5'
                                            : 'bg-gradient-to-br from-indigo-50 to-blue-50/50 border-indigo-300 hover:border-indigo-500 shadow-indigo-900/5'
                                        }`}
                                        title={`Bấm để xem chi tiết buổi học của lớp ${cls.className}`}
                                      >
                                        <div>
                                          {/* Room Badge & Period */}
                                          <div className="flex items-center justify-between gap-1 mb-1.5">
                                            <span
                                              className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-black uppercase tracking-wider shadow-xs ${
                                                matchingSlot.room.startsWith('H.') ||
                                                matchingSlot.room.startsWith('H')
                                                  ? 'bg-blue-700 text-white'
                                                  : 'bg-slate-700 text-white'
                                              }`}
                                            >
                                              {matchingSlot.room}
                                            </span>
                                            <span className={`text-[10px] font-extrabold font-mono px-1.5 py-0.2 rounded ${
                                              session.key === 'MORNING' ? 'bg-amber-200/80 text-amber-950' : 'bg-indigo-200/80 text-indigo-950'
                                            }`}>
                                              {matchingSlot.period}
                                            </span>
                                          </div>

                                          {/* Subject Title */}
                                          <div
                                            className="text-[11.5px] font-extrabold text-slate-900 leading-snug line-clamp-2"
                                            title={matchingSlot.subject}
                                          >
                                            {matchingSlot.subject}
                                          </div>
                                        </div>

                                        {/* Teacher Name & Time */}
                                        <div className="mt-2 pt-1.5 border-t border-slate-200/90 flex items-center justify-between text-[10.5px] text-slate-700">
                                          <span
                                            className="font-bold truncate max-w-[90px] text-slate-800"
                                            title={matchingSlot.teacher}
                                          >
                                            {matchingSlot.teacher}
                                          </span>
                                          <span className="text-[9.5px] font-semibold text-slate-500 shrink-0 font-mono">
                                            {matchingSlot.time ? matchingSlot.time.split('-')[0].trim() : ''}
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="h-[96px] flex items-center justify-center text-slate-300 text-xs font-light select-none hover:bg-slate-50/50 rounded-xl transition">
                                        <span>—</span>
                                      </div>
                                    )}
                                  </td>
                                );
                              })
                            )}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-bold text-slate-700">Chú giải:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                  <span>Ca Sáng (Tiết 1-5 • 07:00 - 11:30)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-300" />
                  <span>Ca Chiều (Tiết 6-10 • 13:00 - 17:30)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-blue-700 text-white font-mono text-[10px] font-bold">H.xxx</span>
                  <span>Phòng học Nhà H (12 phòng)</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                * Nhấp vào ô lịch bất kỳ để xem chi tiết giảng dạy và phòng học
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 2: DAILY ACCORDION VIEW (Monday to Sunday)                      */}
        {/* ========================================================================= */}
        {cohortViewMode === 'daily' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {DAYS_OF_WEEK.map((day) => {
                // Collect all slots for this day across filtered cohorts
                const daySlots: {
                  cohort: string;
                  className: string;
                  studentCount: number;
                  slot: CohortClassTimetableSlot;
                }[] = [];

                filteredCohorts.forEach((c) => {
                  c.classes.forEach((cls) => {
                    cls.scheduleSlots?.forEach((s) => {
                      if (s.dayOfWeek === day.key) {
                        if (
                          sessionFilter === 'ALL' ||
                          (sessionFilter === 'MORNING' && s.session === 'MORNING') ||
                          (sessionFilter === 'AFTERNOON' && s.session === 'AFTERNOON')
                        ) {
                          daySlots.push({
                            cohort: c.cohort,
                            className: cls.className,
                            studentCount: cls.studentCount,
                            slot: s,
                          });
                        }
                      }
                    });
                  });
                });

                return (
                  <div
                    key={day.key}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                            {day.short}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900">{day.label}</h4>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {daySlots.length} Lớp có lịch
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Slots List */}
                      {daySlots.length > 0 ? (
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                          {daySlots.map((item, idx) => (
                            <div
                              key={idx}
                              onClick={() =>
                                setInspectedSlot({
                                  className: item.className,
                                  classCode: item.className,
                                  cohort: item.cohort,
                                  studentCount: item.studentCount,
                                  slot: item.slot,
                                })
                              }
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition hover:shadow-sm ${
                                item.slot.session === 'MORNING'
                                  ? 'bg-amber-50/80 border-amber-200 hover:border-amber-400'
                                  : 'bg-indigo-50/80 border-indigo-200 hover:border-indigo-400'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-mono font-extrabold text-blue-900">
                                  {item.className}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-black ${
                                    item.slot.room.startsWith('H')
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-700 text-white'
                                  }`}
                                >
                                  {item.slot.room}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 line-clamp-1">
                                {item.slot.subject}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                                <span className="truncate">{item.slot.teacher}</span>
                                <span className="font-mono text-[10px]">
                                  {item.slot.session === 'MORNING' ? 'Sáng' : 'Chiều'} • {item.slot.period}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                          Không có lịch học trong ngày này
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 3: COHORT KPI SUMMARY CARDS                                     */}
        {/* ========================================================================= */}
        {cohortViewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCohorts.map((c) => {
              const morningRatio =
                c.totalPeriods > 0 ? Math.round((c.morningPeriods / c.totalPeriods) * 100) : 50;
              const afternoonRatio = 100 - morningRatio;

              return (
                <div
                  key={c.cohort}
                  className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/90 hover:shadow-md transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-black uppercase mb-1">
                        {c.cohort}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{c.cohortName}</h3>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCohort(c.cohort);
                        setCohortViewMode('matrix');
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition cursor-pointer"
                      title="Xem dạng bảng ma trận lớp này"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cohort KPIs */}
                  <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-100 text-center">
                    <div>
                      <div className="text-[11px] text-slate-400 font-semibold uppercase">Số lớp học</div>
                      <div className="text-base font-black text-slate-800 mt-0.5">{c.classesCount} Lớp</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-semibold uppercase">Học phần</div>
                      <div className="text-base font-black text-blue-700 mt-0.5">{c.coursesCount} Môn</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-semibold uppercase">Tổng tải</div>
                      <div className="text-base font-black text-indigo-700 mt-0.5">{c.totalPeriods} Tiết/t</div>
                    </div>
                  </div>

                  {/* Session Distribution Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-600 font-semibold">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Ca Sáng: {c.morningPeriods} tiết ({morningRatio}%)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        Ca Chiều: {c.afternoonPeriods} tiết ({afternoonRatio}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="bg-amber-400 h-full" style={{ width: `${morningRatio}%` }} />
                      <div className="bg-indigo-500 h-full" style={{ width: `${afternoonRatio}%` }} />
                    </div>
                  </div>

                  {/* Classes List */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Danh sách lớp thuộc khóa ({c.classes.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.classes.map((cls) => (
                        <span
                          key={cls.classCode}
                          onClick={() => {
                            setSelectedClass(cls.className);
                            setActiveTab('timetable');
                          }}
                          className="px-2.5 py-1 bg-white text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5 cursor-pointer hover:border-blue-500 hover:text-blue-700 transition"
                        >
                          <span className="font-mono font-bold text-blue-700">{cls.className}</span>
                          <span className="text-[11px] text-slate-400">({cls.periodsPerWeek} tiết)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. CARD: PHÂN BỔ LỚP HỌC TẠI 12 PHÒNG NHÀ H (Building H Room Allocation)    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Phân Bổ Lớp Học Chi Tiết Tại 12 Phòng Học Nhà H
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black uppercase tracking-wider">
                  3 Tầng • 12 Phòng học
                </span>
              </div>
              <p className="text-[13px] sm:text-[14px] text-slate-500 mt-1 max-w-3xl">
                Hiển thị mỗi tầng một bảng thời khóa biểu tuần gồm 4 phòng học • Tầng 1 (H.101 – H.104) • Tầng 2 (H.201 – H.204) • Tầng 3 (H.301 – H.304).
              </p>
            </div>
          </div>

          {/* Top Actions: Synchronized Week Indicator, Export CSV & Print */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Synchronized Week Status Badge (Synced with top master selector) */}
            <div className="flex items-center gap-2 bg-blue-50/80 px-3 py-2 rounded-xl border border-blue-200 shadow-2xs">
              <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-500 font-medium">TKB: </span>
                <span className="font-extrabold text-blue-950">
                  {weeklySynthesis.weekObj.weekTitle || selectedWeekId}
                </span>
                {weeklySynthesis.weekObj.current && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                    Hiện tại
                  </span>
                )}
              </div>
              {loadingCohortSchedule ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin ml-1" />
              ) : (
                <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ml-1">
                  ✓ Đồng bộ
                </span>
              )}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportBuildingHCSV}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Xuất bảng phân bổ 12 phòng Nhà H ra CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Xuất CSV Nhà H</span>
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="In bảng thời khóa biểu Nhà H"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">In biểu</span>
            </button>
          </div>
        </div>

        {/* Multi-Filters Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <button
                onClick={() => setBuildingHViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  buildingHViewMode === 'table'
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Bảng Từng Tầng (4 Phòng/Bảng)</span>
              </button>
              <button
                onClick={() => setBuildingHViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  buildingHViewMode === 'cards'
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Dạng Thẻ Phòng</span>
              </button>
            </div>

            {/* Session Filter */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <button
                onClick={() => setBuildingHSessionFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  buildingHSessionFilter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cả 2 Ca
              </button>
              <button
                onClick={() => setBuildingHSessionFilter('MORNING')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  buildingHSessionFilter === 'MORNING'
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-600 hover:text-amber-800'
                }`}
              >
                <Sun className="w-3 h-3" />
                <span>Sáng (T1-5)</span>
              </button>
              <button
                onClick={() => setBuildingHSessionFilter('AFTERNOON')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  buildingHSessionFilter === 'AFTERNOON'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:text-indigo-800'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>Chiều (T6-10)</span>
              </button>
            </div>

            {/* Floor Filter */}
            <div className="flex items-center gap-1 p-1 bg-white border border-slate-200/80 rounded-xl text-xs font-bold shadow-2xs">
              <button
                onClick={() => setSelectedFloor('ALL')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedFloor === 'ALL' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả 3 Tầng
              </button>
              {[1, 2, 3].map((fl) => (
                <button
                  key={fl}
                  onClick={() => setSelectedFloor(fl)}
                  className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                    selectedFloor === fl ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tầng {fl}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm phòng, lớp, môn, GV..."
              value={roomSearchQuery}
              onChange={(e) => setRoomSearchQuery(e.target.value)}
              className="pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Day-of-Week Quick Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Xem theo Thứ:
            </span>
            {[
              { key: 'ALL', label: 'Cả Tuần (T2 - CN)' },
              { key: 'Thứ 2', label: 'Thứ 2' },
              { key: 'Thứ 3', label: 'Thứ 3' },
              { key: 'Thứ 4', label: 'Thứ 4' },
              { key: 'Thứ 5', label: 'Thứ 5' },
              { key: 'Thứ 6', label: 'Thứ 6' },
              { key: 'Thứ 7', label: 'Thứ 7' },
              { key: 'Chủ Nhật', label: 'Chủ Nhật' },
            ].map((d) => (
              <button
                key={d.key}
                onClick={() => setSelectedDayFilter(d.key)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedDayFilter === d.key
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Room Type Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold">Loại phòng:</span>
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              <option value="ALL">Tất cả loại phòng</option>
              <option value="LECTURE">Phòng Lý Thuyết</option>
              <option value="LAB">Phòng Máy Tính (Lab)</option>
              <option value="SEMINAR">Phòng Seminar / Chuyên đề</option>
              <option value="MULTIPURPOSE">Phòng Đa Năng / Đồ án</option>
            </select>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW MODE 1: TABLE PER FLOOR (Mỗi Tầng Một Bảng Gồm 4 Phòng)               */}
        {/* ========================================================================= */}
        {buildingHViewMode === 'table' && (
          <div className="space-y-9">
            {([1, 2, 3] as const)
              .filter((floorNum) => selectedFloor === 'ALL' || selectedFloor === floorNum)
              .map((floorNum) => {
                const floorRooms = filteredRooms.filter((r) => r.floor === floorNum);

                const floorMeta = {
                  1: {
                    title: 'Bảng Thời Khóa Biểu Tầng 1 - Khu Giảng Đường & Lab Máy Tính',
                    desc: 'Gồm 4 phòng học: H.101 & H.102 (Lý thuyết • 40 SV) • H.103 & H.104 (Lab Máy Tính 1 & 2 • 40 Máy)',
                    badge: 'TẦNG 1',
                    badgeColor: 'bg-blue-700',
                    bgHeader: 'from-blue-600 to-blue-800',
                  },
                  2: {
                    title: 'Bảng Thời Khóa Biểu Tầng 2 - Khu Giảng Đường & Seminar Chuyên Đề',
                    desc: 'Gồm 4 phòng học: H.201 & H.202 (Lý thuyết • 40 SV) • H.203 & H.204 (Seminar & Chuyên đề CNTT • 40 SV)',
                    badge: 'TẦNG 2',
                    badgeColor: 'bg-indigo-700',
                    bgHeader: 'from-indigo-600 to-indigo-800',
                  },
                  3: {
                    title: 'Bảng Thời Khóa Biểu Tầng 3 - Khu Lab AI / IoT & Đồ Án Chuyên Ngành',
                    desc: 'Gồm 4 phòng học: H.301 & H.302 (Đa năng • 40 SV) • H.303 (Lab AI & IoT • 40 Máy) • H.304 (Đồ án • 40 SV)',
                    badge: 'TẦNG 3',
                    badgeColor: 'bg-purple-700',
                    bgHeader: 'from-purple-600 to-purple-800',
                  },
                }[floorNum];

                if (floorRooms.length === 0) {
                  return (
                    <div key={floorNum} className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                      Không có phòng nào thuộc Tầng {floorNum} phù hợp với bộ lọc hiện tại.
                    </div>
                  );
                }

                // Days to display in table
                const displayedDays =
                  selectedDayFilter === 'ALL'
                    ? DAYS_OF_WEEK
                    : DAYS_OF_WEEK.filter((d) => d.key === selectedDayFilter);

                // Total assignments count on this floor
                const totalFloorSlots = floorRooms.reduce(
                  (acc, r) => acc + (r.assignedClasses?.length || 0),
                  0
                );

                return (
                  <div key={floorNum} className="space-y-3.5">
                    {/* Floor Table Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-100 to-blue-50/60 border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-xl text-white text-xs font-black shadow-xs ${floorMeta.badgeColor}`}>
                          {floorMeta.badge}
                        </span>
                        <div>
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                            {floorMeta.title}
                          </h3>
                          <p className="text-[12px] text-slate-500 mt-0.5">{floorMeta.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-bold text-blue-900 bg-white px-3 py-1 rounded-xl border border-slate-200/90 shadow-2xs">
                          {floorRooms.length} Phòng • {totalFloorSlots} Ca học tuần
                        </span>
                      </div>
                    </div>

                    {/* Table for this Floor: 4 Rooms as columns */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
                      <table className="w-full text-left border-collapse min-w-[960px]">
                        <thead>
                          <tr className="bg-slate-100/90 text-slate-700 text-xs uppercase tracking-wider font-extrabold border-b border-slate-200">
                            <th className="py-2.5 px-2 w-[105px] min-w-[105px] max-w-[105px] text-slate-800 border-r border-slate-200 text-center bg-slate-200/60 sticky left-0 z-10">
                              Thứ / Buổi
                            </th>
                            {floorRooms.map((r) => (
                              <th
                                key={r.roomCode}
                                className="py-3 px-3.5 text-center border-r last:border-r-0 border-slate-200 min-w-[190px] w-1/4"
                              >
                                <div className="flex flex-col items-center gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-black text-base text-blue-950 bg-white px-2.5 py-0.5 rounded-lg border border-slate-300 shadow-2xs">
                                      {r.roomCode}
                                    </span>
                                    <button
                                      onClick={() => setInspectedRoom(r)}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition"
                                      title={`Xem toàn bộ chi tiết phòng ${r.roomCode}`}
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                        r.roomType === 'LAB'
                                          ? 'bg-purple-100 text-purple-800'
                                          : r.roomType === 'SEMINAR'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : r.roomType === 'MULTIPURPOSE'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {r.roomType === 'LAB' && <Laptop className="w-2.5 h-2.5" />}
                                      {r.roomType === 'LECTURE' && 'Lý thuyết'}
                                      {r.roomType === 'LAB' && 'Lab Máy tính'}
                                      {r.roomType === 'SEMINAR' && 'Seminar'}
                                      {r.roomType === 'MULTIPURPOSE' && 'Đa năng / Đồ án'}
                                    </span>
                                    <span className="text-[10.5px] font-bold text-slate-500">
                                      • {r.capacity} {r.roomType === 'LAB' ? 'Máy' : 'SV'}
                                    </span>
                                  </div>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {displayedDays.map((dayObj) => {
                            return (
                              <React.Fragment key={dayObj.key}>
                                {/* Morning Row (Ca Sáng) */}
                                {(buildingHSessionFilter === 'ALL' || buildingHSessionFilter === 'MORNING') && (
                                  <tr className="hover:bg-amber-50/20 transition group">
                                    <td className="py-2.5 px-1.5 w-[105px] min-w-[105px] max-w-[105px] bg-amber-50/60 border-r border-slate-200 font-medium text-center sticky left-0 z-10">
                                      <div className="font-extrabold text-slate-900 text-xs">{dayObj.key}</div>
                                      <div className="inline-flex items-center justify-center gap-0.5 mt-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] whitespace-nowrap">
                                        <Sun className="w-2.5 h-2.5 text-amber-600 shrink-0" /> Sáng (T1-5)
                                      </div>
                                      <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">07:00 - 11:30</div>
                                    </td>
                                    {floorRooms.map((r) => {
                                      const matchEntries = getRoomScheduleForDayAndSession(r, dayObj.key, 'MORNING');
                                      return (
                                        <td
                                          key={r.roomCode}
                                          className="py-2 px-2.5 border-r last:border-r-0 border-slate-200 align-top"
                                        >
                                          {matchEntries.length > 0 ? (
                                            <div className="space-y-2">
                                              {matchEntries.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  onClick={() => {
                                                    setSelectedClass(item.className);
                                                    setActiveTab('timetable');
                                                  }}
                                                  className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 border-2 border-amber-300 hover:border-amber-500 shadow-sm hover:shadow-md transition-all cursor-pointer shadow-amber-900/5 hover:scale-[1.01]"
                                                  title="Nhấp để chuyển sang xem lịch học chi tiết của lớp này"
                                                >
                                                  <div className="flex items-center justify-between gap-1 mb-1.5">
                                                    <span className="font-mono font-black text-blue-900 text-xs bg-white px-2 py-0.5 rounded border border-amber-300 shadow-xs">
                                                      {item.className}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-amber-950 font-extrabold bg-amber-200/80 px-1.5 py-0.2 rounded">
                                                      {item.period ? `Tiết ${item.period}` : (item.time || '')}
                                                    </span>
                                                  </div>
                                                  <div
                                                    className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2"
                                                    title={item.subject}
                                                  >
                                                    {item.subject}
                                                  </div>
                                                  <div className="text-[11px] text-slate-700 mt-2 pt-1.5 border-t border-amber-200 flex items-center justify-between">
                                                    <span
                                                      className="truncate flex items-center gap-1 font-bold text-slate-800"
                                                      title={item.teacher}
                                                    >
                                                      <User className="w-3 h-3 text-amber-700 shrink-0" />
                                                      {item.teacher}
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="h-full min-h-[64px] flex items-center justify-center text-slate-300 text-xs font-medium rounded-xl border border-dashed border-slate-200/70 bg-slate-50/40">
                                              <span className="text-[11px] text-slate-400 italic">— Trống ca sáng —</span>
                                            </div>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                )}

                                {/* Afternoon Row (Ca Chiều) */}
                                {(buildingHSessionFilter === 'ALL' || buildingHSessionFilter === 'AFTERNOON') && (
                                  <tr className="hover:bg-indigo-50/20 transition border-b-2 border-slate-200 group">
                                    <td className="py-2.5 px-1.5 w-[105px] min-w-[105px] max-w-[105px] bg-indigo-50/50 border-r border-slate-200 font-medium text-center sticky left-0 z-10">
                                      <div className="font-extrabold text-slate-900 text-xs">{dayObj.key}</div>
                                      <div className="inline-flex items-center justify-center gap-0.5 mt-0.5 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold text-[10px] whitespace-nowrap">
                                        <Moon className="w-2.5 h-2.5 text-indigo-600 shrink-0" /> Chiều (T6-10)
                                      </div>
                                      <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">13:00 - 17:30</div>
                                    </td>
                                    {floorRooms.map((r) => {
                                      const matchEntries = getRoomScheduleForDayAndSession(r, dayObj.key, 'AFTERNOON');
                                      return (
                                        <td
                                          key={r.roomCode}
                                          className="py-2 px-2.5 border-r last:border-r-0 border-slate-200 align-top"
                                        >
                                          {matchEntries.length > 0 ? (
                                            <div className="space-y-2">
                                              {matchEntries.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  onClick={() => {
                                                    setSelectedClass(item.className);
                                                    setActiveTab('timetable');
                                                  }}
                                                  className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50/50 border-2 border-indigo-300 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer shadow-indigo-900/5 hover:scale-[1.01]"
                                                  title="Nhấp để chuyển sang xem lịch học chi tiết của lớp này"
                                                >
                                                  <div className="flex items-center justify-between gap-1 mb-1.5">
                                                    <span className="font-mono font-black text-blue-900 text-xs bg-white px-2 py-0.5 rounded border border-indigo-300 shadow-xs">
                                                      {item.className}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-indigo-950 font-extrabold bg-indigo-200/80 px-1.5 py-0.2 rounded">
                                                      {item.period ? `Tiết ${item.period}` : (item.time || '')}
                                                    </span>
                                                  </div>
                                                  <div
                                                    className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2"
                                                    title={item.subject}
                                                  >
                                                    {item.subject}
                                                  </div>
                                                  <div className="text-[11px] text-slate-700 mt-2 pt-1.5 border-t border-indigo-200 flex items-center justify-between">
                                                    <span
                                                      className="truncate flex items-center gap-1 font-bold text-slate-800"
                                                      title={item.teacher}
                                                    >
                                                      <User className="w-3 h-3 text-indigo-700 shrink-0" />
                                                      {item.teacher}
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="h-full min-h-[64px] flex items-center justify-center text-slate-300 text-xs font-medium rounded-xl border border-dashed border-slate-200/70 bg-slate-50/40">
                                              <span className="text-[11px] text-slate-400 italic">— Trống ca chiều —</span>
                                            </div>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 2: CARD GRID DISPLAY                                            */}
        {/* ========================================================================= */}
        {buildingHViewMode === 'cards' && (
          <div className="space-y-8">
            {([1, 2, 3] as const)
              .filter((floorNum) => selectedFloor === 'ALL' || selectedFloor === floorNum)
              .map((floorNum) => {
                const floorRooms = filteredRooms.filter((r) => r.floor === floorNum);

                const floorMeta = {
                  1: {
                    title: 'Tầng 1 - Khu Giảng Đường & Lab Thực Hành Máy Tính',
                    desc: 'Phòng H.101 & H.102 (Lý thuyết) • Phòng H.103 & H.104 (Lab Máy Tính 1 & 2)',
                    badge: 'TẦNG 1',
                    bgHeader: 'from-blue-600 to-blue-800',
                  },
                  2: {
                    title: 'Tầng 2 - Khu Giảng Đường & Phòng Seminar Chuyên Đề',
                    desc: 'Phòng H.201 & H.202 (Lý thuyết) • Phòng H.203 & H.204 (Seminar & Chuyên đề CNTT)',
                    badge: 'TẦNG 2',
                    bgHeader: 'from-indigo-600 to-indigo-800',
                  },
                  3: {
                    title: 'Tầng 3 - Khu Phòng Lab AI / IoT & Phòng Đa Năng / Đồ Án',
                    desc: 'Phòng H.301 & H.302 (Đa năng) • Phòng H.303 (Lab AI & IoT) • Phòng H.304 (Đồ án)',
                    badge: 'TẦNG 3',
                    bgHeader: 'from-purple-600 to-purple-800',
                  },
                }[floorNum];

                if (floorRooms.length === 0) return null;

                return (
                  <div key={floorNum} className="space-y-4">
                    {/* Floor Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-slate-100 to-blue-50/50 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-xl text-white text-xs font-black shadow-xs bg-gradient-to-r ${floorMeta.bgHeader}`}>
                          {floorMeta.badge}
                        </span>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">{floorMeta.title}</h3>
                          <p className="text-[12px] text-slate-500">{floorMeta.desc}</p>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200/80 self-start sm:self-auto">
                        {floorRooms.length} Phòng học
                      </div>
                    </div>

                    {/* 4 Rooms Grid for this Floor */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {floorRooms.map((r) => {
                        const isLab = r.roomType === 'LAB';

                        const roomClasses = (r.assignedClasses || []).filter((item) => {
                          if (selectedDayFilter === 'ALL') return true;
                          return normalizeDayHelper(item.dayOfWeek) === selectedDayFilter;
                        });

                        return (
                          <div
                            key={r.roomCode}
                            className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                          >
                            <div>
                              {/* Room Header */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-lg text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                    {r.roomCode}
                                  </span>
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                                    Tầng {r.floor}
                                  </span>
                                </div>

                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                    isLab
                                      ? 'bg-purple-100 text-purple-800'
                                      : r.roomType === 'SEMINAR'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : r.roomType === 'MULTIPURPOSE'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {isLab && <Laptop className="w-3 h-3" />}
                                  {r.roomType === 'LECTURE' && 'Lý thuyết'}
                                  {r.roomType === 'LAB' && 'Thực hành Máy'}
                                  {r.roomType === 'SEMINAR' && 'Seminar'}
                                  {r.roomType === 'MULTIPURPOSE' && 'Đa năng'}
                                </span>
                              </div>

                              <p className="text-[12px] text-slate-500 mt-1 line-clamp-1">{r.description}</p>

                              {/* Direct Schedule inside Room Card */}
                              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                    Lịch học {selectedDayFilter === 'ALL' ? 'trong tuần' : selectedDayFilter}:
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-mono font-black text-[10px]">
                                    {roomClasses.length} Ca
                                  </span>
                                </div>

                                {roomClasses.length > 0 ? (
                                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {roomClasses.map((item, sIdx) => {
                                      const isMorning = item.session === 'MORNING' || (item.period && item.period.startsWith('1'));
                                      return (
                                        <div
                                          key={sIdx}
                                          onClick={() => {
                                            setSelectedClass(item.className);
                                            setActiveTab('timetable');
                                          }}
                                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition hover:shadow-xs ${
                                            isMorning
                                              ? 'bg-amber-50/80 border-amber-200 hover:border-amber-400'
                                              : 'bg-indigo-50/80 border-indigo-200 hover:border-indigo-400'
                                          }`}
                                          title="Nhấp để chuyển sang xem lịch học chi tiết của lớp này"
                                        >
                                          <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="font-mono font-extrabold text-blue-900 text-[11px]">
                                              {item.className}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-600 font-semibold">
                                              {item.dayOfWeek} • {isMorning ? 'Sáng' : 'Chiều'}
                                            </span>
                                          </div>
                                          <div className="font-bold text-slate-900 line-clamp-1 text-xs">
                                            {item.subject}
                                          </div>
                                          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between gap-2">
                                            <span className="truncate flex items-center gap-1">
                                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                                              {item.teacher}
                                            </span>
                                            <span className="font-mono text-[10px] text-slate-500 shrink-0">
                                              {item.time || (item.period ? `Tiết ${item.period}` : '')}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="py-6 px-3 text-center bg-slate-50/80 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1 opacity-70" />
                                    Trống lịch {selectedDayFilter === 'ALL' ? 'cả tuần' : selectedDayFilter}
                                    <div className="text-[10px] text-slate-400 mt-0.5">Sẵn sàng bố trí lớp học mới</div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quick Inspect Button */}
                            <button
                              onClick={() => setInspectedRoom(r)}
                              className="w-full py-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem chi tiết lịch phòng {r.roomCode}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ROOM SCHEDULE DETAIL MODAL                                                */}
      {/* ========================================================================= */}
      {inspectedRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-2xl text-blue-950">
                    Phòng {inspectedRoom.roomCode}
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg">
                    Tầng {inspectedRoom.floor} Nhà H
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{inspectedRoom.description}</p>
              </div>

              <button
                onClick={() => setInspectedRoom(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
              <div>
                <div className="text-xs text-slate-400 font-semibold">Sức chứa</div>
                <div className="text-base font-black text-blue-900 mt-0.5">{inspectedRoom.capacity} Sinh viên</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold">Số lớp phân bổ</div>
                <div className="text-base font-black text-blue-900 mt-0.5">{inspectedRoom.assignedClasses?.length || 0} Ca học</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold">Số học phần</div>
                <div className="text-base font-black text-blue-900 mt-0.5">{inspectedRoom.subjects?.length || 0} Môn</div>
              </div>
            </div>

            {/* Detailed Timetable Table for this Room */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Lịch phân bổ các buổi học trong tuần:
              </h4>

              {inspectedRoom.assignedClasses && inspectedRoom.assignedClasses.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Thứ & Ca</th>
                        <th className="py-2.5 px-3">Thời gian (Tiết)</th>
                        <th className="py-2.5 px-3">Lớp học</th>
                        <th className="py-2.5 px-3">Học phần</th>
                        <th className="py-2.5 px-3">Giảng viên</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspectedRoom.assignedClasses.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/40 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[11px] font-bold">
                              {item.dayOfWeek} • {item.session === 'MORNING' ? 'Sáng' : 'Chiều'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                            Tiết {item.period} ({item.time})
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                            {item.className}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {item.subject}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                            {item.teacher}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs font-semibold">
                  Phòng đang trống trong tuần này, sẵn sàng tiếp nhận điều phối lớp học mới.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedRoom(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHI TIẾT TIẾT HỌC THỜI KHÓA BIỂU (Inspected Slot Modal)            */}
      {/* ========================================================================= */}
      {inspectedSlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    inspectedSlot.slot.session === 'MORNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {inspectedSlot.slot.session === 'MORNING' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-black uppercase">
                      Khóa {inspectedSlot.cohort}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {inspectedSlot.slot.dayOfWeek} • {inspectedSlot.slot.session === 'MORNING' ? 'Ca Sáng' : 'Ca Chiều'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {inspectedSlot.slot.subject}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setInspectedSlot(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Session Info Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Lớp học phần</div>
                <div className="text-sm font-black font-mono text-blue-900 mt-0.5">
                  {inspectedSlot.className}
                </div>
                <div className="text-[11px] text-slate-500">Sĩ số: {inspectedSlot.studentCount} sinh viên</div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Phòng học</div>
                <div className="text-sm font-black font-mono text-indigo-900 mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>{inspectedSlot.slot.room}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {inspectedSlot.slot.room.startsWith('H') ? 'Nhà H (Khu phòng máy & lý thuyết)' : 'Khu giảng đường chính'}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Giảng viên phụ trách</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{inspectedSlot.slot.teacher}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Thời gian học</div>
                <div className="text-xs font-bold font-mono text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tiết {inspectedSlot.slot.period} ({inspectedSlot.slot.time})</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setSelectedClass(inspectedSlot.className);
                  setActiveTab('timetable');
                  setInspectedSlot(null);
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/20"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Xem TKB riêng lớp {inspectedSlot.className}</span>
              </button>

              <button
                onClick={() => setInspectedSlot(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
