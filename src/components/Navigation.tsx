import React from 'react';
import {
  Home,
  CalendarDays,
  GraduationCap,
  Building2,
  BarChart3,
  Database,
  Layers,
  Sparkles,
  Users,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navigation: React.FC = () => {
  const { currentRole, activeTab, setActiveTab, setIsAIDrawerOpen } = useAuth();

  const getNavItems = () => {
    const items = [
      { id: 'home', label: 'Trang chủ', shortLabel: 'Trang chủ', icon: Home, desc: 'Cổng thông tin & Chọn vai trò' },
      { id: 'timetable', label: 'Thời khóa biểu', shortLabel: 'TKB', icon: CalendarDays, desc: 'Lịch tuần & Lưới TKB' },
      { id: 'exams', label: 'Lịch thi', shortLabel: 'Lịch thi', icon: GraduationCap, desc: 'Kỳ thi & Ca thi' },
    ];

    // Thống kê giảng dạy: Giảng viên, Quản lý đào tạo và Admin
    if (currentRole === 'LECTURER' || currentRole === 'MANAGER' || currentRole === 'ADMIN') {
      items.push({ id: 'workload', label: 'Thống kê giảng dạy', shortLabel: 'Giảng dạy', icon: BarChart3, desc: 'Khối lượng & Giờ chuẩn' });
    }

    // Cơ sở Nhà H, Dashboard Đào tạo & Quản lý thông báo: Dành riêng cho Quản lý đào tạo và Admin
    if (currentRole === 'MANAGER' || currentRole === 'ADMIN') {
      items.push({ id: 'building_h', label: 'Cơ sở Nhà H', shortLabel: 'Nhà H', icon: Building2, desc: 'Sơ đồ & Đánh giá trùng phòng' });
      items.push({ id: 'manager_dashboard', label: 'Dashboard Đào tạo', shortLabel: 'Dashboard', icon: Layers, desc: 'KPIs & Xung đột' });
      items.push({ id: 'notifications', label: 'Quản lý thông báo', shortLabel: 'Thông báo', icon: Bell, desc: 'Phát sóng & Dời phòng' });
    }

    // Quản lý User: Dành riêng cho Quản trị viên (Admin)
    if (currentRole === 'ADMIN') {
      items.push({ id: 'users', label: 'Quản lý User', shortLabel: 'Quản lý User', icon: Users, desc: 'Tài khoản & Phân quyền' });
      items.push({ id: 'data_sources', label: 'Nguồn dữ liệu (Sync)', shortLabel: 'Nguồn Sync', icon: Database, desc: 'Cấu hình cào & Tùy chỉnh URL' });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Desktop Horizontal Navigation Bar */}
      <div className="bg-white border-b border-slate-200/90 shadow-2xs hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 py-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isHome = item.id === 'home';
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  className={`cursor-pointer flex items-center justify-center ${
                    isHome ? 'px-2.5 py-1.5' : 'gap-2 px-3.5 py-1.5'
                  } rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#085584] text-white shadow-xs'
                      : 'text-slate-700 hover:text-[#085584] hover:bg-slate-100'
                  }`}
                  style={isActive ? { backgroundColor: '#085584' } : undefined}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {!isHome && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Fixed Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`cursor-pointer flex flex-col items-center justify-center py-1 px-2 rounded-lg transition text-xs font-semibold ${
                isActive ? 'text-[#0C2340] font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 mb-0.5 ${isActive ? 'text-[#0C2340]' : 'text-slate-400'}`} />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}

        <button
          onClick={() => setIsAIDrawerOpen(true)}
          className="cursor-pointer flex flex-col items-center justify-center py-1 px-2 rounded-lg transition text-xs font-semibold text-blue-600"
        >
          <Sparkles className="w-4.5 h-4.5 mb-0.5 text-blue-600" />
          <span>PDU AI</span>
        </button>
      </div>
    </>
  );
};

