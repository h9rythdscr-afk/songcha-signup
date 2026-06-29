const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const tableBody = document.getElementById("tableBody");
const totalEl = document.getElementById("total");
const leftEl = document.getElementById("left");
const searchInput = document.getElementById("search");
const exportBtn = document.getElementById("exportBtn");

let allData = [];

async function loadSignups() {
  const { data, error } = await db
    .from("signups")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("加载报名数据失败");
    console.error(error);
    return;
  }

  allData = data || [];
  renderTable(allData);
  updateStats(allData);
}

function updateStats(data) {
  const total = data.length;
  const left = Math.max(MAX_SIGNUPS - total, 0);

  totalEl.textContent = total;
  leftEl.textContent = left;
}

function renderTable(data) {
  if (!data.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9">暂无报名数据</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = data
    .map((item) => {
      return `
        <tr>
          <td>${safe(item.name)}</td>
          <td>${safe(item.phone)}</td>
          <td>${safe(item.department)}</td>
          <td>${safe(item.social_account)}</td>
          <td>${safe(item.content_type)}</td>
          <td>${safe(item.reason)}</td>
          <td>${safe(item.remark)}</td>
          <td>${formatTime(item.created_at)}</td>
          <td>
            <button onclick="deleteSignup(${item.id})">删除</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function safe(value) {
  return value ? String(value).replace(/[<>&"]/g, "") : "-";
}

function formatTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  return date.toLocaleString("zh-CN", {
    hour12: false
  });
}

searchInput.addEventListener("input", function () {
  const keyword = this.value.trim();

  if (!keyword) {
    renderTable(allData);
    return;
  }

  const filtered = allData.filter((item) => {
    return (
      String(item.name || "").includes(keyword) ||
      String(item.phone || "").includes(keyword) ||
      String(item.department || "").includes(keyword) ||
      String(item.social_account || "").includes(keyword)
    );
  });

  renderTable(filtered);
});

async function deleteSignup(id) {
  const ok = confirm("确定删除这条报名信息吗？");

  if (!ok) return;

  const { error } = await db
    .from("signups")
    .delete()
    .eq("id", id);

  if (error) {
    alert("删除失败");
    console.error(error);
    return;
  }

  alert("已删除");
  loadSignups();
}

exportBtn.addEventListener("click", function () {
  if (!allData.length) {
    alert("暂无数据可导出");
    return;
  }

  const header = [
    "姓名",
    "手机号",
    "部门",
    "账号",
    "内容形式",
    "报名理由",
    "备注",
    "报名时间"
  ];

  const rows = allData.map((item) => [
    item.name || "",
    item.phone || "",
    item.department || "",
    item.social_account || "",
    item.content_type || "",
    item.reason || "",
    item.remark || "",
    formatTime(item.created_at)
  ]);

  const csvContent = [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "夏日荷花茶饮套餐内测官报名名单.csv";
  link.click();

  URL.revokeObjectURL(url);
});

loadSignups();
