const socket = io();
const converter = new showdown.Converter({'openLinksInNewWindow':true, 'simplifiedAutoLink':true,'strikethrough':true,'tables':true,'backslashEscapesHTMLTags':true,'emoji':true,'literalMidWordUnderscores':true,'requireSpaceBeforeHeadingText':true,'simpleLineBreaks':true});

converter.setFlavor('github');

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");


function autoResize(textarea) {
  textarea.style.height = 'auto'; // Réinitialise la hauteur à auto
  textarea.style.height = `calc(${textarea.scrollHeight}px - 1rem)`; // Ajuste la hauteur
  document.body.style.setProperty('--form-height', `${form.scrollHeight}px`);
}

input.addEventListener('input', e => {
  autoResize(e.currentTarget);
});

input.addEventListener('keydown', e => {
  if (e.key == 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
    return;
  }
});


// Récupérer le token dans les cookies
const token = document.cookie.split("=")[1];
// Récupérer la room dans l'url
let room;
if (window.location.pathname.split("/")[1] === "chat") {
  socket.emit("auth chat",token, window.location.pathname.split("/")[2]);
} else if (window.location.pathname.split("/")[1] === "room") {
  room = window.location.pathname.split("/")[2];
  socket.emit("authentification",token, room);
} else {
  room = null;
  socket.emit("authentification",token, room);
}

socket.on("auth chat", (roomId) => {
  room = roomId;
  socket.emit("authentification",token, room);
});

function sendMessage() {
  if (input.value) {
    socket.emit("chat message", input.value, room);
    input.value = "";
    input.dispatchEvent(new Event("input"));
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

socket.on("chat message", (msg, username, date) => {

  let message = document.createElement("div");
  message.classList.add("message");

  let messageText = document.createElement("div");
  msg = msg.replaceAll('<', '&lt;');
  messageText.innerHTML = converter.makeHtml(msg);

  let dateElement = document.createElement("span");
  dateElement.classList.add("date");
  dateElement.innerText = date;
  
  message.append(messageText);
  message.append(dateElement);
  // Vérifier si le message précédent a été envoyé par le même utilisateur
  if (messages.lastChild && messages.lastChild.querySelector(".username").innerText === username) {
    // Si oui, ajouter le message à la suite du message précédent
    messages.lastChild.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
    return;
  }
  let item = document.createElement("li");
  let user = document.createElement("strong");
  user.classList.add("username");
  user.innerText = username;
  item.appendChild(user);
  item.appendChild(message);
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

autoResize(input)

/* Search user form */

document.querySelector("#searchUser").addEventListener("click", () => {
  document.querySelector("#userSearch").style.display = "flex";
});

/* Quand on appuie autour de la fenêtre de recherche, on la ferme */
document.querySelector("#userSearch").addEventListener("click", (e) => {
  if (e.target === document.querySelector("#userSearch")) {
    document.querySelector("#userSearch").style.display = "none";
    document.querySelector("#searchUserInput").value = "";
  }
});

document.querySelector("#searchUserInput").addEventListener("input", (e) => {
  if (e.target.value === "") {
    document.querySelector("#searchUserResults").innerHTML = "";
    let userElement = document.createElement("li");
    let span = document.createElement("span");
    span.innerText = "Start typing to search for a user";
    userElement.appendChild(span);
    document.querySelector("#searchUserResults").appendChild(userElement);
    return;
  }
  socket.emit("search user", e.target.value);
}
);

socket.on("search user", (users) => {
  document.querySelector("#searchUserResults").innerHTML = "";
  if (users.length === 0) {
    let userElement = document.createElement("li");
    userElement.innerText = "No user found";
    document.querySelector("#searchUserResults").appendChild(userElement);
    return;
  }
  users.forEach((user) => {
    let userElement = document.createElement("li");
    userElement.innerText = user.username;
    chatButton = document.createElement("a");
    chatButton.innerText = "💬";
    chatButton.classList.add("chatButton");
    chatButton.href = `/chat/${user._id}`;
    userElement.appendChild(chatButton);
    document.querySelector("#searchUserResults").appendChild(userElement);
  });
});