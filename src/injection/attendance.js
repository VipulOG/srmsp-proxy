const calendarScriptURL =
  "https://vipul.is-a.dev/SimpleCalendar.js/src/SimpleCalendar.js";

let timetable;

const loadScript = function (url) {
  return new Promise((resolve) => $.getScript(url, resolve));
};

const postData = function (url, data, dataType = "json") {
  return $.post({ url, data, dataType });
};

const regNo = $(".sidenav-footer-subtitle").first().text();

function getData(key) {
  const data = localStorage.getItem(regNo);
  if (!data) return {};
  return JSON.parse(data)[key] || {};
}

function setData(key, value) {
  const data = JSON.parse(localStorage.getItem(regNo)) || {};
  data[key] = value;
  localStorage.setItem(regNo, JSON.stringify(data));
}

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

function showMarkModal(date, daySchedule) {
  $("#markModal").modal("show");

  const dateStr = date.toLocaleDateString("en-in");
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
    const data = getData(date.toLocaleDateString("en-in"));
    if (data.holiday) {
      setData(date.toLocaleDateString("en-in"), {
        holiday: false,
        attendance: undefined,
      });
      $("#toggleAll").prop("checked", true);
      $("#toggleAll").prop("disabled", false);
      $(".markCheckbox").prop("checked", true);
      $(".markCheckbox").prop("disabled", false);
      $("#toggleHoliday").text("Mark Holiday");
    } else {
      setData(date.toLocaleDateString("en-in"), {
        holiday: true,
        attendance: [],
      });
      $("#toggleAll").prop("checked", false);
      $("#toggleAll").prop("disabled", true);
      $(".markCheckbox").prop("checked", false);
      $(".markCheckbox").prop("disabled", true);
      $("#toggleHoliday").text("Unmark Holiday");
    }
    calendar.removeAllEvents();
    calendar.addEvents(generateEvents());
  }

  function saveAttendance() {
    const boxes = $(".markCheckbox");
    setData(date.toLocaleDateString("en-in"), {
      holiday: false,
      attendance: [...boxes.filter(":checked")].map((box) => box.value),
    });
    calendar.removeAllEvents();
    calendar.addEvents(generateEvents());
  }

  function generateTableRows() {
    let rows = "";
    for (const [key, value] of Object.entries(daySchedule)) {
      const checked =
        !data.attendance || (data.attendance && data.attendance.includes(key));
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

function generateEvents() {
  const events = [];
  const today = new Date();
  const sessionEnd = new Date(sessionStart);
  sessionEnd.setMonth(sessionEnd.getMonth() + 6);

  let expectedTotalClasses = totalClasses;
  let expectedTotalPresent = totalPresent;

  for (
    let date = new Date(today);
    date <= sessionEnd;
    date.setDate(date.getDate() + 1)
  ) {
    const data = getData(date.toLocaleDateString("en-in"));
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

  return events;
}

async function initCalendar() {
  await loadScript(calendarScriptURL);
  timetable = await postData(timetablePageURL);
  const events = generateEvents(timetable);

  calendar = new SimpleCalendar("#calendarContainer", events);
  const container = $(".selected-date-info");
  const mark = $("<p>", { id: "mark", text: "Mark" }).on("click", () => {
    const date = calendar.selectedDate;
    const day = date.getDay() - 1;
    const daySchedule = timetable[day];
    showMarkModal(date, daySchedule);
  });

  container.append(mark);
}

initCalendar();
createMarkModal();
