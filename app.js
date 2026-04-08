const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let myProfile = JSON.parse(localStorage.getItem('anonProfile'));

// Show setup or main app
if (!myProfile) {
  document.getElementById('setupModal').style.display = 'flex';
} else {
  showApp();
}

function previewPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('previewPic').src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function saveProfile() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  if (!firstName || !lastName) return alert('Please enter your full name!');

  const picInput = document.getElementById('picInput');
  let picUrl = '';

  if (picInput.files[0]) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      picUrl = e.target.result; // base64 stored locally
      await finishSave(firstName, lastName, picUrl);
    };
    reader.readAsDataURL(picInput.files[0]);
  } else {
    picUrl = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=4f46e5&color=fff&size=100`;
    await finishSave(firstName, lastName, picUrl);
  }
}

async function finishSave(firstName, lastName, picUrl) {
  const code = 'user_' + Math.random().toString(36).substr(2, 9).toUpperCase();
  myProfile = { firstName, lastName, picUrl, code };
  localStorage.setItem('anonProfile', JSON.stringify(myProfile));

  // Save to Supabase
  await supabaseClient.from('users').upsert({
    code,
    first_name: firstName,
    last_name: lastName,
    pic_url: picUrl
  });

  document.getElementById('setupModal').style.display = 'none';
  showApp();
}

function showApp() {
  document.getElementById('app').style.display = 'block';
  document.getElementById('myPic').src = myProfile.picUrl;
  document.getElementById('myName').textContent = myProfile.firstName + ' ' + myProfile.lastName;
  document.getElementById('myCode').textContent = myProfile.code;
}

function copyCode() {
  navigator.clipboard.writeText(myProfile.code);
  alert('✅ Code copied! Share it with your friend.');
}

async function searchUsers() {
  const query = document.getElementById('searchInput').value.trim();
  const resultsDiv = document.getElementById('searchResults');
  if (!query) { resultsDiv.innerHTML = ''; return; }

  const { data } = await supabaseClient
    .from('users')
    .select('*')
    .or(`code.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`);

  resultsDiv.innerHTML = '';
  if (!data || data.length === 0) {
    resultsDiv.innerHTML = '<p class="no-result">No user found.</p>';
    return;
  }

  data.forEach(user => {
    if (user.code === myProfile.code) return; // skip yourself
    const div = document.createElement('div');
    div.className = 'user-result';
    div.innerHTML = `
      <img src="${user.pic_url}" class="avatar-sm" />
      <div class="user-info">
        <div class="bold">${user.first_name} ${user.last_name}</div>
        <div class="code-text">${user.code}</div>
      </div>
      <button onclick="startChat('${user.code}', '${user.first_name} ${user.last_name}', '${user.pic_url}')">Chat</button>
    `;
    resultsDiv.appendChild(div);
  });
}

function startChat(otherCode, otherName, otherPic) {
  const roomId = [myProfile.code, otherCode].sort().join('__');
  window.location.href = `chat.html?room=${roomId}&me=${myProfile.code}&with=${otherCode}&withName=${encodeURIComponent(otherName)}&withPic=${encodeURIComponent(otherPic)}`;
}