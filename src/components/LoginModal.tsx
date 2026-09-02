import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Official Google 'G' Multi-color Logo
const GoogleLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, loginTargetRole, setLoginTargetRole, login, loginGoogle } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'google' | 'password'>('google');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize Google Sign-In button if Google Identity Services is available
  useEffect(() => {
    if (!isLoginModalOpen) return;

    if (loginTargetRole === 'ADMIN') {
      setEmailInput('pvantho@pdu.edu.vn');
    } else {
      setEmailInput('');
    }
    setError('');

    // Try initializing Google One Tap / GIS button
    const initGoogleGsi = () => {
      const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '1048293749281-pdu-academic.apps.googleusercontent.com';
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            hd: 'pdu.edu.vn', // Restrict to pdu.edu.vn Google Workspace
          });

          if (googleBtnRef.current) {
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'filled_blue',
              size: 'large',
              shape: 'pill',
              text: 'signin_with',
              logo_alignment: 'left',
              width: 340,
            });
          }
        } catch (gErr) {
          console.log('Google Identity Services note:', gErr);
        }
      }
    };

    const timer = setTimeout(initGoogleGsi, 300);
    return () => clearTimeout(timer);
  }, [loginTargetRole, isLoginModalOpen]);

  if (!isLoginModalOpen) return null;

  // Handle Google Token Response from GIS
  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await loginGoogle({ credential: response.credential });
      if (!res.success) {
        setError(res.message || 'Đăng nhập Google thất bại');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối xác thực Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Workspace 1-Click SSO (Passwordless)
  const handleGoogleWorkspaceSSO = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    let targetEmail = emailInput.trim().toLowerCase();
    if (!targetEmail) {
      if (loginTargetRole === 'ADMIN') {
        targetEmail = 'pvantho@pdu.edu.vn';
      } else {
        targetEmail = 'pvantho@pdu.edu.vn'; // Default recommended account
      }
    }

    // Auto append domain if not present
    if (!targetEmail.includes('@')) {
      targetEmail = `${targetEmail}@pdu.edu.vn`;
      setEmailInput(targetEmail);
    }

    if (!targetEmail.endsWith('@pdu.edu.vn') && !targetEmail.endsWith('.pdu.edu.vn')) {
      setError('Hệ thống chỉ chấp nhận tài khoản Google Doanh nghiệp có đuôi @pdu.edu.vn.');
      return;
    }

    setIsLoading(true);

    // If GIS popup prompt is available, try prompt
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to server-side Google SSO verification
            loginGoogle({ email: targetEmail })
              .then((res) => {
                if (!res.success) setError(res.message || 'Đăng nhập thất bại');
              })
              .catch((err) => setError(err.message))
              .finally(() => setIsLoading(false));
          }
        });
      } catch {
        const res = await loginGoogle({ email: targetEmail });
        if (!res.success) setError(res.message || 'Đăng nhập thất bại');
        setIsLoading(false);
      }
    } else {
      // Direct passwordless authentication with PDU Google Workspace Account
      try {
        const res = await loginGoogle({ email: targetEmail });
        if (!res.success) {
          setError(res.message || 'Đăng nhập không thành công.');
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi kết nối xác thực Google.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Standard Login (with Password option)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Vui lòng nhập địa chỉ email @pdu.edu.vn');
      return;
    }

    if (!cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@pdu.edu.vn`;
      setEmailInput(cleanEmail);
    }

    if (!cleanEmail.endsWith('@pdu.edu.vn') && !cleanEmail.endsWith('.pdu.edu.vn')) {
      setError('Hệ thống chỉ cho phép đăng nhập bằng tài khoản email trường Đại học Phạm Văn Đồng (@pdu.edu.vn).');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await login(cleanEmail, password);
      if (!ok) {
        setError('Đăng nhập không thành công. Vui lòng kiểm tra lại email hoặc liên hệ Quản trị viên (pvantho@pdu.edu.vn).');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-200">
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
              <GoogleLogoSvg className="w-7 h-7" />
            )}
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Đăng nhập PDU Academic</h3>
          <p className="text-[13px] font-medium text-blue-800/80 mt-1">
            Google Workspace Doanh nghiệp • Đại học Phạm Văn Đồng
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
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100/90 text-emerald-900 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              Không cần mật khẩu • Xác thực qua Google Workspace
            </div>
          )}
        </div>

        {/* Info Banner on System Role Policy */}
        <div className="mx-6 mt-4 p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-[12px] text-blue-950 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div>
              <span className="font-bold">Đăng nhập an toàn & nhanh chóng:</span> Đăng nhập trực tiếp bằng tài khoản Google trường (<span className="font-mono font-bold text-blue-900">@pdu.edu.vn</span>).
            </div>
            <div className="text-blue-800/80 text-[11px]">
              Admin hệ thống: <span className="font-mono font-bold text-blue-950">pvantho@pdu.edu.vn</span>. Người dùng mới mặc định là <span className="font-bold">Sinh viên</span>.
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* MAIN ACTION: 1-Click Sign in with Google Workspace (No Password) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleGoogleWorkspaceSSO()}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl font-bold text-sm border-2 border-slate-200 hover:border-blue-400 shadow-sm transition flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-50"
            >
              <GoogleLogoSvg className="w-5 h-5 shrink-0" />
              <span>Đăng nhập với Google Doanh nghiệp (@pdu.edu.vn)</span>
            </button>

            {/* Hidden container for rendered Google GIS button if available */}
            <div ref={googleBtnRef} className="flex justify-center empty:hidden"></div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Hoặc nhập Email PDU
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Email input form for passwordless or optional password */}
          <form onSubmit={authMode === 'google' ? handleGoogleWorkspaceSSO : handlePasswordSubmit} className="space-y-3.5">
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
                  placeholder="pvantho@pdu.edu.vn, ten@pdu.edu.vn..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                />
              </div>
            </div>

            {authMode === 'password' && (
              <div className="animate-in fade-in duration-150">
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
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#0C2340] hover:bg-blue-900 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-900/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                'Đang xác thực Google...'
              ) : authMode === 'google' ? (
                <>
                  <span>Tiếp tục với Google Workspace (Không cần MK)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Đăng nhập với Mật khẩu</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'google' ? 'password' : 'google')}
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                {authMode === 'google' ? 'Tùy chọn: Đăng nhập bằng mật khẩu' : 'Đăng nhập không cần mật khẩu (Google SSO)'}
              </button>

              <span className="text-slate-400">PDU Education v2.5</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
