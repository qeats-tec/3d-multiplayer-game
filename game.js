const socket = io("https://threed-multiplayer-game.onrender.com");

let scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // gökyüzü

let camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Işık
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
let sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(5, 10, 5);
scene.add(sun);

// Zemin
let ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x55aa55 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Oyuncular
const players = {};
let myId = null;

// Username gir
document.getElementById("username").addEventListener("change", e => {
  socket.emit("join", e.target.value);
  e.target.disabled = true;
});

// Oyuncu oluştur
function createPlayer(p) {
  let cube = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({ color: p.id === myId ? 0x0000ff : 0xff0000 })
  );
  cube.position.set(p.x, p.y, p.z);
  scene.add(cube);

  let label = document.createElement("div");
  label.style.position = "absolute";
  label.style.color = "white";
  label.innerText = p.username;
  document.body.appendChild(label);

  players[p.id] = { mesh: cube, label };
}

// Server olayları
socket.on("currentPlayers", data => {
  myId = socket.id;
  for (let id in data) createPlayer(data[id]);
});

socket.on("newPlayer", p => createPlayer(p));

socket.on("playerMoved", p => {
  if (players[p.id]) players[p.id].mesh.position.set(p.x, p.y, p.z);
});

socket.on("playerDisconnected", id => {
  if (players[id]) {
    scene.remove(players[id].mesh);
    players[id].label.remove();
    delete players[id];
  }
});

// Hareket
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// Mouse kamera
let pitch = 0, yaw = 0;
document.addEventListener("mousemove", e => {
  if (document.pointerLockElement === document.body) {
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = Math.max(-1.5, Math.min(1.5, pitch));
  }
});
document.body.addEventListener("click", () => document.body.requestPointerLock());

// Chat
const chatBox = document.getElementById("chat");
document.getElementById("chatInput").addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.value) {
    socket.emit("chat", e.target.value);
    e.target.value = "";
  }
});

socket.on("chat", data => {
  let div = document.createElement("div");
  div.textContent = `${data.user}: ${data.message}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Animasyon
function animate() {
  requestAnimationFrame(animate);

  let me = players[myId];
  if (me) {
    if (keys["w"]) me.mesh.position.z -= 0.1;
    if (keys["s"]) me.mesh.position.z += 0.1;
    if (keys["a"]) me.mesh.position.x -= 0.1;
    if (keys["d"]) me.mesh.position.x += 0.1;

    socket.emit("move", {
      x: me.mesh.position.x,
      y: me.mesh.position.y,
      z: me.mesh.position.z
    });

    camera.position.lerp(
      new THREE.Vector3(
        me.mesh.position.x,
        me.mesh.position.y + 2,
        me.mesh.position.z + 5
      ),
      0.1
    );
    camera.rotation.set(pitch, yaw, 0);
  }

  for (let id in players) {
    let p = players[id];
    let pos = p.mesh.position.clone().project(camera);
    let x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    let y = (-pos.y * 0.5 + 0.5) * window.innerHeight;
    p.label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    p.label.style.display = camera.position.distanceTo(p.mesh.position) < 10 ? "block" : "none";
  }

  renderer.render(scene, camera);
}

animate();
