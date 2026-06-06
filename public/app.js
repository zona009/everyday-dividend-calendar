let state = { accounts: [], dividends: [] };
let calendarDate = new Date(2026, 4, 1);
let selectedDate = "2026-05-29";
const maxItemsInDayCell = 5;

const $ = selector => document.querySelector(selector);
const won = value => `${Math.round(value).toLocaleString("ko-KR")}원`;
const share = value => Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 8 });

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "요청에 실패했어요.");
  return data;
}

function accountName(id) {
  return state.accounts.find(item => item.id === id)?.label ?? "새 계좌";
}

function total(items, key) {
  return items.reduce((sum, item) => sum + item[key], 0);
}

function monthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function visibleDividends() {
  const account = $("#account-select").value;
  const query = $("#calendar-search").value.trim().toLowerCase();
  return state.dividends.filter(item => {
    const matchesAccount = account === "all" || item.account === account;
    const searchable = `${item.stock} ${accountName(item.account)}`.toLowerCase();
    return matchesAccount && (!query || searchable.includes(query));
  });
}

function fillAccounts() {
  const options = ['<option value="all">전체 계좌</option>']
    .concat(state.accounts.map(item => `<option value="${item.id}">${item.label}</option>`))
    .join("");
  $("#account-select").innerHTML = options;
  $("#account-input").innerHTML = state.accounts.map(item => `<option value="${item.id}">${item.label}</option>`).join("");
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const filtered = visibleDividends();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells = [];

  $("#account-title").textContent = $("#account-select").value === "all" ? "전체 계좌" : accountName($("#account-select").value);
  $("#calendar-month").textContent = `${year}년 ${month + 1}월`;

  for (let blank = 0; blank < firstDay; blank++) {
    cells.push('<span class="calendar-day muted" aria-hidden="true"></span>');
  }

  for (let day = 1; day <= lastDate; day++) {
    const date = `${monthKey(year, month)}-${String(day).padStart(2, "0")}`;
    const dayItems = filtered.filter(item => item.date === date);
    const visibleItems = dayItems.slice(0, maxItemsInDayCell);
    const hiddenCount = Math.max(dayItems.length - maxItemsInDayCell, 0);
    const amount = total(dayItems, "amount");
    const classes = ["calendar-day"];
    if (amount) classes.push("has-dividend");
    if (date === selectedDate) classes.push("selected");

    cells.push(`<div class="${classes.join(" ")}" data-date="${date}">
      <button class="day-main" type="button" data-date="${date}">
        <span class="day-number">${day}</span>
        ${amount ? `<span class="day-amount">${won(amount)}</span>` : ""}
      </button>
      ${amount ? `<button class="day-count" type="button" data-date="${date}" aria-label="${date} 전체 배당 내역 보기">${dayItems.length}건</button>
        <span class="day-items">${visibleItems.map(item => `<span>${item.stock}(${share(item.shares)})-${won(item.amount)}</span>`).join("")}${hiddenCount ? `<span class="more-line">+${hiddenCount}건 더</span>` : ""}</span>` : ""}
    </div>`);
  }

  $("#calendar-grid").innerHTML = cells.join("");

  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    sum: filtered
      .filter(item => item.date.startsWith(monthKey(year, index)))
      .reduce((acc, item) => acc + item.amount, 0),
  }));
  const max = Math.max(...monthly.map(item => item.sum), 1);
  $("#monthly-dividend-list").innerHTML = `<div class="monthly-summary-list">${monthly.map(item => `
    <div class="monthly-row">
      <span>${item.month}월</span>
      <div class="monthly-track"><span class="monthly-fill" style="width:${item.sum / max * 100}%"></span></div>
      <b>${won(item.sum)}</b>
    </div>`).join("")}</div>`;

  document.querySelectorAll(".day-main[data-date]").forEach(button => {
    button.addEventListener("click", () => {
      selectedDate = button.dataset.date;
      $("#date-input").value = selectedDate;
      renderCalendar();
    });
  });

  document.querySelectorAll(".day-count[data-date]").forEach(button => {
    button.addEventListener("click", () => {
      selectedDate = button.dataset.date;
      $("#date-input").value = selectedDate;
      renderCalendar();
      openDayPanel(button.dataset.date);
    });
  });
}

function openDayPanel(date) {
  const filtered = visibleDividends().filter(item => item.date === date);
  const selectedTotal = total(filtered, "amount");
  $("#day-panel-date").textContent = `${date.replaceAll("-", ".")} · ${won(selectedTotal)} · ${filtered.length}건`;
  $("#day-panel-list").innerHTML = filtered.map(item => `
    <div class="panel-entry">
      <label class="select-entry">
        <input type="checkbox" data-select-dividend="${item.id}" />
        <button type="button" data-edit="${item.id}">
          <b>${item.stock}</b>
          <span>${accountName(item.account)} · ${share(item.shares)}주</span>
        </button>
      </label>
      <strong>${won(item.amount)}</strong>
    </div>
  `).join("");
  $("#day-panel").hidden = false;
  document.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => openDividendDialog(state.dividends.find(item => item.id === button.dataset.edit)));
  });
  document.querySelectorAll("[data-select-dividend]").forEach(input => {
    input.addEventListener("change", updateBulkDeleteState);
  });
  updateBulkDeleteState();
}

function updateBulkDeleteState() {
  const selected = document.querySelectorAll("[data-select-dividend]:checked").length;
  $("#bulk-delete").disabled = selected === 0;
  $("#bulk-delete").textContent = selected ? `${selected}개 삭제` : "선택 삭제";
}

function openDividendDialog(item = null) {
  $("#form-error").textContent = "";
  $("#dividend-id").value = item?.id || "";
  $("#date-input").value = item?.date || selectedDate;
  $("#account-input").value = item?.account || ($("#account-select").value === "all" ? state.accounts[0]?.id : $("#account-select").value);
  $("#stock-input").value = item?.stock || "";
  $("#shares-input").value = item?.shares || "";
  $("#amount-input").value = item?.amount || "";
  $("#dialog-mode").textContent = item ? "배당 수정" : "배당 입력";
  $("#dialog-title").textContent = item ? "배당 수정" : "배당 추가";
  $("#delete-dividend").hidden = !item;
  $("#dividend-dialog").showModal();
}

async function refreshData() {
  state = await api("/api/data");
  state.dividends.sort((a, b) => a.date.localeCompare(b.date) || a.stock.localeCompare(b.stock));
  fillAccounts();
  renderAccountList();
  renderCalendar();
}

function openAccountDialog(account = null) {
  $("#account-error").textContent = "";
  $("#account-id").value = account?.id || "";
  $("#account-label").value = account?.label || "";
  $("#delete-account").hidden = !account;
  renderAccountList();
  $("#account-dialog").showModal();
}

function renderAccountList() {
  const counts = state.accounts.map(account => ({
    ...account,
    count: state.dividends.filter(item => item.account === account.id).length,
  }));
  $("#account-list").innerHTML = counts.map(account => `
    <button class="account-row" type="button" data-account-edit="${account.id}">
      <span>${account.label}</span>
      <b>${account.count}건</b>
    </button>
  `).join("");
  document.querySelectorAll("[data-account-edit]").forEach(button => {
    button.addEventListener("click", () => openAccountDialog(state.accounts.find(item => item.id === button.dataset.accountEdit)));
  });
}

async function boot() {
  const session = await api("/api/session");
  if (session.authed) {
    $("#login-view").hidden = true;
    $("#app-view").hidden = false;
    await refreshData();
  }
}

$("#login-form").addEventListener("submit", async event => {
  event.preventDefault();
  $("#login-error").textContent = "";
  try {
    await api("/api/login", { method: "POST", body: JSON.stringify({ password: $("#password").value }) });
    $("#login-view").hidden = true;
    $("#app-view").hidden = false;
    await refreshData();
  } catch (error) {
    $("#login-error").textContent = error.message;
  }
});

$("#theme-toggle").addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  $("#theme-toggle").textContent = isDark ? "라이트" : "다크";
});

$("#account-select").addEventListener("change", () => {
  $("#day-panel").hidden = true;
  renderCalendar();
});

$("#calendar-search").addEventListener("input", () => {
  $("#day-panel").hidden = true;
  renderCalendar();
});

$("#calendar-prev").addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
  $("#day-panel").hidden = true;
  renderCalendar();
});

$("#calendar-next").addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
  $("#day-panel").hidden = true;
  renderCalendar();
});

$("#close-day-panel").addEventListener("click", () => {
  $("#day-panel").hidden = true;
});

$("#bulk-delete").addEventListener("click", async () => {
  const ids = Array.from(document.querySelectorAll("[data-select-dividend]:checked")).map(input => input.dataset.selectDividend);
  if (!ids.length || !confirm(`${ids.length}개 배당 내역을 삭제할까요?`)) return;
  await api("/api/dividends/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) });
  await refreshData();
  openDayPanel(selectedDate);
});

$("#add-dividend").addEventListener("click", () => openDividendDialog());
$(".close-button").addEventListener("click", () => $("#dividend-dialog").close());

$("#dividend-form").addEventListener("submit", async event => {
  event.preventDefault();
  $("#form-error").textContent = "";
  const id = $("#dividend-id").value;
  const payload = {
    date: $("#date-input").value,
    account: $("#account-input").value,
    stock: $("#stock-input").value,
    shares: $("#shares-input").value,
    amount: $("#amount-input").value,
  };
  try {
    if (id) await api(`/api/dividends/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    else await api("/api/dividends", { method: "POST", body: JSON.stringify(payload) });
    $("#dividend-dialog").close();
    await refreshData();
    if (id || payload.date === selectedDate) openDayPanel(payload.date);
  } catch (error) {
    $("#form-error").textContent = error.message;
  }
});

$("#delete-dividend").addEventListener("click", async () => {
  const id = $("#dividend-id").value;
  if (!id || !confirm("이 배당 내역을 삭제할까요?")) return;
  await api(`/api/dividends/${id}`, { method: "DELETE" });
  $("#dividend-dialog").close();
  await refreshData();
});

$("#manage-accounts").addEventListener("click", () => openAccountDialog());

$("#close-account-dialog").addEventListener("click", () => $("#account-dialog").close());

$("#account-form").addEventListener("submit", async event => {
  event.preventDefault();
  $("#account-error").textContent = "";
  const id = $("#account-id").value;
  const payload = { label: $("#account-label").value };
  try {
    if (id) await api(`/api/accounts/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    else await api("/api/accounts", { method: "POST", body: JSON.stringify(payload) });
    $("#account-id").value = "";
    $("#account-label").value = "";
    $("#delete-account").hidden = true;
    await refreshData();
  } catch (error) {
    $("#account-error").textContent = error.message;
  }
});

$("#delete-account").addEventListener("click", async () => {
  const id = $("#account-id").value;
  if (!id || !confirm("이 계좌를 삭제할까요?")) return;
  try {
    await api(`/api/accounts/${id}`, { method: "DELETE" });
    $("#account-id").value = "";
    $("#account-label").value = "";
    $("#delete-account").hidden = true;
    await refreshData();
  } catch (error) {
    $("#account-error").textContent = error.message;
  }
});

boot();
