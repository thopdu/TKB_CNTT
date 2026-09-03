import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Check,
  AlertCircle,
  Users,
  Mail,
  Phone,
  Layers,
  Sparkles,
  Save,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Department } from '../types';
import { api } from '../services/api';

interface DepartmentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onDepartmentsChange: (departments: Department[]) => void;
  canManage: boolean;
  onDepartmentSelected?: (departmentName: string) => void;
  onRefreshData?: () => void;
}

export const DepartmentManagementModal: React.FC<DepartmentManagementModalProps> = ({
  isOpen,
  onClose,
  departments,
  onDepartmentsChange,
  canManage,
  onDepartmentSelected,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [migrateTarget, setMigrateTarget] = useState<string>('Khoa học máy tính');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form inputs
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    faculty: 'Khoa Công nghệ Thông tin',
    headName: '',
    phone: '0255.3822295',
    email: '',
    description: '',
    active: true,
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      faculty: 'Khoa Công nghệ Thông tin',
      headName: '',
      phone: '0255.3822295',
      email: '',
      description: '',
      active: true,
    });
    setEditingDept(null);
    setIsFormOpen(false);
    setErrorMsg(null);
  };

  // Open form for Create
  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Open form for Edit
  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      faculty: dept.faculty || 'Khoa Công nghệ Thông tin',
      headName: dept.headName || '',
      phone: dept.phone || '0255.3822295',
      email: dept.email || '',
      description: dept.description || '',
      active: dept.active !== false,
    });
    setIsFormOpen(true);
    setErrorMsg(null);
  };

  // Auto generate code from name if user types
  const handleNameChange = (newName: string) => {
    setFormData((prev) => {
      // If code was not manually edited or is empty, auto suggest
      if (!editingDept && (!prev.code || prev.code.startsWith('BM_'))) {
        const cleanName = newName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '_')
          .replace(/_+/g, '_')
          .slice(0, 15);
        return { ...prev, name: newName, code: cleanName ? `BM_${cleanName}` : '' };
      }
      return { ...prev, name: newName };
    });
  };

  // Handle Save (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Vui lòng nhập tên Bộ môn hoặc Đơn vị phụ trách');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (editingDept) {
        // Update
        const updated = await api.updateDepartment(editingDept.id, formData);
        const updatedList = departments.map((d) => (d.id === updated.id ? updated : d));
        onDepartmentsChange(updatedList);
        setSuccessMsg(`Đã cập nhật bộ môn "${updated.name}" thành công!`);
      } else {
        // Create
        const created = await api.createDepartment(formData);
        const updatedList = [...departments, created];
        onDepartmentsChange(updatedList);
        setSuccessMsg(`Đã thêm bộ môn / đơn vị mới "${created.name}" thành công!`);
        if (onDepartmentSelected) {
          onDepartmentSelected(created.name);
        }
      }

      resetForm();
      if (onRefreshData) {
        onRefreshData();
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu bộ môn / đơn vị');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingDept) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.deleteDepartment(deletingDept.id, migrateTarget);
      const updatedList = departments.filter((d) => d.id !== deletingDept.id);
      onDepartmentsChange(updatedList);
      setSuccessMsg(res.message || `Đã xóa bộ môn "${deletingDept.name}" thành công!`);
      setDeletingDept(null);
      if (onRefreshData) {
        onRefreshData();
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi xóa bộ môn');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered departments list
  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const term = searchTerm.toLowerCase().trim();
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.code.toLowerCase().includes(term) ||
        (d.faculty && d.faculty.toLowerCase().includes(term)) ||
        (d.headName && d.headName.toLowerCase().includes(term)) ||
        (d.email && d.email.toLowerCase().includes(term))
    );
  }, [departments, searchTerm]);

  // Remaining departments for migration selection (exclude the one being deleted)
  const migrationCandidates = useMemo(() => {
    if (!deletingDept) return departments;
    return departments.filter((d) => d.id !== deletingDept.id);
  }, [departments, deletingDept]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 my-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-scaleUp overflow-hidden">
        {/* Modal Header */}
        <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                Quản Lý Bộ Môn & Đơn Vị Phụ Trách
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                  {departments.length} đơn vị
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thêm, sửa, xóa và phân công Trưởng bộ môn thuộc Khoa Công nghệ Thông tin • Đại học Phạm Văn Đồng
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="shrink-0 mx-5 sm:mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="shrink-0 mx-5 sm:mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMsg}</div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-500 hover:text-emerald-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search & Actions Bar */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bộ môn, mã, trưởng bộ môn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2 shrink-0">
            {canManage ? (
              <button
                onClick={isFormOpen ? resetForm : handleOpenCreate}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isFormOpen
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                }`}
              >
                {isFormOpen ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    Đóng Form
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Thêm Bộ Môn Mới
                  </>
                )}
              </button>
            ) : (
              <span className="text-xs text-slate-500 italic">
                Chế độ chỉ xem (Cần quyền Quản lý Đào tạo / Admin)
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5">
          {/* ADD / EDIT DEPARTMENT FORM */}
          {isFormOpen && canManage && (
            <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-blue-50/70 border border-indigo-200 rounded-3xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {editingDept ? `Chỉnh Sửa: ${editingDept.name}` : 'Thêm Bộ Môn / Đơn Vị Mới'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Hủy
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Bộ Môn / Đơn Vị Phụ Trách <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Khoa học máy tính"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã Bộ Môn
                    </label>
                    <input
                      type="text"
                      placeholder="VD: BM_KHMT"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Khoa / Trường Trực Thuộc
                    </label>
                    <input
                      type="text"
                      placeholder="Khoa Công nghệ Thông tin"
                      value={formData.faculty}
                      onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Trưởng Bộ Môn / Cán Bộ Phụ Trách
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Thầy Phạm Văn Thơ"
                      value={formData.headName}
                      onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số Điện Thoại Liên Hệ
                    </label>
                    <input
                      type="text"
                      placeholder="0255.3822295"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Liên Hệ
                    </label>
                    <input
                      type="email"
                      placeholder="bomon@pdu.edu.vn"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mô Tả / Chức Năng Nhiệm Vụ
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Mô tả tóm tắt chức năng quản lý chuyên môn của Bộ môn / Đơn vị..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-700">Đang hoạt động trong kỳ</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {editingDept ? 'Lưu Thay Đổi' : 'Thêm Bộ Môn'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* DELETE CONFIRMATION CARD */}
          {deletingDept && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-3xl space-y-4 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-rose-950 text-sm">
                    Xác Nhận Xóa Bộ Môn / Đơn Vị: {deletingDept.name}
                  </h4>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                    Bạn có chắc chắn muốn xóa bộ môn này? Nếu có giảng viên đang trực thuộc, hệ thống sẽ tự động chuyển hướng các giảng viên sang đơn vị thay thế bên dưới để đảm bảo không bị gián đoạn thời khóa biểu.
                  </p>
                </div>
              </div>

              {(deletingDept.lecturerCount ?? 0) > 0 && (
                <div className="p-3 bg-white/80 border border-rose-200 rounded-2xl space-y-2">
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-rose-600" />
                    Hiện có {deletingDept.lecturerCount} giảng viên đang thuộc bộ môn này
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Chọn đơn vị chuyển tiếp giảng viên:
                    </label>
                    <select
                      value={migrateTarget}
                      onChange={(e) => setMigrateTarget(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {migrationCandidates.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} ({d.faculty || 'Khoa CNTT'})
                        </option>
                      ))}
                      <option value="Khoa Công nghệ Thông tin">Khoa Công nghệ Thông tin</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingDept(null)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xác Nhận Xóa
                </button>
              </div>
            </div>
          )}

          {/* DEPARTMENTS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
              <span>Danh Sách Đơn Vị ({filteredDepartments.length})</span>
              <span>Cập nhật theo cơ cấu PDU</span>
            </div>

            {filteredDepartments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200/80 space-y-2">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-600">Không tìm thấy bộ môn nào</div>
                <div className="text-xs text-slate-400">
                  Hãy thử tìm kiếm bằng từ khóa khác hoặc bấm nút "Thêm Bộ Môn Mới".
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredDepartments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-4 sm:p-5 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-2xs transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {dept.code}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                            {dept.name}
                          </h4>
                          {!dept.active && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                              Tạm ngưng
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                          <span className="font-medium text-slate-600">
                            {dept.faculty || 'Khoa Công nghệ Thông tin'}
                          </span>
                          {dept.headName && (
                            <>
                              <span>•</span>
                              <span className="text-slate-700 font-semibold flex items-center gap-1">
                                Trưởng BM: <strong>{dept.headName}</strong>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right-side Badges & Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Lecturer count badge */}
                        <div
                          className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-100 text-xs font-bold flex items-center gap-1.5"
                          title="Số lượng giảng viên đang thuộc bộ môn này"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>{dept.lecturerCount ?? 0} Giảng viên</span>
                        </div>

                        {canManage && (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => handleOpenEdit(dept)}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition cursor-pointer"
                              title="Chỉnh sửa bộ môn"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingDept(dept);
                                setIsFormOpen(false);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg transition cursor-pointer"
                              title="Xóa bộ môn"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact details & description */}
                    {(dept.phone || dept.email || dept.description) && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex flex-wrap items-center gap-3">
                          {dept.phone && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {dept.phone}
                            </span>
                          )}
                          {dept.email && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {dept.email}
                            </span>
                          )}
                        </div>
                        {dept.description && (
                          <p className="text-[11px] text-slate-400 italic max-w-md line-clamp-1">
                            {dept.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Modal Footer */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Khoa CNTT • Trường Đại học Phạm Văn Đồng (PDU)
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
