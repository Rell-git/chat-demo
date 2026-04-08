// Generate or load unique ID
let myId = localStorage.getItem('anonId');
if (!myId) {
  myId = 'user_' + Math.random().toString(36).substr(2, 9).toUpperCase();
  localStorage.setItem('anonId', myId);
}
document.getElementById('myId').textContent = myId;

function copyId() {
  navigator.clipboard.writeText(myId);
  alert('✅ ID Copied! Share it with your friend.');
}

function startChat() {
  const otherId = document.getElementById('searchId').value.trim();
  if (!otherId) return alert('Please enter a friend ID!');
  if (otherId === myId) return alert("That's your own ID!");
  const roomId = [myId, otherId].sort().join('__');
  window.location.href = `chat.html?room=${roomId}&me=${myId}&with=${otherId}`;
}