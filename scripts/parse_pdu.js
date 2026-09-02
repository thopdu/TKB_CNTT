import fs from 'fs';

function parseCSVLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parsePDUSheet(csvText, weekId, weekTitle, postUrl) {
  const rawLines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = rawLines.map(parseCSVLine);

  // Row 1: TUẦN 05 - TỪ NGÀY 24/8/2026 ĐẾN NGÀY 29/8/2026
  let headerTitle = weekTitle;
  if (rows[1] && rows[1][6]) {
    headerTitle = rows[1][6];
  } else if (rows[1] && rows[1].find((c) => c.includes('TUẦN'))) {
    headerTitle = rows[1].find((c) => c.includes('TUẦN'));
  }

  // Row 3: Days of week (Thứ 2 -> CN) -> Col 2: Thứ 2, Col 4: Thứ 3, Col 6: Thứ 4, Col 8: Thứ 5, Col 10: Thứ 6, Col 12: Thứ 7, Col 14: CN
  // Row 4: Dates -> 24/08/2026, 25/08/2026, 26/08/2026, 27/08/2026, 28/08/2026, 29/08/2026, 30/08/2026
  const dayCols = [
    { dayOfWeek: 'Thứ 2', date: rows[4]?.[2] || '', subjectCol: 2, teacherCol: 3 },
    { dayOfWeek: 'Thứ 3', date: rows[4]?.[4] || '', subjectCol: 4, teacherCol: 5 },
    { dayOfWeek: 'Thứ 4', date: rows[4]?.[6] || '', subjectCol: 6, teacherCol: 7 },
    { dayOfWeek: 'Thứ 5', date: rows[4]?.[8] || '', subjectCol: 8, teacherCol: 9 },
    { dayOfWeek: 'Thứ 6', date: rows[4]?.[10] || '', subjectCol: 10, teacherCol: 11 },
    { dayOfWeek: 'Thứ 7', date: rows[4]?.[12] || '', subjectCol: 12, teacherCol: 13 },
    { dayOfWeek: 'Chủ nhật', date: rows[4]?.[14] || '', subjectCol: 14, teacherCol: 15 },
  ];

  // Each class has 10 rows:
  // Row 0 of class (e.g. Row 6): col 1 = ClassName (e.g. DCT23A)
  // SÁNG block: 4 rows
  //   Row 0: Subject name, Teacher name
  //   Row 1: Subject name, Room (e.g. H101, H204, GĐ2...)
  //   Row 2: Subject name (Tiết 3)
  //   Row 3: Subject name (Tiết 4)
  // CHIỀU block: 4 rows (or 5 rows)
  //   Row 5 (or 6): Subject name, Teacher name
  //   Row 6 (or 7): Subject name, Room
  //   Row 7: Subject name (Tiết 8)
  //   Row 8: Subject name (Tiết 9)
  // Blank row between classes

  const classSchedules = [];
  let currentClass = null;

  let i = 6;
  while (i < rows.length) {
    const row = rows[i];
    const className = (row[1] || '').trim();

    if (className && className !== 'LỚP') {
      currentClass = className;
      const classEntries = [];

      // Look at the 10 rows for this class:
      // Morning is rows i to i+3
      // Afternoon is rows i+4 to i+8
      const morningSubjectRow = rows[i];
      const morningRoomRow = rows[i + 1] || [];
      const afternoonSubjectRow = rows[i + 5] || rows[i + 4] || [];
      const afternoonRoomRow = rows[i + 6] || rows[i + 5] || [];

      dayCols.forEach((d) => {
        // Morning check
        const mSub = (morningSubjectRow?.[d.subjectCol] || '').trim();
        const mTeacher = (morningSubjectRow?.[d.teacherCol] || '').trim();
        const mRoom = (morningRoomRow?.[d.teacherCol] || morningRoomRow?.[d.subjectCol] || '').trim();

        if (mSub && mSub !== '') {
          classEntries.push({
            id: `${weekId}_${currentClass}_${d.dayOfWeek}_MORNING`,
            weekId,
            className: currentClass,
            dayOfWeek: d.dayOfWeek,
            date: d.date,
            session: 'MORNING', // SÁNG
            period: 'Tiết 1 - 4',
            time: '07:00 - 10:30',
            subject: mSub,
            teacher: mTeacher || 'Bộ môn CNTT',
            room: mRoom || 'H.101',
          });
        }

        // Afternoon check
        // Check rows i+4, i+5, i+6
        let aSub = '';
        let aTeacher = '';
        let aRoom = '';

        for (let offset = 4; offset <= 8; offset++) {
          const r = rows[i + offset];
          if (!r) continue;
          const sub = (r[d.subjectCol] || '').trim();
          const t = (r[d.teacherCol] || '').trim();
          if (sub && !aSub && !['CHIỀU', 'SÁNG'].includes(sub)) {
            aSub = sub;
          }
          if (t && !aTeacher && (t.startsWith('Thầy') || t.startsWith('Cô') || t.startsWith('Lớp') || t.startsWith('PLĐ'))) {
            aTeacher = t;
          } else if (t && !aRoom && (t.startsWith('H') || t.startsWith('P.') || t.startsWith('E') || t.startsWith('G') || t.startsWith('Sân') || t.startsWith('GĐ'))) {
            aRoom = t;
          }
        }

        if (aSub && aSub !== '') {
          classEntries.push({
            id: `${weekId}_${currentClass}_${d.dayOfWeek}_AFTERNOON`,
            weekId,
            className: currentClass,
            dayOfWeek: d.dayOfWeek,
            date: d.date,
            session: 'AFTERNOON', // CHIỀU
            period: 'Tiết 6 - 9',
            time: '13:00 - 16:30',
            subject: aSub,
            teacher: aTeacher || 'Bộ môn CNTT',
            room: aRoom || 'H.101',
          });
        }
      });

      classSchedules.push({
        className: currentClass,
        entries: classEntries,
      });

      i += 10;
    } else {
      i++;
    }
  }

  return {
    weekId,
    weekTitle: headerTitle,
    postUrl,
    classes: classSchedules,
  };
}

async function run() {
  const url = 'https://docs.google.com/spreadsheets/d/1Z9CT9dbSPlHIvT_WDjVUQc0e2CxN889UVt3pTLFY9lk/export?format=csv';
  const res = await fetch(url);
  const text = await res.text();
  const result = parsePDUSheet(text, 'week_05', 'Thời khóa biểu Tuần 05', 'https://cntt.pdu.edu.vn/luu-tru/128');
  console.log('Result for Week 5:', result.weekTitle);
  console.log('Total classes parsed:', result.classes.length);
  result.classes.forEach((c) => {
    console.log(`Class: ${c.className} (${c.entries.length} sessions)`);
    c.entries.forEach((e) => {
      console.log(`  - [${e.dayOfWeek} ${e.date} | ${e.session}] ${e.subject} | GV: ${e.teacher} | Phòng: ${e.room}`);
    });
  });
}

run().catch(console.error);
