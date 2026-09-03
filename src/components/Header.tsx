import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bell,
  Search,
  LogIn,
  LogOut,
  Clock,
  ArrowRight,
  User as UserIcon,
  GraduationCap,
  MapPin,
  Building2,
  Pin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
  X,
  FileText,
  ExternalLink,
  Info,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ScheduleChange, AnnouncementNotification, NotificationType } from '../types';

export const Header: React.FC<{ onGlobalSearchSelect?: (item: any) => void }> = () => {
  const {
    currentUser,
    currentRole,
    logout,
    setIsLoginModalOpen,
    setIsAIDrawerOpen,
    setActiveTab,
  } = useAuth();

  const [changes, setChanges] = useState<ScheduleChange[]>([]);
  const [pinnedNotifications, setPinnedNotifications] = useState<AnnouncementNotification[]>([]);
  const [allNotifications, setAllNotifications] = useState<AnnouncementNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<'pinned' | 'changes'>('pinned');
  const [selectedNotif, setSelectedNotif] = useState<AnnouncementNotification | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchAllData = () => {
    // 1. Fetch Schedule Changes
    api.getScheduleChanges().then((data) => {
      if (Array.isArray(data)) setChanges(data);
    });

    // 2. Fetch Active & Pinned Announcements
    api.getNotifications({ activeOnly: true }).then((data) => {
      if (Array.isArray(data)) {
        setAllNotifications(data);
        const pinned = data.filter((n) => n.isPinned && n.isActive);
        setPinnedNotifications(pinned);
      }
    });
  };

  useEffect(() => {
    fetchAllData();

    const handleUpdate = () => {
      fetchAllData();
    };

    window.addEventListener('pdu_notifications_updated', handleUpdate);
    window.addEventListener('pdu_schedules_updated', handleUpdate);

    const interval = setInterval(handleUpdate, 20000);

    return () => {
      window.removeEventListener('pdu_notifications_updated', handleUpdate);
      window.removeEventListener('pdu_schedules_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

      {/* Notification Bell Dropdown */}
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const queryRes = await api.queryTimetable(undefined, undefined, searchQuery);
        if (queryRes && Array.isArray(queryRes.results)) {
          setSearchResults(queryRes.results.slice(0, 5));
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getTypeStyle = (type?: NotificationType) => {
    switch (type) {
      case 'URGENT':
        return {
          bg: 'bg-rose-500 text-white',
          border: 'border-rose-300',
          label: 'Khẩn cấp',
        };
      case 'ROOM_CHANGE':
        return {
          bg: 'bg-amber-500 text-white',
          border: 'border-amber-300',
          label: 'Đổi phòng / Lịch',
        };
      case 'EXAM':
        return {
          bg: 'bg-purple-600 text-white',
          border: 'border-purple-300',
          label: 'Lịch thi & CBCT',
        };
      case 'SCHEDULE_CHANGE':
        return {
          bg: 'bg-blue-600 text-white',
          border: 'border-blue-300',
          label: 'Lịch học bù',
        };
      default:
        return {
          bg: 'bg-teal-600 text-white',
          border: 'border-teal-300',
          label: 'Thông báo chung',
        };
    }
  };

  const totalUnreadCount = (pinnedNotifications.length > 0 ? pinnedNotifications.length : 0) + changes.length;

  return (
    <header className="sticky top-0 z-40 bg-[#0b386f] text-white border-b border-[#054369] shadow-sm">
      {/* 1. Main Navigation Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#054369]">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* PDU Brand & Crest */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group py-1 min-w-0"
            onClick={() => {
              setActiveTab('home');
            }}
            title="Trường Đại học Phạm Văn Đồng - Chọn vai trò người dùng (Home)"
          >
            {/* Logo Emblem Badge */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-1 border border-white/30 group-hover:border-blue-300 group-hover:scale-105 flex items-center justify-center shadow-xs transition-all shrink-0">
              <img
                src="/pdu-emblem.png"
                alt="Logo Trường Đại học Phạm Văn Đồng"
                className="w-full h-full object-contain"
              />
            </div>

            {/* School & Department Title */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-bold text-white tracking-tight text-xs sm:text-base md:text-lg group-hover:text-blue-200 transition-colors truncate">
                  TRƯỜNG ĐẠI HỌC PHẠM VĂN ĐỒNG
                </span>
                <span className="hidden xs:inline-flex items-center px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium bg-white/10 text-blue-100 border border-white/15 rounded-md shrink-0">
                  Khoa CNTT
                </span>
              </div>
              <div className="hidden xs:flex items-center gap-2 text-xs text-blue-200/70 font-normal mt-0.5 truncate">
                <span className="flex items-center gap-1 shrink-0">
                  <MapPin className="w-3 h-3 text-blue-300" />
                  Quảng Ngãi
                </span>
                <span className="text-blue-400/40">•</span>
                <span className="flex items-center gap-1 shrink-0">
                  <Building2 className="w-3 h-3 text-blue-300" />
                  Nhà H
                </span>
                <span className="text-blue-400/40 hidden md:inline">•</span>
                <span className="text-blue-200/80 hidden md:inline truncate">Chọn vai trò & Cổng thông tin đào tạo</span>
              </div>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-3 relative">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm học phần, giảng viên, phòng Nhà H..."
                className="w-full pl-9.5 pr-4 py-1.5 text-sm bg-white text-[#020218] placeholder:text-slate-400 border border-slate-200 focus:border-blue-500 rounded-lg focus:outline-none transition-colors"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Live Search Popup */}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 text-slate-800 rounded-xl shadow-lg p-2 z-50 animate-in fade-in">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span>Kết quả tìm kiếm</span>
                  <span className="text-blue-700 font-mono font-medium">{searchResults.length} kết quả</span>
                </div>
                {searchResults.map((item, i) => (
                  <div
                    key={item.id || i}
                    onClick={() => {
                      setActiveTab('timetable');
                      setSearchQuery('');
                    }}
                    className="p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {item.subject || item.courseName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.time || item.period} • Phòng <span className="font-semibold text-slate-700">{item.room || item.roomCode}</span> • Lớp <span className="text-slate-700">{item.className || item.classCode}</span>
                      </div>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {item.teacher || item.lecturerName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Actions: PDU AI Assistant, Notification, User / Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* PDU AI Assistant Button - Always accessible on Large Screens & Responsive */}
            <button
              onClick={() => setIsAIDrawerOpen(true)}
              className="cursor-pointer flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/40 rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
              title="Trợ lý PDU AI - Tra cứu thông minh lịch học, phòng thi, phòng trống Nhà H"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
              <span className="font-semibold tracking-wide">PDU AI</span>
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative shrink-0" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="cursor-pointer relative p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-white/10 shrink-0"
                title="Thông báo hệ thống & Biến động lịch"
              >
                <Bell className="w-4.5 h-4.5" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-[#054369] shadow-xs">
                    {totalUnreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Menu */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white border border-slate-200 text-slate-800 rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in">
                  {/* Header & Tabs */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => setNotifTab('pinned')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                          notifTab === 'pinned'
                            ? 'bg-white text-blue-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Pin className="w-3 h-3 text-amber-600" />
                        <span>Đã ghim ({pinnedNotifications.length})</span>
                      </button>
                      <button
                        onClick={() => setNotifTab('changes')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                          notifTab === 'changes'
                            ? 'bg-white text-blue-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>Biến động TKB ({changes.length})</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('notifications');
                        setIsNotifOpen(false);
                      }}
                      className="cursor-pointer text-[11px] text-blue-700 hover:underline font-bold"
                    >
                      Xem tất cả
                    </button>
                  </div>

                  {/* Content for Tab: Pinned Announcements */}
                  {notifTab === 'pinned' ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {pinnedNotifications.length === 0 ? (
                        <div className="text-center py-6 text-slate-400">
                          <Pin className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                          <p className="text-xs">Chưa có thông báo nào được ghim lên đầu.</p>
                        </div>
                      ) : (
                        pinnedNotifications.map((n) => {
                          const badge = getTypeStyle(n.type);
                          return (
                            <div
                              key={n.id}
                              onClick={() => {
                                setSelectedNotif(n);
                                setIsNotifOpen(false);
                              }}
                              className="p-3 bg-slate-50/90 hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-300 rounded-xl transition cursor-pointer space-y-1.5 group"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${badge.bg}`}>
                                    {badge.label}
                                  </span>
                                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                    <Pin className="w-2.5 h-2.5" /> Đã ghim
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {n.effectiveDate || n.createdAt.split(' ')[0]}
                                </span>
                              </div>

                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-800 transition-colors line-clamp-2">
                                {n.title}
                              </h4>

                              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                {n.content}
                              </p>

                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                                <span>Tác giả: {n.createdBy || 'Ban Đào tạo'}</span>
                                <span className="text-blue-700 font-bold group-hover:underline flex items-center gap-0.5">
                                  Chi tiết <ArrowRight className="w-2.5 h-2.5" />
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    /* Content for Tab: Schedule Changes */
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {changes.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">Không có thay đổi lịch nào mới.</p>
                      ) : (
                        changes.map((chg) => (
                          <div key={chg.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                            <div className="font-semibold text-slate-900 flex items-center justify-between">
                              <span>{chg.courseName}</span>
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono font-medium">
                                {chg.classCode}
                              </span>
                            </div>
                            <div className="text-slate-600 mt-1 flex items-center gap-1">
                              <span className="line-through text-slate-400">{chg.oldValue}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className="font-medium text-blue-700">{chg.newValue}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">Cập nhật lúc: {chg.detectedAt}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Footer Link */}
                  <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setActiveTab('notifications');
                        setIsNotifOpen(false);
                      }}
                      className="w-full py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition cursor-pointer"
                    >
                      Mở Bảng Quản lý Thông báo Khoa CNTT
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Auth / User Status with Username */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 pr-1.5 py-1 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg transition">
                <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="text-left leading-tight hidden sm:block">
                  <div className="text-xs font-semibold text-white font-mono flex items-center gap-1">
                    {currentUser.username}
                    <span className="text-[9px] px-1 py-0.2 bg-white/20 text-blue-100 rounded font-sans uppercase font-bold">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-200 truncate max-w-[120px]">
                    {currentUser.fullName}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="cursor-pointer p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-md transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/20 shadow-xs"
              >
                <LogIn className="w-4 h-4 text-blue-200" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT THÔNG BÁO (Khi bấm vào thông báo từ dropdown) */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#0b386f] to-[#072449] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center shadow-xs">
                  <Pin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-400 text-slate-900 text-[10px] font-black rounded-md">
                      THÔNG BÁO GHIM
                    </span>
                    <span className="px-2 py-0.5 bg-white/20 text-blue-100 text-[10px] font-bold rounded-md">
                      {getTypeStyle(selectedNotif.type).label}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold mt-1 text-white">Chi tiết thông báo</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-snug">
                  {selectedNotif.title}
                </h2>
                <div className="flex items-center gap-3 text-slate-500 mt-2 text-[11px] flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Hiệu lực: {selectedNotif.effectiveDate || selectedNotif.createdAt}
                  </span>
                  <span>•</span>
                  <span>Tác giả: <strong className="text-slate-800">{selectedNotif.createdBy || 'Ban Quản lý Đào tạo Khoa CNTT'}</strong></span>
                </div>
              </div>

              {/* Extra context: Room & Class affected */}
              {(selectedNotif.relatedRoom || selectedNotif.relatedClass) && (
                <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-blue-900 uppercase">Phạm vi áp dụng:</div>
                  <div className="flex items-center gap-3 text-slate-700">
                    {selectedNotif.relatedRoom && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-blue-600" />
                        Phòng: <strong>{selectedNotif.relatedRoom} (Nhà H)</strong>
                      </span>
                    )}
                    {selectedNotif.relatedClass && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-indigo-600" />
                        Lớp: <strong>{selectedNotif.relatedClass}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Full Content */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-800 leading-relaxed whitespace-pre-line text-xs font-normal">
                {selectedNotif.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedNotif(null);
                  setActiveTab('notifications');
                }}
                className="px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100/70 rounded-xl transition cursor-pointer"
              >
                Mở danh sách thông báo
              </button>
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-5 py-2 bg-[#0b386f] text-white text-xs font-bold rounded-xl hover:bg-blue-800 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
