const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const players = {};

io.on("connection", (socket) => {
  console.log("Bir oyuncu bağlandı:", socket.id);

  socket.on("join", (username) => {
    players[socket.id] = {
      id: socket.id,
      username,
      x: 0,
      y: 1,
      z: 0,
    };

    socket.emit("currentPlayers", players);
    socket.broadcast.emit("newPlayer", players[socket.id]);
  });

  socket.on("move", (pos) => {
    if (players[socket.id]) {
      players[socket.id] = { ...players[socket.id], ...pos };
      socket.broadcast.emit("playerMoved", players[socket.id]);
    }
  });

  socket.on("chat", (msg) => {
    if (players[socket.id]) {
      io.emit("chat", {
        user: players[socket.id].username,
        message: msg,
      });
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playerDisconnected", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Server çalışıyor");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("SERVER BAŞLADI:", PORT);
});
