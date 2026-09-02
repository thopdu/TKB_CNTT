import React, { useState, useEffect } from 'react';
import {
  Database,
  Globe,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Activity,
  Zap,
  Layers,
  FileCode,
  ArrowRight,
  ExternalLink,
  History,
  Lock,
  FileSpreadsheet,
  Link2,
  Check,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DataSource, SyncLog, AuditLog } from '../../types';

export const DataSourceAdminView: React.FC = () => {
  const { currentUser, currentRole, setIsLoginModalOpen, setLoginTargetRole } = useAuth();

  const [sources, setSources] = useState<DataSource[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Google Sheet Import Tool in Admin
  const [sheetUrlInput, setSheetUrlInput] = useState('https://docs.google.com/spreadsheets/d/1kCHr0jwbRtJ9oXhW9buBpRDX6XNOldvp08M5XqYpwEI/edit?usp=sharing');
  const [targetType, setTargetType] = useState<'TIMETABLE' | 'EXAM'>('TIMETABLE');
  const [weekNumber, setWeekNumber] = useState<number>(6);
  const [weekTitle, setWeekTitle] = useState('Tuần 06 (Đồng bộ Google Sheet)');
  const [sheetImporting, setSheetImporting] = useState(false);
  const [sheetMessage, setSheetMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Edit / Add modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Partial<DataSource> | null>(null);

  // Pipeline Preview modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Test connection state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string; time: number } | null>(
    null
  );

  // Syncing state
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([api.getSources(), api.getSyncLogs(), api.getAuditLogs()])
      .then(([srcs, sLogs, aLogs]) => {
        if (Array.isArray(srcs)) setSources(srcs);
        if (Array.isArray(sLogs)) setSyncLogs(sLogs);
        if (Array.isArray(aLogs)) setAuditLogs(aLogs);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // If user is not authenticated or not ADMIN
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 max-w-xl mx-auto text-center border border-slate-200/80 shadow-lg space-y-5 my-8 sm:my-12 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-md shadow-purple-500/10">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-800 rounded-full text-xs font-semibold border border-purple-200 mb-2">
            <Lock className="w-3.5 h-3.5" />
            Phân hệ Quản trị Nguồn Dữ liệu
          </span>
          <h2 className="text-xl font-bold text-slate-900">Yêu Cầu Xác Thực Quyền Quản Trị</h2>
          <p className="text-[15px] text-slate-600 leading-relaxed mt-2">
            Khu vực tùy chỉnh nguồn cào dữ liệu (URL thời khóa biểu, lịch thi, cấu hình WordPress REST API, chu kỳ tự động sync) chỉ dành riêng cho tài khoản Quản trị viên (Admin) đã đăng nhập.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setLoginTargetRole('ADMIN');
              setIsLoginModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Đăng nhập tài khoản Quản trị (Admin)</span>
          </button>
        </div>

        <div className="text-[12px] text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
          Tài khoản Admin mẫu: <span className="font-mono font-bold text-slate-700">admin</span> / Mật khẩu: <span className="font-mono font-bold text-slate-700">admin123</span>
        </div>
      </div>
    );
  }

  const handleTestConnection = async (src: DataSource) => {
    setTestingId(src.id);
    setTestResult(null);
    try {
      const res = await api.testConnection(src.url);
      setTestResult({
        id: src.id,
        success: res.reachable,
        message: res.message,
        time: res.responseTimeMs,
      });
    } catch {
      setTestResult({
        id: src.id,
        success: false,
        message: 'Lỗi mạng khi kiểm tra kết nối',
        time: 0,
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleSyncNow = async (id: string) => {
    setSyncingId(id);
    try {
      await api.syncSource(id);
      fetchAll();
    } catch (e) {
      alert('Lỗi đồng bộ nguồn');
    } finally {
      setSyncingId(null);
    }
  };

  const handleOpenPreview = async (url: string) => {
    setIsPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const res = await api.previewImport(url);
      setPreviewData(res);
    } catch {
      setPreviewData({ error: 'Không thể xem trước dữ liệu' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource) return;

    if (editingSource.id) {
      await api.updateSource(editingSource.id, editingSource);
    } else {
      await api.addSource(editingSource);
    }

    setIsEditModalOpen(false);
    setEditingSource(null);
    fetchAll();
  };

  const handleDeleteSource = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa cấu hình nguồn dữ liệu này không?')) {
      await api.deleteSource(id);
      fetchAll();
    }
  };

  const handleQuickGoogleSheetImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrlInput.trim()) {
      setSheetMessage({ success: false, text: 'Vui lòng nhập đường link Google Sheet hợp lệ' });
      return;
    }

    setSheetImporting(true);
    setSheetMessage(null);

    try {
      if (targetType === 'TIMETABLE') {
        const res = await api.importTimetableGoogleSheet({
          url: sheetUrlInput.trim(),
          weekNumber: Number(weekNumber),
          title: weekTitle.trim() || undefined,
          isCurrent: true,
        });
        if (res.success) {
          setSheetMessage({
            success: true,
            text: `Thành công! Đã nạp ${res.week.title} (${res.classesCount} lớp học phần, ${res.entriesCount} buổi học) vào hệ thống.`,
          });
          fetchAll();
        }
      } else {
        const res = await api.importExamsGoogleSheet({
          url: sheetUrlInput.trim(),
          replaceExisting: false,
        });
        if (res.success) {
          setSheetMessage({
            success: true,
            text: `Thành công! Đã nạp ${res.importedCount} ca thi từ Google Sheet vào lịch thi chung.`,
          });
          fetchAll();
        }
      }
    } catch (err: any) {
      setSheetMessage({
        success: false,
        text: err.message || 'Lỗi khi trích xuất dữ liệu từ Google Sheet. Vui lòng kiểm tra quyền chia sẻ công khai.',
      });
    } finally {
      setSheetImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-center"
        style={{ backgroundColor: '#054369', minHeight: '150px' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-3 border border-white/10">
              <Shield className="w-3.5 h-3.5 text-blue-300" />
              Khu vực Quản trị Hệ thống (Admin Portal)
            </div>
            <h1 className="text-[25px] font-extrabold tracking-tight leading-tight">
              Quản Lý Tùy Chỉnh Nguồn Dữ Liệu
            </h1>
            <p className="text-[15px] text-blue-100/80 mt-1 max-w-2xl">
              Cấu hình URL nguồn cào (ví dụ:{' '}
              <span className="font-mono text-blue-200 underline">
                https://cntt.pdu.edu.vn/luu-tru/category/thoi-khoa-bieu
              </span>
              ), chu kỳ đồng bộ và nạp trực tiếp từ Google Sheet.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingSource({
                name: '',
                category: 'TIMETABLE',
                url: 'https://cntt.pdu.edu.vn/luu-tru/category/thoi-khoa-bieu',
                syncFrequency: 'EVERY_6H',
                status: 'ACTIVE',
                description: '',
              });
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-500/30 self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nguồn dữ liệu mới</span>
          </button>
        </div>
      </div>

      {/* QUICK GOOGLE SHEET IMPORT & EMERGENCY OVERRIDE CARD */}
      <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 text-white border border-emerald-800/80 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Nạp Dữ Liệu Trực Tiếp Từ Google Sheet</span>
                <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-400/30">
                  Dành cho Admin & Quản lý
                </span>
              </h2>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Khi không thể cào tự động từ URL hoặc cần cập nhật tuần học/lịch thi khẩn cấp từ bảng tính Google Sheet.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSheetUrlInput('https://docs.google.com/spreadsheets/d/1kCHr0jwbRtJ9oXhW9buBpRDX6XNOldvp08M5XqYpwEI/edit?usp=sharing');
              setSheetMessage(null);
            }}
            className="text-xs font-bold text-emerald-300 hover:text-white bg-emerald-800/50 hover:bg-emerald-700/60 px-3 py-1.5 rounded-xl border border-emerald-600/40 transition cursor-pointer self-start sm:self-auto"
          >
            Dùng liên kết Google Sheet mẫu
          </button>
        </div>

        {sheetMessage && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
              sheetMessage.success
                ? 'bg-emerald-900/60 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
            }`}
          >
            {sheetMessage.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed">{sheetMessage.text}</div>
          </div>
        )}

        <form onSubmit={handleQuickGoogleSheetImport} className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
          <div className="lg:col-span-3">
            <label className="text-[11px] font-bold text-emerald-200 uppercase tracking-wide block mb-1">
              Loại dữ liệu đích
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-900/80 border border-emerald-600/40 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 font-semibold"
            >
              <option value="TIMETABLE">Thời khóa biểu tuần</option>
              <option value="EXAM">Lịch thi học kỳ</option>
            </select>
          </div>

          <div className="lg:col-span-5">
            <label className="text-[11px] font-bold text-emerald-200 uppercase tracking-wide block mb-1">
              Google Sheet URL
            </label>
            <input
              type="url"
              required
              value={sheetUrlInput}
              onChange={(e) => setSheetUrlInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
              className="w-full px-3.5 py-2 text-xs bg-slate-900/80 border border-emerald-600/40 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
            />
          </div>

          {targetType === 'TIMETABLE' ? (
            <>
              <div className="lg:col-span-2">
                <label className="text-[11px] font-bold text-emerald-200 uppercase tracking-wide block mb-1">
                  Tuần số
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  required
                  value={weekNumber}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setWeekNumber(v);
                    setWeekTitle(`Tuần ${v < 10 ? '0' + v : v} (Đồng bộ Google Sheet)`);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-900/80 border border-emerald-600/40 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold"
                />
              </div>

              <div className="lg:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={sheetImporting}
                  className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {sheetImporting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{sheetImporting ? 'Đang nạp...' : 'Nạp Tuần Mới'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="lg:col-span-4 flex items-end">
              <button
                type="submit"
                disabled={sheetImporting}
                className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                {sheetImporting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{sheetImporting ? 'Đang nạp...' : 'Nạp Lịch Thi Mới'}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Sources List Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            Danh Sách Nguồn Dữ Liệu Đã Cấu Hình ({sources.length})
          </h2>
          <button
            onClick={fetchAll}
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới danh sách
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((src) => {
              const isTesting = testingId === src.id;
              const isSyncing = syncingId === src.id;
              const hasTest = testResult && testResult.id === src.id;

              return (
                <div
                  key={src.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-purple-300 hover:shadow-lg transition-all space-y-4"
                >
                  {/* Top Bar: Name, Category & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900">{src.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              src.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {src.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
                          </span>
                        </div>
                        <p className="text-[15px] text-slate-500 mt-0.5">{src.description}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenPreview(src.url)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                        title="Xem trước kết quả chuẩn hóa dữ liệu"
                      >
                        <FileCode className="w-3.5 h-3.5 text-slate-600" />
                        <span>Xem Pipeline</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingSource(src);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 rounded-xl transition"
                        title="Sửa cấu hình URL / Tần suất"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteSource(src.id)}
                        className="p-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 rounded-xl transition"
                        title="Xóa nguồn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* URL Display */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] shrink-0">
                        URL Cào:
                      </span>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-purple-700 hover:underline truncate flex items-center gap-1"
                      >
                        {src.url}
                        <ExternalLink className="w-3 h-3 shrink-0 inline" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTestConnection(src)}
                        disabled={isTesting}
                        className="px-3 py-1 bg-white border border-slate-200 hover:border-purple-300 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition disabled:opacity-50"
                      >
                        {isTesting ? 'Đang kiểm tra...' : '⚡ Test Kết Nối'}
                      </button>

                      <button
                        onClick={() => handleSyncNow(src.id)}
                        disabled={isSyncing}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Test Connection Live Result Banner */}
                  {hasTest && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                        testResult.success
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-red-50 text-red-900 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {testResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                        <span>{testResult.message}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold">
                        Độ trễ: {testResult.time}ms
                      </span>
                    </div>
                  )}

                  {/* Metadata strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-slate-100 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Loại dữ liệu</span>
                      <span className="font-semibold text-slate-800">{src.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Chu kỳ đồng bộ</span>
                      <span className="font-semibold text-slate-800">{src.syncFrequency}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Đồng bộ gần nhất</span>
                      <span className="font-semibold text-slate-800">{src.lastSyncedAt || 'Chưa sync'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Người cập nhật</span>
                      <span className="font-semibold text-slate-800">{src.updatedBy || 'admin'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sync Logs Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-purple-600" />
          Nhật Ký Đồng Bộ & Crawl Dữ Liệu (Sync Logs)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-y border-slate-200">
                <th className="py-2.5 px-3 font-bold">Thời gian</th>
                <th className="py-2.5 px-3 font-bold">Nguồn dữ liệu</th>
                <th className="py-2.5 px-3 font-bold">Trạng thái</th>
                <th className="py-2.5 px-3 font-bold text-center">Bản ghi thêm</th>
                <th className="py-2.5 px-3 font-bold text-center">Bản ghi cập nhật</th>
                <th className="py-2.5 px-3 font-bold text-center">Thời gian chạy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {syncLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono text-slate-600">{log.syncedAt}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{log.sourceName}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-emerald-700">
                    +{log.recordsInserted}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-blue-700">
                    ~{log.recordsUpdated}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-500">{log.durationMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {isEditModalOpen && editingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingSource.id ? 'Cập Nhật Nguồn Dữ Liệu' : 'Thêm Nguồn Dữ Liệu Mới'}
            </h3>

            <form onSubmit={handleSaveSource} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Tên nguồn</label>
                <input
                  type="text"
                  required
                  value={editingSource.name || ''}
                  onChange={(e) => setEditingSource({ ...editingSource, name: e.target.value })}
                  placeholder="Ví dụ: Thời khóa biểu Khoa CNTT (Học kỳ 2)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Đường dẫn URL Nguồn (Có thể tùy chỉnh)
                </label>
                <input
                  type="url"
                  required
                  value={editingSource.url || ''}
                  onChange={(e) => setEditingSource({ ...editingSource, url: e.target.value })}
                  placeholder="https://cntt.pdu.edu.vn/luu-tru/category/thoi-khoa-bieu"
                  className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-purple-800 font-semibold"
                />
                <p className="text-[15px] text-slate-400 mt-1">
                  Nhập URL từ cổng đào tạo CNTT PDU hoặc nguồn API JSON / XML.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Loại danh mục</label>
                  <select
                    value={editingSource.category || 'TIMETABLE'}
                    onChange={(e) =>
                      setEditingSource({ ...editingSource, category: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="TIMETABLE">Thời khóa biểu (TKB)</option>
                    <option value="EXAM_SCHEDULE">Lịch thi học kỳ</option>
                    <option value="ROOM_CATALOG">Cơ sở phòng học (Nhà H)</option>
                    <option value="CURRICULUM">Chương trình đào tạo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Chu kỳ đồng bộ</label>
                  <select
                    value={editingSource.syncFrequency || 'EVERY_6H'}
                    onChange={(e) =>
                      setEditingSource({ ...editingSource, syncFrequency: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="EVERY_6H">Mỗi 6 tiếng (Khuyến nghị)</option>
                    <option value="EVERY_12H">Mỗi 12 tiếng</option>
                    <option value="DAILY">Hàng ngày (00:00)</option>
                    <option value="MANUAL">Chỉ đồng bộ thủ công</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={2}
                  value={editingSource.description || ''}
                  onChange={(e) => setEditingSource({ ...editingSource, description: e.target.value })}
                  placeholder="Ghi chú về nguồn dữ liệu này..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingSource(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-500/20"
                >
                  Lưu cấu hình nguồn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Ingestion Pipeline Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-purple-600" />
                Data Ingestion Pipeline Preview
              </h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {previewLoading ? (
              <div className="py-16 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                Đang cào & chạy pipeline chuẩn hóa dữ liệu từ nguồn...
              </div>
            ) : previewData ? (
              <div className="space-y-4 text-xs">
                {/* Pipeline Flow Steps */}
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-2xl border border-purple-200 text-[11px] font-bold text-purple-900">
                  <span>1. Cào HTML/JSON</span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-500" />
                  <span>2. Parser</span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-500" />
                  <span>3. Chuẩn hóa Nhà H</span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-500" />
                  <span>4. Lưu trữ DB</span>
                </div>

                <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-64">
                  <pre>{JSON.stringify(previewData, null, 2)}</pre>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
