import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model, headMesh, clock = new THREE.Clock();
const loader = new GLTFLoader();

// 1. تشغيل المشهد
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 1), new THREE.DirectionalLight(0xffffff, 2));
    camera.position.set(0, 1.6, 0.7);
}

// 2. معالجة المجسم
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

// 3. السمع وتحريك الفم
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';

document.getElementById('talkBtn').onclick = () => recognition.start();

recognition.onresult = async (event) => {
    const text = event.results[0][0].transcript;
    const res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    const audio = new Audio(data.audioUrl + "?t=" + Date.now());
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser); analyser.connect(ctx.destination);
    audio.play();

    function sync() {
        if (!audio.paused) {
            const d = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(d);
            let v = d.reduce((a, b) => a + b) / d.length;
            if (headMesh) {
                const i = headMesh.morphTargetDictionary['jawOpen'] || headMesh.morphTargetDictionary['mouthOpen'];
                headMesh.morphTargetInfluences[i] = v / 50;
            }
            requestAnimationFrame(sync);
        }
    }
    sync();
};

// 4. التحريك التلقائي (تنفس + عيون + مفاصل)
function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (model) {
        const spine = model.getObjectByName('Spine2');
        if (spine) spine.rotation.x = Math.sin(t * 1.5) * 0.02; // تنفس
        if (headMesh) { // رمش
            const b = Math.sin(t * 4) > 0.98 ? 1 : 0;
            headMesh.morphTargetInfluences[headMesh.morphTargetDictionary['eyeBlinkLeft']] = b;
            headMesh.morphTargetInfluences[headMesh.morphTargetDictionary['eyeBlinkRight']] = b;
        }
        model.traverse(o => { if (o.name.includes('Hand') && o.isBone) o.rotation.z += Math.sin(t * 2) * 0.001; });
    }
    renderer.render(scene, camera);
}
init(); animate();
