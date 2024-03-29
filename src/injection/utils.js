const loadScript = function (url) {
  return new Promise((resolve) => $.getScript(url, resolve));
};

const postAsync = function (url, data, dataType = "json") {
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

function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace(/\s/g, '/');
}

function parseDate(dateString) {
  const parts = dateString.split('/');
  const year = parseInt(parts[2], 10);
  const month = new Date(Date.parse(parts[1] + ' 1, ' + year)).getMonth() + 1;
  const day = parseInt(parts[0], 10);
  return new Date(year, month - 1, day);
}