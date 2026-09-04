import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  MapPin,
  User,
  GraduationCap,
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Building2,
  ChevronRight,
  Filter,
  Search,
  X,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Schedule, StudentClass, Lecturer } from '../../types';

export const TodayScheduleView: React.FC = () => {
  const { currentRole, selectedClass, setSelectedClass, selectedLecturerId, setSelectedLecturerId, setActiveTab } =
    useAuth();

  const [loading, setLoading] = useState(true);
  const [todayData, setTodayData] = useState<{
    date: string;
    weekdayName: string;
    totalClasses: number;
    totalPeriods: number;
    schedules: Schedule[];
  } | null>(null);

  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);

  // Prominent filter states for Today Schedule
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([api.getClasses(), api.getLecturers()]).then(([cls, lecs]) => {
      if (Array.isArray(cls)) setClasses(cls);
      if (Array.isArray(lecs)) setLecturers(lecs);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const entityId = currentRole === 'LECTURER' ? selectedLecturerId : selectedClass;
    api
      .getTodaySchedule(currentRole, entityId)
      .then((res) => {
        setTodayData(res);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentRole, selectedClass, selectedLecturerId]);

  const currentLecturer = useMemo(() => {
    return lecturers.find((l) => l.id === selectedLecturerId);
  }, [lecturers, selectedLecturerId]);

  const currentLecturerName = currentLecturer ? currentLecturer.fullName : 'Thầy/Cô';

  // Filtered schedules based on session and search term
  const filteredSchedules = useMemo(() => {
    if (!todayData || !todayData.schedules) return [];
    return todayData.schedules.filter((item) => {
      const isMorning = item.periodStart <= 5;
      const matchSession =
        sessionFilter === 'ALL' ||
        (sessionFilter === 'MORNING' && isMorning) ||
        (sessionFilter === 'AFTERNOON' && !isMorning);

      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        item.courseName.toLowerCase().includes(term) ||
        item.courseCode.toLowerCase().includes(term) ||
        item.roomCode.toLowerCase().includes(term) ||
        item.lecturerName.toLowerCase().includes(term) ||
        item.classCode.toLowerCase().includes(term);

      return matchSession && matchSearch;
    });
  }, [todayData, sessionFilter, searchTerm]);

  const hasActiveTimelineFilters = sessionFilter !== 'ALL' || searchTerm.trim() !== '';

  const handleResetTimelineFilters = () => {
    setSessionFilter('ALL');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-center"
        style={{ backgroundColor: '#054369', minHeight: '150px' }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-3 border border-white/20 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              {todayData ? `${todayData.weekdayName}, ngày ${todayData.date}` : 'Hôm nay'} • Tuần 05 (Khoa CNTT - PDU)
            </div>
            <h1 className="text-[25px] font-extrabold tracking-tight leading-tight">
              {currentRole === 'LECTURER' ? 'Lịch Giảng Dạy Hôm Nay' : 'Lịch Học Hôm Nay'}
            </h1>
            <p className="text-[15px] text-blue-100/80 mt-1 max-w-xl">
              {currentRole === 'LECTURER'
                ? 'Thông tin ca giảng và phòng học Nhà H được phân công trong ngày của Thầy/Cô'
                : 'Tra cứu nhanh tiết học, phòng học Nhà H và giảng viên phụ trách theo lớp'}
            </p>
          </div>

          {/* Quick Selectors / Filter Pill */}
          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border-2 border-white/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-lg">
            {currentRole === 'LECTURER' ? (
              <div className="min-w-[200px]">
                <label className="block text-[11px] font-extrabold text-blue-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-blue-400" />
                  Chọn Giảng viên
                </label>
                <select
                  value={selectedLecturerId}
                  onChange={(e) => setSelectedLecturerId(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl border border-blue-400/40 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer shadow-2xs"
                >
                  {lecturers.map((lec) => (
                    <option key={lec.id} value={lec.id} className="bg-slate-900 text-white">
                      {lec.fullName}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="min-w-[200px]">
                <label className="block text-[11px] font-extrabold text-blue-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3 text-blue-400" />
                  Chọn Lớp sinh viên
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl border border-blue-400/40 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer shadow-2xs"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.classCode} className="bg-slate-900 text-white">
                      {cls.className} ({cls.classCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setActiveTab('timetable')}
              className="mt-auto px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Xem cả tuần</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-blue-200 uppercase font-semibold">Số môn hôm nay</div>
            <div className="text-xl font-extrabold mt-0.5">{todayData?.totalClasses || 0} môn</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-blue-200 uppercase font-semibold">Tổng số tiết</div>
            <div className="text-xl font-extrabold mt-0.5">{todayData?.totalPeriods || 0} tiết</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-blue-200 uppercase font-semibold">Khu vực phòng</div>
            <div className="text-xl font-extrabold mt-0.5">Nhà H (3 tầng)</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-blue-200 uppercase font-semibold">Trạng thái TKB</div>
            <div className="text-xl font-extrabold mt-0.5 text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Đã cập nhật
            </div>
          </div>
        </div>
      </div>

      {/* MASTER CARD: TIMELINE LỊCH HỌC VỚI BỘ LỌC NỔI BẬT & ACTIVE FILTER RIBBON */}
      <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-md overflow-hidden border-t-4 border-t-blue-600">
        {/* CARD-HEADER: BỘ LỌC NỔI BẬT */}
        <div className="card-header bg-gradient-to-b from-blue-50/70 via-slate-50/90 to-slate-100/95 border-b-2 border-slate-300 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm ring-4 ring-blue-500/20 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                    Timeline Lịch Học & Giảng Dạy Hôm Nay
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-2xs">
                    {todayData ? todayData.weekdayName : 'Hôm nay'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Lọc nhanh theo ca học (Sáng / Chiều), tìm kiếm môn học, phòng học Nhà H hoặc giảng viên
                </p>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-700 bg-white/90 px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
              Hiển thị: <strong className="text-blue-700 font-black">{filteredSchedules.length}</strong> / {todayData?.schedules.length || 0} ca học
            </div>
          </div>

          {/* Filters Control Box */}
          <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Session Filter Tabs */}
              <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setSessionFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    sessionFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Tất cả các ca ({todayData?.schedules.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setSessionFilter('MORNING')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    sessionFilter === 'MORNING'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  ☀️ Buổi Sáng (Tiết 1-5)
                </button>
                <button
                  type="button"
                  onClick={() => setSessionFilter('AFTERNOON')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    sessionFilter === 'AFTERNOON'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  ⛅ Buổi Chiều (Tiết 6-10)
                </button>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px] max-w-sm flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm môn học, phòng, giảng viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-7 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-2xs"
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
                {currentRole === 'LECTURER' ? `👨‍🏫 Giảng viên: ${currentLecturerName}` : `🎓 Lớp: ${selectedClass}`}
              </span>
              <span className="px-2.5 py-1 bg-white/10 text-white rounded-lg font-bold border border-white/15">
                {sessionFilter === 'ALL' ? 'Tất cả các ca' : sessionFilter === 'MORNING' ? '☀️ Chỉ Buổi Sáng' : '⛅ Chỉ Buổi Chiều'}
              </span>
              {searchTerm.trim() && (
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg font-bold border border-amber-500/40">
                  Tìm: &ldquo;{searchTerm}&rdquo;
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto shrink-0">
              {hasActiveTimelineFilters && (
                <button
                  type="button"
                  onClick={handleResetTimelineFilters}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Đặt lại bộ lọc hôm nay"
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

        {/* CARD-BODY: NỘI DUNG TIMELINE BÁM SÁT BIÊN CARD */}
        <div className="card-body p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !todayData || todayData.schedules.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-10 text-center border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8 opacity-70" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Hôm nay không có lịch học</h3>
              <p className="text-[15px] text-slate-500 mt-1 max-w-sm mx-auto">
                Không tìm thấy thời khóa biểu được xếp cho ngày hôm nay theo đối tượng đang chọn.
              </p>
              <button
                onClick={() => setActiveTab('timetable')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer"
              >
                Xem lịch các ngày khác trong tuần
              </button>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Không tìm thấy ca học nào phù hợp</h3>
              <p className="text-xs text-slate-500 mt-1">
                Không có kết quả khớp với ca học hoặc từ khóa tìm kiếm &ldquo;{searchTerm}&rdquo;.
              </p>
              <button
                type="button"
                onClick={handleResetTimelineFilters}
                className="mt-3 px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSchedules.map((item) => {
                const isMorning = item.periodStart <= 5;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 border-2 border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Time & Period Badge */}
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <div
                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shadow-2xs ${
                          isMorning ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        <span className="text-xs font-normal">{isMorning ? 'Sáng' : 'Chiều'}</span>
                        <span className="text-sm font-extrabold">T.{item.periodStart}-{item.periodEnd}</span>
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-600" />
                          {item.startTime} - {item.endTime}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Số tiết: <span className="font-semibold text-slate-700">{item.periodEnd - item.periodStart + 1} tiết</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Course, Class & Lecturer Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-mono font-bold rounded-lg border border-blue-200">
                          {item.courseCode}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{item.courseName}</h3>
                        {item.version > 1 && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                            Đã điều chỉnh
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Giảng viên: <strong className="text-slate-800">{item.lecturerName}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          Lớp: <strong className="text-slate-800">{item.classCode}</strong>
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-[15px] text-slate-500 bg-slate-50 p-2 rounded-lg mt-2 border border-slate-100 italic">
                          📌 Ghi chú: {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Right: Room Box in Building H */}
                    <div className="flex sm:flex-col items-center justify-between sm:justify-center p-3 sm:px-5 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl border border-slate-200/80 min-w-[140px] text-center">
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mb-0.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        {item.building}
                      </div>
                      <div className="text-xl font-extrabold text-blue-700 tracking-tight font-mono">
                        Phòng {item.roomCode}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Sức chứa: 40 SV</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
