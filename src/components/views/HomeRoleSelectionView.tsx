import React from 'react';
import {
  GraduationCap,
  UserCheck,
  Layers,
  Shield,
  Sparkles,
  Building2,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const HomeRoleSelectionView: React.FC = () => {
  const { currentRole, switchRole } = useAuth();

  const handleSelectRole = (role: UserRole) => {
    switchRole(role);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 4 Independent Role Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 sm:gap-5">
        {/* Role: Sinh viên */}
        <div
          onClick={() => handleSelectRole('STUDENT')}
          className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer bg-white flex flex-col justify-between shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(37,99,235,0.12),0_2px_6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 ${
            currentRole === 'STUDENT'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/15'
              : 'border-slate-200/90 hover:border-blue-400'
          }`}
        >
          {currentRole === 'STUDENT' && (
            <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Đang chọn
            </div>
          )}
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform mb-3.5">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <span>Sinh viên</span>
            </h3>
            <p className="text-[15px] text-[#01080e] mt-1.5 leading-relaxed">
              Tra cứu lịch học hôm nay trong 2s, thời khóa biểu theo tuần, phòng thi, giảng viên và thông báo dời phòng Nhà H.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
            <span>Truy cập lịch học</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Role: Giảng viên */}
        <div
          onClick={() => handleSelectRole('LECTURER')}
          className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer bg-white flex flex-col justify-between shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(16,185,129,0.12),0_2px_6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 ${
            currentRole === 'LECTURER'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/15'
              : 'border-slate-200/90 hover:border-emerald-400'
          }`}
        >
          {currentRole === 'LECTURER' && (
            <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Đang chọn
            </div>
          )}
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform mb-3.5">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
              <span>Giảng viên</span>
            </h3>
            <p className="text-[15px] text-[#060f1c] mt-1.5 leading-relaxed">
              Xem lịch giảng dạy cá nhân, thống kê số tiết lý thuyết/thực hành, danh sách lớp phụ trách và tải đào tạo.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
            <span>Xem lịch giảng</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Role: Quản lý đào tạo */}
        <div
          onClick={() => handleSelectRole('MANAGER')}
          className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer bg-white flex flex-col justify-between shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(245,158,11,0.12),0_2px_6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 ${
            currentRole === 'MANAGER'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/15'
              : 'border-slate-200/90 hover:border-amber-400'
          }`}
        >
          {currentRole === 'MANAGER' && (
            <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Đang chọn
            </div>
          )}
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform mb-3.5">
              <Layers className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Quản lý đào tạo
              </h3>
              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> Yêu cầu Login
              </span>
            </div>
            <p className="text-[15px] text-[#091d3a] mt-1.5 leading-relaxed">
              Dashboard KPIs đào tạo, thống kê tải giảng dạy toàn khoa, quản lý & phát sóng thông báo, kiểm tra xung đột phòng Nhà H.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
            <span>Mở Quản lý Đào tạo</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Role: Quản trị viên (Admin) */}
        <div
          onClick={() => handleSelectRole('ADMIN')}
          className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer bg-white flex flex-col justify-between shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(168,85,247,0.12),0_2px_6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 ${
            currentRole === 'ADMIN'
              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/15'
              : 'border-slate-200/90 hover:border-purple-400'
          }`}
        >
          {currentRole === 'ADMIN' && (
            <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Đang chọn
            </div>
          )}
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform mb-3.5">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Quản trị (Admin)
              </h3>
              <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> Yêu cầu Login
              </span>
            </div>
            <p className="text-[15px] text-[#0d1b2d] mt-1.5 leading-relaxed">
              Quản lý người dùng & phân quyền toàn hệ thống, quản trị nguồn cào (cntt.pdu.edu.vn), đồng bộ dữ liệu và audit log.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
            <span>Quản trị Hệ thống</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Quick Summary Highlights / Nhà H Info - 3 Independent Cards with soft drop shadow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 sm:gap-5">
        {/* Card 1: Cơ sở Nhà H */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(37,99,235,0.1),0_2px_6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[16px] font-bold text-slate-900">Cơ sở Nhà H - Khoa CNTT</div>
            <p className="text-[14px] text-slate-600 mt-1 leading-relaxed">
              Quy mô 3 tầng với 12 phòng học lý thuyết & thực hành (H.101 - H.304), sức chứa 40 SV/phòng.
            </p>
          </div>
        </div>

        {/* Card 2: Tra cứu nhanh */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(16,185,129,0.1),0_2px_6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[16px] font-bold text-slate-900">Tra cứu nhanh trong 2s</div>
            <p className="text-[14px] text-slate-600 mt-1 leading-relaxed">
              Hệ thống lọc theo Lớp (CNTT21, CNTT22...), Giảng viên, Phòng học và Ca sáng/chiều tức thì.
            </p>
          </div>
        </div>

        {/* Card 3: Trợ lý AI & Cảnh báo */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(99,102,241,0.1),0_2px_6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[16px] font-bold text-slate-900">Trợ lý AI & Cảnh báo</div>
            <p className="text-[14px] text-slate-600 mt-1 leading-relaxed">
              Hỏi đáp tự nhiên về lịch học, kiểm tra phòng trống và tự động thông báo khi có thay đổi lịch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
