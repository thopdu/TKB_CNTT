/**
 * PDU Academic - Types & Interfaces
 */

export type UserRole = 'STUDENT' | 'LECTURER' | 'MANAGER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  entityId?: string; // student_id or lecturer_id
  phone?: string;
  department?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  lastLogin?: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2025-2026"
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface Semester {
  id: string;
  academicYearId: string;
  name: string; // e.g. "Học kỳ 1", "Học kỳ 2", "Học kỳ Hè"
  startDate: string;
  endDate: string;
  weeksCount: number;
  active: boolean;
}

export interface Room {
  id: string;
  roomCode: string; // e.g. "H.101", "H.301"
  building: string; // "Nhà H"
  floor: number; // 1, 2, 3
  capacity: number; // 40
  roomType: 'LECTURE' | 'LAB' | 'SEMINAR';
  hasProjector: boolean;
  hasAirConditioner: boolean;
  description: string;
  active: boolean;
}

export interface Department {
  id: string;
  code: string; // e.g. "BM_CNPM"
  name: string; // e.g. "Bộ môn Công nghệ Phần mềm"
  faculty?: string; // "Khoa Công nghệ Thông tin"
  headName?: string; // Trưởng bộ môn / Phụ trách đơn vị
  phone?: string;
  email?: string;
  description?: string;
  active: boolean;
  lecturerCount?: number;
}

export interface Course {
  id: string;
  courseCode: string; // e.g. "CNTT301"
  courseName: string; // e.g. "Cơ sở dữ liệu"
  credits: number; // 3
  theoryPeriods: number;
  practicePeriods: number;
  department: string; // "Khoa Công nghệ Thông tin"
  lecturerId?: string;
  lecturerName?: string;
  description?: string;
  active: boolean;
}

export interface Lecturer {
  id: string;
  lecturerCode: string; // e.g. "GV001"
  fullName: string; // e.g. "ThS. Nguyễn Văn An"
  email: string;
  phone?: string;
  department: string; // "Bộ môn Khoa học Máy tính"
  degree: string; // "Thạc sĩ", "Tiến sĩ"
  active: boolean;
  userId?: string;
  username?: string;
  hasAccount?: boolean;
  accountStatus?: 'ACTIVE' | 'INACTIVE';
  userRole?: UserRole;
}

export interface StudentClass {
  id: string;
  classCode: string; // e.g. "D22CNTT01"
  className: string; // e.g. "Đại học CNTT K22A"
  cohort: string; // "K22"
  major: string; // "Công nghệ Thông tin"
  department: string;
  studentCount: number;
}

export interface Student {
  id: string;
  studentCode: string; // e.g. "2210310001"
  fullName: string;
  classId: string;
  email: string;
  active: boolean;
}

export type ScheduleStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CHANGED' | 'CANCELLED';

export interface Schedule {
  id: string;
  semesterId: string;
  week: number;
  date: string; // "YYYY-MM-DD"
  weekday: number; // 2 (Thứ 2) to 8 (Chủ nhật)
  periodStart: number; // 1-10
  periodEnd: number; // 1-10
  startTime: string; // "07:00"
  endTime: string; // "09:30"
  courseId: string;
  courseCode: string;
  courseName: string;
  lecturerId: string;
  lecturerName: string;
  classId: string;
  classCode: string;
  roomId: string;
  roomCode: string;
  building: string;
  sourceId: string;
  sourceUrl?: string;
  status: ScheduleStatus;
  version: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExamType = 'Tự luận' | 'Trắc nghiệm' | 'Thực hành máy tính' | 'Vấn đáp' | 'Bảo vệ Đồ án' | 'Tự luận (90 phút)' | 'Thực hành máy (120 phút)' | string;

export interface ExamSchedule {
  id: string;
  semesterId: string;
  academicYear?: string; // "2025-2026", "2024-2025", "2026-2027"
  semesterName?: string; // "Học kỳ 1", "Học kỳ 2", "Học kỳ Hè"
  cohort?: string; // "D21", "D22", "D23", "D24", "D25"
  courseId: string;
  courseCode: string;
  courseName: string;
  classId: string;
  classCode: string;
  lecturerId: string;
  lecturerName: string;
  invigilator1?: string;
  invigilator2?: string;
  examDate: string; // "YYYY-MM-DD"
  startTime: string; // "07:30"
  endTime: string; // "09:00"
  roomId: string;
  roomCode: string;
  building: string;
  examType: ExamType;
  durationMinutes: number;
  studentCount?: number;
  note?: string;
  notes?: string;
  sourceId: string;
  updatedAt?: string;
}

export type SourceType = 'WORDPRESS' | 'EXCEL' | 'PDF' | 'CSV' | 'JSON' | 'REST_API' | 'EXCEL_SHEET' | 'GOOGLE_SHEET' | string;
export type SyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'WARNING' | 'FAILED' | 'ACTIVE' | 'PAUSED' | 'ERROR';
export type SyncFrequency = '06:00, 12:00, 18:00' | 'Mỗi 2 giờ' | 'Hàng ngày lúc 06:00' | 'Thủ công' | 'Mỗi 3 giờ (Tự động)' | 'EVERY_6H' | 'EVERY_2H' | 'DAILY' | 'MANUAL' | string;

export interface DataSource {
  id: string;
  name: string;
  url: string;
  categoryUrl?: string;
  type: SourceType;
  category: 'THOI_KHOA_BIEU' | 'LICH_THI' | 'BAO_GIANG' | 'THONG_BAO' | 'TIMETABLE' | 'EXAM' | string;
  active: boolean;
  syncFrequency: SyncFrequency;
  lastSync: string | null;
  status: SyncStatus;
  recordsCount: number;
  config: {
    cssSelector?: string;
    targetFileType?: string;
    filePattern?: string;
    encoding?: string;
    authRequired?: boolean;
    customHeaders?: Record<string, string>;
    sheetId?: string;
    autoSync?: boolean;
    [key: string]: any;
  };
  notes?: string;
  description?: string;
}

export interface SyncLog {
  id: string;
  sourceId: string;
  sourceName: string;
  startTime: string;
  endTime: string;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  recordsFailed: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  errorMessage?: string;
  details?: string[];
}

export interface ScheduleChange {
  id: string;
  scheduleId: string;
  courseName: string;
  classCode: string;
  date: string;
  changeType: 'ROOM' | 'TIME' | 'LECTURER' | 'CANCELLED';
  oldValue: string;
  newValue: string;
  detectedAt: string;
  notified: boolean;
}

export type ConflictType = 'LECTURER_CONFLICT' | 'ROOM_CONFLICT' | 'CLASS_CONFLICT' | 'DATA_CONFLICT';

export interface ScheduleConflict {
  id: string;
  type: ConflictType;
  title: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  scheduleIds: string[];
  entityName: string;
  date: string;
  timeSlot: string;
  resolved: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'LOGIN' | 'CONFIG_CHANGE';
  entity: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  ipAddress: string;
}

export interface WorkloadSession {
  weekday: number;
  weekdayName: string;
  date?: string;
  period: string;
  periodStart: number;
  periodEnd: number;
  periodsCount: number;
  className: string;
  subject: string;
  room: string;
  isLab: boolean;
}

export interface WorkloadStat {
  lecturerId: string;
  lecturerCode: string;
  lecturerName: string;
  department: string;
  degree?: string;
  email?: string;
  phone?: string;
  totalPeriods: number;
  theoryPeriods: number;
  practicePeriods: number;
  coursesCount: number;
  classesCount: number;
  studentsCount: number;
  periodsPerWeek?: number;
  subjectsList?: string[];
  classesList?: string[];
  sessionsList?: WorkloadSession[];
  weekId?: string;
  weekTitle?: string;
}

export interface RoomUtilizationStat {
  roomId: string;
  roomCode: string;
  floor: number;
  building: string;
  capacity: number;
  totalUsedPeriods: number;
  utilizationRate: number; // percentage e.g. 68
  peakDay: string;
  isAvailableNow: boolean;
  currentClass?: string;
}

export interface WeeklyTimetableEntry {
  id: string;
  weekId: string;
  className: string;
  dayOfWeek: string;
  date: string;
  session: 'MORNING' | 'AFTERNOON';
  period: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
}

export interface TimetableClassGroup {
  className: string;
  entries: WeeklyTimetableEntry[];
}

export interface TimetableWeekInfo {
  weekId: string;
  weekNumber: number;
  title: string;
  sheetId: string;
  url: string;
  current: boolean;
  parsedTitle: string;
  startDate?: string;
  endDate?: string;
  dateRangeText?: string;
  classes: TimetableClassGroup[];
}

export type NotificationType = 'SCHEDULE_CHANGE' | 'ROOM_CHANGE' | 'EXAM' | 'GENERAL' | 'URGENT';
export type NotificationAudience = 'ALL' | 'STUDENT' | 'LECTURER' | 'MANAGER';
export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AnnouncementNotification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  targetAudience: NotificationAudience;
  priority: NotificationPriority;
  createdAt: string;
  createdBy: string;
  isPinned: boolean;
  isActive: boolean;
  relatedRoom?: string;
  relatedClass?: string;
  effectiveDate?: string;
}

export interface CohortClassTimetableSlot {
  id?: string;
  dayOfWeek: string; // 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'
  session: 'MORNING' | 'AFTERNOON';
  subject: string;
  teacher: string;
  room: string;
  period: string;
  time: string;
}

export interface CohortClassDetail {
  classCode: string;
  className: string;
  studentCount: number;
  periodsPerWeek: number;
  subjects: string[];
  teachers: string[];
  scheduleSlots?: CohortClassTimetableSlot[];
}

export interface CohortOverviewStat {
  cohort: string;
  cohortName: string;
  classesCount: number;
  coursesCount: number;
  totalPeriods: number;
  studentsCount: number;
  morningPeriods: number;
  afternoonPeriods: number;
  classes: CohortClassDetail[];
}

export interface BuildingHAllocationStat {
  roomId: string;
  roomCode: string;
  floor: number;
  roomType: 'LECTURE' | 'LAB' | 'SEMINAR' | 'MULTIPURPOSE';
  capacity: number;
  totalPeriods: number;
  utilizationRate: number;
  assignedClasses: {
    className: string;
    subject: string;
    teacher: string;
    dayOfWeek: string;
    time: string;
    period: string;
    session: 'MORNING' | 'AFTERNOON';
  }[];
  classNames: string[];
  subjects: string[];
  teachers: string[];
  status: 'OPTIMAL' | 'HIGH_LOAD' | 'LOW_LOAD' | 'AVAILABLE';
}

export interface BuildingHConflictItem {
  id: string;
  roomCode: string;
  floor: number;
  dayOfWeek: string;
  session: string;
  period: string;
  time: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  type: 'DOUBLE_BOOKING' | 'OVERLOAD' | 'TEACHER_CLASH' | 'ROOM_TYPE_MISMATCH' | 'SESSION_OVERBOOKING';
  title: string;
  description: string;
  conflictingEntries: {
    className: string;
    subject: string;
    teacher: string;
    period?: string;
    time?: string;
  }[];
  classCount?: number;
  suggestedSolution?: string;
  suggestedRooms?: string[];
}

export interface BuildingHSessionSlot {
  roomCode: string;
  floor: number;
  dayOfWeek: string;
  session: 'MORNING' | 'AFTERNOON';
  sessionName: string;
  classCount: number;
  classes: Array<{
    className: string;
    subject: string;
    teacher: string;
    period: string;
    time: string;
  }>;
  isConflict: boolean; // classCount > 2
  status: 'EMPTY' | 'OPTIMAL' | 'DOUBLE' | 'CONFLICT';
}

export interface BuildingHConflictEvaluation {
  totalRoomsChecked: number;
  conflictCount: number;
  conflictedRoomsCount: number;
  highLoadCount: number;
  optimalRoomsCount: number;
  safeRoomsCount: number;
  totalSessionsChecked: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  conflicts: BuildingHConflictItem[];
  roomStatusList: {
    roomCode: string;
    floor: number;
    roomType: string;
    totalPeriods: number;
    utilizationRate: number;
    conflictedSessionsCount: number;
    maxClassesInSession: number;
    status: 'NORMAL' | 'CONFLICT' | 'OVERLOAD';
    message: string;
  }[];
  sessionMatrix: BuildingHSessionSlot[];
  weekId?: string;
  weekTitle?: string;
  weekNumber?: number;
  lastEvaluated: string;
}

