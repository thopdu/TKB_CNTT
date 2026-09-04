import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { LoginModal } from './components/LoginModal';
import { AIAssistantDrawer } from './components/views/AIAssistantDrawer';
import { HomeRoleSelectionView } from './components/views/HomeRoleSelectionView';
import { TodayScheduleView } from './components/views/TodayScheduleView';
import { TimetableView } from './components/views/TimetableView';
import { ExamScheduleView } from './components/views/ExamScheduleView';
import { BuildingHView } from './components/views/BuildingHView';
import { LecturerWorkloadView } from './components/views/LecturerWorkloadView';
import { ManagerDashboardView } from './components/views/ManagerDashboardView';
import { DataSourceAdminView } from './components/views/DataSourceAdminView';
import { UserManagerView } from './components/views/UserManagerView';
import { NotificationManagerView } from './components/views/NotificationManagerView';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, currentRole, setIsAIDrawerOpen } = useAuth();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeRoleSelectionView />;
      case 'today':
        return <TodayScheduleView />;
      case 'timetable':
        return <TimetableView />;
      case 'exams':
        return <ExamScheduleView />;
      case 'building_h':
        return currentRole === 'MANAGER' || currentRole === 'ADMIN' ? (
          <BuildingHView />
        ) : (
          <TimetableView />
        );
      case 'workload':
        return currentRole === 'LECTURER' || currentRole === 'MANAGER' || currentRole === 'ADMIN' ? (
          <LecturerWorkloadView />
        ) : (
          <TimetableView />
        );
      case 'manager_dashboard':
        return currentRole === 'MANAGER' || currentRole === 'ADMIN' ? (
          <ManagerDashboardView />
        ) : (
          <TimetableView />
        );
      case 'notifications':
        return currentRole === 'MANAGER' || currentRole === 'ADMIN' ? (
          <NotificationManagerView />
        ) : (
          <TimetableView />
        );
      case 'users':
        return currentRole === 'ADMIN' ? <UserManagerView /> : <TimetableView />;
      case 'data_sources':
        return currentRole === 'ADMIN' ? <DataSourceAdminView /> : <TimetableView />;
      default:
        return <HomeRoleSelectionView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Navigation Sub-Bar */}
      <Navigation />

      {/* Main Container - Compact & Framed */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-20 md:pb-10">
        {renderActiveTab()}
      </main>

      {/* Modals & AI Drawer */}
      <LoginModal />
      <AIAssistantDrawer />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            onClick={() => setActiveTab('home')}
            title="Về trang chủ chọn vai trò người dùng"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0C2340] group-hover:bg-blue-800 transition-colors flex items-center justify-center text-white font-bold text-xs shadow-2xs">
              PDU
            </div>
            <div>
              <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors text-xs flex items-center gap-1.5">
                Khoa Công nghệ Thông tin • Trường Đại học Phạm Văn Đồng
                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">Quảng Ngãi</span>
              </div>
              <p className="text-xs text-slate-400">
                Nhà H • Hệ thống quản lý lịch giảng dạy & học tập
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => setActiveTab('home')}
              className={`font-semibold hover:underline cursor-pointer ${
                activeTab === 'home' ? 'text-blue-700 font-bold' : 'text-slate-600'
              }`}
            >
              Trang chủ
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`font-semibold hover:underline cursor-pointer ${
                activeTab === 'timetable' ? 'text-blue-700 font-bold' : 'text-slate-600'
              }`}
            >
              Thời khóa biểu
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => setActiveTab('exams')}
              className={`hover:text-slate-800 transition cursor-pointer ${
                activeTab === 'exams' ? 'text-blue-700 font-bold' : 'text-slate-600'
              }`}
            >
              Lịch thi
            </button>
            <span className="text-slate-300">•</span>
            <a
              href="https://cntt.pdu.edu.vn/luu-tru/category/thoi-khoa-bieu"
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-blue-600 hover:underline"
            >
              cntt.pdu.edu.vn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
