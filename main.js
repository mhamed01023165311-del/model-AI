import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model, headMesh, clock = new THREE.Clock();
const loader = new GLTFLoader();
let analyser, dataArray; // لتحليل الصوت وتحريك الشفايف بدقة

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    
    // ضبط الكاميرا لتجيب الجسم كله من بعيد
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 4); // المسافة 4 تجلب الجسم كاملاً

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    scene.add(new THREE.AmbientLight(0xffffff, 1), new THREE.DirectionalLight(0xffffff, 2));
}

// استقبال الأفاتار (تأكد انك ترفع صورتك في النافذة اللي هتفتح)
window.addEventListener('message', (e) => {
    if (typeof e.data === 'string' && e.data.startsWith('https://models.readyplayer.me')) {
        document.getElementById('avatar-frame').style.display = 'none';
        loader.load(e.data, (gltf) => {
            if (model) scene.remove(model);
            model = gltf.scene; 
            scene.add(model);
            model.position.y = -1; // وضع القدم على الأرض
            model.traverse(o => { if (o.morphTargetDictionary) headMesh = o; });
            document.getElementById('talkBtn').style.display = 'block';
        });
    }
});

document.getElementById('setupBtn').onclick = () => document.getElementById('avatar-frame').style.display = 'block';

// --- محرك تحريك الشفايف بناءً على "ذبذبات" الصوت الحقيقية ---
const talkBtn = document.getElementById('talkBtn');

function playWithLipSync(audioUrl) {
    const audio = new Audio(audioUrl);
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 64;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    audio.play();

    function updateMouth() {
        if (!audio.paused) {
            analyser.getByteFrequencyData(dataArray);
            // حساب قوة الصوت (Volume)
            let volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
            
            if (headMesh) {
                const jawIdx = headMesh.morphTargetDictionary['jawOpen'] || headMesh.morphTargetDictionary['mouthOpen'];
                // تحريك الفم بناءً على قوة الصوت فعلياً
                headMesh.morphTargetInfluences[jawIdx] = volume / 60; 
            }
            requestAnimationFrame(updateMouth);
        } else if (headMesh) {
            const jawIdx = headMesh.morphTargetDictionary['jawOpen'] || headMesh.morphTargetDictionary['mouthOpen'];
            headMesh.morphTargetInfluences[jawIdx] = 0;
        }
    }
    updateMouth();
}

// تسجيل الصوت وإرساله (للتجربة حالياً سيقوم بصدى لصوتك)
talkBtn.onclick = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'ar-SA';
    recognition.start();
    talkBtn.innerText = "جاري تسجيل صوتك...";

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        // هنا يمكنك ربط ElevenLabs لتقليد صوتك، حالياً سنستخدم الرد الصوتي للمتصفح مع LipSync
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'ar-SA';
        
        // تشغيل ميزة LipSync
        window.speechSynthesis.speak(msg);
        
        // محاكاة تحريك الفم مع النطق
        const interval = setInterval(() => {
            if (window.speechSynthesis.speaking) {
                if (headMesh) {
                    const jawIdx = headMesh.morphTargetDictionary['jawOpen'] || headMesh.morphTargetDictionary['mouthOpen'];
                    headMesh.morphTargetInfluences[jawIdx] = Math.random() * 0.8;
                }
            } else {
                clearInterval(interval);
                if (headMesh) headMesh.morphTargetInfluences[headMesh.morphTargetDictionary['jawOpen']] = 0;
                talkBtn.innerText = "تحدث مرة أخرى";
            }
        }, 100);
    };
};

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (model) {
        // تنفس وحركة جسم كامل
        const spine = model.getObjectByName('Spine2');
        if (spine) spine.rotation.x = Math.sin(t * 1.5) * 0.03;
        
        // تحريك اليدين بشكل طبيعي
        const lArm = model.getObjectByName('LeftArm');
        const rArm = model.getObjectByName('RightArm');
        if(lArm) lArm.rotation.z = Math.sin(t) * 0.1 + 0.2;
        if(rArm) rArm.rotation.z = -Math.sin(t) * 0.1 - 0.2;
    }
    renderer.render(scene, camera);
}
init(); animate();
