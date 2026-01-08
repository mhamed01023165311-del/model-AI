// ==== main.js ====
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ----- Scene & Renderer -----
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 3);

let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ----- Lights -----
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 5, 5);
scene.add(spotLight);

// ----- Loader -----
const loader = new GLTFLoader();
let model;

// ----- Load your Rigged Model from GitHub (keep the exact name) -----
loader.load('https://raw.githubusercontent.com/username/repo/main/Stylized_Paladin_Clean.glb', (gltf) => {
    model = gltf.scene;
    model.position.y = -1;
    scene.add(model);
});

// ----- Gestures Mapping -----
const gestures = {
    "hello": {
        "RightArm": {x: 0.5, y:0, z:0},
        "LeftArm": {x:0, y:0, z:0},
        "Spine": {x:0.1, y:0, z:0}
    },
    "thank you": {
        "RightArm": {x:0.3, y:0, z:0},
        "LeftArm": {x:0.2, y:0, z:0},
        "Spine": {x:0.05, y:0, z:0}
    },
    "yes": {
        "RightArm": {x:0.2, y:0.1, z:0},
        "LeftArm": {x:0, y:0, z:0},
        "Spine": {x:0.05, y:0, z:0}
    },
    "no": {
        "RightArm": {x:-0.2, y:0, z:0},
        "LeftArm": {x:0, y:0, z:0},
        "Spine": {x:-0.05, y:0, z:0}
    }
};

// ----- Convert AI Text to Gestures -----
function aiToGesture(text) {
    return gestures[text.toLowerCase()] || {};
}

// ----- Move Bones Function -----
function moveBones(actions) {
    if (!model) return;

    model.traverse(o => {
        if (o.isBone && actions[o.name] !== undefined) {
            o.rotation.x += (actions[o.name].x - o.rotation.x) * 0.2;
            o.rotation.y += (actions[o.name].y - o.rotation.y) * 0.2;
            o.rotation.z += (actions[o.name].z - o.rotation.z) * 0.2;
        }
    });
}

// ----- Speech Recognition Setup -----
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';
recognition.interimResults = false;

document.getElementById('talkBtn').onclick = () => recognition.start();

recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    
    // Convert text to gesture actions
    const actions = aiToGesture(text);

    // Apply to model
    moveBones(actions);
};

// ----- Animate Loop -----
function animate() {
    requestAnimationFrame(animate);

    // Idle subtle movement
    if (model) {
        const t = Date.now() * 0.001;
        model.rotation.y = Math.sin(t * 0.5) * 0.05;
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();
