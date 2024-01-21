import { parse } from "node-html-parser";

export function handleTimetablePage(req, res, html) {
  if (req.headers["accept"].includes("text/html")) {
    res.send(html);
    return;
  }
  if (req.headers["accept"].includes("application/json")) {
    const root = parse(html);
    const scheduleData = {};
    const subjects = {};

    const headings = root.querySelector("thead tr:nth-child(2)");
    const headingCells = headings.querySelectorAll("th");
    const timeSlots = [...headingCells].map((cell) => cell.text.trim());

    const tables = root.querySelectorAll("tbody");
    const timeTable = tables[0];
    const subjectTable = tables[1];

    const timeTableRows = timeTable.querySelectorAll("tr");
    const subjectTableRows = subjectTable.querySelectorAll("tr");

    subjectTableRows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      const subjectCode = cells[0].text.trim();
      const subjectName = cells[1].text.trim();
      subjects[subjectCode] = subjectName;
    });

    timeTableRows.forEach((row, day) => {
      scheduleData[day] = {};
      const cells = row.querySelectorAll("td");

      for (let i = 1; i < cells.length; i++) {
        const subjectCode = cells[i].text.trim();
        if (subjectCode === "-") continue;
        const timeSlot = timeSlots[i - 1];
        scheduleData[day][i] = {
          subjectCode,
          timeSlot,
          subjectName: subjects[subjectCode],
        };
      }
    });
    const data = JSON.stringify(scheduleData, null, 2);
    res.set("Content-Type", "application/json");
    res.send(data);
  }
}
