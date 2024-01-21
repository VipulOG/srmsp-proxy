import { parse } from "node-html-parser";
import { timetablePageURL } from "../constants.js";

export function handleAttendancePage(req, res, html) {
  const root = parse(html);

  const attendanceTable = root.querySelectorAll("table")[0];
  const lastRow = attendanceTable.querySelectorAll("tr").pop();
  const lastRowCells = lastRow.querySelectorAll("td");
  const totalClasses = lastRowCells[1].text.trim();
  const totalPresent = lastRowCells[2].text.trim();

  const sessionStart = root
    .querySelector("div.card-header.bg-custom.text-white > b:nth-child(2)")
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
    const timetablePageURL = "${timetablePageURL}";
  </script>
  <script src="/injection/attendance.js"></script>
    `)
  );
  res.send(root.toString());
}
