import fs from 'fs';

const weeksJson = JSON.parse(fs.readFileSync('scripts/parsed_all_weeks.json', 'utf8'));

// Convert all parsed sessions into standard Schedule objects
const schedules = [];
let schedId = 1;

const dayMap = {
  'Thứ 2': 2,
  'Thứ 3': 3,
  'Thứ 4': 4,
  'Thứ 5': 5,
  'Thứ 6': 6,
  'Thứ 7': 7,
  'Chủ nhật': 8,
};

weeksJson.forEach((week) => {
  week.classes.forEach((cls) => {
    cls.entries.forEach((ent) => {
      let isoDate = '2026-08-24';
      if (ent.date && ent.date.includes('/')) {
        const parts = ent.date.split('/');
        if (parts.length === 3) {
          isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }

      const isMorning = ent.session === 'MORNING';
      const pStart = isMorning ? 1 : 6;
      const pEnd = isMorning ? 4 : 9;
      const startTime = isMorning ? '07:00' : '13:00';
      const endTime = isMorning ? '10:30' : '16:30';

      const sId = `sch_${week.weekId}_${cls.className}_${ent.dayOfWeek}_${ent.session}`;
      schedules.push({
        id: sId,
        semesterId: 'sem_2026_1',
        week: week.weekNumber,
        date: isoDate,
        weekday: dayMap[ent.dayOfWeek] || 2,
        periodStart: pStart,
        periodEnd: pEnd,
        startTime,
        endTime,
        courseId: `crs_${ent.subject.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
        courseCode: `IT-${ent.subject.substring(0, 4).toUpperCase()}`,
        courseName: ent.subject,
        lecturerId: `gv_${ent.teacher.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
        lecturerName: ent.teacher,
        classId: `cls_${cls.className.toLowerCase()}`,
        classCode: cls.className,
        roomId: `room_${ent.room.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
        roomCode: ent.room,
        building: ent.room.startsWith('H.') || ent.room.startsWith('H') ? 'Nhà H' : 'Khu giảng đường PDU',
        sourceId: 'src_pdu_cntt',
        sourceUrl: week.url,
        status: 'UPCOMING',
        version: 1,
        notes: `Nguồn: ${week.title}`,
        createdAt: '2026-08-20T08:00:00Z',
        updatedAt: '2026-08-24T08:00:00Z',
      });
    });
  });
});

const fileContent = `import {
  AcademicYear,
  Semester,
  Room,
  Course,
  Lecturer,
  StudentClass,
  Schedule,
  ExamSchedule,
  DataSource,
  ScheduleChange,
  ScheduleConflict,
  User,
  SyncLog
} from '../types';

export const TIMETABLE_WEEKS = ${JSON.stringify(weeksJson, null, 2)};

export const INITIAL_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: 'ay_2026_2027',
    name: '2026 - 2027',
    startDate: '2026-08-01',
    endDate: '2027-06-30',
    active: true,
  }
];

export const INITIAL_SEMESTERS: Semester[] = [
  {
    id: 'sem_2026_1',
    academicYearId: 'ay_2026_2027',
    name: 'Học kỳ 1 (Năm học 2026 - 2027)',
    startDate: '2026-08-01',
    endDate: '2027-01-15',
    weeksCount: 20,
    active: true,
  }
];

/**
 * NHÀ H - KHOA CÔNG NGHỆ THÔNG TIN - ĐẠI HỌC PHẠM VĂN ĐỒNG
 * 3 Tầng • 12 Phòng học hiện đại • Sức chứa 40 SV/phòng
 */
export const INITIAL_ROOMS: Room[] = [
  // Tầng 1
  {
    id: 'room_h_101',
    roomCode: 'H.101',
    building: 'Nhà H',
    floor: 1,
    capacity: 40,
    roomType: 'LECTURE',
    hasProjector: true,
    hasAirConditioner: true,
    description: 'Phòng học thông minh tầng 1 - Cạnh hành lang chính Nhà H',
    active: true,
  },
  {
    id: 'room_h_102',
    roomCode: 'H.102',
    building: 'Nhà H',
    floor: 1,
    capacity: 40,
    roomType: 'LECTURE',
    hasProjector: true,
    hasAirConditioner: true,
    description: 'Phòng học đa phương tiện tầng 1 - Nhà H',
    active: true,
  },
  {
    id: 'room_h_103',
    roomCode: 'H.103',
    building: 'Nhà H',
    floor: 1,
    capacity: 40,
    roomType: 'LAB',
    hasProjector: true,
    hasAirConditioner: true,
    description: 'Phòng thực hành máy tính 1 - Tầng 1 Nhà H',
    active: true,
  },
  {
    id: 'room_h_104',
    roomCode: 'H.104',
    building: 'Nhà H',
    floor: 1,
    capacity: 40,
    roomType: 'LAB',
    hasProjector: true,
    hasAirConditioner: true,
    description: 'Phòng thực hành máy tính 2 - Tầng 1 Nhà H',
    active: true,
  },

  // Tầng 2
  {
    id: 'room_h_201',
    roomCode: 'H.201',
    building: 'Nhà H',
    floor: 2,
    capacity: 40,
    roomType: 'LECTURE',
    hasProjector: true,
    hasAirConditioner: true,
    description: 'Phòng học lý thuyết chuyên ngành - Tầng 2 Nhà H',
    active: true,
  },
  {
    id: 'room_h_202',
    roomCode: 'H.202',
    building: 'Nhà H',
    floor: 2,
    capacity: 40,
    roomType: 'LECTURE',
    hasProjector: true,
    hasAirConditioner: true,
    description: 'Phòng học thông minh - Tầng 2 Nhà H',
    active: true,
  },
  {
    id: 'room_h_203',
    roomCode: 'H.203',
    building: 'Nhà H',
    floor: 2,
    capacity: 40,
    roomType: 'LAB',
    hasProjector: true,
    hasAirConditioner: true,
    description: 'Phòng Lab Mạng máy tính & An ninh mạng - Tầng 2 Nhà H',
    active: true,
  },
  {
    id: 'room_h_204',
    roomCode: 'H.204',
    building: 'Nhà H',
    floor: 2,
    capacity: 40,
    roomType: 'LAB',
    hasProjector: true,
    hasAirConditioner: true,
    description: 'Phòng Lab Phát triển phần mềm & Web - Tầng 2 Nhà H',
    active: true,
  },

  // Tầng 3
  {
    id: 'room_h_301',
    roomCode: 'H.301',
    building: 'Nhà H',
    floor: 3,
    capacity: 40,
    roomType: 'LECTURE',
    hasProjector: true,
    hasAirConditioner: true,
    description: 'Phòng học lý thuyết AI & Khoa học Dữ liệu - Tầng 3 Nhà H',
    active: true,
  },
  {
    id: 'room_h_302',
    roomCode: 'H.302',
    building: 'Nhà H',
    floor: 3,
    capacity: 40,
    roomType: 'LECTURE',
    hasProjector: true,
    hasAirConditioner: true,
    description: 'Phòng học thảo luận & Seminar đồ án - Tầng 3 Nhà H',
    active: true,
  },
  {
    id: 'room_h_303',
    roomCode: 'H.303',
    building: 'Nhà H',
    floor: 3,
    capacity: 40,
    roomType: 'LAB',
    hasProjector: true,
    hasAirConditioner: true,
    description: 'Phòng Lab Trí tuệ Nhân tạo & IoT - Tầng 3 Nhà H',
    active: true,
  },
  {
    id: 'room_h_304',
    roomCode: 'H.304',
    building: 'Nhà H',
    floor: 3,
    capacity: 40,
    roomType: 'LAB',
    hasProjector: true,
    hasAirConditioner: true,
    description: 'Phòng Lab Nghiên cứu & Dự án Sáng tạo - Tầng 3 Nhà H',
    active: true,
  }
];

export const INITIAL_CLASSES: StudentClass[] = [
  { id: 'cls_dct23a', classCode: 'DCT23A', className: 'Đại học CNTT K23A', cohort: 'K23', major: 'Công nghệ Thông tin', department: 'Khoa CNTT', studentCount: 38 },
  { id: 'cls_dct23b', classCode: 'DCT23B', className: 'Đại học CNTT K23B', cohort: 'K23', major: 'Công nghệ Thông tin', department: 'Khoa CNTT', studentCount: 40 },
  { id: 'cls_dst23', classCode: 'DST23', className: 'Đại học Sư phạm Tin K23', cohort: 'K23', major: 'Sư phạm Tin học', department: 'Khoa CNTT', studentCount: 32 },
  { id: 'cls_dct24a', classCode: 'DCT24A', className: 'Đại học CNTT K24A', cohort: 'K24', major: 'Công nghệ Thông tin', department: 'Khoa CNTT', studentCount: 39 },
  { id: 'cls_dct24b', classCode: 'DCT24B', className: 'Đại học CNTT K24B', cohort: 'K24', major: 'Công nghệ Thông tin', department: 'Khoa CNTT', studentCount: 39 },
  { id: 'cls_dst24', classCode: 'DST24', className: 'Đại học Sư phạm Tin K24', cohort: 'K24', major: 'Sư phạm Tin học', department: 'Khoa CNTT', studentCount: 30 },
  { id: 'cls_dct25a', classCode: 'DCT25A', className: 'Đại học CNTT K25A', cohort: 'K25', major: 'Công nghệ Thông tin', department: 'Khoa CNTT', studentCount: 40 },
  { id: 'cls_dct25b', classCode: 'DCT25B', className: 'Đại học CNTT K25B', cohort: 'K25', major: 'Công nghệ Thông tin', department: 'Khoa CNTT', studentCount: 40 },
  { id: 'cls_dst25', classCode: 'DST25', className: 'Đại học Sư phạm Tin K25', cohort: 'K25', major: 'Sư phạm Tin học', department: 'Khoa CNTT', studentCount: 35 }
];

export const INITIAL_LECTURERS: Lecturer[] = [
  { id: 'gv_tho', lecturerCode: 'GV001', fullName: 'Thầy Tho', email: 'pvantho@pdu.edu.vn', department: 'Bộ môn Hệ thống & Mạng', degree: 'Thạc sĩ', active: true },
  { id: 'gv_quynh', lecturerCode: 'GV002', fullName: 'Cô Quỳnh', email: 'ntquynh@pdu.edu.vn', department: 'Bộ môn Công nghệ Phần mềm', degree: 'Thạc sĩ', active: true },
  { id: 'gv_toan', lecturerCode: 'GV003', fullName: 'Thầy Toán', email: 'dvtoan@pdu.edu.vn', department: 'Bộ môn Công nghệ Phần mềm', degree: 'Thạc sĩ', active: true },
  { id: 'gv_trung', lecturerCode: 'GV004', fullName: 'Thầy Trung', email: 'nvtrung@pdu.edu.vn', department: 'Bộ môn Hệ thống & An ninh', degree: 'Thạc sĩ', active: true },
  { id: 'gv_thuong', lecturerCode: 'GV005', fullName: 'Cô Thương', email: 'ltthuong@pdu.edu.vn', department: 'Bộ môn Công nghệ Phần mềm', degree: 'Thạc sĩ', active: true },
  { id: 'gv_lan', lecturerCode: 'GV006', fullName: 'Thầy Lân', email: 'pvlan@pdu.edu.vn', department: 'Bộ môn Khoa học Máy tính & AI', degree: 'Thạc sĩ', active: true },
  { id: 'gv_anh', lecturerCode: 'GV007', fullName: 'Thầy Ánh', email: 'hnanh@pdu.edu.vn', department: 'Bộ môn Toán - Tin ứng dụng', degree: 'Thạc sĩ', active: true },
  { id: 'gv_van', lecturerCode: 'GV008', fullName: 'Cô Vạn', email: 'ptkvan@pdu.edu.vn', department: 'Bộ môn Sư phạm Tin học', degree: 'Thạc sĩ', active: true },
  { id: 'gv_thanh', lecturerCode: 'GV009', fullName: 'Thầy Thành', email: 'nhthanh@pdu.edu.vn', department: 'Bộ môn Khoa học Máy tính', degree: 'Thạc sĩ', active: true },
  { id: 'gv_viet', lecturerCode: 'GV010', fullName: 'Thầy Việt', email: 'tqviet@pdu.edu.vn', department: 'Bộ môn AI & Web', degree: 'Thạc sĩ', active: true },
  { id: 'gv_bao', lecturerCode: 'GV011', fullName: 'Thầy Bảo', email: 'tqbao@pdu.edu.vn', department: 'Bộ môn Cơ sở Dữ liệu & HTTT', degree: 'Thạc sĩ', active: true },
  { id: 'gv_hue', lecturerCode: 'GV012', fullName: 'Cô Huệ', email: 'nthue@pdu.edu.vn', department: 'Bộ môn Phương pháp Nghiên cứu', degree: 'Thạc sĩ', active: true },
  { id: 'gv_trang', lecturerCode: 'GV013', fullName: 'Cô Trang', email: 'dthtrang@pdu.edu.vn', department: 'Bộ môn Hệ thống Máy tính', degree: 'Thạc sĩ', active: true },
  { id: 'gv_phuong', lecturerCode: 'GV014', fullName: 'Cô Phương', email: 'vtmphuong@pdu.edu.vn', department: 'Bộ môn Toán Rời rạc', degree: 'Thạc sĩ', active: true }
];

export const INITIAL_COURSES: Course[] = [
  { id: 'crs_cnpm', courseCode: 'IT-CNPM', courseName: 'Công nghệ phần mềm', credits: 3, theoryPeriods: 30, practicePeriods: 15, department: 'Khoa CNTT', active: true },
  { id: 'crs_xml', courseCode: 'IT-XML', courseName: 'XML và ứng dụng', credits: 3, theoryPeriods: 30, practicePeriods: 15, department: 'Khoa CNTT', active: true },
  { id: 'crs_anm', courseCode: 'IT-ANM', courseName: 'An ninh mạng', credits: 3, theoryPeriods: 30, practicePeriods: 15, department: 'Khoa CNTT', active: true },
  { id: 'crs_qldapm', courseCode: 'IT-QLDA', courseName: 'Quản lý dự án phần mềm', credits: 3, theoryPeriods: 30, practicePeriods: 15, department: 'Khoa CNTT', active: true },
  { id: 'crs_kpdl', courseCode: 'IT-KPDL', courseName: 'Khai phá dữ liệu', credits: 3, theoryPeriods: 30, practicePeriods: 15, department: 'Khoa CNTT', active: true },
  { id: 'crs_ai', courseCode: 'IT-AI', courseName: 'Trí tuệ nhân tạo', credits: 3, theoryPeriods: 30, practicePeriods: 15, department: 'Khoa CNTT', active: true },
  { id: 'crs_web', courseCode: 'IT-WEB', courseName: 'Thiết kế website', credits: 3, theoryPeriods: 30, practicePeriods: 15, department: 'Khoa CNTT', active: true },
  { id: 'crs_dthm', courseCode: 'IT-DTHM', courseName: 'Định tuyến trong HT mạng', credits: 3, theoryPeriods: 30, practicePeriods: 15, department: 'Khoa CNTT', active: true },
  { id: 'crs_csdlnc', courseCode: 'IT-CSDLNC', courseName: 'Cơ sở dữ liệu nâng cao', credits: 3, theoryPeriods: 30, practicePeriods: 15, department: 'Khoa CNTT', active: true },
  { id: 'crs_oop', courseCode: 'IT-OOP', courseName: 'Lập trình hướng đối tượng', credits: 3, theoryPeriods: 30, practicePeriods: 15, department: 'Khoa CNTT', active: true },
  { id: 'crs_csdl', courseCode: 'IT-CSDL', courseName: 'Cơ sở dữ liệu', credits: 3, theoryPeriods: 30, practicePeriods: 15, department: 'Khoa CNTT', active: true },
  { id: 'crs_hdh', courseCode: 'IT-HDH', courseName: 'Nguyên lý Hệ điều hành', credits: 3, theoryPeriods: 30, practicePeriods: 15, department: 'Khoa CNTT', active: true },
  { id: 'crs_trr', courseCode: 'IT-TRR', courseName: 'Toán rời rạc', credits: 3, theoryPeriods: 45, practicePeriods: 0, department: 'Khoa CNTT', active: true }
];

export const INITIAL_SCHEDULES: Schedule[] = ${JSON.stringify(schedules, null, 2)};

export const INITIAL_DATA_SOURCES: DataSource[] = [
  {
    id: 'src_pdu_cntt',
    name: 'Chuyên mục TKB - cntt.pdu.edu.vn',
    url: 'https://cntt.pdu.edu.vn/luu-tru/category/thoi-khoa-bieu',
    categoryUrl: 'https://cntt.pdu.edu.vn/luu-tru/category/thoi-khoa-bieu',
    type: 'WORDPRESS',
    category: 'THOI_KHOA_BIEU',
    active: true,
    syncFrequency: '06:00, 12:00, 18:00',
    lastSync: '2026-08-26T23:50:00Z',
    status: 'SUCCESS',
    recordsCount: ${schedules.length},
    config: {
      cssSelector: '.post, .category-thoi-khoa-bieu',
      targetFileType: 'GOOGLE_SHEETS_CSV',
      filePattern: 'https://docs.google.com/spreadsheets/d/*/edit',
      encoding: 'UTF-8',
      authRequired: false,
    },
    notes: 'Nguồn chính thức từ Khoa CNTT - Đại học Phạm Văn Đồng'
  }
];

export const INITIAL_CHANGES: ScheduleChange[] = [
  {
    id: 'chg_001',
    scheduleId: 'sch_week_05_DCT23A_Thứ 3_MORNING',
    courseName: 'XML và ứng dụng',
    classCode: 'DCT23A',
    date: '2026-08-25',
    changeType: 'ROOM',
    oldValue: 'H.101',
    newValue: 'H.204 (Tầng 2)',
    detectedAt: '2026-08-24T06:30:00Z',
    notified: true
  }
];

export const INITIAL_CONFLICTS: ScheduleConflict[] = [];

export const INITIAL_EXAMS: ExamSchedule[] = [
  {
    id: 'ex_001',
    semesterId: 'sem_2026_1',
    courseId: 'crs_cnpm',
    courseCode: 'IT-CNPM',
    courseName: 'Công nghệ phần mềm',
    classId: 'cls_dct23a',
    classCode: 'DCT23A',
    lecturerId: 'gv_quynh',
    lecturerName: 'Cô Quỳnh',
    examDate: '2026-09-05',
    startTime: '07:30',
    endTime: '09:30',
    roomId: 'room_h_101',
    roomCode: 'H.101',
    building: 'Nhà H',
    examType: 'Tự luận',
    durationMinutes: 90,
    note: 'SV có mặt trước 15 phút, mang theo thẻ SV PDU',
    sourceId: 'src_pdu_cntt'
  },
  {
    id: 'ex_002',
    semesterId: 'sem_2026_1',
    courseId: 'crs_xml',
    courseCode: 'IT-XML',
    courseName: 'XML và ứng dụng',
    classId: 'cls_dct23b',
    classCode: 'DCT23B',
    lecturerId: 'gv_toan',
    lecturerName: 'Thầy Toán',
    examDate: '2026-09-06',
    startTime: '13:30',
    endTime: '15:30',
    roomId: 'room_h_204',
    roomCode: 'H.204',
    building: 'Nhà H',
    examType: 'Thực hành máy tính',
    durationMinutes: 90,
    note: 'Thi trên máy tính phòng Lab Nhà H',
    sourceId: 'src_pdu_cntt'
  }
];

export const INITIAL_SYNC_LOGS: SyncLog[] = [
  {
    id: 'log_001',
    sourceId: 'src_pdu_cntt',
    sourceName: 'cntt.pdu.edu.vn',
    startTime: '2026-08-26 23:50:00',
    endTime: '2026-08-26 23:50:04',
    recordsCreated: ${schedules.length},
    recordsUpdated: 0,
    recordsDeleted: 0,
    recordsFailed: 0,
    status: 'SUCCESS',
    details: [
      'Đã kết nối WordPress API: cntt.pdu.edu.vn/wp-json/wp/v2/posts?categories=12',
      'Đã tải và phân tích 4 tuần thời khóa biểu: Tuần 05, Tuần 04, Tuần 03, Tuần 02',
      'Đã nạp ${schedules.length} ca học vào cơ sở dữ liệu Nhà H'
    ]
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    fullName: 'Quản trị viên Hệ thống PDU',
    email: 'pvantho@pdu.edu.vn',
    role: 'ADMIN'
  },
  {
    id: 'usr_manager',
    username: 'manager',
    fullName: 'Ban Chủ nhiệm Khoa CNTT',
    email: 'bcn_cntt@pdu.edu.vn',
    role: 'MANAGER'
  },
  {
    id: 'usr_lecturer',
    username: 'gv_tho',
    fullName: 'ThS. Phạm Văn Thơ',
    email: 'pvantho@pdu.edu.vn',
    role: 'LECTURER',
    entityId: 'gv_tho'
  },
  {
    id: 'usr_student',
    username: 'sv_dct23a',
    fullName: 'Sinh viên Lớp DCT23A',
    email: 'sv_dct23a@student.pdu.edu.vn',
    role: 'STUDENT',
    entityId: 'cls_dct23a'
  }
];
`;

fs.writeFileSync('src/data/initialData.ts', fileContent);
console.log('Successfully re-generated initialData.ts with all exports!');
