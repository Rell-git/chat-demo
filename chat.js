const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const params = new URLSearchParams(window.location.search);
const roomId = params.get('room');
const myCode = params.get('me');
const otherCode = params.get('with');
const otherName = decodeURIComponent(params.get('withName'));
const otherPic = decodeURIComponent(params.get('withPic'));

const myProfile = JSON.parse(localStorage.getItem('anonProfile'));

document.getElementById('otherPic').src = otherPic;
document.getElementById('otherName').textContent = otherName;

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

  const pic = isMe ? myProfile.picUrl : otherPic;
  const name = isMe ? myProfile.firstName : otherName.split(' ')[0];

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

loadMessages();