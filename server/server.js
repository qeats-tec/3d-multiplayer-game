const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let players = {};
let names = {};

io.on("connection", socket => {
  console.log("Oyuncu bağlandı:", socket.id);

  socket.emit("me", socket.id);

  players[socket.id] = { x: 0, z: 0 };

  socket.on("setName", name => {
    names[socket.id] = name;
  });

  socket.on("move", pos => {
    players[socket.id] = pos;
    io.emit("players", { players, names });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    delete names[socket.id];
    io.emit("players", { players, names });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server çalışıyor");
});
