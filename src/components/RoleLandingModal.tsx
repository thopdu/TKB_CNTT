import React from 'react';
import { GraduationCap, UserCheck, Layers, Shield, Sparkles, Building2, Calendar, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const RoleLandingModal: React.FC = () => {
  const { isRoleLandingOpen, setIsRoleLandingOpen, switchRole, currentRole } = useAuth();

  if (!isRoleLandingOpen) return null;

  const handleSelectRole = (role: UserRole) => {
    switchRole(role);
    setIsRoleLandingOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden relative">
        {/* Close Button if role already selected */}
        {localStorage.getItem('pdu_role') && (
          <button
            onClick={() => setIsRoleLandingOpen(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Hero Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-3 border border-white/10">
            <Building2 className="w-3.5 h-3.5 text-blue-300" />
            Trường Đại học Phạm Văn Đồng • Khoa CNTT
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">PDU ACADEMIC</h2>
          <p className="text-[15px] text-blue-100/90 mt-1 max-w-md mx-auto">
            Hệ thống tra cứu thời khóa biểu – lịch thi – phân tích cơ sở vật chất Nhà H
          </p>

          <div className="mt-5 text-xs font-bold uppercase tracking-wider text-blue-300">
            Bạn đang sử dụng hệ thống với vai trò nào?
          </div>
        </div>

        {/* 4 Role Selection Cards */}
        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50">
          {/* Card Sinh viên */}
          <div
            onClick={() => handleSelectRole('STUDENT')}
            className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white hover:border-blue-500 hover:shadow-lg ${
              currentRole === 'STUDENT' ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/30' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Công khai
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3 group-hover:text-blue-600 transition-colors">
              🎓 SINH VIÊN
            </h3>
            <p className="text-[15px] text-slate-500 mt-1 line-clamp-2">
              Tra cứu lịch học hôm nay trong 2s, thời khóa biểu theo tuần, phòng thi, giảng viên và thông báo đổi phòng.
            </p>
            <div className="mt-3 flex items-center text-xs font-bold text-blue-600 gap-1 group-hover:translate-x-1 transition-transform">
              Truy cập ngay <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card Giảng viên */}
          <div
            onClick={() => handleSelectRole('LECTURER')}
            className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white hover:border-emerald-500 hover:shadow-lg ${
              currentRole === 'LECTURER' ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/30' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Giảng dạy
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3 group-hover:text-emerald-600 transition-colors">
              👨‍🏫 GIẢNG VIÊN
            </h3>
            <p className="text-[15px] text-slate-500 mt-1 line-clamp-2">
              Xem lịch giảng hôm nay, thống kê số tiết lý thuyết/thực hành, lớp phụ trách và tải đào tạo.
            </p>
            <div className="mt-3 flex items-center text-xs font-bold text-emerald-600 gap-1 group-hover:translate-x-1 transition-transform">
              Xem lịch giảng <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card Quản lý */}
          <div
            onClick={() => handleSelectRole('MANAGER')}
            className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white hover:border-amber-500 hover:shadow-lg ${
              currentRole === 'MANAGER' ? 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/30' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Cần đăng nhập
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3 group-hover:text-amber-600 transition-colors">
              📊 QUẢN LÝ ĐÀO TẠO
            </h3>
            <p className="text-[15px] text-slate-500 mt-1 line-clamp-2">
              Thống kê toàn diện học phần, phòng Nhà H (12 phòng), phân tích tải giảng viên, phát hiện trùng lịch.
            </p>
            <div className="mt-3 flex items-center text-xs font-bold text-amber-600 gap-1 group-hover:translate-x-1 transition-transform">
              Mở Analytics <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card Quản trị Admin */}
          <div
            onClick={() => handleSelectRole('ADMIN')}
            className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white hover:border-purple-500 hover:shadow-lg ${
              currentRole === 'ADMIN' ? 'border-purple-600 ring-2 ring-purple-500/20 bg-purple-50/30' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Cần đăng nhập
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3 group-hover:text-purple-600 transition-colors">
              ⚙️ QUẢN TRỊ (ADMIN)
            </h3>
            <p className="text-[15px] text-slate-500 mt-1 line-clamp-2">
              Tùy chỉnh nguồn cào (cntt.pdu.edu.vn), cấu hình chu kỳ sync, kiểm tra preview dữ liệu, xem log.
            </p>
            <div className="mt-3 flex items-center text-xs font-bold text-purple-600 gap-1 group-hover:translate-x-1 transition-transform">
              Cấu hình nguồn <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-white border-t border-slate-100 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Tích hợp Trợ lý AI học vụ PDU – Hỗ trợ tra cứu tự nhiên và cảnh báo xung đột</span>
        </div>
      </div>
    </div>
  );
};
