import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Key,
  X,
  AlertCircle,
  Shield,
  Layers,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, loginTargetRole, setLoginTargetRole, login } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (loginTargetRole === 'ADMIN') {
      setEmailInput('pvantho@pdu.edu.vn');
      setPassword('');
    } else {
      setEmailInput('');
      setPassword('');
    }
    setError('');
  }, [loginTargetRole, isLoginModalOpen]);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Vui lòng nhập địa chỉ email @pdu.edu.vn');
      return;
    }

    // Auto-append @pdu.edu.vn if no @ domain provided
    if (!cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@pdu.edu.vn`;
      setEmailInput(cleanEmail);
    }

    // STRICT VALIDATION: Must end with @pdu.edu.vn or .pdu.edu.vn
    if (!cleanEmail.endsWith('@pdu.edu.vn') && !cleanEmail.endsWith('.pdu.edu.vn')) {
      setError('Hệ thống chỉ cho phép đăng nhập bằng tài khoản email trường Đại học Phạm Văn Đồng (@pdu.edu.vn).');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await login(cleanEmail, password);
      if (!ok) {
        setError('Đăng nhập không thành công. Vui lòng kiểm tra lại địa chỉ email hoặc liên hệ Quản trị viên (pvantho@pdu.edu.vn).');
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi kết nối tới máy chủ xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsLoginModalOpen(false);
    setLoginTargetRole(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 text-center border-b border-slate-100 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50">
          <div className="w-14 h-14 rounded-2xl bg-[#0C2340] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-900/20">
            {loginTargetRole === 'ADMIN' ? (
              <Shield className="w-7 h-7 text-purple-300" />
            ) : loginTargetRole === 'MANAGER' ? (
              <Layers className="w-7 h-7 text-amber-300" />
            ) : (
              <Lock className="w-7 h-7 text-blue-300" />
            )}
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Đăng nhập PDU Academic</h3>
          <p className="text-[13px] font-medium text-blue-800/80 mt-1">
            Cổng thông tin Đào tạo & Quản lý TKB Đại học Phạm Văn Đồng
          </p>

          {loginTargetRole === 'ADMIN' ? (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
              Yêu cầu quyền Quản trị viên (Admin: pvantho@pdu.edu.vn)
            </div>
          ) : loginTargetRole === 'MANAGER' ? (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
              <Layers className="w-3.5 h-3.5" />
              Yêu cầu quyền Ban Quản lý Đào tạo Khoa CNTT
            </div>
          ) : (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100/80 text-blue-900 rounded-full text-xs font-semibold">
              <Mail className="w-3.5 h-3.5 text-blue-700" />
              Chỉ chấp nhận email <span className="font-bold">@pdu.edu.vn</span>
            </div>
          )}
        </div>

        {/* Info Banner on System Role Policy */}
        <div className="mx-6 mt-4 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[12px] text-amber-900 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div>
              <span className="font-bold">Admin hệ thống:</span> <span className="font-mono font-bold text-amber-950">pvantho@pdu.edu.vn</span>
            </div>
            <div className="text-amber-800 text-[11px]">
              Tài khoản mới khi đăng nhập lần đầu nhận vai trò mặc định là <span className="font-bold text-blue-900">Sinh viên</span>. Quản trị viên sẽ trực tiếp phân quyền.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Địa chỉ Email PDU (@pdu.edu.vn) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="ví dụ: pvantho@pdu.edu.vn..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Nhập email đuôi <span className="font-mono text-blue-600 font-semibold">@pdu.edu.vn</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#0C2340] hover:bg-blue-900 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-900/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Đang xác thực...' : 'Đăng nhập với Email PDU'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
