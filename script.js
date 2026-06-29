const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById("signupForm");
const successBox = document.getElementById("successBox");
const submitBtn = document.getElementById("submitBtn");
const leftCount = document.getElementById("leftCount");

async function getSignupCount() {
  const { data, error } = await db
    .from("signups")
    .select("id");

  if (error) {
    console.error(error);
    leftCount.textContent = "加载失败";
    return 0;
  }

  const count = data.length;
  const left = MAX_SIGNUPS - count;

  leftCount.textContent = left > 0 ? `${left} / ${MAX_SIGNUPS}` : "已满";

  if (left <= 0) {
    submitBtn.disabled = true;
    submitBtn.textContent = "名额已满";
  }

  return count;
}

function checkDeadline() {
  const now = new Date();
  const deadline = new Date(DEADLINE);

  if (now > deadline) {
    submitBtn.disabled = true;
    submitBtn.textContent = "报名已截止";
    return false;
  }

  return true;
}

async function checkDuplicatePhone(phone) {
  const { data, error } = await db
    .from("signups")
    .select("id")
    .eq("phone", phone);

  if (error) {
    console.error(error);
    return false;
  }

  return data.length > 0;
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!checkDeadline()) {
    alert("报名已截止");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "提交中...";

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const department = document.getElementById("department").value.trim();
  const social_account = document.getElementById("social_account").value.trim();
  const content_type = document.getElementById("content_type").value;
  const reason = document.getElementById("reason").value.trim();
  const remark = document.getElementById("remark").value.trim();

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    alert("请输入正确的手机号");
    submitBtn.disabled = false;
    submitBtn.textContent = "提交报名";
    return;
  }

  const currentCount = await getSignupCount();

  if (currentCount >= MAX_SIGNUPS) {
    alert("报名名额已满");
    submitBtn.textContent = "名额已满";
    return;
  }

  const isDuplicate = await checkDuplicatePhone(phone);

  if (isDuplicate) {
    alert("该手机号已报名，请勿重复提交");
    submitBtn.disabled = false;
    submitBtn.textContent = "提交报名";
    return;
  }

  const { error } = await db
    .from("signups")
    .insert([
      {
        name,
        phone,
        department,
        social_account,
        content_type,
        reason,
        remark,
        people_count: 1,
        status: "已报名"
      }
    ]);

  if (error) {
    console.error(error);
    alert("提交失败，请稍后再试");
    submitBtn.disabled = false;
    submitBtn.textContent = "提交报名";
    return;
  }

  form.classList.add("hidden");
  successBox.classList.remove("hidden");

  await getSignupCount();
});

getSignupCount();
checkDeadline();
