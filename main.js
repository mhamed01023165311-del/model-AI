import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model, headMesh, clock = new THREE.Clock();
const loader = new GLTFLoader();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    
    // تعديل الكاميرا عشان تجيب الجسم كله (Full Body View)
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.2, 3); // رجعنا الكاميرا لورا (3) ونزلناها لمستوى الجسم (1.2)

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
            model.traverse(o => { if (o.morphTargetDictionary) headMesh = o; });
            document.getElementById('talkBtn').style.display = 'block';
        });
    }
});

document.getElementById('setupBtn').onclick = () => document.getElementById('avatar-frame').style.display = 'block';

// --- محرك الكلام المعدل (حركة شفايف + صوت سيري) ---
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';

document.getElementById('talkBtn').onclick = () => recognition.start();

recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const speech = new SpeechSynthesisUtterance(`لقد سمعتك تقول ${text}. أنا هنا لمساعدتك.`);
    
    // 1. تثبيت الصوت (محاكاة صوت سيري)
    const voices = window.speechSynthesis.getVoices();
    // بنحاول نلاقي صوت أنثوي ناعم
    speech.voice = voices.find(v => v.name.includes('Google') || v.name.includes('Female')) || voices[0];
    speech.lang = 'ar-SA';
    speech.pitch = 1.2; // تعلية الطبقة شوية عشان يبان ذكاء اصطناعي ناعم
    speech.rate = 0.9;  // سرعة هادية

    // 2. حركة الشفايف المتزامنة
    speech.onboundary = (e) => {
        if (headMesh) {
            const jawIdx = headMesh.morphTargetDictionary['jawOpen'] || headMesh.morphTargetDictionary['mouthOpen'];
            // الحركة هنا بقت عشوائية سريعة أثناء الكلام عشان تبان طبيعية أكتر
            headMesh.morphTargetInfluences[jawIdx] = Math.random() * 0.8 + 0.2; 
            setTimeout(() => { if(headMesh) headMesh.morphTargetInfluences[jawIdx] = 0; }, 80);
        }
    };

    speech.onend = () => {
        if (headMesh) {
            const jawIdx = headMesh.morphTargetDictionary['jawOpen'] || headMesh.morphTargetDictionary['mouthOpen'];
            headMesh.morphTargetInfluences[jawIdx] = 0;
        }
    };

    window.speechSynthesis.speak(speech);
};

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (model) {
        // حركة الجسم (التنفس)
        const spine = model.getObjectByName('Spine2');
        if (spine) spine.rotation.x = Math.sin(t * 1.5) * 0.02;

        // حركة الإيد (Natural Sway) - المجسم هيفضل يتحرك كأنه حي
        const leftArm = model.getObjectByName('LeftArm');
        const rightArm = model.getObjectByName('RightArm');
        if(leftArm) leftArm.rotation.z = Math.sin(t) * 0.05 + 0.1;
        if(rightArm) rightArm.rotation.z = -Math.sin(t) * 0.05 - 0.1;

        // رمش العيون
        if (headMesh) {
            const blink = Math.sin(t * 4) > 0.98 ? 1 : 0;
            headMesh.morphTargetInfluences[headMesh.morphTargetDictionary['eyeBlinkLeft']] = blink;
            headMesh.morphTargetInfluences[headMesh.morphTargetDictionary['eyeBlinkRight']] = blink;
        }
    }
    renderer.render(scene, camera);
}
init(); animate();
