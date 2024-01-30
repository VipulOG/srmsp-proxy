import { parse } from "node-html-parser";
import { timetablePageURL } from "../constants.js";

export function handleAttendancePage(req, res, html) {
  const root = parse(html);

  const attendanceTable = root.querySelectorAll("table")[0];
  const lastRow = attendanceTable.querySelectorAll("tr").pop();
  const lastRowCells = lastRow.querySelectorAll("td");
  const totalClasses = lastRowCells[1].text.trim();
  const totalPresent = lastRowCells[2].text.trim();

  const courseWiseAttendance = getCourseWiseAttendance(root);

  const sessionStart = root
    .querySelector("div.card-header.bg-custom.text-white > b:nth-child(2)")
    .text.trim();
  const today = root
  .querySelector("div.card-header.bg-custom.text-white > b:nth-child(3)")
  .text.trim();

  const main = root.querySelector("div");
  main.appendChild(
    parse(`
  <link rel="stylesheet" href="https://vipul.is-a.dev/SimpleCalendar.js/src/SimpleCalendar.css">
  <link rel="stylesheet" href="/injection/attendance.css">
  <div id="calendarContainer" class="card-body mt-4"></div>
  <script>
    const totalClasses = ${totalClasses};
    const totalPresent = ${totalPresent};
    const sessionStart = "${sessionStart}";
    const today = "${today}";
    const timetablePageURL = "${timetablePageURL}";
    const courseWiseAttendance = ${JSON.stringify(courseWiseAttendance)};
  </script>
  <script src="/injection/attendance.js"></script>
    `)
  );
  res.send(root.toString());
}

function getCourseWiseAttendance(root) {
  const attendanceTable = root.querySelectorAll("table")[0];
  const attendanceRows = attendanceTable.querySelectorAll("tr");
  const courseWiseAttendance = {};
  for (const row of attendanceRows) {
    const cells = row.querySelectorAll("td");
    if (cells.length < 8) continue;
    const courseCode = cells[0].text.trim();
    const courseName = cells[1].text.trim();
    const maxHours = cells[2].text.trim();
    const attendedHours = cells[3].text.trim();
    const absentHours = cells[4].text.trim();
    const avgAttendance = cells[5].text.trim();
    const odMlPresent = cells[6].text.trim();
    const totalPresent = cells[7].text.trim();
    courseWiseAttendance[courseCode] = {
      courseName,
      maxHours,
      attendedHours,
      absentHours,
      avgAttendance,
      odMlPresent,
      totalPresent,
    };
  }
  return courseWiseAttendance;
}
