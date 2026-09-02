import React, { useState, useEffect } from 'react';
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
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-3 border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              {todayData ? `${todayData.weekdayName}, ngày ${todayData.date}` : 'Hôm nay'} • Tuần 05 (Khoa CNTT - PDU)
            </div>
            <h1 className="text-[25px] font-extrabold tracking-tight leading-tight">
              {currentRole === 'LECTURER' ? 'Lịch Giảng Dạy Hôm Nay' : 'Lịch Học Hôm Nay'}
            </h1>
            <p className="text-[15px] text-blue-100/80 mt-1 max-w-xl">
              {currentRole === 'LECTURER'
                ? 'Thông tin ca giảng và phòng học Nhà H được phân công trong ngày'
                : 'Tra cứu nhanh tiết học, phòng học Nhà H và giảng viên phụ trách'}
            </p>
          </div>

          {/* Quick Selectors / Filter Pill */}
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {currentRole === 'LECTURER' ? (
              <div>
                <label className="block text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-1">
                  Giảng viên
                </label>
                <select
                  value={selectedLecturerId}
                  onChange={(e) => setSelectedLecturerId(e.target.value)}
                  className="bg-slate-900/80 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {lecturers.map((lec) => (
                    <option key={lec.id} value={lec.id} className="bg-slate-900 text-white">
                      {lec.fullName} ({lec.lecturerCode})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-1">
                  Lớp sinh viên
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-slate-900/80 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              className="mt-auto px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Xem cả tuần</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-[11px] text-blue-200 uppercase font-semibold">Số môn hôm nay</div>
            <div className="text-xl font-extrabold mt-0.5">{todayData?.totalClasses || 0} môn</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-[11px] text-blue-200 uppercase font-semibold">Tổng số tiết</div>
            <div className="text-xl font-extrabold mt-0.5">{todayData?.totalPeriods || 0} tiết</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-[11px] text-blue-200 uppercase font-semibold">Khu vực phòng</div>
            <div className="text-xl font-extrabold mt-0.5">Nhà H (3 tầng)</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-[11px] text-blue-200 uppercase font-semibold">Trạng thái TKB</div>
            <div className="text-xl font-extrabold mt-0.5 text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Đã cập nhật
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Timeline List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Timeline Lịch học chi tiết
          </h2>
          <span className="text-xs text-slate-500">Mỗi phòng chuẩn sức chứa: 40 sinh viên</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !todayData || todayData.schedules.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 opacity-70" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Hôm nay không có lịch học</h3>
            <p className="text-[15px] text-slate-500 mt-1 max-w-sm mx-auto">
              Không tìm thấy thời khóa biểu được xếp cho ngày hôm nay theo bộ lọc hiện tại.
            </p>
            <button
              onClick={() => setActiveTab('timetable')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              Xem lịch các ngày khác trong tuần
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {todayData.schedules.map((item, idx) => {
              const isMorning = item.periodStart <= 5;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
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
  );
};
