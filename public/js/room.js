const socket = io();

// Récupérer le token dans les cookies
const token = document.cookie.split("=")[1];

socket.emit("authentification", token, null);

document.querySelector("#search").addEventListener("input", (e) => {
    socket.emit("search room", e.target.value);
}
);

socket.on("search room", (rooms) => {
    document.querySelector("#rooms").innerHTML = "";
    if (rooms.length === 0) {
        let userElement = document.createElement("li");
        userElement.innerText = "No room found";
        document.querySelector("#rooms").appendChild(userElement);
        return;
    }
    rooms.forEach((room) => {
        let userElement = document.createElement("li");
        userElement.innerText = room.name;
        let admin = document.createElement("span");
        admin.innerText = room.admin;
        admin.classList.add("adminInSearch");
        chatButton = document.createElement("a");
        if (room.isUserInRoom) {
            chatButton.innerText = "💬";
            chatButton.title = "Chat";
        }
        else {
            chatButton.innerText = "✔️";
            chatButton.title = "Join";
        }
        chatButton.classList.add("chatButton");
        chatButton.href = `/room/${room._id}`;
        userElement.appendChild(admin);
        userElement.appendChild(chatButton);
        document.querySelector("#rooms").appendChild(userElement);
    });
});

socket.emit("search room", document.querySelector("#search>input").value);