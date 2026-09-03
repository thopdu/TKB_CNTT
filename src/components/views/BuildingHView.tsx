import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  BuildingHConflictEvaluation,
  BuildingHSessionSlot,
} from '../../types';
import { TimetableWeekSelector } from '../TimetableWeekSelector';

export const BuildingHView: React.FC = () => {
  // Timetable Weeks & Conflict Evaluation State
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('week_05');
  const [conflictEval, setConflictEval] = useState<BuildingHConflictEvaluation | null>(null);
  const [loadingEval, setLoadingEval] = useState<boolean>(true);

  // Filters for Heatmap Matrix
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [dayFilter, setDayFilter] = useState<string>('ALL');
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFLICT' | 'OPTIMAL' | 'DOUBLE' | 'EMPTY'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inspected Session Slot Modal
  const [inspectedSlot, setInspectedSlot] = useState<BuildingHSessionSlot | null>(null);

  const DAYS = [
    { key: 'Thứ 2', label: 'Thứ Hai', short: 'T2' },
    { key: 'Thứ 3', label: 'Thứ Ba', short: 'T3' },
    { key: 'Thứ 4', label: 'Thứ Tư', short: 'T4' },
    { key: 'Thứ 5', label: 'Thứ Năm', short: 'T5' },
    { key: 'Thứ 6', label: 'Thứ Sáu', short: 'T6' },
    { key: 'Thứ 7', label: 'Thứ Bảy', short: 'T7' },
    { key: 'Chủ Nhật', label: 'Chủ Nhật', short: 'CN' },
  ];

  const BUILDING_H_ROOMS = [
    { code: 'H.101', floor: 1, type: 'Phòng Lý Thuyết', capacity: 40 },
    { code: 'H.102', floor: 1, type: 'Phòng Lý Thuyết', capacity: 40 },
    { code: 'H.103', floor: 1, type: 'Phòng Thực Hành Máy', capacity: 40 },
    { code: 'H.104', floor: 1, type: 'Phòng Thực Hành Máy', capacity: 40 },
    { code: 'H.201', floor: 2, type: 'Phòng Lý Thuyết', capacity: 40 },
    { code: 'H.202', floor: 2, type: 'Phòng Lý Thuyết', capacity: 40 },
    { code: 'H.203', floor: 2, type: 'Phòng Seminar', capacity: 40 },
    { code: 'H.204', floor: 2, type: 'Phòng Seminar', capacity: 40 },
    { code: 'H.301', floor: 3, type: 'Phòng Lý Thuyết', capacity: 40 },
    { code: 'H.302', floor: 3, type: 'Phòng Lý Thuyết', capacity: 40 },
    { code: 'H.303', floor: 3, type: 'Phòng Thực Hành AI', capacity: 40 },
    { code: 'H.304', floor: 3, type: 'Phòng Seminar', capacity: 40 },
  ];

  // Initial Load
  useEffect(() => {
    const loadInitial = async () => {
      setLoadingEval(true);
      try {
        const timetableWeeks = await api.getTimetableWeeks();

        if (Array.isArray(timetableWeeks) && timetableWeeks.length > 0) {
          setWeeks(timetableWeeks);
          const curWeek = timetableWeeks.find((w: any) => w.current) || timetableWeeks[0];
          const initialWeekId = curWeek?.weekId || 'week_05';
          setSelectedWeekId(initialWeekId);
          loadConflictData(initialWeekId);
        } else {
          loadConflictData('week_05');
        }
      } catch (err) {
        console.error('Error loading building H data:', err);
      } finally {
        setLoadingEval(false);
      }
    };

    loadInitial();
  }, []);

  const loadConflictData = async (weekId: string) => {
    setLoadingEval(true);
    try {
      const evaluation = await api.getBuildingHConflictEvaluation(weekId);
      if (evaluation) {
        setConflictEval(evaluation);
      }
    } catch (err) {
      console.error('Error loading conflict evaluation:', err);
    } finally {
      setLoadingEval(false);
    }
  };

  const handleSelectWeek = (weekId: string) => {
    setSelectedWeekId(weekId);
    loadConflictData(weekId);
  };

  // Group matrix by roomCode for matrix view
  const matrixByRoom = useMemo(() => {
    const map = new Map<string, BuildingHSessionSlot[]>();
    BUILDING_H_ROOMS.forEach((r) => map.set(r.code, []));

    (conflictEval?.sessionMatrix || []).forEach((slot) => {
      if (!map.has(slot.roomCode)) {
        map.set(slot.roomCode, []);
      }
      map.get(slot.roomCode)!.push(slot);
    });

    return map;
  }, [conflictEval]);

  const currentWeekObj = weeks.find((w) => w.weekId === selectedWeekId);
  const currentWeekDisplayTitle =
    conflictEval?.weekTitle ||
    currentWeekObj?.title ||
    (currentWeekObj?.weekNumber
      ? `Tuần 0${currentWeekObj.weekNumber} (${currentWeekObj.dateRange || '24/08/2026 - 29/08/2026'})`
      : 'Tuần 05 (24/08/2026 - 29/08/2026)');

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* ========================================================================= */}
      {/* 1. CHỌN TUẦN TKB (WEEK SELECTOR WITH NAVIGATION & SEARCH)                 */}
      {/* ========================================================================= */}
      <TimetableWeekSelector
        weeks={weeks}
        selectedWeekId={selectedWeekId}
        onSelectWeek={handleSelectWeek}
        title="Chọn Tuần TKB"
        variant="white"
      />

      {/* ========================================================================= */}
      {/* 2. MA TRẬN NHIỆT PHÂN BỔ PHÒNG HỌC NHÀ H (THEO THỨ & BUỔI)               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Ma Trận Nhiệt Phân Bổ Phòng Học Nhà H (Theo Thứ & Buổi)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bảng trực quan 12 phòng × 7 ngày × 2 buổi (Sáng/Chiều). Nhấp vào ô bất kỳ để xem chi tiết danh sách lớp.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2.5 text-[11px] flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 inline-block" />
              <span className="text-slate-600">Trống (0 lớp)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300 inline-block" />
              <span className="text-emerald-800 font-bold">1 Lớp (Tối ưu)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300 inline-block" />
              <span className="text-amber-800 font-bold">2 Lớp (Bình thường)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-600 inline-block" />
              <span className="text-rose-700 font-extrabold">&gt; 2 Lớp (TRÙNG PHÒNG)</span>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Floor Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Lọc Theo Tầng:
            </label>
            <div className="flex items-center gap-1">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 1, label: 'Tầng 1' },
                { id: 2, label: 'Tầng 2' },
                { id: 3, label: 'Tầng 3' },
              ].map((fl) => (
                <button
                  key={fl.id}
                  onClick={() => setSelectedFloor(fl.id as any)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                    selectedFloor === fl.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {fl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Day Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Lọc Theo Thứ:
            </label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">Tất cả các ngày (T2 - CN)</option>
              {DAYS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Trạng Thái Phân Bổ:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CONFLICT">🚨 Phòng TRÙNG (&gt; 2 lớp)</option>
              <option value="OPTIMAL">✓ Phòng 1 lớp (Tối ưu)</option>
              <option value="DOUBLE">⚬ Phòng 2 lớp (Bình thường)</option>
              <option value="EMPTY">⚪ Phòng trống</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Tìm Kiếm Phòng / Lớp:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập mã phòng, tên lớp, GV..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-3 font-bold sticky left-0 bg-slate-100 z-10 border-r border-slate-200 min-w-[120px]">
                  Phòng Học
                </th>
                {DAYS.filter((d) => dayFilter === 'ALL' || d.key === dayFilter).map((d) => (
                  <th
                    key={d.key}
                    colSpan={sessionFilter === 'ALL' ? 2 : 1}
                    className="p-2.5 font-bold text-center border-r border-slate-200"
                  >
                    <div className="font-extrabold text-slate-800">{d.label}</div>
                    <div className="text-[10px] text-slate-500 font-normal">({d.short})</div>
                  </th>
                ))}
              </tr>
              {sessionFilter === 'ALL' && (
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 text-center">
                  <th className="p-2 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    Tầng / Sức chứa
                  </th>
                  {DAYS.filter((d) => dayFilter === 'ALL' || d.key === dayFilter).map((d) => (
                    <React.Fragment key={d.key}>
                      <th className="p-1.5 text-amber-800 bg-amber-50/40 border-r border-slate-200">
                        Sáng (T1-5)
                      </th>
                      <th className="p-1.5 text-indigo-800 bg-indigo-50/40 border-r border-slate-200">
                        Chiều (T6-10)
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {BUILDING_H_ROOMS.filter((r) => selectedFloor === 'ALL' || r.floor === selectedFloor).map((room) => {
                const roomSlots = matrixByRoom.get(room.code) || [];

                return (
                  <tr key={room.code} className="hover:bg-slate-50/80 transition">
                    {/* Sticky Room Label */}
                    <td className="p-3 font-mono font-black text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-900 font-bold">{room.code}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-600">
                          T{room.floor}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                        {room.type}
                      </div>
                    </td>

                    {/* Schedule Cells */}
                    {DAYS.filter((d) => dayFilter === 'ALL' || d.key === dayFilter).map((d) => {
                      const morningSlot = roomSlots.find(
                        (s) => s.dayOfWeek === d.key && s.session === 'MORNING'
                      );
                      const afternoonSlot = roomSlots.find(
                        (s) => s.dayOfWeek === d.key && s.session === 'AFTERNOON'
                      );

                      const renderCellContent = (slot?: BuildingHSessionSlot) => {
                        if (!slot || slot.classCount === 0) {
                          return (
                            <div className="h-full min-h-[52px] p-2 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/80 text-center flex flex-col justify-center items-center text-slate-400 text-[10px] cursor-pointer transition">
                              <span>Trống</span>
                            </div>
                          );
                        }

                        if (slot.isConflict) {
                          // > 2 classes assigned in the same session
                          return (
                            <div
                              onClick={() => setInspectedSlot(slot)}
                              className="h-full min-h-[52px] p-2 rounded-xl bg-rose-500 text-white border-2 border-rose-600 shadow-sm hover:scale-102 cursor-pointer transition flex flex-col justify-between animate-pulse"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-[10px] uppercase tracking-wider bg-rose-700 px-1 rounded">
                                  TRÙNG PHÒNG
                                </span>
                                <span className="font-black text-xs bg-white text-rose-700 px-1.5 py-0.2 rounded-full">
                                  {slot.classCount} lớp
                                </span>
                              </div>
                              <div className="text-[10px] font-bold mt-1 line-clamp-1">
                                {slot.classes.map((c) => c.className).join(', ')}
                              </div>
                            </div>
                          );
                        }

                        if (slot.classCount === 2) {
                          // Exactly 2 classes (normal split)
                          return (
                            <div
                              onClick={() => setInspectedSlot(slot)}
                              className="h-full min-h-[52px] p-2 rounded-xl bg-amber-50 border border-amber-300 hover:border-amber-400 hover:bg-amber-100/70 cursor-pointer transition flex flex-col justify-between text-amber-900"
                            >
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-amber-800">2 Lớp (Ca 1 & 2)</span>
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                              </div>
                              <div className="text-[10px] font-semibold line-clamp-1 mt-0.5 text-slate-800">
                                {slot.classes.map((c) => c.className).join(', ')}
                              </div>
                            </div>
                          );
                        }

                        // 1 Class (Optimal)
                        const singleClass = slot.classes[0];
                        return (
                          <div
                            onClick={() => setInspectedSlot(slot)}
                            className="h-full min-h-[52px] p-2 rounded-xl bg-emerald-50/90 border border-emerald-300 hover:border-emerald-400 hover:bg-emerald-100/70 cursor-pointer transition flex flex-col justify-between text-emerald-950"
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-emerald-900">{singleClass.className}</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-200/70 text-emerald-900 font-bold">
                                1 Lớp
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-600 line-clamp-1 mt-0.5">
                              {singleClass.subject}
                            </div>
                          </div>
                        );
                      };

                      if (sessionFilter === 'MORNING') {
                        return (
                          <td key={`${d.key}_M`} className="p-1.5 border-r border-slate-200 align-top">
                            {renderCellContent(morningSlot)}
                          </td>
                        );
                      }

                      if (sessionFilter === 'AFTERNOON') {
                        return (
                          <td key={`${d.key}_A`} className="p-1.5 border-r border-slate-200 align-top">
                            {renderCellContent(afternoonSlot)}
                          </td>
                        );
                      }

                      return (
                        <React.Fragment key={d.key}>
                          <td className="p-1.5 border-r border-slate-200 align-top">
                            {renderCellContent(morningSlot)}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 align-top">
                            {renderCellContent(afternoonSlot)}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BẢNG THỐNG KÊ CHI TIẾT 12 PHÒNG HỌC NHÀ H (${currentWeekDisplayTitle}) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Bảng Thống Kê Chi Tiết 12 Phòng Học Nhà H ({currentWeekDisplayTitle})
            </h3>
            <p className="text-xs text-slate-500">
              Tổng hợp số tiết giảng dạy, tải sử dụng và số buổi phân bổ tại cơ sở Nhà H
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Mã Phòng</th>
                <th className="p-3">Tầng</th>
                <th className="p-3">Loại Phòng</th>
                <th className="p-3 text-center">Tổng Tiết/Tuần</th>
                <th className="p-3 text-center">Tải Sử Dụng</th>
                <th className="p-3 text-center">Ca Trùng (&gt;2 Lớp)</th>
                <th className="p-3 text-center">Lớp Tối Đa/Ca</th>
                <th className="p-3 text-center">Đánh Giá Phân Bổ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {conflictEval?.roomStatusList.map((r) => {
                const isConflicted = r.conflictedSessionsCount > 0;
                return (
                  <tr key={r.roomCode} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-black text-slate-900 text-sm">
                      {r.roomCode}
                    </td>
                    <td className="p-3 text-slate-600">Tầng {r.floor}</td>
                    <td className="p-3 text-slate-700">{r.roomType}</td>
                    <td className="p-3 text-center font-bold text-slate-800">
                      {r.totalPeriods} Tiết
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-slate-700">{r.utilizationRate}%</span>
                        <div className="w-12 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              r.utilizationRate > 85
                                ? 'bg-amber-500'
                                : r.utilizationRate > 50
                                ? 'bg-blue-600'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${r.utilizationRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-extrabold ${
                          isConflicted
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.conflictedSessionsCount} Buổi
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">
                      {r.maxClassesInSession} Lớp
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                          isConflicted
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : r.status === 'OVERLOAD'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {isConflicted && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        {!isConflicted && r.status === 'NORMAL' && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        )}
                        {isConflicted
                          ? 'Xung Đột Trùng Phòng'
                          : r.status === 'OVERLOAD'
                          ? 'Tải Rất Cao'
                          : 'Phân Bổ An Toàn'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CHI TIẾT BUỔI HỌC KHI NHẤP VÀO Ô MA TRẬN                          */}
      {/* ========================================================================= */}
      {inspectedSlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                  inspectedSlot.isConflict
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#085584] text-white'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Phòng {inspectedSlot.roomCode} • {inspectedSlot.dayOfWeek}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tầng {inspectedSlot.floor} • {inspectedSlot.sessionName} (
                    {inspectedSlot.session === 'MORNING' ? '07:00 - 11:30' : '13:00 - 17:30'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedSlot(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conflict Warning Alert if > 2 classes */}
            {inspectedSlot.isConflict && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-900 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  XUNG ĐỘT TRÙNG PHÒNG ({inspectedSlot.classCount} LỚP &gt; 2 LỚP)
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Quy tắc: Một phòng học chỉ cho phép tối đa 2 lớp/buổi. Phòng này đang bị xếp quá tải ({inspectedSlot.classCount} lớp), cần điều chuyển các lớp dôi dư sang phòng học trống.
                </p>
              </div>
            )}

            {/* List of classes in this slot */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Danh sách {inspectedSlot.classCount} lớp được phân vào buổi này:</span>
                <span className="text-slate-400 font-normal">Sức chứa phòng: 40 SV</span>
              </div>

              {inspectedSlot.classes.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                  Phòng trống trong buổi này, không có lớp nào được xếp lịch.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {inspectedSlot.classes.map((cls, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1 hover:border-blue-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-blue-900 font-mono text-sm">
                          {cls.className}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {cls.period}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-800">{cls.subject}</div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                        <span>Giảng viên: <strong className="text-slate-700">{cls.teacher}</strong></span>
                        <span>{cls.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setInspectedSlot(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
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
