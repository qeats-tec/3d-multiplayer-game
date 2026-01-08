const socket = io("http://localhost:3000"); 
// ⚠️ server online olunca burayı değiştireceğiz

// ===== KULLANICI ADI =====
let username = prompt("Kullanıcı adını gir:");
if (!username || username.trim() === "") {
  username = "Oyuncu" + Math.floor(Math.random() * 1000);
}
socket.emit("setName", username);

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

// ===== IŞIK =====
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

// ===== ZEMİN =====
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x55aa55 })
);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// ===== OYUNCULAR =====
const players3D = {};

function createPlayer(id, name) {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({
      color: id === myId ? 0x0000ff : 0x00ff00
    })
  );
  scene.add(box);

  const label = document.createElement("div");
  label.textContent = name;
  label.style.position = "absolute";
  label.style.color = "white";
  label.style.fontSize = "14px";
  label.style.pointerEvents = "none";
  label.style.display = "none";
  document.body.appendChild(label);

  players3D[id] = { box, label };
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
    pitch = Math.max(-1.2, Math.min(1.2, pitch));
  }
});

// ===== SERVER'DAN VERİ =====
socket.on("players", data => {
  const { players, names } = data;

  for (let id in players) {
    if (!players3D[id]) {
      createPlayer(id, names[id] || "Oyuncu");
    }
    players3D[id].box.position.set(players[id].x, 0.5, players[id].z);
  }
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

  // ===== İSİM GÖSTER (YAKINLIK) =====
  for (let id in players3D) {
    const { box, label } = players3D[id];
    const dist = camera.position.distanceTo(box.position);

    if (dist < 8) {
      label.style.display = "block";

      const p = box.position.clone();
      p.y += 1.5;
      p.project(camera);

      label.style.left = (p.x * 0.5 + 0.5) * innerWidth + "px";
      label.style.top  = (-p.y * 0.5 + 0.5) * innerHeight + "px";
    } else {
      label.style.display = "none";
    }
  }

  renderer.render(scene, camera);
}

animate();
