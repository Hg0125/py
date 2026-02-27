import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

// ===== 基本場景 =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(15, 12, 15);

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("three"),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);

// ===== 控制器 =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ===== 光源 =====
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

// ===== 地板 =====
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// ===== 載入地圖 =====
const loader = new GLTFLoader();
loader.load("map.glb", (gltf) => {
    scene.add(gltf.scene);
});

let player1 = null;
let player2 = null;
let player3 = null;

// chil guy
loader.load("chill_guy.glb", (gltf) => {
    player1 = gltf.scene;
    player1.scale.set(0.5, 0.5, 0.5);
    player1.position.set(9, 1.5, 8);
    scene.add(player1);
});

// alan walker
loader.load("blue_smurf_cat.glb", (gltf) => {
    player2 = gltf.scene;
    player2.scale.set(1.5, 1.5, 1.5);
    player2.position.set(9, 0, 7);
    scene.add(player2);
});

// ina
loader.load("takodachi.glb", (gltf) => {
    player3 = gltf.scene;
    player3.scale.set(0.3, 0.3, 0.3);
    player3.position.set(9, 1, 7);
    scene.add(player3);
});

// ===== 動畫 =====
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// ===== 視窗縮放 =====
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== UI邏輯 =====
let turn = 1;
let position = 0;

document.getElementById("roll").addEventListener("click", () => {

    if (!player1) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    position += dice;

    document.getElementById("dice").textContent = dice;
    document.getElementById("pos").textContent = position;
    document.getElementById("turn").textContent = turn++;

    // 只讓 player1 移動（測試）
    player1.position.x = 8 + position;
});
