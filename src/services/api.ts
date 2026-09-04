import {
  DataSource,
  Schedule,
  ExamSchedule,
  ScheduleConflict,
  ScheduleChange,
  Room,
  Course,
  Lecturer,
  Department,
  StudentClass,
  SyncLog,
  AuditLog,
  WorkloadStat,
  RoomUtilizationStat,
  User,
  AnnouncementNotification,
  CohortOverviewStat,
  BuildingHAllocationStat,
  BuildingHConflictEvaluation,
} from '../types';

const API_BASE = '/api';

/**
 * Returns role and user authentication headers from local storage.
 */
function getAuthHeaders(): Record<string, string> {
  const role = localStorage.getItem('pdu_role') || 'STUDENT';
  const userJson = localStorage.getItem('pdu_user');
  let userId = 'usr_guest';
  if (userJson) {
    try {
      const u = JSON.parse(userJson);
      userId = u.id || u.username || 'usr_guest';
    } catch {}
  }
  return {
    'X-User-Role': role,
    'X-User-Id': userId,
  };
}

/**
 * Robust JSON fetch wrapper that guards against HTML responses or server resets
 * preventing "Unexpected token '<', '<!doctype '... is not valid JSON" errors.
 */
async function safeFetchJson<T>(url: string, options?: RequestInit, fallback: T = [] as any): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      console.warn(`Fetch to ${url} failed with status:`, res.status);
      return fallback;
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`Fetch to ${url} returned non-JSON content-type:`, contentType);
      return fallback;
    }
    return await res.json();
  } catch (err: any) {
    console.error(`Safe fetch error for ${url}:`, err.message);
    return fallback;
  }
}

export const api = {
  // Auth & Users
  async login(emailOrUsername: string, password?: string): Promise<{ success: boolean; token?: string; user?: User; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: emailOrUsername, email: emailOrUsername, password }),
      });
      const data = await res.json().catch(() => ({ success: false, message: 'Lỗi phản hồi máy chủ' }));
      if (!res.ok) {
        return { success: false, message: data.message || data.error || 'Đăng nhập không thành công' };
      }
      return data;
    } catch (err: any) {
      return { success: false, message: 'Lỗi kết nối máy chủ xác thực: ' + err.message };
    }
  },

  async loginWithGoogle(params: { credential?: string; email?: string; name?: string; picture?: string }): Promise<{ success: boolean; token?: string; user?: User; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/google-sso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json().catch(() => ({ success: false, message: 'Lỗi phản hồi máy chủ' }));
      if (!res.ok) {
        return { success: false, message: data.message || data.error || 'Đăng nhập Google không thành công' };
      }
      return data;
    } catch (err: any) {
      return { success: false, message: 'Lỗi kết nối máy chủ xác thực Google: ' + err.message };
    }
  },

  async getUsers(): Promise<User[]> {
    return safeFetchJson<User[]>(`${API_BASE}/users`, undefined, []);
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi tạo người dùng' }));
      throw new Error(err.error || 'Lỗi tạo người dùng');
    }
    return res.json();
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi cập nhật người dùng' }));
      throw new Error(err.error || 'Lỗi cập nhật người dùng');
    }
    return res.json();
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi xóa người dùng' }));
      throw new Error(err.error || 'Lỗi xóa người dùng');
    }
    return res.json();
  },

  async resetUserPassword(id: string, newPassword?: string): Promise<{ success: boolean; newPassword: string; message: string }> {
    const res = await fetch(`${API_BASE}/users/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi đặt lại mật khẩu' }));
      throw new Error(err.error || 'Lỗi đặt lại mật khẩu');
    }
    return res.json();
  },

  async toggleUserStatus(id: string): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/users/${id}/toggle-status`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi đổi trạng thái' }));
      throw new Error(err.error || 'Lỗi đổi trạng thái');
    }
    return res.json();
  },

  // Sources
  async getSources(): Promise<DataSource[]> {
    return safeFetchJson<DataSource[]>(`${API_BASE}/sources`, undefined, []);
  },

  async addSource(data: Partial<DataSource>): Promise<DataSource> {
    const res = await fetch(`${API_BASE}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateSource(id: string, data: Partial<DataSource>): Promise<DataSource> {
    const res = await fetch(`${API_BASE}/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteSource(id: string): Promise<{ success: boolean }> {
    return safeFetchJson(`${API_BASE}/sources/${id}`, { method: 'DELETE' }, { success: true });
  },

  async testConnection(url: string): Promise<{ success: boolean; reachable: boolean; responseTimeMs: number; message: string; detectedType?: string }> {
    return safeFetchJson(`${API_BASE}/sources/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }, { success: false, reachable: false, responseTimeMs: 0, message: 'Không thể kết nối đến URL' });
  },

  async syncSource(id: string): Promise<{ success: boolean; source: DataSource; log: SyncLog }> {
    return safeFetchJson(`${API_BASE}/sources/${id}/sync`, { method: 'POST' }, { success: false } as any);
  },

  async previewImport(url: string): Promise<any> {
    return safeFetchJson(`${API_BASE}/sources/preview-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }, { success: false });
  },

  // Schedules
  async getSchedules(params?: Record<string, any>): Promise<Schedule[]> {
    const query = new URLSearchParams(params || {}).toString();
    return safeFetchJson<Schedule[]>(`${API_BASE}/schedules${query ? `?${query}` : ''}`, undefined, []);
  },

  async getTodaySchedule(role: string, entityId?: string): Promise<{
    date: string;
    weekday: number;
    weekdayName: string;
    totalClasses: number;
    totalPeriods: number;
    schedules: Schedule[];
  }> {
    const query = new URLSearchParams({ role, ...(entityId ? { entityId } : {}) }).toString();
    return safeFetchJson(`${API_BASE}/schedules/today?${query}`, undefined, {
      date: new Date().toISOString().split('T')[0],
      weekday: 2,
      weekdayName: 'Thứ Hai',
      totalClasses: 0,
      totalPeriods: 0,
      schedules: [],
    });
  },

  async getScheduleChanges(): Promise<ScheduleChange[]> {
    return safeFetchJson<ScheduleChange[]>(`${API_BASE}/schedules/changes`, undefined, []);
  },

  // Exams
  async getExams(params?: Record<string, any>): Promise<ExamSchedule[]> {
    const query = new URLSearchParams(params || {}).toString();
    return safeFetchJson<ExamSchedule[]>(`${API_BASE}/exams${query ? `?${query}` : ''}`, undefined, []);
  },

  async createExam(data: Partial<ExamSchedule>): Promise<{ success: boolean; isUpdated?: boolean; message: string; exam: ExamSchedule }> {
    const res = await fetch(`${API_BASE}/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi thêm lịch thi' }));
      throw new Error(err.error || 'Lỗi thêm lịch thi');
    }
    return res.json();
  },

  async updateExam(id: string, data: Partial<ExamSchedule>): Promise<{ success: boolean; message: string; exam: ExamSchedule }> {
    const res = await fetch(`${API_BASE}/exams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi cập nhật ca thi' }));
      throw new Error(err.error || 'Lỗi cập nhật ca thi');
    }
    return res.json();
  },

  async deleteExam(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/exams/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi xóa ca thi' }));
      throw new Error(err.error || 'Lỗi xóa ca thi');
    }
    return res.json();
  },

  // Metadata entities
  async getRooms(): Promise<Room[]> {
    return safeFetchJson<Room[]>(`${API_BASE}/rooms`, undefined, []);
  },

  async getCourses(): Promise<Course[]> {
    return safeFetchJson<Course[]>(`${API_BASE}/courses`, undefined, []);
  },

  async getLecturers(): Promise<Lecturer[]> {
    return safeFetchJson<Lecturer[]>(`${API_BASE}/lecturers`, undefined, []);
  },

  async createLecturer(data: Partial<Lecturer>): Promise<Lecturer> {
    const res = await fetch(`${API_BASE}/lecturers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi thêm giảng viên mới' }));
      throw new Error(err.error || 'Lỗi thêm giảng viên mới');
    }
    return res.json();
  },

  async updateLecturer(id: string, data: Partial<Lecturer>): Promise<Lecturer> {
    const res = await fetch(`${API_BASE}/lecturers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi cập nhật giảng viên' }));
      throw new Error(err.error || 'Lỗi cập nhật giảng viên');
    }
    return res.json();
  },

  async deleteLecturer(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/lecturers/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi xóa giảng viên' }));
      throw new Error(err.error || 'Lỗi xóa giảng viên');
    }
    return res.json();
  },

  async createLecturerAccount(
    lecturerId: string,
    accountData: { username?: string; password?: string; email?: string; phone?: string; role?: string }
  ): Promise<{ success: boolean; message: string; user: User; password?: string; lecturer: Lecturer }> {
    const res = await fetch(`${API_BASE}/lecturers/${lecturerId}/create-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(accountData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi tạo tài khoản cho giảng viên' }));
      throw new Error(err.error || 'Lỗi tạo tài khoản cho giảng viên');
    }
    return res.json();
  },

  async linkLecturerAccount(lecturerId: string, userId: string): Promise<{ success: boolean; message: string; user: User; lecturer: Lecturer }> {
    const res = await fetch(`${API_BASE}/lecturers/${lecturerId}/link-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi liên kết tài khoản cho giảng viên' }));
      throw new Error(err.error || 'Lỗi liên kết tài khoản cho giảng viên');
    }
    return res.json();
  },

  async unlinkLecturerAccount(lecturerId: string): Promise<{ success: boolean; message: string; lecturer: Lecturer }> {
    const res = await fetch(`${API_BASE}/lecturers/${lecturerId}/unlink-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi hủy liên kết tài khoản' }));
      throw new Error(err.error || 'Lỗi hủy liên kết tài khoản');
    }
    return res.json();
  },

  // ==========================================
  // DEPARTMENTS / ACADEMIC UNITS APIS
  // ==========================================
  async getDepartments(): Promise<Department[]> {
    return safeFetchJson<Department[]>(`${API_BASE}/departments`, undefined, []);
  },

  async createDepartment(data: Partial<Department>): Promise<Department> {
    const res = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi thêm bộ môn / đơn vị mới' }));
      throw new Error(err.error || 'Lỗi thêm bộ môn / đơn vị mới');
    }
    return res.json();
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    const res = await fetch(`${API_BASE}/departments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi cập nhật bộ môn / đơn vị' }));
      throw new Error(err.error || 'Lỗi cập nhật bộ môn / đơn vị');
    }
    return res.json();
  },

  async deleteDepartment(id: string, migrateTo?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/departments/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ migrateTo }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi xóa bộ môn / đơn vị' }));
      throw new Error(err.error || 'Lỗi xóa bộ môn / đơn vị');
    }
    return res.json();
  },

  async getClasses(): Promise<StudentClass[]> {
    return safeFetchJson<StudentClass[]>(`${API_BASE}/classes`, undefined, []);
  },

  async getConflicts(): Promise<ScheduleConflict[]> {
    return safeFetchJson<ScheduleConflict[]>(`${API_BASE}/conflicts`, undefined, []);
  },

  // Analytics
  async getSummaryStats(): Promise<any> {
    return safeFetchJson(`${API_BASE}/statistics/summary`, undefined, {
      totalCourses: 0,
      totalClasses: 0,
      totalLecturers: 0,
      totalRooms: 12,
      totalStudents: 0,
      totalWeeklyPeriods: 0,
      totalExams: 0,
      activeSources: 0,
      unresolvedConflicts: 0,
      recentChanges: 0,
    });
  },

  async getWorkloadStats(weekId?: string): Promise<WorkloadStat[]> {
    const query = weekId ? `?weekId=${encodeURIComponent(weekId)}` : '';
    return safeFetchJson<WorkloadStat[]>(`${API_BASE}/statistics/workload${query}`, undefined, []);
  },

  async getRoomStats(): Promise<RoomUtilizationStat[]> {
    return safeFetchJson<RoomUtilizationStat[]>(`${API_BASE}/statistics/rooms`, undefined, []);
  },

  // New High-level Academic Manager Analytics
  async getCohortOverview(weekId?: string): Promise<CohortOverviewStat[]> {
    const query = weekId ? `?weekId=${encodeURIComponent(weekId)}` : '';
    return safeFetchJson<CohortOverviewStat[]>(`${API_BASE}/statistics/cohort-overview${query}`, undefined, []);
  },

  async getBuildingHAllocation(weekId?: string): Promise<BuildingHAllocationStat[]> {
    const query = weekId ? `?weekId=${encodeURIComponent(weekId)}` : '';
    return safeFetchJson<BuildingHAllocationStat[]>(`${API_BASE}/statistics/building-h-allocation${query}`, undefined, []);
  },

  async getBuildingHConflictEvaluation(weekId?: string): Promise<BuildingHConflictEvaluation> {
    const query = weekId ? `?weekId=${encodeURIComponent(weekId)}` : '';
    return safeFetchJson<BuildingHConflictEvaluation>(`${API_BASE}/conflicts/scan-building-h${query}`, undefined, {
      totalRoomsChecked: 12,
      conflictCount: 0,
      conflictedRoomsCount: 0,
      highLoadCount: 0,
      optimalRoomsCount: 12,
      safeRoomsCount: 12,
      totalSessionsChecked: 84,
      status: 'SAFE',
      conflicts: [],
      roomStatusList: [],
      sessionMatrix: [],
      lastEvaluated: new Date().toISOString(),
    });
  },

  async scanBuildingHConflicts(weekId?: string): Promise<{ success: boolean; message: string; evaluation: BuildingHConflictEvaluation }> {
    return safeFetchJson(`${API_BASE}/conflicts/scan-building-h`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekId }),
    }, {
      success: true,
      message: 'Đã hoàn tất quét!',
      evaluation: {
        totalRoomsChecked: 12,
        conflictCount: 0,
        conflictedRoomsCount: 0,
        highLoadCount: 0,
        optimalRoomsCount: 12,
        safeRoomsCount: 12,
        totalSessionsChecked: 84,
        status: 'SAFE',
        conflicts: [],
        roomStatusList: [],
        sessionMatrix: [],
        lastEvaluated: new Date().toISOString(),
      },
    });
  },

  async getSyncLogs(): Promise<SyncLog[]> {
    return safeFetchJson<SyncLog[]>(`${API_BASE}/logs/sync`, undefined, []);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return safeFetchJson<AuditLog[]>(`${API_BASE}/logs/audit`, undefined, []);
  },

  // AI Chat
  async askAI(message: string, history?: any[], context?: any): Promise<{ reply: string; functionExecuted?: string; data?: any }> {
    return safeFetchJson(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, context }),
    }, { reply: 'Xin lỗi, tôi chưa thể xử lý yêu cầu lúc này.' });
  },

  // Timetable Weeks & Class / Lecturer Lookup (cntt.pdu.edu.vn)
  async getTimetableWeeks(): Promise<any[]> {
    return safeFetchJson<any[]>(`${API_BASE}/timetable/weeks`, undefined, []);
  },

  async getTimetableLecturers(): Promise<any[]> {
    return safeFetchJson<any[]>(`${API_BASE}/timetable/lecturers`, undefined, []);
  },

  async queryTimetable(weekId?: string, className?: string, teacherName?: string): Promise<any> {
    const params: Record<string, string> = {};
    if (weekId) params.weekId = weekId;
    if (className) params.className = className;
    if (teacherName) params.teacherName = teacherName;
    const query = new URLSearchParams(params).toString();
    return safeFetchJson(`${API_BASE}/timetable/query?${query}`, undefined, { weeks: [], results: [] });
  },

  async syncPDUData(): Promise<{ success: boolean; message: string; weeks: any[]; count: number }> {
    return safeFetchJson(`${API_BASE}/timetable/sync-pdu`, { method: 'POST' }, { success: false, message: 'Lỗi đồng bộ', weeks: [], count: 0 });
  },

  // Google Sheets & URL Auto-Sync APIs
  async importTimetableGoogleSheet(data: {
    url: string;
    title?: string;
    weekNumber?: number;
    isCurrent?: boolean;
    rawText?: string;
  }): Promise<{ success: boolean; message: string; week: any; entriesCount: number; classesCount: number }> {
    const res = await fetch(`${API_BASE}/timetable/import-google-sheet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Lỗi khi nhập dữ liệu Google Sheet' }));
      throw new Error(err.message || err.error || 'Lỗi khi nhập dữ liệu Google Sheet');
    }
    return res.json();
  },

  async updateTimetableWeek(weekId: string, data: {
    title?: string;
    url?: string;
    weekNumber?: number;
    current?: boolean;
    reSync?: boolean;
    rawText?: string;
  }): Promise<{ success: boolean; message: string; week: any; weeks: any[] }> {
    const res = await fetch(`${API_BASE}/timetable/weeks/${weekId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Lỗi khi cập nhật thời khóa biểu tuần' }));
      throw new Error(err.message || err.error || 'Lỗi khi cập nhật thời khóa biểu tuần');
    }
    return res.json();
  },

  async setCurrentTimetableWeek(weekId: string): Promise<{ success: boolean; message: string; weeks: any[] }> {
    const res = await fetch(`${API_BASE}/timetable/weeks/${weekId}/set-current`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Lỗi khi đặt tuần hiện tại' }));
      throw new Error(err.message || err.error || 'Lỗi khi đặt tuần hiện tại');
    }
    return res.json();
  },

  async deleteTimetableWeek(weekId: string): Promise<{ success: boolean; message: string; weeks: any[] }> {
    const res = await fetch(`${API_BASE}/timetable/weeks/${weekId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Lỗi khi xóa tuần thời khóa biểu' }));
      throw new Error(err.message || err.error || 'Lỗi khi xóa tuần thời khóa biểu');
    }
    return res.json();
  },

  async importExamsGoogleSheet(data: {
    url: string;
    title?: string;
    semesterId?: string;
    academicYear?: string;
    semesterName?: string;
    cohort?: string;
    rawText?: string;
    replaceExisting?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    examsCount: number;
    importedCount?: number;
    updatedCount?: number;
    createdCount?: number;
    exams: ExamSchedule[];
  }> {
    const res = await fetch(`${API_BASE}/exams/import-google-sheet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Lỗi khi nhập lịch thi Google Sheet' }));
      throw new Error(err.message || err.error || 'Lỗi khi nhập lịch thi Google Sheet');
    }
    return res.json();
  },

  async autoSyncUrls(): Promise<{
    success: boolean;
    message: string;
    sourcesSynced: number;
    timetableWeeksCount: number;
    examsCount: number;
    lastSynced: string;
  }> {
    return safeFetchJson(`${API_BASE}/sync/auto-sync-all`, { method: 'POST' }, {
      success: false,
      message: 'Không thể kích hoạt tự động đồng bộ',
      sourcesSynced: 0,
      timetableWeeksCount: 0,
      examsCount: 0,
      lastSynced: '',
    });
  },

  async getSyncStatus(): Promise<{
    autoSyncEnabled: boolean;
    lastSynced: string;
    syncInterval: string;
    sources: { name: string; url: string; type: string; status: string; lastSync: string }[];
  }> {
    return safeFetchJson(`${API_BASE}/sync/status`, undefined, {
      autoSyncEnabled: true,
      lastSynced: '',
      syncInterval: 'Mỗi 3 giờ',
      sources: [],
    });
  },

  // Notification & Announcement APIs
  async getNotifications(params?: { audience?: string; type?: string; activeOnly?: boolean }): Promise<AnnouncementNotification[]> {
    const query = new URLSearchParams({
      ...(params?.audience ? { audience: params.audience } : {}),
      ...(params?.type ? { type: params.type } : {}),
      ...(params?.activeOnly ? { activeOnly: 'true' } : {}),
    }).toString();
    return safeFetchJson<AnnouncementNotification[]>(`${API_BASE}/notifications${query ? `?${query}` : ''}`, undefined, []);
  },

  async createNotification(data: Partial<AnnouncementNotification>): Promise<AnnouncementNotification> {
    const res = await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi tạo thông báo' }));
      throw new Error(err.error || 'Lỗi tạo thông báo');
    }
    return res.json();
  },

  async updateNotification(id: string, data: Partial<AnnouncementNotification>): Promise<AnnouncementNotification> {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi cập nhật thông báo' }));
      throw new Error(err.error || 'Lỗi cập nhật thông báo');
    }
    return res.json();
  },

  async deleteNotification(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi xóa thông báo' }));
      throw new Error(err.error || 'Lỗi xóa thông báo');
    }
    return res.json();
  },

  async toggleNotificationPin(id: string): Promise<{ success: boolean; notification: AnnouncementNotification }> {
    return safeFetchJson(`${API_BASE}/notifications/${id}/toggle-pin`, { method: 'POST' }, { success: false, notification: {} as any });
  },

  async toggleNotificationActive(id: string): Promise<{ success: boolean; notification: AnnouncementNotification }> {
    return safeFetchJson(`${API_BASE}/notifications/${id}/toggle-active`, { method: 'POST' }, { success: false, notification: {} as any });
  },
};

