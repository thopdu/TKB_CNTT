import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Plus,
  Search,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  AlertTriangle,
  Calendar,
  Building,
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  Filter,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AnnouncementNotification, NotificationType, NotificationAudience, NotificationPriority } from '../../types';

export const NotificationManagerView: React.FC = () => {
  const { currentUser, currentRole, setIsLoginModalOpen, setLoginTargetRole } = useAuth();
  const [notifications, setNotifications] = useState<AnnouncementNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedAudience, setSelectedAudience] = useState<string>('ALL');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNotification, setEditingNotification] = useState<AnnouncementNotification | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Values
  const [formValues, setFormValues] = useState<{
    title: string;
    content: string;
    type: NotificationType;
    targetAudience: NotificationAudience;
    priority: NotificationPriority;
    isPinned: boolean;
    isActive: boolean;
    relatedRoom: string;
    relatedClass: string;
    effectiveDate: string;
  }>({
    title: '',
    content: '',
    type: 'GENERAL',
    targetAudience: 'ALL',
    priority: 'MEDIUM',
    isPinned: false,
    isActive: true,
    relatedRoom: '',
    relatedClass: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const canManage = currentRole === 'MANAGER' || currentRole === 'ADMIN';

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleOpenCreate = () => {
    setEditingNotification(null);
    setFormValues({
      title: '',
      content: '',
      type: 'GENERAL',
      targetAudience: 'ALL',
      priority: 'MEDIUM',
      isPinned: false,
      isActive: true,
      relatedRoom: '',
      relatedClass: '',
      effectiveDate: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (n: AnnouncementNotification) => {
    setEditingNotification(n);
    setFormValues({
      title: n.title,
      content: n.content,
      type: n.type,
      targetAudience: n.targetAudience,
      priority: n.priority,
      isPinned: n.isPinned,
      isActive: n.isActive,
      relatedRoom: n.relatedRoom || '',
      relatedClass: n.relatedClass || '',
      effectiveDate: n.effectiveDate || new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.title.trim() || !formValues.content.trim()) {
      showToast('Tiêu đề và nội dung thông báo không được để trống', true);
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<AnnouncementNotification> = {
        ...formValues,
        createdBy: currentUser?.fullName || (currentRole === 'ADMIN' ? 'Ban Quản trị' : 'Ban Quản lý Đào tạo Khoa CNTT'),
      };

      if (editingNotification) {
        await api.updateNotification(editingNotification.id, payload);
        showToast(`Đã cập nhật thông báo: "${formValues.title}"`);
      } else {
        await api.createNotification(payload);
        showToast(`Đã phát hành thông báo mới thành công!`);
      }

      window.dispatchEvent(new CustomEvent('pdu_notifications_updated'));
      setIsModalOpen(false);
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Lỗi lưu thông báo', true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (n: AnnouncementNotification) => {
    try {
      await api.toggleNotificationPin(n.id);
      window.dispatchEvent(new CustomEvent('pdu_notifications_updated'));
      showToast(n.isPinned ? `Đã bỏ ghim "${n.title}"` : `Đã ghim "${n.title}" lên đầu`);
      fetchNotifications();
    } catch (err: any) {
      showToast('Lỗi thay đổi trạng thái ghim', true);
    }
  };

  const handleToggleActive = async (n: AnnouncementNotification) => {
    try {
      await api.toggleNotificationActive(n.id);
      window.dispatchEvent(new CustomEvent('pdu_notifications_updated'));
      showToast(n.isActive ? `Đã ẩn thông báo "${n.title}"` : `Đã kích hoạt hiển thị "${n.title}"`);
      fetchNotifications();
    } catch (err: any) {
      showToast('Lỗi thay đổi trạng thái hiển thị', true);
    }
  };

  const handleDelete = async (n: AnnouncementNotification) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn thông báo "${n.title}"?`)) {
      return;
    }

    try {
      await api.deleteNotification(n.id);
      window.dispatchEvent(new CustomEvent('pdu_notifications_updated'));
      showToast(`Đã xóa thông báo thành công`);
      fetchNotifications();
    } catch (err: any) {
      showToast('Lỗi xóa thông báo', true);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchSearch =
        !searchQuery ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.relatedRoom && n.relatedRoom.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.relatedClass && n.relatedClass.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType = selectedType === 'ALL' || n.type === selectedType;
      const matchAudience = selectedAudience === 'ALL' || n.targetAudience === selectedAudience;

      return matchSearch && matchType && matchAudience;
    });
  }, [notifications, searchQuery, selectedType, selectedAudience]);

  // KPIs
  const totalCount = notifications.length;
  const activeCount = notifications.filter((n) => n.isActive).length;
  const pinnedCount = notifications.filter((n) => n.isPinned).length;
  const urgentCount = notifications.filter((n) => n.priority === 'HIGH' || n.type === 'URGENT' || n.type === 'ROOM_CHANGE').length;

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'ROOM_CHANGE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <Building className="w-3 h-3" /> Đổi phòng / Lịch
          </span>
        );
      case 'EXAM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
            <GraduationCap className="w-3 h-3" /> Lịch thi & CBCT
          </span>
        );
      case 'URGENT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Khẩn cấp
          </span>
        );
      case 'SCHEDULE_CHANGE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Lịch học bù
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
            <Megaphone className="w-3 h-3" /> Thông báo chung
          </span>
        );
    }
  };

  const getAudienceBadge = (aud: NotificationAudience) => {
    switch (aud) {
      case 'STUDENT':
        return <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">Sinh viên</span>;
      case 'LECTURER':
        return <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Giảng viên</span>;
      default:
        return <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">Toàn trường (Tất cả)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-xs animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between"
        style={{ backgroundColor: '#054369', minHeight: '220px' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold backdrop-blur-md mb-2">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Trung Tâm Quản Lý Thông Báo & Điều Phối Học Vụ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Quản Lý Thông Báo & Phát Sóng Lịch
            </h1>
            <p className="text-[15px] text-blue-100/80 mt-1 max-w-xl">
              Phát hành và điều phối các thông báo dời phòng Nhà H, lịch thi, lịch học bù và tin tức đào tạo tới Sinh viên & Giảng viên
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {canManage ? (
              <button
                onClick={handleOpenCreate}
                className="cursor-pointer px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Thông Báo Mới</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setLoginTargetRole('MANAGER');
                  setIsLoginModalOpen(true);
                }}
                className="cursor-pointer px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs sm:text-sm font-bold backdrop-blur-md transition flex items-center gap-2"
              >
                <span>Đăng nhập Quản lý để biên tập</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 KPIs Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="text-[11px] text-blue-200 uppercase font-bold tracking-wider">Tổng thông báo</div>
            <div className="text-2xl font-black text-white mt-0.5">{totalCount}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="text-[11px] text-emerald-200 uppercase font-bold tracking-wider">Đang phát sóng</div>
            <div className="text-2xl font-black text-emerald-300 mt-0.5">{activeCount}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="text-[11px] text-amber-200 uppercase font-bold tracking-wider">Đã ghim ưu tiên</div>
            <div className="text-2xl font-black text-amber-300 mt-0.5">{pinnedCount}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="text-[11px] text-rose-200 uppercase font-bold tracking-wider">Dời phòng & Khẩn cấp</div>
            <div className="text-2xl font-black text-rose-300 mt-0.5">{urgentCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, nội dung, phòng, lớp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Loại:</span>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Tất cả thể loại</option>
            <option value="ROOM_CHANGE">Đổi phòng / Lịch Nhà H</option>
            <option value="EXAM">Lịch thi & Ca thi</option>
            <option value="SCHEDULE_CHANGE">Lịch học bù</option>
            <option value="URGENT">Khẩn cấp</option>
            <option value="GENERAL">Thông báo chung</option>
          </select>

          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 ml-2">
            <span>Đối tượng:</span>
          </div>
          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Tất cả đối tượng</option>
            <option value="STUDENT">Sinh viên</option>
            <option value="LECTURER">Giảng viên</option>
          </select>

          <button
            onClick={fetchNotifications}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
            title="Tải lại"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy thông báo nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Không có thông báo nào phù hợp với bộ lọc tìm kiếm hiện tại.
          </p>
          {canManage && (
            <button
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo thông báo mới
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredNotifications.map((noti) => (
            <div
              key={noti.id}
              className={`bg-white rounded-2xl p-5 border transition-all duration-200 shadow-xs hover:shadow-md ${
                noti.isPinned
                  ? 'border-amber-300 ring-1 ring-amber-200/60 bg-amber-50/10'
                  : 'border-slate-200/90'
              } ${!noti.isActive ? 'opacity-60 bg-slate-50/80' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  {/* Tags Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {noti.isPinned && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                        <Pin className="w-3 h-3 fill-white" /> Đã ghim
                      </span>
                    )}
                    {getTypeBadge(noti.type)}
                    {getAudienceBadge(noti.targetAudience)}
                    {!noti.isActive && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 text-slate-600">
                        Đang tạm ẩn
                      </span>
                    )}
                    {noti.relatedRoom && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-100">
                        Phòng: {noti.relatedRoom}
                      </span>
                    )}
                    {noti.relatedClass && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-100">
                        Lớp: {noti.relatedClass}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {noti.title}
                  </h3>

                  {/* Content */}
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {noti.content}
                  </p>

                  {/* Meta footer */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Phát hành: {noti.createdAt}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 font-medium">Bởi: {noti.createdBy}</span>
                    {noti.effectiveDate && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">Hiệu lực: {noti.effectiveDate}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons for Manager/Admin */}
                {canManage && (
                  <div className="flex items-center gap-1.5 shrink-0 sm:self-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      onClick={() => handleTogglePin(noti)}
                      title={noti.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                      className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        noti.isPinned
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {noti.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleToggleActive(noti)}
                      title={noti.isActive ? 'Tạm ẩn' : 'Hiển thị'}
                      className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        noti.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {noti.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(noti)}
                      title="Chỉnh sửa thông báo"
                      className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(noti)}
                      title="Xóa thông báo"
                      className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Notification */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingNotification ? 'Chỉnh Sửa Thông Báo' : 'Tạo Thông Báo Mới'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Phát sóng thông tin học vụ & thời khóa biểu Nhà H
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tiêu đề thông báo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thông báo chuyển phòng học thực hành Nhà H tuần 26..."
                  value={formValues.title}
                  onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Loại thông báo
                  </label>
                  <select
                    value={formValues.type}
                    onChange={(e) => setFormValues({ ...formValues, type: e.target.value as NotificationType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="GENERAL">Thông báo chung</option>
                    <option value="ROOM_CHANGE">Đổi phòng / Lịch Nhà H</option>
                    <option value="EXAM">Lịch thi & Ca thi</option>
                    <option value="SCHEDULE_CHANGE">Lịch học bù</option>
                    <option value="URGENT">Khẩn cấp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Đối tượng nhận tin
                  </label>
                  <select
                    value={formValues.targetAudience}
                    onChange={(e) => setFormValues({ ...formValues, targetAudience: e.target.value as NotificationAudience })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ALL">Toàn trường (Tất cả)</option>
                    <option value="STUDENT">Sinh viên</option>
                    <option value="LECTURER">Giảng viên</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nội dung chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Nhập nội dung thông báo đầy đủ, ghi rõ thời gian, phòng học, lớp liên quan..."
                  value={formValues.content}
                  onChange={(e) => setFormValues({ ...formValues, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-normal text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phòng liên quan
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: H.203, H.101"
                    value={formValues.relatedRoom}
                    onChange={(e) => setFormValues({ ...formValues, relatedRoom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Lớp liên quan
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: D22CNTT01"
                    value={formValues.relatedClass}
                    onChange={(e) => setFormValues({ ...formValues, relatedClass: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ngày hiệu lực
                  </label>
                  <input
                    type="date"
                    value={formValues.effectiveDate}
                    onChange={(e) => setFormValues({ ...formValues, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formValues.isPinned}
                    onChange={(e) => setFormValues({ ...formValues, isPinned: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Ghim lên đầu trang</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formValues.isActive}
                    onChange={(e) => setFormValues({ ...formValues, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Kích hoạt phát sóng ngay</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{editingNotification ? 'Cập Nhật' : 'Phát Hành Thông Báo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
