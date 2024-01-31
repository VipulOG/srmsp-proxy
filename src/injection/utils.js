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
