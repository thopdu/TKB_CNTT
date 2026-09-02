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

function parsePDUSheet(csvText, weekId, fallbackWeekTitle, postUrl) {
  const rawLines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = rawLines.map(parseCSVLine);

  let headerTitle = fallbackWeekTitle;
  if (rows[1]) {
    const t = rows[1].find((c) => c.includes('TUẦN'));
    if (t) headerTitle = t;
  }

  const dayCols = [
    { dayOfWeek: 'Thứ 2', date: rows[4]?.[2] || '', subjectCol: 2, teacherCol: 3 },
    { dayOfWeek: 'Thứ 3', date: rows[4]?.[4] || '', subjectCol: 4, teacherCol: 5 },
    { dayOfWeek: 'Thứ 4', date: rows[4]?.[6] || '', subjectCol: 6, teacherCol: 7 },
    { dayOfWeek: 'Thứ 5', date: rows[4]?.[8] || '', subjectCol: 8, teacherCol: 9 },
    { dayOfWeek: 'Thứ 6', date: rows[4]?.[10] || '', subjectCol: 10, teacherCol: 11 },
    { dayOfWeek: 'Thứ 7', date: rows[4]?.[12] || '', subjectCol: 12, teacherCol: 13 },
    { dayOfWeek: 'Chủ nhật', date: rows[4]?.[14] || '', subjectCol: 14, teacherCol: 15 },
  ];

  const classSchedules = [];
  let i = 6;
  while (i < rows.length) {
    const row = rows[i];
    let className = (row[1] || '').trim();

    if (className && className !== 'LỚP') {
      const classEntries = [];
      const morningSubjectRow = rows[i];
      const morningRoomRow = rows[i + 1] || [];

      dayCols.forEach((d) => {
        // MORNING CHECK (Rows i, i+1, i+2, i+3)
        let mSub = (morningSubjectRow?.[d.subjectCol] || '').trim();
        let mTeacher = (morningSubjectRow?.[d.teacherCol] || '').trim();
        let mRoom = (morningRoomRow?.[d.teacherCol] || morningRoomRow?.[d.subjectCol] || '').trim();

        // Also check if morning had multiple entries in rows i+2
        if (!mSub && rows[i + 2]) {
          const s2 = (rows[i + 2]?.[d.subjectCol] || '').trim();
          const t2 = (rows[i + 2]?.[d.teacherCol] || '').trim();
          if (s2) {
            mSub = s2;
            mTeacher = t2;
            mRoom = (rows[i + 3]?.[d.teacherCol] || '').trim();
          }
        }

        if (mSub && mSub !== '') {
          classEntries.push({
            id: `${weekId}_${className}_${d.dayOfWeek}_MORNING`,
            weekId,
            className: className,
            dayOfWeek: d.dayOfWeek,
            date: d.date,
            session: 'MORNING',
            period: 'Tiết 1 - 4',
            time: '07:00 - 10:30',
            subject: mSub,
            teacher: mTeacher || 'Bộ môn CNTT',
            room: mRoom ? (mRoom.startsWith('H') ? mRoom.replace('H', 'H.') : mRoom) : 'H.101',
          });
        }

        // AFTERNOON CHECK (Rows i+4 to i+8)
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
          if (t && !aTeacher && (t.startsWith('Thầy') || t.startsWith('Cô') || t.startsWith('Lớp') || t.startsWith('PLĐ') || t.startsWith('Khoa'))) {
            aTeacher = t;
          } else if (t && !aRoom && (t.startsWith('H') || t.startsWith('P.') || t.startsWith('E') || t.startsWith('G') || t.startsWith('Sân') || t.startsWith('GĐ') || t.startsWith('D'))) {
            aRoom = t;
          }
        }

        if (aSub && aSub !== '') {
          classEntries.push({
            id: `${weekId}_${className}_${d.dayOfWeek}_AFTERNOON`,
            weekId,
            className: className,
            dayOfWeek: d.dayOfWeek,
            date: d.date,
            session: 'AFTERNOON',
            period: 'Tiết 6 - 9',
            time: '13:00 - 16:30',
            subject: aSub,
            teacher: aTeacher || 'Bộ môn CNTT',
            room: aRoom ? (aRoom.startsWith('H') ? aRoom.replace('H', 'H.') : aRoom) : 'H.101',
          });
        }
      });

      classSchedules.push({
        className,
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

async function fetchAndGenerate() {
  const weeksConfig = [
    {
      weekId: 'week_05',
      weekNumber: 5,
      sheetId: '1Z9CT9dbSPlHIvT_WDjVUQc0e2CxN889UVt3pTLFY9lk',
      title: 'Tuần 05 (24/08/2026 - 29/08/2026)',
      url: 'https://cntt.pdu.edu.vn/luu-tru/128',
      current: true,
    },
    {
      weekId: 'week_04',
      weekNumber: 4,
      sheetId: '17Gj5edCNgzdr6bFTsoY_GjJrVsOTI0Z-k6EGEZMpB5c',
      title: 'Tuần 04 (17/08/2026 - 22/08/2026)',
      url: 'https://cntt.pdu.edu.vn/luu-tru/125',
      current: false,
    },
    {
      weekId: 'week_03',
      weekNumber: 3,
      sheetId: '15F1zkEYyYF-kpXXLn5xqSdnGNaSHCPX_jX6YLflkesY',
      title: 'Tuần 03 (10/08/2026 - 15/08/2026)',
      url: 'https://cntt.pdu.edu.vn/luu-tru/91',
      current: false,
    },
    {
      weekId: 'week_02',
      weekNumber: 2,
      sheetId: '1EFrzgZapfLjdncBlnAYpTtQcyFq7akQDpGV_xh3kxbc',
      title: 'Tuần 02 (03/08/2026 - 09/08/2026)',
      url: 'https://cntt.pdu.edu.vn/luu-tru/85',
      current: false,
    },
  ];

  const allWeeksData = [];
  for (const w of weeksConfig) {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${w.sheetId}/export?format=csv`;
    const res = await fetch(csvUrl);
    const text = await res.text();
    const parsed = parsePDUSheet(text, w.weekId, w.title, w.url);
    allWeeksData.push({
      ...w,
      parsedTitle: parsed.weekTitle,
      classes: parsed.classes,
    });
  }

  console.log('Successfully fetched and parsed all weeks!');
  fs.writeFileSync('scripts/parsed_all_weeks.json', JSON.stringify(allWeeksData, null, 2));
}

fetchAndGenerate().catch(console.error);
