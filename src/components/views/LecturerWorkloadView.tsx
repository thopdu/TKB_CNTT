import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  User as UserIcon,
  GraduationCap,
  Clock,
  BookOpen,
  Award,
  Download,
  Filter,
  CheckCircle2,
  TrendingUp,
  Calendar,
  CalendarDays,
  Search,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Sparkles,
  Info,
  Layers,
  Building2,
  Mail,
  Phone,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  Lock,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  UserCheck,
  UserPlus,
  Link2,
  Unlink,
  Key,
  Copy,
  LogIn,
  UserCog,
  Settings2,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { WorkloadStat, WorkloadSession, Lecturer, Department, User as UserType } from '../../types';
import { DepartmentManagementModal } from '../DepartmentManagementModal';
import { TimetableWeekSelector } from '../TimetableWeekSelector';

// Standard PDU Departments & Academic Units
const STANDARD_DEPARTMENTS = [
  'Khoa học máy tính',
  'Hệ thống thông tin',
  'Phương pháp tin',
  'Các thầy ngoài khoa',
];

export const LecturerWorkloadView: React.FC = () => {
  const { currentRole, currentUser, switchUser, setIsLoginModalOpen, setLoginTargetRole, selectedLecturerId, setSelectedLecturerId } = useAuth();

  // Role permissions check: Chức năng lưu & chỉnh sửa thông tin giảng viên chỉ được thực hiện với vai trò Quản lý Đào tạo (MANAGER) hoặc Admin (ADMIN)
  const canManageLecturers =
    currentRole === 'MANAGER' ||
    currentRole === 'ADMIN' ||
    currentUser?.role === 'MANAGER' ||
    currentUser?.role === 'ADMIN';
  
  // Tab: Workload Stats by Week vs Lecturer Management
  const [activeTab, setActiveTab] = useState<'WORKLOAD' | 'LECTURERS'>('WORKLOAD');

  // Timetable weeks & selection
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('week_05');
  
  // Data
  const [workloads, setWorkloads] = useState<WorkloadStat[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'THAY' | 'CO'>('ALL');
  const [accountFilter, setAccountFilter] = useState<'ALL' | 'HAS_ACCOUNT' | 'NO_ACCOUNT'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'PERIODS_DESC' | 'NAME_ASC' | 'COURSES_DESC' | 'CLASSES_DESC'>('PERIODS_DESC');

  // Department Management state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);

  // Modal / Drawer for detailed session schedule of a lecturer
  const [selectedLecturerDetail, setSelectedLecturerDetail] = useState<WorkloadStat | null>(null);

  // Lecturer Management CRUD states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null);
  const [deletingLecturer, setDeletingLecturer] = useState<Lecturer | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Account Management Modal states (Tạo / Liên kết / Quản lý tài khoản Giảng viên)
  const [managingAccountLecturer, setManagingAccountLecturer] = useState<Lecturer | null>(null);
  const [accountModalTab, setAccountModalTab] = useState<'CREATE' | 'LINK'>('CREATE');
  const [accFormData, setAccFormData] = useState({
    username: '',
    password: 'pdu@123456',
    email: '',
    phone: '',
    role: 'LECTURER' as 'LECTURER' | 'MANAGER',
  });
  const [selectedLinkUserId, setSelectedLinkUserId] = useState<string>('');
  const [accountActionLoading, setAccountActionLoading] = useState<boolean>(false);
  const [accountActionMsg, setAccountActionMsg] = useState<string | null>(null);

  // Form states for Add/Edit Lecturer
  const [formData, setFormData] = useState({
    fullName: '',
    lecturerCode: '',
    department: 'Khoa học máy tính',
    degree: '',
    email: '',
    phone: '0255.3822295',
    active: true,
    createAccount: false,
    username: '',
    password: 'pdu@123456',
  });

  // Load weeks and initial data
  useEffect(() => {
    api.getTimetableWeeks().then((weeksList) => {
      if (Array.isArray(weeksList) && weeksList.length > 0) {
        setWeeks(weeksList);
        const currentWk = weeksList.find((w) => w.current) || weeksList[0];
        if (currentWk) {
          setSelectedWeekId(currentWk.weekId);
        }
      }
    });
  }, []);

  // Fetch workload stats & departments whenever selectedWeekId changes
  const fetchStats = async () => {
    setLoading(true);
    try {
      const [stats, lecs, depts] = await Promise.all([
        api.getWorkloadStats(selectedWeekId),
        api.getLecturers(),
        api.getDepartments(),
      ]);
      if (Array.isArray(stats)) setWorkloads(stats);
      if (Array.isArray(lecs)) setLecturers(lecs);
      if (Array.isArray(depts)) setDepartments(depts);
    } catch (err) {
      console.error('Error fetching workload stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedWeekId]);

  // Selected week object
  const currentWeekObj = useMemo(() => {
    if (selectedWeekId === 'ALL') {
      return {
        weekId: 'ALL',
        weekNumber: 0,
        title: 'Cả học kỳ 2 (Tất cả các tuần)',
        dateRangeText: 'Học kỳ 2 Năm học 2025 - 2026',
        current: false,
      };
    }
    return weeks.find((w) => w.weekId === selectedWeekId) || weeks[0] || null;
  }, [weeks, selectedWeekId]);

  // List of all unique departments from standard list, database departments, lecturers, and workloads
  const allAvailableDepartments = useMemo(() => {
    const deptSet = new Set<string>();
    // From database departments
    departments.forEach((d) => {
      if (d.name && d.name.trim()) deptSet.add(d.name.trim());
    });
    // From standard fallback
    STANDARD_DEPARTMENTS.forEach((s) => deptSet.add(s));
    // From lecturers
    lecturers.forEach((l) => {
      if (l.department && l.department.trim()) deptSet.add(l.department.trim());
    });
    // From workloads
    workloads.forEach((w) => {
      if (w.department && w.department.trim()) deptSet.add(w.department.trim());
    });
    return Array.from(deptSet).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [departments, lecturers, workloads]);

  // Filtered and sorted workloads
  const filteredWorkloads = useMemo(() => {
    let list = workloads.filter((w) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        w.lecturerName.toLowerCase().includes(term) ||
        (w.lecturerCode && w.lecturerCode.toLowerCase().includes(term)) ||
        (w.department && w.department.toLowerCase().includes(term)) ||
        (w.subjectsList && w.subjectsList.some((s) => s.toLowerCase().includes(term))) ||
        (w.classesList && w.classesList.some((c) => c.toLowerCase().includes(term)));

      const isThay = w.lecturerName.toLowerCase().startsWith('thầy');
      const isCo = w.lecturerName.toLowerCase().startsWith('cô');
      const matchGender =
        genderFilter === 'ALL' ||
        (genderFilter === 'THAY' && isThay) ||
        (genderFilter === 'CO' && isCo);

      const matchDept =
        departmentFilter === 'ALL' ||
        (w.department && w.department.toLowerCase().includes(departmentFilter.toLowerCase()));

      return matchSearch && matchGender && matchDept;
    });

    list.sort((a, b) => {
      if (sortBy === 'PERIODS_DESC') return b.totalPeriods - a.totalPeriods;
      if (sortBy === 'NAME_ASC') return a.lecturerName.localeCompare(b.lecturerName, 'vi');
      if (sortBy === 'COURSES_DESC') return b.coursesCount - a.coursesCount;
      if (sortBy === 'CLASSES_DESC') return b.classesCount - a.classesCount;
      return 0;
    });

    return list;
  }, [workloads, searchTerm, genderFilter, departmentFilter, sortBy]);

  // Active filter state helpers
  const hasActiveWorkloadFilters =
    searchTerm.trim() !== '' ||
    genderFilter !== 'ALL' ||
    departmentFilter !== 'ALL' ||
    sortBy !== 'PERIODS_DESC';

  const handleResetWorkloadFilters = () => {
    setSearchTerm('');
    setGenderFilter('ALL');
    setDepartmentFilter('ALL');
    setSortBy('PERIODS_DESC');
  };

  const hasActiveLecturerFilters =
    searchTerm.trim() !== '' ||
    genderFilter !== 'ALL' ||
    accountFilter !== 'ALL' ||
    departmentFilter !== 'ALL';

  const handleResetLecturerFilters = () => {
    setSearchTerm('');
    setGenderFilter('ALL');
    setAccountFilter('ALL');
    setDepartmentFilter('ALL');
  };

  // Filtered lecturers for Tab 2
  const filteredLecturers = useMemo(() => {
    return lecturers.filter((l) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        l.fullName.toLowerCase().includes(term) ||
        (l.department && l.department.toLowerCase().includes(term)) ||
        (l.email && l.email.toLowerCase().includes(term)) ||
        (l.username && l.username.toLowerCase().includes(term));

      const matchGender =
        genderFilter === 'ALL' ||
        (genderFilter === 'THAY' && l.fullName.toLowerCase().startsWith('thầy')) ||
        (genderFilter === 'CO' && l.fullName.toLowerCase().startsWith('cô'));

      const matchAccount =
        accountFilter === 'ALL' ||
        (accountFilter === 'HAS_ACCOUNT' && l.hasAccount) ||
        (accountFilter === 'NO_ACCOUNT' && !l.hasAccount);

      const matchDept =
        departmentFilter === 'ALL' || (l.department && l.department.includes(departmentFilter));

      return matchSearch && matchGender && matchAccount && matchDept;
    });
  }, [lecturers, searchTerm, genderFilter, accountFilter, departmentFilter]);

  // KPIs calculation for the selected week
  const weekKpis = useMemo(() => {
    const totalPeriods = workloads.reduce((acc, curr) => acc + curr.totalPeriods, 0);
    const theoryPeriods = workloads.reduce((acc, curr) => acc + curr.theoryPeriods, 0);
    const practicePeriods = workloads.reduce((acc, curr) => acc + curr.practicePeriods, 0);
    const totalLecturers = workloads.length;
    const allSubjects = new Set<string>();
    const allClasses = new Set<string>();
    workloads.forEach((w) => {
      (w.subjectsList || []).forEach((s) => allSubjects.add(s));
      (w.classesList || []).forEach((c) => allClasses.add(c));
    });

    return {
      totalPeriods,
      theoryPeriods,
      practicePeriods,
      totalLecturers,
      totalSubjects: allSubjects.size,
      totalClasses: allClasses.size,
    };
  }, [workloads]);

  // Handle lecturer save (Create or Update)
  const handleSaveLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    // Validate permission
    if (!canManageLecturers) {
      setActionErrorMsg('Quyền bị từ chối: Chức năng lưu & chỉnh sửa thông tin giảng viên chỉ được thực hiện với vai trò Quản lý Đào tạo hoặc Admin.');
      return;
    }

    if (!formData.fullName.trim()) {
      setActionErrorMsg('Vui lòng nhập họ và tên giảng viên');
      return;
    }

    try {
      if (editingLecturer) {
        // Update
        const updated = await api.updateLecturer(editingLecturer.id, formData);
        setActionSuccessMsg(`Cập nhật thành công thông tin giảng viên: ${updated.fullName}`);
        setEditingLecturer(null);
      } else {
        // Create
        const created = await api.createLecturer(formData);
        setActionSuccessMsg(`Thêm mới thành công giảng viên: ${created.fullName}`);
        setIsAddModalOpen(false);
      }
      // Refresh
      await fetchStats();
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Lỗi khi lưu thông tin giảng viên');
    }
  };

  // Handle lecturer delete
  const handleDeleteLecturer = async () => {
    if (!canManageLecturers) {
      setActionErrorMsg('Quyền bị từ chối: Chức năng xóa giảng viên chỉ được thực hiện với vai trò Quản lý Đào tạo hoặc Admin.');
      return;
    }

    if (!deletingLecturer) return;
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      await api.deleteLecturer(deletingLecturer.id);
      setActionSuccessMsg(`Đã xóa giảng viên ${deletingLecturer.fullName} thành công`);
      setDeletingLecturer(null);
      await fetchStats();
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Lỗi khi xóa giảng viên');
    }
  };

  const openEditModal = (lec: Lecturer) => {
    if (!canManageLecturers) {
      setActionErrorMsg('Chức năng chỉnh sửa thông tin giảng viên chỉ dành cho Quản lý Đào tạo hoặc Admin. Vui lòng đăng nhập với vai trò phù hợp.');
      setLoginTargetRole('MANAGER');
      setIsLoginModalOpen(true);
      return;
    }

    setEditingLecturer(lec);
    setFormData({
      fullName: lec.fullName,
      lecturerCode: lec.lecturerCode,
      department: lec.department || 'Khoa học máy tính',
      degree: '',
      email: lec.email || '',
      phone: lec.phone || '0255.3822295',
      active: lec.active !== undefined ? lec.active : true,
    });
  };

  const openAddModal = () => {
    if (!canManageLecturers) {
      setActionErrorMsg('Chức năng thêm giảng viên mới chỉ dành cho Quản lý Đào tạo hoặc Admin. Vui lòng đăng nhập với vai trò phù hợp.');
      setLoginTargetRole('MANAGER');
      setIsLoginModalOpen(true);
      return;
    }

    setEditingLecturer(null);
    setFormData({
      fullName: '',
      lecturerCode: `GV${(lecturers.length + 1).toString().padStart(3, '0')}`,
      department: 'Khoa học máy tính',
      degree: '',
      email: '',
      phone: '0255.3822295',
      active: true,
      createAccount: false,
      username: '',
      password: 'pdu@123456',
    });
    setIsAddModalOpen(true);
  };

  // Open Account Management Modal for a Lecturer
  const openAccountModal = async (lec: Lecturer) => {
    if (!canManageLecturers) {
      setActionErrorMsg('Chức năng quản lý và liên kết tài khoản chỉ dành cho Quản lý Đào tạo hoặc Admin.');
      setLoginTargetRole('MANAGER');
      setIsLoginModalOpen(true);
      return;
    }

    setManagingAccountLecturer(lec);
    setAccountActionMsg(null);
    setSelectedLinkUserId('');

    const cleanName = lec.fullName.replace(/^(Thầy|Cô)\s+/i, '');
    const cleanAscii = cleanName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');

    setAccFormData({
      username: `gv_${cleanAscii}`,
      password: 'pdu@123456',
      email: lec.email || `${cleanAscii}@pdu.edu.vn`,
      phone: lec.phone || '0255.3822295',
      role: 'LECTURER',
    });

    setAccountModalTab(lec.hasAccount ? 'CREATE' : 'CREATE');

    // Refresh users list
    try {
      const users = await api.getUsers();
      setUsersList(users);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  // Create & Link new Account for Lecturer
  const handleCreateAccountForLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingAccountLecturer) return;

    try {
      setAccountActionLoading(true);
      setAccountActionMsg(null);

      const res = await api.createLecturerAccount(managingAccountLecturer.id, accFormData);
      setActionSuccessMsg(`Đã tạo và liên kết thành công tài khoản @${res.user.username} cho ${managingAccountLecturer.fullName}`);
      
      // Update local lecturer state
      setLecturers((prev) =>
        prev.map((l) => (l.id === managingAccountLecturer.id ? res.lecturer : l))
      );
      setManagingAccountLecturer(res.lecturer);
      setAccountActionMsg(`Tạo tài khoản thành công! Tên đăng nhập: @${res.user.username} | Mật khẩu: ${res.password || 'pdu@123456'}`);
      
      await fetchStats();
    } catch (err: any) {
      setAccountActionMsg(`Lỗi: ${err.message}`);
    } finally {
      setAccountActionLoading(false);
    }
  };

  // Link existing User Account to Lecturer
  const handleLinkAccountToLecturer = async () => {
    if (!managingAccountLecturer || !selectedLinkUserId) return;

    try {
      setAccountActionLoading(true);
      setAccountActionMsg(null);

      const res = await api.linkLecturerAccount(managingAccountLecturer.id, selectedLinkUserId);
      setActionSuccessMsg(`Đã liên kết tài khoản @${res.user.username} với ${managingAccountLecturer.fullName}`);
      
      setLecturers((prev) =>
        prev.map((l) => (l.id === managingAccountLecturer.id ? res.lecturer : l))
      );
      setManagingAccountLecturer(res.lecturer);
      setAccountActionMsg(`Liên kết thành công với tài khoản @${res.user.username}`);
      
      await fetchStats();
    } catch (err: any) {
      setAccountActionMsg(`Lỗi: ${err.message}`);
    } finally {
      setAccountActionLoading(false);
    }
  };

  // Unlink Account from Lecturer
  const handleUnlinkAccountFromLecturer = async () => {
    if (!managingAccountLecturer) return;

    try {
      setAccountActionLoading(true);
      setAccountActionMsg(null);

      const res = await api.unlinkLecturerAccount(managingAccountLecturer.id);
      setActionSuccessMsg(`Đã hủy liên kết tài khoản cho Thầy/Cô ${managingAccountLecturer.fullName}`);
      
      setLecturers((prev) =>
        prev.map((l) => (l.id === managingAccountLecturer.id ? res.lecturer : l))
      );
      setManagingAccountLecturer(res.lecturer);
      setAccountActionMsg('Đã hủy liên kết tài khoản.');
      
      await fetchStats();
    } catch (err: any) {
      setAccountActionMsg(`Lỗi: ${err.message}`);
    } finally {
      setAccountActionLoading(false);
    }
  };

  // Quick switch into Lecturer user account
  const handleQuickLoginAsLecturer = (lec: Lecturer) => {
    if (lec.userId) {
      const targetUser = usersList.find((u) => u.id === lec.userId) || {
        id: lec.userId,
        username: lec.username || 'gv_tho',
        fullName: lec.fullName,
        email: lec.email,
        role: (lec.userRole as any) || 'LECTURER',
        entityId: lec.id,
        status: 'ACTIVE' as const,
      };
      switchUser(targetUser as UserType);
      setActionSuccessMsg(`Đã chuyển đổi sang tài khoản Thầy/Cô: ${lec.fullName} (@${targetUser.username})`);
    } else {
      setSelectedLecturerId(lec.id);
      setActionSuccessMsg(`Đã chọn xem hồ sơ và lịch dạy của Thầy/Cô: ${lec.fullName}`);
    }
  };

  // Selected lecturer for top card KPI preview
  const currentLecturerWorkload =
    workloads.find((w) => w.lecturerId === selectedLecturerId) || workloads[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast / Notification Banner */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-sm shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{actionErrorMsg}</span>
          </div>
          <button
            onClick={() => setActionErrorMsg(null)}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Nav-Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex flex-wrap gap-2 sm:gap-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('WORKLOAD')}
            className={`cursor-pointer inline-flex items-center gap-2 py-3 px-4 sm:px-5 border-b-2 font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'WORKLOAD'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BarChart3 className={`w-4 h-4 ${activeTab === 'WORKLOAD' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Thống Kê Khối Lượng Giảng Dạy Tuần</span>
          </button>

          <button
            onClick={() => setActiveTab('LECTURERS')}
            className={`cursor-pointer inline-flex items-center gap-2 py-3 px-4 sm:px-5 border-b-2 font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'LECTURERS'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${activeTab === 'LECTURERS' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Lưu & Chỉnh Sửa Thông Tin Giảng Viên</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'LECTURERS'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {lecturers.length}
            </span>
          </button>
        </nav>
      </div>

      {/* TAB 1: WORKLOAD STATISTICS */}
      {activeTab === 'WORKLOAD' && (
        <div className="space-y-6">
          {/* Card: Chọn Thời Khóa Biểu Tuần (Thuộc Tab Thống Kê Giảng Dạy) */}
          <TimetableWeekSelector
            weeks={weeks}
            selectedWeekId={selectedWeekId}
            onSelectWeek={(id) => setSelectedWeekId(id)}
            title="Chọn thời khóa biểu tuần"
            includeAllOption={true}
            allOptionLabel="Cả học kỳ 2"
            variant="gray"
          />
          {/* Master Card: Bộ Lọc & Bảng Khối Lượng Giảng Dạy */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-md overflow-hidden border-t-4 border-t-blue-600">
            {/* CARD-HEADER: BỘ LỌC NỔI BẬT */}
            <div className="card-header bg-gradient-to-b from-blue-50/70 via-slate-50/90 to-slate-100/95 border-b-2 border-slate-300 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm ring-4 ring-blue-500/20 shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                        Bảng Chi Tiết Khối Lượng Giảng Dạy
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-2xs">
                        {currentWeekObj?.title || 'Tất cả các tuần'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Danh sách phân công giảng dạy, học phần, lớp học và các buổi giảng dạy chi tiết trong tuần
                    </p>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-700 bg-white/90 px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
                  Hiển thị: <strong className="text-blue-700 font-black">{filteredWorkloads.length}</strong> / {workloads.length} Thầy/Cô
                </div>
              </div>

              {/* Filters Control Box */}
              <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    {/* Search Box */}
                    <div className="relative min-w-[240px] max-w-sm flex-1 sm:flex-initial">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm theo tên Thầy/Cô, môn, lớp..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-7 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-2xs"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Title / Prefix Filter */}
                    <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-black">
                      <button
                        onClick={() => setGenderFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                          genderFilter === 'ALL'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        Tất cả ({workloads.length})
                      </button>
                      <button
                        onClick={() => setGenderFilter('THAY')}
                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                          genderFilter === 'THAY'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        👨‍🏫 Thầy
                      </button>
                      <button
                        onClick={() => setGenderFilter('CO')}
                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                          genderFilter === 'CO'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        👩‍🏫 Cô
                      </button>
                    </div>

                    {/* Filter by Department */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 max-w-[220px] truncate shadow-2xs"
                        title="Lọc theo Bộ môn / Đơn vị"
                      >
                        <option value="ALL">Tất cả Bộ môn / Đơn vị</option>
                        {allAvailableDepartments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsDeptModalOpen(true)}
                        className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition cursor-pointer shadow-2xs"
                        title="Quản lý danh sách Bộ môn / Đơn vị phụ trách"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Sắp xếp:</span>
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-2xs"
                    >
                      <option value="PERIODS_DESC">Số tiết dạy nhiều nhất</option>
                      <option value="NAME_ASC">Họ và Tên (A - Z)</option>
                      <option value="COURSES_DESC">Số học phần nhiều nhất</option>
                      <option value="CLASSES_DESC">Số lớp nhiều nhất</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ACTIVE FILTER RIBBON (DẢI PHẢN QUANG ĐẬM NỔI BẬT) */}
              <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-sm flex items-center justify-between flex-wrap gap-2.5 border border-slate-800">
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  <span className="font-extrabold uppercase tracking-wider text-blue-300 text-[11px] flex items-center gap-1.5 bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-500/30 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-blue-400" />
                    ĐANG LỌC:
                  </span>
                  <span className="px-2.5 py-1 bg-white/10 text-white rounded-lg font-bold border border-white/15">
                    {currentWeekObj?.title || 'Tất cả các tuần'}
                  </span>
                  <span className="px-2.5 py-1 bg-white/10 text-white rounded-lg font-bold border border-white/15">
                    {genderFilter === 'ALL' ? 'Tất cả giảng viên' : genderFilter === 'THAY' ? '👨‍🏫 Chỉ Thầy' : '👩‍🏫 Chỉ Cô'}
                  </span>
                  {departmentFilter !== 'ALL' && (
                    <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-black border border-indigo-400 ring-2 ring-indigo-400/20">
                      BM: {departmentFilter}
                    </span>
                  )}
                  {searchTerm.trim() && (
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg font-bold border border-amber-500/40">
                      Tìm: &ldquo;{searchTerm}&rdquo;
                    </span>
                  )}
                  <span className="px-2.5 py-1 bg-white/5 text-slate-300 rounded-lg font-medium border border-white/10 text-[11px]">
                    Xếp theo: {sortBy === 'PERIODS_DESC' ? 'Tiết nhiều nhất' : sortBy === 'NAME_ASC' ? 'Tên A-Z' : sortBy === 'COURSES_DESC' ? 'Nhiều môn nhất' : 'Nhiều lớp nhất'}
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto shrink-0">
                  {hasActiveWorkloadFilters && (
                    <button
                      type="button"
                      onClick={handleResetWorkloadFilters}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Đặt lại tất cả bộ lọc khối lượng"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Đặt lại bộ lọc</span>
                    </button>
                  )}
                  <span className="bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-lg text-xs shadow-xs">
                    Sẵn sàng theo dõi
                  </span>
                </div>
              </div>
            </div>

            {/* CARD-BODY: NỘI DUNG BẢNG KHỐI LƯỢNG GIẢNG DẠY BÁM BIÊN */}
            <div className="card-body p-4 sm:p-5 space-y-4">

            {loading ? (
              <div className="h-64 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 font-medium">
                Đang tải dữ liệu khối lượng giảng dạy...
              </div>
            ) : filteredWorkloads.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
                <div className="font-bold text-slate-700">Không tìm thấy giảng viên phù hợp</div>
                <div className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc chọn tuần khác</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-xs border-y border-slate-200">
                      <th className="py-3.5 px-5 font-bold w-1/4">Giảng Viên & Đơn Vị</th>
                      <th className="py-3.5 px-5 font-bold w-1/3">Học Phần Phụ Trách ({selectedWeekId === 'ALL' ? 'Cả kỳ' : 'Trong tuần'})</th>
                      <th className="py-3.5 px-5 font-bold w-1/4">Lớp Giảng Dạy</th>
                      <th className="py-3.5 px-5 font-bold text-center">Phân Bổ Tiết</th>
                      <th className="py-3.5 px-5 font-bold text-right">Tổng Tiết</th>
                      <th className="py-3.5 px-4 font-bold text-center">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWorkloads.map((w) => {
                      const isThay = w.lecturerName.toLowerCase().startsWith('thầy');
                      const isCo = w.lecturerName.toLowerCase().startsWith('cô');
                      const subjects = w.subjectsList && w.subjectsList.length > 0 ? w.subjectsList : ['Lập trình & Đào tạo CNTT'];
                      const classes = w.classesList && w.classesList.length > 0 ? w.classesList : ['D21CNTT01'];
                      const sessionsCount = w.sessionsList ? w.sessionsList.length : 0;

                      return (
                        <tr
                          key={w.lecturerId}
                          className="hover:bg-blue-50/40 transition group"
                        >
                          <td className="py-4 px-5 align-top">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border ${
                                  isThay
                                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                                    : isCo
                                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                                    : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                }`}
                              >
                                {isThay ? 'Thầy' : isCo ? 'Cô' : w.lecturerName.slice(-2)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                  {w.lecturerName}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">{w.department}</div>
                                {w.email && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                      {w.email}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5 align-top">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                                <span>{subjects.length} học phần phụ trách:</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {subjects.map((sub, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-lg text-xs font-medium border border-indigo-100/80 leading-snug"
                                  >
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5 align-top">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                                <span>{classes.length} lớp giảng dạy:</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {classes.map((cls, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-100/80 font-mono"
                                  >
                                    {cls}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5 align-top text-center">
                            <div className="inline-flex flex-col gap-1 text-xs">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold border border-blue-100">
                                Lý thuyết: {w.theoryPeriods} tiết
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold border border-emerald-100">
                                Thực hành: {w.practicePeriods} tiết
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                            <div className="font-black text-lg text-blue-900">
                              {w.totalPeriods}{' '}
                              <span className="text-xs font-normal text-slate-500">tiết</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {sessionsCount > 0 ? `${sessionsCount} buổi dạy` : `${w.classesCount} lớp`}
                            </div>
                          </td>

                          <td className="py-4 px-4 align-top text-center">
                            <button
                              onClick={() => setSelectedLecturerDetail(w)}
                              className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl transition shadow-xs text-xs font-bold flex items-center gap-1 mx-auto"
                              title="Xem chi tiết lịch dạy trong tuần"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Lịch dạy</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* TAB 2: LECTURER MANAGEMENT (LƯU VÀ CHỈNH SỬA THÔNG TIN GIẢNG VIÊN) */}
      {activeTab === 'LECTURERS' && (
        <div className="space-y-6">
          {/* Smart Auto-Add Banner - Chỉ hiển thị với vai trò Quản lý Đào tạo hoặc Admin */}
          {canManageLecturers && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Cơ Chế Tự Động Quét & Thêm Giảng Viên Mới (Thầy / Cô)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Khi bạn tải thời khóa biểu mới từ Google Sheet hoặc website Khoa CNTT, hệ thống sẽ tự động quét danh sách, nếu xuất hiện tên giảng viên mới (bắt đầu bằng Thầy/Cô) thì sẽ tự động thêm vào hệ thống và khởi tạo hồ sơ giảng dạy.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 max-w-full">
                <button
                  onClick={() => setIsDeptModalOpen(true)}
                  className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Thêm, sửa, xóa Bộ môn / Đơn vị phụ trách"
                >
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  Quản Lý Bộ Môn ({departments.length})
                </button>
                <button
                  onClick={openAddModal}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  Thêm Thầy/Cô Mới
                </button>
              </div>
            </div>
          )}

          {/* Master Card: Quản Lý Giảng Viên & Tài Khoản */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-md overflow-hidden border-t-4 border-t-blue-600">
            {/* CARD-HEADER: BỘ LỌC NỔI BẬT */}
            <div className="card-header bg-gradient-to-b from-blue-50/70 via-slate-50/90 to-slate-100/95 border-b-2 border-slate-300 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm ring-4 ring-blue-500/20 shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                      Danh Sách Giảng Viên & Quản Lý Tài Khoản
                    </h2>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Lưu trữ hồ sơ học vị, liên kết tài khoản đăng nhập cho Thầy/Cô và phân quyền giảng dạy
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-700 bg-white/90 px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
                  Hiển thị: <strong className="text-blue-700 font-black">{filteredLecturers.length}</strong> / {lecturers.length} Thầy/Cô
                </div>
              </div>

              {/* Filters Control Box */}
              <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Box */}
                  <div className="relative min-w-[240px] max-w-sm flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm Thầy/Cô, mã, email, tài khoản..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-7 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-2xs"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Title / Prefix Filter */}
                  <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-black">
                    <button
                      onClick={() => setGenderFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        genderFilter === 'ALL'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setGenderFilter('THAY')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        genderFilter === 'THAY'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      👨‍🏫 Thầy
                    </button>
                    <button
                      onClick={() => setGenderFilter('CO')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        genderFilter === 'CO'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      👩‍🏫 Cô
                    </button>
                  </div>

                  {/* Filter by Account Linkage */}
                  <select
                    value={accountFilter}
                    onChange={(e) => setAccountFilter(e.target.value as any)}
                    className="bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-2xs"
                  >
                    <option value="ALL">Tất cả tài khoản</option>
                    <option value="HAS_ACCOUNT">Đã có tài khoản</option>
                    <option value="NO_ACCOUNT">Chưa có tài khoản</option>
                  </select>

                  {/* Filter by Department */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 max-w-[200px] truncate shadow-2xs"
                    >
                      <option value="ALL">Tất cả Bộ môn / Đơn vị</option>
                      {allAvailableDepartments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsDeptModalOpen(true)}
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition cursor-pointer shadow-2xs"
                      title="Quản lý danh sách Bộ môn / Đơn vị"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ACTIVE FILTER RIBBON (DẢI PHẢN QUANG ĐẬM NỔI BẬT) */}
              <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-sm flex items-center justify-between flex-wrap gap-2.5 border border-slate-800">
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  <span className="font-extrabold uppercase tracking-wider text-blue-300 text-[11px] flex items-center gap-1.5 bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-500/30 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-blue-400" />
                    ĐANG LỌC:
                  </span>
                  <span className="px-2.5 py-1 bg-white/10 text-white rounded-lg font-bold border border-white/15">
                    {genderFilter === 'ALL' ? 'Tất cả danh xưng' : genderFilter === 'THAY' ? '👨‍🏫 Chỉ Thầy' : '👩‍🏫 Chỉ Cô'}
                  </span>
                  <span className="px-2.5 py-1 bg-white/10 text-white rounded-lg font-bold border border-white/15">
                    {accountFilter === 'ALL' ? 'Tất cả trạng thái tài khoản' : accountFilter === 'HAS_ACCOUNT' ? '🔑 Đã liên kết tài khoản' : '⏳ Chưa có tài khoản'}
                  </span>
                  {departmentFilter !== 'ALL' && (
                    <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-black border border-indigo-400 ring-2 ring-indigo-400/20">
                      BM: {departmentFilter}
                    </span>
                  )}
                  {searchTerm.trim() && (
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg font-bold border border-amber-500/40">
                      Tìm: &ldquo;{searchTerm}&rdquo;
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto shrink-0">
                  {hasActiveLecturerFilters && (
                    <button
                      type="button"
                      onClick={handleResetLecturerFilters}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Đặt lại tất cả bộ lọc giảng viên"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Đặt lại bộ lọc</span>
                    </button>
                  )}
                  <span className="bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-lg text-xs shadow-xs">
                    Sẵn sàng theo dõi
                  </span>
                </div>
              </div>
            </div>

            {/* CARD-BODY: BẢNG GIẢNG VIÊN */}
            <div className="card-body p-4 sm:p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-xs border-y border-slate-200">
                      <th className="py-3.5 px-5 font-bold">Họ và Tên Giảng Viên</th>
                      <th className="py-3.5 px-4 font-bold">Bộ Môn</th>
                      <th className="py-3.5 px-4 font-bold">Liên Hệ</th>
                      <th className="py-3.5 px-4 font-bold">Tài Khoản Liên Kết</th>
                      <th className="py-3.5 px-4 font-bold text-center">Trạng Thái</th>
                      <th className="py-3.5 px-5 font-bold text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLecturers.map((lec) => {
                      const isThay = lec.fullName.toLowerCase().startsWith('thầy');
                      const isCo = lec.fullName.toLowerCase().startsWith('cô');

                      return (
                        <tr key={lec.id} className="hover:bg-slate-50/80 transition group">
                          {/* Name & Avatar */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                                  isThay
                                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                                    : isCo
                                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                                    : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                }`}
                              >
                                {isThay ? 'Thầy' : isCo ? 'Cô' : lec.fullName.slice(-2)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm">
                                  {lec.fullName}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-4 px-4 text-xs">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-100/80">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{lec.department || 'Khoa học máy tính'}</span>
                            </span>
                          </td>

                          {/* Contact */}
                          <td className="py-4 px-4 text-xs text-slate-500 space-y-0.5">
                            {lec.email && (
                              <div className="flex items-center gap-1 text-slate-600 truncate max-w-[190px]" title={lec.email}>
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{lec.email}</span>
                              </div>
                            )}
                            {lec.phone && (
                              <div className="flex items-center gap-1 text-slate-500 font-mono">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{lec.phone}</span>
                              </div>
                            )}
                          </td>

                          {/* Account Linkage */}
                          <td className="py-4 px-4">
                            {lec.hasAccount ? (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 text-xs font-mono font-bold">
                                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                  <span>@{lec.username}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      lec.accountStatus === 'INACTIVE' ? 'bg-red-500' : 'bg-emerald-500'
                                    }`}
                                  />
                                  <span className="text-[11px] text-slate-500">
                                    {lec.accountStatus === 'INACTIVE' ? 'Tạm khóa' : 'Đã kích hoạt'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-[11px] font-medium">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  Chưa liên kết TK
                                </span>
                                {canManageLecturers && (
                                  <div>
                                    <button
                                      onClick={() => openAccountModal(lec)}
                                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" /> Tạo tài khoản
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Active Status */}
                          <td className="py-4 px-4 text-center">
                            {lec.active !== false ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                                <Check className="w-3 h-3" /> Đang dạy
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[11px] font-bold">
                                Tạm nghỉ
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Account Management Button */}
                              {canManageLecturers && (
                                <button
                                  onClick={() => openAccountModal(lec)}
                                  className={`p-1.5 rounded-lg transition ${
                                    lec.hasAccount
                                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                  }`}
                                  title={lec.hasAccount ? 'Quản lý tài khoản liên kết' : 'Tạo & liên kết tài khoản'}
                                >
                                  <UserCog className="w-4 h-4" />
                                </button>
                              )}

                              {/* Quick Switch / Login */}
                              <button
                                onClick={() => handleQuickLoginAsLecturer(lec)}
                                className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition"
                                title="Đăng nhập / xem lịch dạy của Thầy/Cô này"
                              >
                                <LogIn className="w-4 h-4" />
                              </button>

                              {canManageLecturers ? (
                                <>
                                  <button
                                    onClick={() => openEditModal(lec)}
                                    className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition"
                                    title="Chỉnh sửa thông tin giảng viên"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeletingLecturer(lec)}
                                    className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition"
                                    title="Xóa giảng viên"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActionErrorMsg('Chức năng chỉnh sửa thông tin giảng viên chỉ dành cho Quản lý Đào tạo hoặc Admin.');
                                    setLoginTargetRole('MANAGER');
                                    setIsLoginModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-800 rounded-lg text-xs font-medium transition border border-slate-200/60"
                                  title="Chức năng chỉ dành cho Quản lý Đào tạo hoặc Admin"
                                >
                                  <Lock className="w-3 h-3 text-slate-400" />
                                  <span>Chỉ xem</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW LECTURER'S TEACHING SESSIONS IN THE SELECTED WEEK */}
      {selectedLecturerDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 my-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-scaleUp overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {selectedLecturerDetail.lecturerName.toLowerCase().startsWith('thầy')
                    ? 'Thầy'
                    : selectedLecturerDetail.lecturerName.toLowerCase().startsWith('cô')
                    ? 'Cô'
                    : 'GV'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Lịch Dạy Chi Tiết: {selectedLecturerDetail.lecturerName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{selectedLecturerDetail.weekTitle || currentWeekObj?.title || 'Thời khóa biểu'}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      <Building2 className="w-3 h-3 text-indigo-600" />
                      {selectedLecturerDetail.department || 'Khoa học máy tính'}
                    </span>
                    <span>•</span>
                    <span>Tổng cộng <strong className="text-blue-700">{selectedLecturerDetail.totalPeriods} tiết</strong></span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLecturerDetail(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="text-[11px] text-blue-700 font-bold uppercase">Học phần</div>
                  <div className="text-lg font-black text-blue-900 mt-0.5">
                    {selectedLecturerDetail.coursesCount} môn
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="text-[11px] text-emerald-700 font-bold uppercase">Lớp phụ trách</div>
                  <div className="text-lg font-black text-emerald-900 mt-0.5">
                    {selectedLecturerDetail.classesCount} lớp
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="text-[11px] text-amber-700 font-bold uppercase">Tổng số tiết</div>
                  <div className="text-lg font-black text-amber-900 mt-0.5">
                    {selectedLecturerDetail.totalPeriods} tiết
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Danh sách các buổi giảng dạy ({selectedLecturerDetail.sessionsList?.length || 0} buổi)
                </h4>

                {(!selectedLecturerDetail.sessionsList || selectedLecturerDetail.sessionsList.length === 0) ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
                    Chưa có lịch chi tiết các buổi trong tuần này.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedLecturerDetail.sessionsList.map((session, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200/80 transition flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs shrink-0">
                            {session.weekdayName}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{session.subject}</div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                              <span className="font-bold text-emerald-700 font-mono">
                                Lớp: {session.className}
                              </span>
                              <span>•</span>
                              <span className="font-medium text-slate-600">
                                Tiết: {session.period} ({session.periodsCount} tiết)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                              session.isLab
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            Phòng: {session.room || 'H.101'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/80">
              <div>
                {canManageLecturers && (
                  <button
                    onClick={() => {
                      const lec = lecturers.find(
                        (l) =>
                          l.id === selectedLecturerDetail.lecturerId ||
                          l.fullName.toLowerCase() === selectedLecturerDetail.lecturerName.toLowerCase() ||
                          (l.lecturerCode && l.lecturerCode === selectedLecturerDetail.lecturerCode)
                      );
                      const targetLecturer: Lecturer = lec || {
                        id: selectedLecturerDetail.lecturerId,
                        lecturerCode: selectedLecturerDetail.lecturerCode || 'GV001',
                        fullName: selectedLecturerDetail.lecturerName,
                        department: selectedLecturerDetail.department || 'Khoa học máy tính',
                        degree: '',
                        email: selectedLecturerDetail.email || '',
                        phone: selectedLecturerDetail.phone || '0255.3822295',
                        active: true,
                      };
                      setSelectedLecturerDetail(null);
                      openEditModal(targetLecturer);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition border border-blue-200"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Sửa Thông Tin & Bộ Môn</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedLecturerDetail(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT LECTURER */}
      {(isAddModalOpen || editingLecturer) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 my-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-scaleUp overflow-hidden">
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 p-5 sm:p-6 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingLecturer ? 'Chỉnh Sửa Thông Tin Giảng Viên' : 'Thêm Giảng Viên Mới'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hệ thống Khoa CNTT • Đại học Phạm Văn Đồng
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingLecturer(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLecturer} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và Tên Giảng Viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thầy Phạm Văn Thơ hoặc Cô Nguyễn Thị B"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nên kèm danh xưng "Thầy" hoặc "Cô" để hệ thống tự động nhận diện và phân loại.
                </p>
              </div>

              {/* Department / Unit Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Bộ Môn / Đơn Vị Phụ Trách <span className="text-rose-500">*</span>
                  </label>
                  {canManageLecturers && (
                    <button
                      type="button"
                      onClick={() => setIsDeptModalOpen(true)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      title="Mở danh sách quản lý Bộ môn / Đơn vị"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      Quản lý Bộ môn ({departments.length})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    list="pdu-departments-datalist"
                    placeholder="VD: Bộ môn Công nghệ Phần mềm, Khoa CNTT, Phòng Đào tạo..."
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full pl-3.5 pr-28 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />

                  {/* Quick preset selector */}
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormData({ ...formData, department: e.target.value });
                        }
                      }}
                      className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                      title="Chọn nhanh từ danh sách Bộ môn"
                    >
                      <option value="">Chọn mẫu ▾</option>
                      {allAvailableDepartments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <datalist id="pdu-departments-datalist">
                    {allAvailableDepartments.map((dept) => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>

                {/* Popular Quick-Select Chips */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">Gợi ý đơn vị phụ trách:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Khoa học máy tính',
                      'Hệ thống thông tin',
                      'Phương pháp tin',
                      'Các thầy ngoài khoa',
                    ].map((chip) => {
                      const isSelected = formData.department === chip;
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setFormData({ ...formData, department: chip })}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition font-medium ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Liên Hệ
                  </label>
                  <input
                    type="email"
                    placeholder="email@pdu.edu.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="text"
                    placeholder="0255.3822295"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quick Account Creation Option for New Lecturer */}
              {!editingLecturer && (
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="createAccountCheck"
                      checked={formData.createAccount}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const cleanName = formData.fullName.replace(/^(Thầy|Cô)\s+/i, '');
                        const autoUsername = `gv_${cleanName
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '_')}`;

                        setFormData({
                          ...formData,
                          createAccount: checked,
                          username: checked ? (formData.username || autoUsername) : '',
                        });
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <label htmlFor="createAccountCheck" className="text-xs font-bold text-blue-900 cursor-pointer flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                      Tạo tài khoản đăng nhập cho Thầy/Cô này ngay
                    </label>
                  </div>

                  {formData.createAccount && (
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-blue-200/60">
                      <div>
                        <label className="block text-[11px] font-bold text-blue-800 uppercase mb-1">
                          Tên Đăng Nhập
                        </label>
                        <input
                          type="text"
                          required={formData.createAccount}
                          placeholder="gv_tho..."
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-blue-800 uppercase mb-1">
                          Mật Khẩu Ban Đầu
                        </label>
                        <input
                          type="text"
                          required={formData.createAccount}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* If Editing and has account info, display linkage status */}
              {editingLecturer && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {editingLecturer.hasAccount ? `Tài khoản liên kết: @${editingLecturer.username}` : 'Chưa liên kết tài khoản người dùng'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {editingLecturer.hasAccount ? `Trạng thái: ${editingLecturer.accountStatus || 'ACTIVE'}` : 'Bạn có thể liên kết tài khoản sau'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const lec = editingLecturer;
                      setIsAddModalOpen(false);
                      setEditingLecturer(null);
                      openAccountModal(lec);
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <UserCog className="w-3.5 h-3.5" />
                    {editingLecturer.hasAccount ? 'Quản lý TK' : 'Liên kết ngay'}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="activeCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Đang trực tiếp tham gia giảng dạy học kỳ này
                </label>
              </div>

              </div>

              <div className="shrink-0 flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingLecturer(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {editingLecturer ? 'Lưu Thay Đổi' : 'Thêm Giảng Viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE / CREATE / LINK ACCOUNT FOR LECTURER */}
      {managingAccountLecturer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 my-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-scaleUp overflow-hidden">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 p-5 sm:p-6 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Quản Lý Tài Khoản Giảng Viên
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {managingAccountLecturer.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManagingAccountLecturer(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">

            {/* Notification alert within modal */}
            {accountActionMsg && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{accountActionMsg}</div>
              </div>
            )}

            {/* Current Linkage Status */}
            {managingAccountLecturer.hasAccount ? (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      Tài Khoản Đang Liên Kết
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        managingAccountLecturer.accountStatus === 'INACTIVE'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {managingAccountLecturer.accountStatus === 'INACTIVE' ? 'Tạm khóa' : 'Đang hoạt động'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Tên đăng nhập:</span>
                      <strong className="text-slate-900 font-mono text-sm">@{managingAccountLecturer.username}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Vai trò hệ thống:</span>
                      <strong className="text-indigo-700 font-bold">{managingAccountLecturer.userRole || 'GIẢNG VIÊN'}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-200/60 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleQuickLoginAsLecturer(managingAccountLecturer)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Đăng nhập tài khoản này
                    </button>
                    <button
                      onClick={handleUnlinkAccountFromLecturer}
                      disabled={accountActionLoading}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Hủy liên kết tài khoản
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Khi hủy liên kết, hồ sơ giảng viên vẫn được giữ nguyên và tài khoản người dùng vẫn tồn tại trong danh sách người dùng nhưng sẽ không còn liên kết tự động.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Switch tab: CREATE NEW vs LINK EXISTING */}
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setAccountModalTab('CREATE')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                      accountModalTab === 'CREATE'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Tạo Tài Khoản Mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountModalTab('LINK')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                      accountModalTab === 'LINK'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Liên Kết Tài Khoản Có Sẵn
                  </button>
                </div>

                {accountModalTab === 'CREATE' ? (
                  <form onSubmit={handleCreateAccountForLecturer} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Tên Đăng Nhập (Username) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={accFormData.username}
                        onChange={(e) => setAccFormData({ ...accFormData, username: e.target.value })}
                        placeholder="gv_tho..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Mật Khẩu Mặc Định
                        </label>
                        <input
                          type="text"
                          required
                          value={accFormData.password}
                          onChange={(e) => setAccFormData({ ...accFormData, password: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Vai Trò Tài Khoản
                        </label>
                        <select
                          value={accFormData.role}
                          onChange={(e) => setAccFormData({ ...accFormData, role: e.target.value as any })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        >
                          <option value="LECTURER">Giảng Viên (LECTURER)</option>
                          <option value="MANAGER">Quản Lý Đào Tạo (MANAGER)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={accFormData.email}
                          onChange={(e) => setAccFormData({ ...accFormData, email: e.target.value })}
                          placeholder="email@pdu.edu.vn"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Số Điện Thoại
                        </label>
                        <input
                          type="text"
                          value={accFormData.phone}
                          onChange={(e) => setAccFormData({ ...accFormData, phone: e.target.value })}
                          placeholder="0255.3822295"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setManagingAccountLecturer(null)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={accountActionLoading}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                      >
                        <UserPlus className="w-4 h-4" />
                        {accountActionLoading ? 'Đang tạo...' : 'Tạo & Liên Kết Ngay'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Chọn Tài Khoản Người Dùng Để Liên Kết
                      </label>
                      <select
                        value={selectedLinkUserId}
                        onChange={(e) => setSelectedLinkUserId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Chọn tài khoản từ danh sách --</option>
                        {usersList
                          .filter((u) => u.role === 'LECTURER' || u.role === 'MANAGER' || u.role === 'ADMIN')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              @{u.username} ({u.fullName}) - {u.role}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setManagingAccountLecturer(null)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleLinkAccountToLecturer}
                        disabled={accountActionLoading || !selectedLinkUserId}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                      >
                        <Link2 className="w-4 h-4" />
                        {accountActionLoading ? 'Đang xử lý...' : 'Xác Nhận Liên Kết'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingLecturer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 my-auto">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-scaleUp text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Xác Nhận Xóa Giảng Viên</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa giảng viên{' '}
                <strong className="text-rose-600">{deletingLecturer.fullName}</strong> khỏi hệ thống?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingLecturer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleDeleteLecturer}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DEPARTMENT / ACADEMIC UNIT MANAGEMENT */}
      <DepartmentManagementModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        departments={departments}
        onDepartmentsChange={(newDepts) => {
          setDepartments(newDepts);
        }}
        canManage={canManageLecturers}
        onDepartmentSelected={(deptName) => {
          setFormData((prev) => ({ ...prev, department: deptName }));
        }}
        onRefreshData={() => {
          fetchStats();
        }}
      />
    </div>
  );
};
