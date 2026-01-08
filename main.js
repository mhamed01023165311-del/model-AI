import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model, headMesh, clock = new THREE.Clock();
const loader = new GLTFLoader();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.6, 0.7);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8), new THREE.DirectionalLight(0xffffff, 2));
}

window.addEventListener('message', (e) => {
    if (typeof e.data === 'string' && e.data.startsWith('https://models.readyplayer.me')) {
        document.getElementById('avatar-frame').style.display = 'none';
        loader.load(e.data, (gltf) => {
            if (model) scene.remove(model);
            model = gltf.scene; scene.add(model);
            model.traverse(o => { if (o.morphTargetDictionary) headMesh = o; });
            document.getElementById('talkBtn').style.display = 'block';
        });
    }
});

document.getElementById('setupBtn').onclick = () => document.getElementById('avatar-frame').style.display = 'block';

const talkBtn = document.getElementById('talkBtn');
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';

talkBtn.onclick = () => recognition.start();

recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const speech = new SpeechSynthesisUtterance(`لقد سمعتك تقول: ${text}. أنا نسختك الرقمية وأتفاعل معك الآن.`);
    speech.lang = 'ar-SA';
    
    speech.onboundary = (e) => {
        if (headMesh) {
            const jawIdx = headMesh.morphTargetDictionary['jawOpen'] || headMesh.morphTargetDictionary['mouthOpen'];
            headMesh.morphTargetInfluences[jawIdx] = 1;
            setTimeout(() => headMesh.morphTargetInfluences[jawIdx] = 0, 100);
        }
    };
    window.speechSynthesis.speak(speech);
};

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getElapsedTime();
    if (model) {
        const spine = model.getObjectByName('Spine2');
        if (spine) spine.rotation.x = Math.sin(delta * 1.5) * 0.02; // تنفس
        if (headMesh) { // رمش وعيون
            const blink = Math.sin(delta * 4) > 0.98 ? 1 : 0;
            headMesh.morphTargetInfluences[headMesh.morphTargetDictionary['eyeBlinkLeft']] = blink;
            headMesh.morphTargetInfluences[headMesh.morphTargetDictionary['eyeBlinkRight']] = blink;
        }
    }
    renderer.render(scene, camera);
}
init(); animate();
