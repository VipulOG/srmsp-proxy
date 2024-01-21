import { axiosInstance } from "./axiosConfig.js";
import { streamToString } from "./utils.js";
import { parse } from "node-html-parser";

const attendancePageURL =
  "/srmiststudentportal/students/report/studentAttendanceDetails.jsp";
const timetablePageURL =
  "/srmiststudentportal/students/report/studentTimeTableDetails.jsp";

export default function configureRoutes(app) {
  app.all("*", async (req, res) => {
    try {
      console.log("Proxy Request:", req.method, req.originalUrl);
      if (req.method.toLowerCase() === "post") console.log("Body:", req.body);

      const axiosHeaders = { ...req.headers };
      delete axiosHeaders["content-length"];
      delete axiosHeaders["host"];

      const axiosResponse = await axiosInstance({
        url: req.originalUrl,
        method: req.method,
        responseType: "stream",
        headers: axiosHeaders,
        data: req.body,
      });

      console.log("Proxy Request Success:", req.method, req.originalUrl);
      if (req.method === "POST") console.log("Body:", req.body);

      const responseHeaders = { ...axiosResponse.headers };
      delete responseHeaders["content-length"];
      res.set(responseHeaders);

      res.status(axiosResponse.status);

      if (axiosResponse.headers["content-type"].includes("text/html")) {
        const html = await streamToString(axiosResponse.data);
        const newHtml = html.replace(
          new RegExp(axiosInstance.defaults.baseURL, "g"),
          process.env.host
        );

        if (req.originalUrl === attendancePageURL) {
          handleAttendancePage(req, res, newHtml);
        } else if (req.originalUrl === timetablePageURL) {
          handleTimetablePage(req, res, newHtml);
        } else res.send(newHtml);
      } else axiosResponse.data.pipe(res);
    } catch (error) {
      console.error("Proxy Request Error:", error.message, error.stack);
      res.status(500).send("Internal Server Error");
    }
  });
}

function handleTimetablePage(req, res, html) {
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

function handleAttendancePage(req, res, html) {
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
<style>
  #calendarContainer {
    margin: unset;
    padding: unset;
    max-width: unset;
    min-height: 460px;
  }
</style>
<div id="calendarContainer" class="card-body mt-4"></div>
  `)
  );
  root.appendChild(
    parse(`
<script>
const totalClasses = ${totalClasses};
const totalPresent = ${totalPresent};

function loadScript(url) {
  return new Promise((resolve, reject) => {
    $.getScript(url, resolve);
  });
}

function postData(url, data, dataType = 'json') {
  return new Promise((resolve, reject) => {
    $.post({
      url: url,
      data: data,
      dataType: dataType,
    })
      .done((response) => resolve(response))
      .fail((error) => reject(error));
  });
}

async function initCalendar() {
  await loadScript("https://vipul.is-a.dev/SimpleCalendar.js/src/SimpleCalendar.js");
  const timetableData = await postData("${timetablePageURL}");
  
  const events = [];

  const today = new Date();
  const sessionStart = new Date("${sessionStart}");
  const sessionEnd = new Date(sessionStart);
  sessionEnd.setMonth(sessionEnd.getMonth() + 6);

  var expectedTotalClasses = totalClasses;
  var expectedTotalPresent = totalPresent;

  for (let date = new Date(today); date <= sessionEnd; date.setDate(date.getDate() + 1)) {
    const day = date.getDay() - 1;
    const daySchedule = timetableData[day];
    const expectedClasses = (daySchedule) ? Object.keys(daySchedule).length : 0;

    expectedTotalClasses += expectedClasses;
    expectedTotalPresent += expectedClasses;
    const expectedAttendance = (expectedTotalPresent / expectedTotalClasses) * 100;

    events.push(
      {
        date: new Date(date),
        title: "Expected Attendance: " + expectedAttendance.toFixed(2) + "%",
      }
    );
  }

  calendar = new SimpleCalendar('#calendarContainer', events);
}

initCalendar();
</script>
    `)
  );
  res.send(root.toString());
}
