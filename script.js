const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const form = document.getElementById('signupForm');
const successBox = document.getElementById('successBox');
const submitBtn = document.getElementById('submitBtn');
const leftCount = document.getElementById('leftCount');
const msg = document.getElementById('msg');
 
function isClosed(){ return new Date() > new Date(ACTIVITY_CONFIG.deadline); }
function setMsg(text){ msg.textContent = text || ''; }
async function getCount(){
  const { count, error } = await client.from('signups').select('*', { count:'exact', head:true });
  if(error){ console.error(error); leftCount.textContent='读取失败'; return 0; }
  const left = Math.max(ACTIVITY_CONFIG.maxSeats - count, 0);
  leftCount.textContent = left + ' 位';
  if(left <= 0){ submitBtn.disabled=true; submitBtn.textContent='名额已满'; }
  if(isClosed()){ submitBtn.disabled=true; submitBtn.textContent='报名已截止'; }
  return count;
}
async function phoneExists(phone){
  const { data, error } = await client.from('signups').select('id').eq('phone', phone).limit(1);
  if(error) throw error;
  return data && data.length > 0;
}
function phoneValid(phone){ return /^1[3-9]\d{9}$/.test(phone); }
 
form.addEventListener('submit', async (e)=>{
  e.preventDefault(); setMsg(''); submitBtn.disabled=true; submitBtn.textContent='提交中...';
  try{
    if(isClosed()) throw new Error('报名已截止');
    const currentCount = await getCount();
    if(currentCount >= ACTIVITY_CONFIG.maxSeats) throw new Error('名额已满，感谢关注');
    const payload = {
      name: document.getElementById('name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      department: document.getElementById('department').value.trim(),
      social_account: document.getElementById('social_account').value.trim(),
      content_type: document.getElementById('content_type').value,
      reason: document.getElementById('reason').value.trim(),
      remark: document.getElementById('remark').value.trim(),
      people_count: 1
    };
    if(!phoneValid(payload.phone)) throw new Error('请填写正确的手机号');
    if(await phoneExists(payload.phone)) throw new Error('该手机号已报名，请勿重复提交');
    const { error } = await client.from('signups').insert([payload]);
    if(error) throw error;
    form.classList.add('hidden'); successBox.classList.remove('hidden'); await getCount();
  }catch(err){ setMsg(err.message || '提交失败，请稍后再试'); submitBtn.disabled=false; submitBtn.textContent='提交报名'; }
});
getCount();
