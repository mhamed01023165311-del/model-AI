import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model, headMesh, clock = new THREE.Clock();
const loader = new GLTFLoader();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 3.5); // زاوية تجيب الجسم كله

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 1), new THREE.DirectionalLight(0xffffff, 2));
}

window.addEventListener('message', (e) => {
    if (typeof e.data === 'string' && e.data.startsWith('https://models.readyplayer.me')) {
        document.getElementById('avatar-frame').style.display = 'none';
        loader.load(e.data, (gltf) => {
            if (model) scene.remove(model);
            model = gltf.scene; 
            scene.add(model);
            model.position.y = -1; 
            model.traverse(o => { if (o.morphTargetDictionary) headMesh = o; });
            document.getElementById('talkBtn').style.display = 'block';
        });
    }
});

document.getElementById('setupBtn').onclick = () => document.getElementById('avatar-frame').style.display = 'block';

// --- محرك الكلام والحركة التفاعلية ---
const talkBtn = document.getElementById('talkBtn');
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';

talkBtn.onclick = () => recognition.start();

recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const speech = new SpeechSynthesisUtterance(text);
    
    // ضبط أفضل صوت عربي متاح في جهازك
    const voices = window.speechSynthesis.getVoices();
    speech.voice = voices.find(v => v.lang.includes('ar')) || voices[0];
    speech.pitch = 1.1; // نبرة صوت طبيعية
    speech.rate = 0.9;  // سرعة متزنة

    speech.onstart = () => { talkBtn.innerText = "نسختك تتحدث الآن..."; };
    
    speech.onboundary = (e) => {
        if (headMesh) {
            const jawIdx = headMesh.morphTargetDictionary['jawOpen'] || headMesh.morphTargetDictionary['mouthOpen'];
            headMesh.morphTargetInfluences[jawIdx] = 1; 
            setTimeout(() => { if(headMesh) headMesh.morphTargetInfluences[jawIdx] = 0; }, 100);
        }
        // إضافة حركة عشوائية للجسم مع كل كلمة (يمين وشمال)
        if (model) {
            model.rotation.y = (Math.random() - 0.5) * 0.2; // يميل يمين وشمال
            const spine = model.getObjectByName('Spine2');
            if (spine) spine.rotation.z = (Math.random() - 0.5) * 0.1; // هزة كتف
        }
    };

    speech.onend = () => {
        talkBtn.innerText = "تحدث مرة أخرى";
        if (model) { model.rotation.y = 0; } // الرجوع للوضع الطبيعي
    };

    window.speechSynthesis.speak(speech);
};

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (model) {
        // حركة التنفس الطبيعية
        const spine = model.getObjectByName('Spine2');
        if (spine) spine.rotation.x = Math.sin(t * 1.5) * 0.03;

        // حركة الإيد المستمرة (Gesticulation)
        const lArm = model.getObjectByName('LeftArm');
        const rArm = model.getObjectByName('RightArm');
        if(lArm) lArm.rotation.z = Math.sin(t * 2) * 0.1 + 0.3;
        if(rArm) rArm.rotation.z = -Math.sin(t * 2) * 0.1 - 0.3;

        // حركة رمش العيون
        if (headMesh) {
            const blink = Math.sin(t * 4) > 0.98 ? 1 : 0;
            headMesh.morphTargetInfluences[headMesh.morphTargetDictionary['eyeBlinkLeft']] = blink;
            headMesh.morphTargetInfluences[headMesh.morphTargetDictionary['eyeBlinkRight']] = blink;
        }
    }
    renderer.render(scene, camera);
}
init(); animate();
