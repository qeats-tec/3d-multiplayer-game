const socket = io("http://localhost:3000");

// ===== KULLANICI ADI =====
let username = prompt("Kullanıcı adını gir:");
if (!username || username.trim() === "") {
  username = "Oyuncu" + Math.floor(Math.random() * 1000);
}
socket.emit("setName", username);

// ===== BEN KİMİM =====
let myId = null;
socket.on("me", id => myId = id);

// ===== SCENE =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// ===== CAMERA =====
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);

// ===== RENDERER =====
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// ===== ZEMİN =====
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x55aa55 })
);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// ===== IŞIK =====
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

// ===== OYUNCULAR =====
const boxes = {};

function createBox(id) {
  const mat = new THREE.MeshStandardMaterial({
    color: id === myId ? 0x0000ff : 0x00ff00
  });
  const box = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), mat);
  scene.add(box);
  boxes[id] = box;
}

// ===== HAREKET =====
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

let pos = { x: 0, z: 0 };

// ===== MOUSE KAMERA =====
let yaw = 0;
let pitch = 0;

document.body.addEventListener("click", () => {
  document.body.requestPointerLock();
});

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement === document.body) {
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;

    // yukarı-aşağı limit
    pitch = Math.max(-1.2, Math.min(1.2, pitch));
  }
});

// ===== SOCKET PLAYER UPDATE =====
socket.on("players", data => {
  for (let id in data) {
    if (!boxes[id]) createBox(id);
    boxes[id].position.set(data[id].x, 0.5, data[id].z);
  }
});

// ===== CHAT =====
const messages = document.getElementById("messages");
const input = document.getElementById("input");

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && input.value.trim() !== "") {
    socket.emit("chat", {
      name: username,
      text: input.value
    });
    input.value = "";
  }
});

socket.on("chat", data => {
  const div = document.createElement("div");
  div.textContent = `${data.name} : ${data.text}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

// ===== GAME LOOP =====
function animate() {
  requestAnimationFrame(animate);

  if (keys["w"]) {
    pos.x -= Math.sin(yaw) * 0.15;
    pos.z -= Math.cos(yaw) * 0.15;
  }
  if (keys["s"]) {
    pos.x += Math.sin(yaw) * 0.15;
    pos.z += Math.cos(yaw) * 0.15;
  }
  if (keys["a"]) {
    pos.x -= Math.cos(yaw) * 0.15;
    pos.z += Math.sin(yaw) * 0.15;
  }
  if (keys["d"]) {
    pos.x += Math.cos(yaw) * 0.15;
    pos.z -= Math.sin(yaw) * 0.15;
  }

  socket.emit("move", pos);

  const camX = pos.x + Math.sin(yaw) * 8;
  const camZ = pos.z + Math.cos(yaw) * 8;
  const camY = 4 + Math.sin(pitch) * 5;

  camera.position.set(camX, camY, camZ);
  camera.lookAt(pos.x, 1, pos.z);

  renderer.render(scene, camera);
}

animate();
