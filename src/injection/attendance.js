const calendarScriptURL =
  "https://vipul.is-a.dev/SimpleCalendar.js/src/SimpleCalendar.js";

const sessionStartStr = formatDate(sessionStart);
const sessionEndStr = formatDate(sessionEnd);
const lastUpdatedStr = formatDate(lastUpdated);

let timetable;
let calendar;

function createMarkModal() {
  $("body").append(`
  <div id="markModal" class="modal fade" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header bg-custom">
          <h5 class="modal-title text-white">Mark Expected Attendance</h5>
          <button class="close" type="button" data-dismiss="modal">&times;</button>
        </div>
        <div class="modal-body" id="markModalBody"></div>
        <div class="modal-footer">
          <button class="btn lift" type="button" id="toggleHoliday"></button>
          <button class="btn btn-dark lift" type="button" data-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
`);
}

function addDisclaimer() {
  const parent = $(".container");
  const disclaimer = `
  <div class="alert alert-info" role="info">
    <strong>Heads-up:</strong>
    <ol>
      <li>
        The expected attendance on the calendar is hit or miss, and if there's a miss, you can blame it on the professors who forget to mark.
      </li>
      <li>
        The unmarked hours are more of an educated guess, as they're based on the current timetable, which might've been different in the past.
      </li>
      <li>
        Calculating unmarked hours relies on past classes, so don't forget to mark holidays from the good ol' days.
      </li>
      <li>
        Estimating future attendance depends on upcoming classes, so make sure to mark holidays in your crystal ball.
      </li>
    </ol>
  </div>
  `;
  parent.prepend(disclaimer);
}

function addUnmarkedHoursTable() {
  function calculateUnmarkedHours() {
    const expectedTotalHours = {};

    for (
      let date = new Date(sessionStart);
      date <= lastUpdated;
      date.setDate(date.getDate() + 1)
    ) {
      const data = getData(formatDate(date));
      if (data.holiday) continue;

      const day = date.getDay() - 1;
      const daySchedule = timetable[day];
      if (!daySchedule) continue;

      for (const [, value] of Object.entries(daySchedule)) {
        const subjectName = value.subjectName;
        if (!expectedTotalHours[subjectName]) {
          expectedTotalHours[subjectName] = 0;
        }
        expectedTotalHours[subjectName]++;
      }
    }

    for (const [, value] of Object.entries(courseWiseAttendance)) {
      const subjectName = value.courseName;
      if (!expectedTotalHours[subjectName]) expectedTotalHours[subjectName] = 0;
      expectedTotalHours[subjectName] -= parseInt(value.maxHours);
    }

    return expectedTotalHours;
  }

  function generateUnmarkedTableRows() {
    const unmarkedHours = calculateUnmarkedHours();
    let rows = "";
    for (const [key, value] of Object.entries(unmarkedHours)) {
      if (value <= 0) continue;
      rows += `
      <tr>
        <td>${key}</td>
        <td>${value}</td>
      </tr>
    `;
    }
    return rows;
  }

  function generateUnmarkedTable() {
    const tableHtml = `
    <div class="card mb-4">
      <div class="card-header bg-custom text-white">
        <i class="fa fa-calculator"></i>
        UNMARKED ATTENDANCE - During the Period:
        <b>${sessionStartStr}</b> To <b>${lastUpdatedStr}</b>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table id="unmarkedTable" class="table mb-0">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Unmarked Hours</th>
              </tr>
            </thead>
            <tbody>
            ${generateUnmarkedTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
    return tableHtml;
  }

  const table = generateUnmarkedTable();
  $("#calendarContainer").before(table);
}

function updateCalendarEvents() {
  if (!calendar) return;
  const events = [];

  let expectedTotalClasses = totalClasses;
  let expectedTotalPresent = totalPresent;

  for (
    let date = new Date(lastUpdated);
    date <= sessionEnd;
    date.setDate(date.getDate() + 1)
  ) {
    const data = getData(formatDate(date));
    if (data.holiday) {
      events.push({ date: new Date(date), title: "Holiday" });
      continue;
    }

    const day = date.getDay() - 1;
    const daySchedule = timetable[day];
    const expectedHours = daySchedule ? Object.keys(daySchedule).length : 0;

    expectedTotalClasses += expectedHours;
    if (data.attendance) expectedTotalPresent += data.attendance.length;
    else expectedTotalPresent += expectedHours;
    const res = (expectedTotalPresent / expectedTotalClasses) * 100;

    events.push({
      date: new Date(date),
      title: `Expected Attendance: ${res.toFixed(2)}%`,
    });
  }

  calendar.removeAllEvents();
  calendar.addEvents(events);
}

function addCalendar() {
  function showMarkModal(date, daySchedule) {
    $("#markModal").modal("show");

    const dateStr = formatDate(date);
    const data = getData(dateStr);
    const modalBody = $("#markModalBody");

    if (!daySchedule || Object.keys(daySchedule).length === 0) {
      modalBody.text(`No classes on ${dateStr}.`);
      $("#toggleHoliday").hide();
      return;
    }

    const message = `Select the classes you will attend on ${dateStr}:`;
    modalBody.text(message);

    function toggleAllSelection() {
      const checked = $(this).is(":checked");
      const boxes = $(".markCheckbox");
      boxes.prop("checked", checked);
      saveAttendance();
    }

    function toggleSelection() {
      updateToggleAllCheckbox();
      saveAttendance();
    }

    function updateToggleAllCheckbox() {
      const boxes = $(".markCheckbox");
      const allChecked = boxes.length === boxes.filter(":checked").length;
      $("#toggleAll").prop("checked", allChecked);
    }

    function toggleHoliday() {
      const dateStr = formatDate(date);
      const data = getData(dateStr);
      if (data.holiday) {
        setData(dateStr, {
          holiday: false,
          attendance: undefined,
        });
        $("#toggleAll").prop("checked", true);
        $("#toggleAll").prop("disabled", false);
        $(".markCheckbox").prop("checked", true);
        $(".markCheckbox").prop("disabled", false);
        $("#toggleHoliday").text("Mark Holiday");
      } else {
        setData(dateStr, {
          holiday: true,
          attendance: [],
        });
        $("#toggleAll").prop("checked", false);
        $("#toggleAll").prop("disabled", true);
        $(".markCheckbox").prop("checked", false);
        $(".markCheckbox").prop("disabled", true);
        $("#toggleHoliday").text("Unmark Holiday");
      }
      updateCalendarEvents();
    }

    function saveAttendance() {
      const boxes = $(".markCheckbox");
      setData(formatDate(date), {
        holiday: false,
        attendance: [...boxes.filter(":checked")].map((box) => box.value),
      });
      updateCalendarEvents();
    }

    function generateTableRows() {
      let rows = "";
      for (const [key, value] of Object.entries(daySchedule)) {
        const checked =
          !data.attendance ||
          (data.attendance && data.attendance.includes(key));
        const holiday = data.holiday;
        rows += `
        <tr>
          <td>${key}</td>
          <td>${value.subjectName}</td>
          <td><input type="checkbox" class="markCheckbox"
           value="${key}"
           ${checked ? "checked" : ""}
           ${holiday ? "disabled" : ""}
          "></td>
        </tr>
      `;
      }
      return rows;
    }

    const tableHtml = `
    <br>
    <table id="markModalTable" class="table table-bordered">
      <thead>
        <tr>
          <th>Hour</th>
          <th>Subject</th>
          <th><input type="checkbox" id="toggleAll"
            ${data.holiday ? "disabled" : ""}
          ></th>
        </tr>
      </thead>
      <tbody>
        ${generateTableRows()}
      </tbody>
    </table>
  `;

    modalBody.append(tableHtml);

    $("#toggleAll").on("change", toggleAllSelection);
    $(".markCheckbox").on("change", toggleSelection);

    $("#toggleHoliday").off("click");
    $("#toggleHoliday").on("click", toggleHoliday);
    if (data.holiday) $("#toggleHoliday").text("Unmark Holiday");
    else $("#toggleHoliday").text("Mark Holiday");
    $("#toggleHoliday").show();

    updateToggleAllCheckbox();
  }

  updateCalendarEvents();

  const container = $(".selected-date-info");
  const mark = $("<p>", { id: "mark", text: "Mark" }).on("click", () => {
    const date = calendar.selectedDate;
    const day = date.getDay() - 1;
    const daySchedule = timetable[day];
    showMarkModal(date, daySchedule);
  });

  container.append(mark);
}

(async function () {
  await loadScript(calendarScriptURL);
  timetable = await postAsync(timetablePageURL);
  calendar = new SimpleCalendar("#calendarContainer");
  createMarkModal();
  addDisclaimer();
  addUnmarkedHoursTable();
  addCalendar();
})();
