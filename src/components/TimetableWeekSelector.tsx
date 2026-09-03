import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Calendar,
} from 'lucide-react';

export function formatWeekName(w: any): string {
  if (!w) return '';
  if (w.displayName) return w.displayName;
  if (w.weekId === 'ALL') return 'Cả học kỳ';

  if (typeof w.weekNumber === 'number' && !isNaN(w.weekNumber)) {
    return `Tuần ${w.weekNumber < 10 ? '0' + w.weekNumber : w.weekNumber}`;
  }

  const raw = (w.title || w.weekTitle || w.parsedTitle || w.weekId || '').toString();
  const match = raw.match(/Tuần\s*0?(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    return `Tuần ${num < 10 ? '0' + num : num}`;
  }

  if (raw.includes('(')) {
    const clean = raw.split('(')[0].trim();
    if (clean) return clean;
  }

  return raw;
}

export function getWeekTooltip(w: any): string {
  if (!w) return '';
  if (w.fullTitle) return w.fullTitle;
  if (w.dateRange) return `${formatWeekName(w)} (${w.dateRange})`;
  if (w.dateRangeText) return `${formatWeekName(w)} (${w.dateRangeText})`;
  return w.title || w.weekTitle || formatWeekName(w);
}

export interface TimetableWeekSelectorProps {
  weeks: any[];
  selectedWeekId: string;
  onSelectWeek: (weekId: string) => void;
  title?: string;
  subtitle?: string;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  variant?: 'white' | 'gray';
  showCurrentIndicator?: boolean;
}

export const TimetableWeekSelector: React.FC<TimetableWeekSelectorProps> = ({
  weeks = [],
  selectedWeekId,
  onSelectWeek,
  title = 'Chọn Tuần TKB',
  subtitle,
  includeAllOption = false,
  allOptionLabel = 'Cả học kỳ 2',
  actions,
  badge,
  className = '',
  variant = 'white',
  showCurrentIndicator = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Normalize list of week options
  const weekOptions = useMemo(() => {
    const list: Array<{
      weekId: string;
      displayName: string;
      tooltip: string;
      weekNumber?: number;
      current?: boolean;
      raw: any;
    }> = [];

    if (includeAllOption) {
      list.push({
        weekId: 'ALL',
        displayName: allOptionLabel,
        tooltip: 'Xem toàn bộ dữ liệu cả học kỳ',
        current: false,
        raw: { weekId: 'ALL', title: allOptionLabel },
      });
    }

    weeks.forEach((w) => {
      list.push({
        weekId: w.weekId,
        displayName: formatWeekName(w),
        tooltip: getWeekTooltip(w),
        weekNumber: w.weekNumber,
        current: !!w.current,
        raw: w,
      });
    });

    return list;
  }, [weeks, includeAllOption, allOptionLabel]);

  // Filtered by search query
  const filteredWeeks = useMemo(() => {
    if (!searchQuery.trim()) return weekOptions;
    const q = searchQuery.toLowerCase().trim();
    return weekOptions.filter(
      (w) =>
        w.displayName.toLowerCase().includes(q) ||
        w.tooltip.toLowerCase().includes(q) ||
        w.weekId.toLowerCase().includes(q)
    );
  }, [weekOptions, searchQuery]);

  // Current index in full week options
  const currentWeekIdx = useMemo(() => {
    return weekOptions.findIndex((w) => w.weekId === selectedWeekId);
  }, [weekOptions, selectedWeekId]);

  // Handle direct previous/next week selection
  const handlePrevWeek = () => {
    if (currentWeekIdx > 0) {
      onSelectWeek(weekOptions[currentWeekIdx - 1].weekId);
    }
  };

  const handleNextWeek = () => {
    if (currentWeekIdx >= 0 && currentWeekIdx < weekOptions.length - 1) {
      onSelectWeek(weekOptions[currentWeekIdx + 1].weekId);
    }
  };

  // Check scroll state
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [filteredWeeks]);

  // Scroll smoothly left or right
  const scrollHorizontally = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 240;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 300);
  };

  // Auto-scroll selected week into view
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const selectedBtn = scrollContainerRef.current.querySelector(
      `[data-week-id="${selectedWeekId}"]`
    ) as HTMLElement;
    if (selectedBtn) {
      selectedBtn.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedWeekId]);

  const bgStyle = variant === 'gray' ? 'bg-[#f2f2f2]' : 'bg-white';

  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5 ${bgStyle} ${className}`}
    >
      {/* Header bar: Title, Navigation steps, Search & Extra Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Title, Badges & Step Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
              {title}
            </span>
          </div>

          {badge && <div className="shrink-0">{badge}</div>}

          {/* Quick step Prev / Next week buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={handlePrevWeek}
              disabled={currentWeekIdx <= 0}
              className="cursor-pointer p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Chuyển về tuần trước"
              aria-label="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-slate-500 px-1.5 select-none">
              {currentWeekIdx >= 0 ? `${currentWeekIdx + 1}/${weekOptions.length}` : '—'}
            </span>
            <button
              type="button"
              onClick={handleNextWeek}
              disabled={currentWeekIdx >= weekOptions.length - 1 || currentWeekIdx < 0}
              className="cursor-pointer p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Chuyển sang tuần sau"
              aria-label="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
        </div>

        {/* Right: Search box */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tuần (VD: 01, Tuần 5)..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-400 font-medium shadow-2xs transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}

      {/* Week Selector Ribbon with Horizontal Scroll Buttons */}
      <div className="relative group">
        {/* Left scroll button */}
        <button
          type="button"
          onClick={() => scrollHorizontally('left')}
          disabled={!canScrollLeft}
          className={`absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/95 backdrop-blur-xs border border-slate-300 shadow-md flex items-center justify-center text-slate-700 transition cursor-pointer hover:bg-slate-50 hover:text-blue-600 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title="Cuộn danh sách về trước"
          aria-label="Cuộn về trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable list of weeks - ONLY displaying week name */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 pt-0.5 px-0.5 scrollbar-thin scrollbar-thumb-slate-200"
        >
          {filteredWeeks && filteredWeeks.length > 0 ? (
            filteredWeeks.map((w) => {
              const isSelected = selectedWeekId === w.weekId;
              return (
                <button
                  key={w.weekId}
                  data-week-id={w.weekId}
                  type="button"
                  onClick={() => onSelectWeek(w.weekId)}
                  title={w.tooltip}
                  className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 select-none ${
                    isSelected
                      ? 'bg-[#085584] text-white shadow-xs scale-[1.02] ring-2 ring-blue-600/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  <span>{w.displayName}</span>
                  {showCurrentIndicator && w.current && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-amber-300 ring-1 ring-amber-400' : 'bg-amber-500'
                      }`}
                      title="Tuần hiện tại"
                    />
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-2 px-3 text-xs text-slate-500 font-medium italic">
              Không tìm thấy tuần nào phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>

        {/* Right scroll button */}
        <button
          type="button"
          onClick={() => scrollHorizontally('right')}
          disabled={!canScrollRight}
          className={`absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/95 backdrop-blur-xs border border-slate-300 shadow-md flex items-center justify-center text-slate-700 transition cursor-pointer hover:bg-slate-50 hover:text-blue-600 ${
            canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title="Cuộn danh sách về sau"
          aria-label="Cuộn về sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
