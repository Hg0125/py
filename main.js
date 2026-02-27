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
camera.position.set(5, 5, 5);

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

const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

// ===== 地板 =====
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// ===== 載入骰子模型 =====
const loader_cube = new GLTFLoader();
let cube = null;

loader_cube.load(
    "cube.glb",
    (gltf) => {
        cube = gltf.scene;
        cube.position.set(0, 0.5, 0);
        scene.add(cube);
        console.log("cube.glb 載入成功");
    },
    undefined,
    (error) => {
        console.error("cube.glb 載入失敗", error);
    }
);

// ===== 載入 GLB（如果有 map.glb）=====
const loader = new GLTFLoader();
loader.load(
    "map.glb",
    (gltf) => {
        gltf.scene.position.set(0, 0, 0);
        scene.add(gltf.scene);
        console.log("GLB 載入成功");
    },
    undefined,
    (error) => {
        console.log("沒有 map.glb 或載入失敗，使用測試方塊");
    }
);

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
    const dice = Math.floor(Math.random() * 6) + 1;
    position += dice;

    document.getElementById("dice").textContent = dice;
    document.getElementById("pos").textContent = position;
    document.getElementById("turn").textContent = turn++;

    cube.position.x = position % 10;
});