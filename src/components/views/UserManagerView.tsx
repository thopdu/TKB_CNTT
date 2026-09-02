import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  GraduationCap,
  UserCheck,
  Layers,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Copy,
  Check,
  Phone,
  Mail,
  Building,
  AlertTriangle,
  LogIn,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, UserRole, Lecturer, StudentClass } from '../../types';

export const UserManagerView: React.FC = () => {
  const { currentUser, switchUser, setIsLoginModalOpen, setLoginTargetRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAuthorized = currentUser && currentUser.role === 'ADMIN';

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal States
  const [isAddEditOpen, setIsAddEditOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formValues, setFormValues] = useState<{
    username: string;
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    department: string;
    entityId: string;
    status: 'ACTIVE' | 'INACTIVE';
    password?: string;
  }>({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'STUDENT',
    department: '',
    entityId: '',
    status: 'ACTIVE',
    password: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newGeneratedPassword, setNewGeneratedPassword] = useState<string>('');
  const [copiedPassword, setCopiedPassword] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Delete Confirm Modal
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchUsers = async () => {
    if (!isAuthorized) return;
    try {
      setLoading(true);
      setError(null);
      const [usersData, lecsData, classesData] = await Promise.all([
        api.getUsers(),
        api.getLecturers(),
        api.getClasses(),
      ]);
      setUsers(usersData);
      setLecturers(lecsData);
      setClasses(classesData);
    } catch (err: any) {
      setError('Không thể tải danh sách người dùng: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAuthorized]);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    const managers = users.filter((u) => u.role === 'MANAGER').length;
    const lecturers = users.filter((u) => u.role === 'LECTURER').length;
    const students = users.filter((u) => u.role === 'STUDENT').length;
    const active = users.filter((u) => u.status !== 'INACTIVE').length;
    return { total, admins, managers, lecturers, students, active };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = selectedRole === 'ALL' || u.role === selectedRole;
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && u.status !== 'INACTIVE') ||
        (selectedStatus === 'INACTIVE' && u.status === 'INACTIVE');

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q));

      return matchRole && matchStatus && matchQuery;
    });
  }, [users, selectedRole, selectedStatus, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormValues({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      role: 'STUDENT',
      department: '',
      entityId: '',
      status: 'ACTIVE',
      password: 'pdu@' + Math.floor(100000 + Math.random() * 900000),
    });
    setFormError(null);
    setIsAddEditOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormValues({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      department: user.department || '',
      entityId: user.entityId || '',
      status: user.status || 'ACTIVE',
    });
    setFormError(null);
    setIsAddEditOpen(true);
  };

  // Quick Role Change Handler
  const handleQuickChangeRole = async (user: User, newRole: UserRole) => {
    if (user.role === newRole) return;
    if (user.email === 'pvantho@pdu.edu.vn' && newRole !== 'ADMIN') {
      alert('Tài khoản pvantho@pdu.edu.vn là Quản trị viên (Admin) chính của hệ thống.');
      return;
    }
    try {
      const updated = await api.updateUser(user.id, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      showNotification(`Đã phân quyền cho tài khoản "${user.fullName}" sang vai trò: ${newRole}`);
    } catch (err: any) {
      alert('Không thể cập nhật vai trò: ' + err.message);
    }
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.username.trim() || !formValues.fullName.trim() || !formValues.email.trim()) {
      setFormError('Vui lòng điền đầy đủ Tên đăng nhập, Họ và tên, và Email');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editingUser) {
        // Update user
        const updated = await api.updateUser(editingUser.id, {
          fullName: formValues.fullName,
          email: formValues.email,
          phone: formValues.phone,
          role: formValues.role,
          department: formValues.department,
          entityId: formValues.entityId,
          status: formValues.status,
        });
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        showNotification(`Đã cập nhật thông tin người dùng "${updated.fullName}" thành công`);
      } else {
        // Create user
        const created = await api.createUser({
          username: formValues.username,
          fullName: formValues.fullName,
          email: formValues.email,
          phone: formValues.phone,
          role: formValues.role,
          department: formValues.department,
          entityId: formValues.entityId,
          status: formValues.status,
        });
        setUsers((prev) => [created, ...prev]);
        showNotification(`Đã tạo tài khoản mới "${created.username}" thành công`);
      }

      setIsAddEditOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Đã có lỗi xảy ra khi lưu thông tin');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (user: User) => {
    try {
      const res = await api.toggleUserStatus(user.id);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
      showNotification(
        `Đã ${res.user.status === 'ACTIVE' ? 'kích hoạt lại' : 'tạm khóa'} tài khoản "${user.username}"`
      );
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      setDeleting(true);
      await api.deleteUser(deleteConfirmUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));
      showNotification(`Đã xóa tài khoản "${deleteConfirmUser.username}" thành công`);
      setDeleteConfirmUser(null);
    } catch (err: any) {
      alert('Không thể xóa: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Reset Password Handler
  const handleOpenResetPassword = (user: User) => {
    const generated = 'Pdu@' + Math.floor(100000 + Math.random() * 900000) + '!';
    setResetModalUser(user);
    setNewGeneratedPassword(generated);
    setCopiedPassword(false);
    setResetSuccess(null);
  };

  const handleConfirmResetPassword = async () => {
    if (!resetModalUser) return;
    try {
      const res = await api.resetUserPassword(resetModalUser.id, newGeneratedPassword);
      setResetSuccess(res.message);
      showNotification(`Mật khẩu mới của ${resetModalUser.username}: ${newGeneratedPassword}`);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleCopyPassword = () => {
    if (!newGeneratedPassword) return;
    navigator.clipboard.writeText(newGeneratedPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Tên đăng nhập', 'Họ và tên', 'Email', 'Vai trò', 'Số điện thoại', 'Đơn vị / Lớp', 'Trạng thái', 'Ngày tạo'];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.username,
      `"${u.fullName}"`,
      u.email,
      u.role,
      u.phone || '',
      `"${u.department || ''}"`,
      u.status !== 'INACTIVE' ? 'Hoạt động' : 'Tạm khóa',
      u.createdAt || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PDU_DanhSach_NguoiDung_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>Quản trị viên (ADMIN)</span>
          </span>
        );
      case 'MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>Ban Chủ nhiệm (MANAGER)</span>
          </span>
        );
      case 'LECTURER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 shadow-2xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Giảng viên (LECTURER)</span>
          </span>
        );
      case 'STUDENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 shadow-2xs">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>Sinh viên (STUDENT)</span>
          </span>
        );
    }
  };

  // Auth Gatekeeper for User Management (ADMIN Only)
  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 max-w-xl mx-auto text-center border border-slate-200/80 shadow-lg space-y-5 my-8 sm:my-12 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-md shadow-purple-500/10">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-800 rounded-full text-xs font-semibold border border-purple-200 mb-2">
            <Users className="w-3.5 h-3.5" />
            Phân hệ Quản trị Người dùng & Phân quyền
          </span>
          <h2 className="text-xl font-bold text-slate-900">Dành Riêng Cho Quản Trị Viên (Admin)</h2>
          <p className="text-[15px] text-slate-600 leading-relaxed mt-2">
            Chức năng quản lý tài khoản, cấp phát tài khoản mới, đặt lại mật khẩu và phân quyền người dùng thuộc thẩm quyền quản trị của Quản trị viên (Admin).
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setLoginTargetRole('ADMIN');
              setIsLoginModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-[#0C2340] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập Quản trị viên (Admin)</span>
          </button>
        </div>

        <div className="text-[12px] text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed">
          <div>
            Tài khoản Admin chính: <span className="font-mono font-bold text-purple-900">pvantho@pdu.edu.vn</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Hệ thống PDU Academic chỉ cho phép đăng nhập qua email <span className="font-mono font-semibold">@pdu.edu.vn</span>. Người dùng mới mặc định là Sinh viên.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-900 text-sm font-medium rounded-2xl border border-emerald-200 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Policy & Guidance Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/70 to-purple-50/80 border border-blue-200/80 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm shadow-blue-600/30">
            <Shield className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">Quy định phân quyền & xác thực PDU Academic</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md border border-purple-200">
                Admin: pvantho@pdu.edu.vn
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              1. Đăng nhập chỉ chấp nhận email trường Đại học Phạm Văn Đồng (<span className="font-bold text-blue-700 font-mono">@pdu.edu.vn</span>).<br />
              2. Người dùng mới khi đăng nhập lần đầu tiên sẽ tự động nhận vai trò mặc định là <span className="font-bold text-blue-800">Sinh viên</span>.<br />
              3. Quản trị viên (<span className="font-bold text-purple-800 font-mono">pvantho@pdu.edu.vn</span>) trực tiếp phân quyền vai trò (Admin, Ban quản lý, Giảng viên, Sinh viên) qua menu chọn vai trò nhanh ở cột "Vai trò" bên dưới.
            </p>
          </div>
        </div>
      </div>

      {/* Top Header Card */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-center"
        style={{ backgroundColor: '#054369', minHeight: '150px' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-blue-200 border border-white/10">
              <Users className="w-3.5 h-3.5 text-blue-300" />
              <span>Hệ thống Xác thực & Phân quyền PDU</span>
            </div>
            <h1 className="text-[25px] font-extrabold text-white tracking-tight leading-tight">
              Quản Lý Người Dùng & Tài Khoản
            </h1>
            <p className="text-[15px] text-blue-100/80">
              Quản lý tài khoản cán bộ giảng viên, sinh viên, phân quyền truy cập và kiểm soát bảo mật hệ thống Nhà H
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-white/15 hover:bg-white/25 rounded-xl transition disabled:opacity-50 border border-white/20"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-white/15 hover:bg-white/25 rounded-xl transition border border-white/20"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Xuất CSV</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 transition transform active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm người dùng mới</span>
            </button>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-2">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="text-xs font-semibold text-slate-500 mb-1">Tổng người dùng</div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <div className="text-xs text-emerald-600 font-medium mt-0.5">{stats.active} đang hoạt động</div>
          </div>

          <div className="bg-purple-50/60 border border-purple-200/70 rounded-2xl p-4">
            <div className="text-xs font-semibold text-purple-700 mb-1">Quản trị viên (ADMIN)</div>
            <div className="text-2xl font-black text-purple-900">{stats.admins}</div>
            <div className="text-xs text-purple-600 font-medium mt-0.5">Toàn quyền hệ thống</div>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-4">
            <div className="text-xs font-semibold text-amber-700 mb-1">Ban Chủ nhiệm (MANAGER)</div>
            <div className="text-2xl font-black text-amber-900">{stats.managers}</div>
            <div className="text-xs text-amber-600 font-medium mt-0.5">Quản lý đào tạo & TKB</div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-4">
            <div className="text-xs font-semibold text-emerald-700 mb-1">Giảng viên (LECTURER)</div>
            <div className="text-2xl font-black text-emerald-900">{stats.lecturers}</div>
            <div className="text-xs text-emerald-600 font-medium mt-0.5">Khối lượng & Lịch dạy</div>
          </div>

          <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-4">
            <div className="text-xs font-semibold text-blue-700 mb-1">Sinh viên (STUDENT)</div>
            <div className="text-2xl font-black text-blue-900">{stats.students}</div>
            <div className="text-xs text-blue-600 font-medium mt-0.5">Lịch học lớp & Lịch thi</div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo username, họ tên, email, SĐT, đơn vị hoặc lớp..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 px-1"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Role Filter Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Tất cả vai trò' },
              { id: 'ADMIN', label: 'Quản trị viên' },
              { id: 'MANAGER', label: 'Ban Quản lý' },
              { id: 'LECTURER', label: 'Giảng viên' },
              { id: 'STUDENT', label: 'Sinh viên' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedRole === r.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                selectedStatus === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setSelectedStatus('ACTIVE')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                selectedStatus === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              Hoạt động
            </button>
            <button
              onClick={() => setSelectedStatus('INACTIVE')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                selectedStatus === 'INACTIVE' ? 'bg-white text-red-700 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              Tạm khóa
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
          <span>
            Hiển thị <strong>{filteredUsers.length}</strong> / {users.length} người dùng
          </span>
          {searchQuery && (
            <span>
              Kết quả tìm kiếm cho: "<strong>{searchQuery}</strong>"
            </span>
          )}
        </div>
      </div>

      {/* USERS LIST TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-[15px] font-medium">Đang tải danh sách tài khoản người dùng...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <div className="text-base font-bold text-slate-800">Không tìm thấy người dùng nào</div>
            <p className="text-[15px] text-slate-400 max-w-md mx-auto">
              Không có tài khoản nào khớp với bộ lọc hoặc từ khóa tìm kiếm. Hãy thử đổi từ khóa hoặc bộ lọc vai trò.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('ALL');
                setSelectedStatus('ALL');
              }}
              className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition"
            >
              Xóa toàn bộ bộ lọc
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Tài khoản & Họ tên</th>
                  <th className="py-3.5 px-4">Vai trò</th>
                  <th className="py-3.5 px-4">Liên hệ</th>
                  <th className="py-3.5 px-4">Đơn vị / Lớp</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const isActive = u.status !== 'INACTIVE';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition group">
                      {/* Name & Username */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 text-sm shadow-2xs shrink-0">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{u.fullName}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                                  Bạn đang đăng nhập
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-slate-500">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge & Inline Role Selector */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 min-w-[140px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getRoleBadge(u.role)}
                            {u.email === 'pvantho@pdu.edu.vn' && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-purple-700 text-white rounded-md shadow-2xs">
                                👑 Admin chính
                              </span>
                            )}
                          </div>
                          {u.email !== 'pvantho@pdu.edu.vn' && (
                            <select
                              value={u.role}
                              onChange={(e) => handleQuickChangeRole(u, e.target.value as UserRole)}
                              className="text-[11px] font-semibold bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs w-full"
                              title="Phân quyền nhanh vai trò cho người dùng này"
                            >
                              <option value="STUDENT">🎓 Sinh viên (Mặc định)</option>
                              <option value="LECTURER">👨‍🏫 Giảng viên</option>
                              <option value="MANAGER">📋 Quản lý Đào tạo</option>
                              <option value="ADMIN">🛡️ Quản trị viên</option>
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]" title={u.email}>
                            {u.email}
                          </span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Department / Class */}
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {u.department ? (
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium">{u.department}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa cập nhật</span>
                        )}
                        {u.entityId && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Mã LK: {u.entityId}
                          </div>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          }`}
                          title="Bấm để chuyển trạng thái kích hoạt"
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Hoạt động</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>Tạm khóa</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Test Switch Login */}
                          <button
                            onClick={() => switchUser(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Đăng nhập thử vai trò này"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleOpenResetPassword(u)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            title="Đặt lại mật khẩu"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            disabled={isCurrent}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isCurrent ? 'Không thể tự xóa tài khoản của bạn' : 'Xóa tài khoản'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE & EDIT MODAL */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {editingUser ? <Edit2 className="w-4.5 h-4.5" /> : <UserPlus className="w-4.5 h-4.5" />}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {editingUser ? 'Chỉnh Sửa Tài Khoản' : 'Thêm Người Dùng Mới'}
                  </h3>
                  <p className="text-[15px] text-slate-500">
                    {editingUser ? `Cập nhật thông tin cho @${editingUser.username}` : 'Khởi tạo tài khoản truy cập PDU'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-800 text-xs font-medium rounded-xl border border-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên đăng nhập (Username) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={formValues.username}
                  onChange={(e) => setFormValues({ ...formValues, username: e.target.value.toLowerCase().trim() })}
                  placeholder="ví dụ: gv_tho, sv_dct23a, admin..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition disabled:bg-slate-100 disabled:text-slate-500"
                />
                {!editingUser && (
                  <p className="text-[15px] text-slate-400 mt-1">Chỉ sử dụng chữ thường không dấu, số và gạch dưới.</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formValues.fullName}
                  onChange={(e) => setFormValues({ ...formValues, fullName: e.target.value })}
                  placeholder="ví dụ: ThS. Phạm Văn Thơ"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email PDU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formValues.email}
                    onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                    placeholder="ten@pdu.edu.vn"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formValues.phone}
                    onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                    placeholder="0905..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Vai trò & Phân quyền <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'STUDENT', label: 'Sinh viên', desc: 'Xem TKB lớp, lịch thi' },
                    { id: 'LECTURER', label: 'Giảng viên', desc: 'Xem lịch dạy, khối lượng' },
                    { id: 'MANAGER', label: 'Ban Chủ nhiệm', desc: 'Xem báo cáo, KPIs, TKB' },
                    { id: 'ADMIN', label: 'Quản trị viên', desc: 'Toàn quyền cấu hình, User' },
                  ].map((r) => (
                    <label
                      key={r.id}
                      className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                        formValues.role === r.id
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{r.label}</span>
                        <input
                          type="radio"
                          name="role"
                          value={r.id}
                          checked={formValues.role === r.id}
                          onChange={() => setFormValues({ ...formValues, role: r.id as UserRole })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1">{r.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Role-specific Linkage Selector */}
              {formValues.role === 'LECTURER' && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      Liên kết với Hồ sơ Giảng viên (Thầy / Cô)
                    </label>
                    <span className="text-[11px] text-blue-600 font-medium">Khoa CNTT - PDU</span>
                  </div>
                  <select
                    value={formValues.entityId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedLec = lecturers.find((l) => l.id === selectedId);
                      if (selectedLec) {
                        const cleanName = selectedLec.fullName.replace(/^(Thầy|Cô)\s+/i, '');
                        const suggestedUsername = !editingUser
                          ? `gv_${cleanName
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '')
                              .toLowerCase()
                              .replace(/[^a-z0-9]/g, '_')}`
                          : formValues.username;

                        setFormValues({
                          ...formValues,
                          entityId: selectedLec.id,
                          fullName: selectedLec.fullName,
                          email: selectedLec.email || formValues.email,
                          phone: selectedLec.phone || formValues.phone,
                          department: selectedLec.department || formValues.department,
                          username: suggestedUsername,
                        });
                      } else {
                        setFormValues({
                          ...formValues,
                          entityId: selectedId,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn Thầy/Cô để tự động điền & liên kết --</option>
                    {lecturers.map((lec) => (
                      <option key={lec.id} value={lec.id}>
                        {lec.fullName} ({lec.lecturerCode}) - {lec.degree || 'Thạc sĩ'} - {lec.department}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-blue-700/80">
                    Khi chọn giảng viên, hệ thống sẽ tự động liên kết tài khoản này với lịch dạy và khối lượng của Thầy/Cô.
                  </p>
                </div>
              )}

              {formValues.role === 'STUDENT' && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      Liên kết với Lớp Sinh viên
                    </label>
                    <span className="text-[11px] text-emerald-600 font-medium">Khóa học & Lớp</span>
                  </div>
                  <select
                    value={formValues.entityId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedCls = classes.find((c) => c.id === selectedId || c.classCode === selectedId);
                      if (selectedCls) {
                        setFormValues({
                          ...formValues,
                          entityId: selectedCls.id || selectedCls.classCode,
                          department: `Lớp ${selectedCls.className} (${selectedCls.classCode})`,
                          fullName: formValues.fullName || `Đại diện Lớp ${selectedCls.classCode}`,
                          username: !editingUser ? `sv_${selectedCls.classCode.toLowerCase()}` : formValues.username,
                        });
                      } else {
                        setFormValues({
                          ...formValues,
                          entityId: selectedId,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Chọn Lớp sinh viên để liên kết --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.className} ({cls.classCode}) - Khóa {cls.cohort}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Department / Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Đơn vị / Bộ môn / Lớp
                  </label>
                  <input
                    type="text"
                    value={formValues.department}
                    onChange={(e) => setFormValues({ ...formValues, department: e.target.value })}
                    placeholder="ví dụ: Bộ môn KTPM, Lớp DCT23A..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mã liên kết (Entity ID)
                  </label>
                  <input
                    type="text"
                    value={formValues.entityId}
                    onChange={(e) => setFormValues({ ...formValues, entityId: e.target.value })}
                    placeholder="gv_tho hoặc cls_dct23a..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Trạng thái tài khoản
                </label>
                <select
                  value={formValues.status}
                  onChange={(e) => setFormValues({ ...formValues, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                >
                  <option value="ACTIVE">Hoạt động bình thường (ACTIVE)</option>
                  <option value="INACTIVE">Tạm khóa tài khoản (INACTIVE)</option>
                </select>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {formSubmitting ? 'Đang lưu...' : editingUser ? 'Cập nhật' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <KeyRound className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Đặt Lại Mật Khẩu</h3>
                  <p className="text-xs text-slate-500">Tài khoản: @{resetModalUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[15px] text-slate-600">
                Mật khẩu mới đã được tạo ngẫu nhiên. Bạn có thể sử dụng mật khẩu này hoặc chỉnh sửa trước khi xác nhận:
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newGeneratedPassword}
                  onChange={(e) => setNewGeneratedPassword(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  title="Sao chép mật khẩu"
                >
                  {copiedPassword ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPassword ? 'Đã chép' : 'Chép'}</span>
                </button>
              </div>

              {resetSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-xl border border-emerald-200">
                  {resetSuccess}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition"
              >
                Lưu mật khẩu mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">Xác Nhận Xóa Tài Khoản?</h3>
              <p className="text-[15px] text-slate-600">
                Bạn có chắc chắn muốn xóa tài khoản <strong>@{deleteConfirmUser.username}</strong> (
                {deleteConfirmUser.fullName}) khỏi hệ thống? Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleting}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
