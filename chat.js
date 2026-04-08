const params = new URLSearchParams(window.location.search);
const roomId = params.get('room');
const myId = params.get('me');
const otherId = params.get('with');

document.getElementById('chatWith').textContent = 'Chatting with: ' + otherId;

// Fix #1: renamed from 'client' to 'supabaseClient'
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Load existing messages
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
  msgs.forEach(msg => {
    const div = document.createElement('div');
    div.className = msg.sender_id === myId ? 'msg me' : 'msg them';
    div.textContent = msg.text;
    container.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;
}

// Real-time listener
supabaseClient
  .channel('room_' + roomId)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `room_id=eq.${roomId}`
  }, (payload) => {
    const msg = payload.new;
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = msg.sender_id === myId ? 'msg me' : 'msg them';
    div.textContent = msg.text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  })
  .subscribe();

// Send message
async function sendMessage() {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if (!text) return;
  await supabaseClient.from('messages').insert({
    room_id: roomId,
    sender_id: myId,
    text: text
  });
  input.value = '';
}

// Fix #2: expose to window so onclick works
window.sendMessage = sendMessage;

document.getElementById('msgInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

loadMessages();