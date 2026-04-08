const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const params = new URLSearchParams(window.location.search);
const roomId = params.get('room');
const myCode = params.get('me');
const otherCode = params.get('with');

const myProfile = JSON.parse(localStorage.getItem('anonProfile'));

let otherProfile = { first_name: otherCode, last_name: '', pic_url: '' };

// Load other user's profile from Supabase (not from URL)
async function init() {
  const { data } = await supabaseClient
    .from('users')
    .select('*')
    .eq('code', otherCode)
    .single();

  if (data) {
    otherProfile = data;
  }

  document.getElementById('otherPic').src = otherProfile.pic_url || 
    `https://ui-avatars.com/api/?name=${otherProfile.first_name}&background=4f46e5&color=fff`;
  document.getElementById('otherName').textContent = 
    otherProfile.first_name + ' ' + (otherProfile.last_name || '');

  await loadMessages();
}

async function loadMessages() {
  const { data } = await supabaseClient
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });
  renderMessages(data || []);
}

function renderMessages(msgs) {
  const container = document.getElementById('messages');
  container.innerHTML = '';
  msgs.forEach(msg => addMessageToUI(msg));
  container.scrollTop = container.scrollHeight;
}

function addMessageToUI(msg) {
  const isMe = msg.sender_id === myCode;
  const container = document.getElementById('messages');
  const wrapper = document.createElement('div');
  wrapper.className = 'msg-wrapper ' + (isMe ? 'me' : 'them');

  const pic = isMe 
    ? myProfile.picUrl 
    : (otherProfile.pic_url || `https://ui-avatars.com/api/?name=${otherProfile.first_name}&background=4f46e5&color=fff`);
  const name = isMe 
    ? myProfile.firstName 
    : otherProfile.first_name;

  wrapper.innerHTML = `
    <img src="${pic}" class="avatar-xs" />
    <div class="msg-bubble">
      <div class="msg-name">${name}</div>
      <div class="msg ${isMe ? 'me' : 'them'}">${msg.text}</div>
    </div>
  `;
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
}

supabaseClient
  .channel('room_' + roomId)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `room_id=eq.${roomId}`
  }, (payload) => {
    addMessageToUI(payload.new);
  })
  .subscribe();

async function sendMessage() {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if (!text) return;
  await supabaseClient.from('messages').insert({
    room_id: roomId,
    sender_id: myCode,
    text
  });
  input.value = '';
}

window.sendMessage = sendMessage;
document.getElementById('msgInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

init();