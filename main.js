import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model, headMesh, clock = new THREE.Clock();
const loader = new GLTFLoader();

// 1. تهيئة المشهد والإضاءة
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.6, 0.7);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(2, 2, 5);
    scene.add(dirLight);
}

// 2. معالجة رابط المجسم القادم من Ready Player Me
window.addEventListener('message', (event) => {
    const url = event.data;
    if (typeof url === 'string' && url.startsWith('https://models.readyplayer.me')) {
        document.getElementById('avatar-frame').style.display = 'none';
        loadAvatar(url);
    }
});

function loadAvatar(url) {
    loader.load(url, (gltf) => {
        if (model) scene.remove(model);
        model = gltf.scene;
        scene.add(model);
        
        model.traverse(o => {
            if (o.morphTargetDictionary) headMesh = o;
        });
        
        document.getElementById('talkBtn').style.display = 'block';
    });
}

document.getElementById('setupBtn').onclick = () => {
    document.getElementById('avatar-frame').style.display = 'block';
};

// 3. محرك الكلام والتعرف على الصوت (بدون بايثون)
const talkBtn = document.getElementById('talkBtn');
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';

talkBtn.onclick = () => {
    recognition.start();
    talkBtn.innerText = "جاري الاستماع...";
};

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    talkBtn.innerText = "نسختك ترد عليك...";
    
    const reply = `أهلاً بك، لقد سمعتك تقول: ${transcript}. أنا نسختك الرقمية وأتفاعل معك الآن.`;
    speakAndAnimate(reply);
};

function speakAndAnimate(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'ar-SA';
    speech.rate = 1.0;

    // محاكاة حركة الفم أثناء الكلام
    speech.onboundary = (event) => {
        if (headMesh) {
            const jawIdx = headMesh.morphTargetDictionary['jawOpen'] || headMesh.morphTargetDictionary['mouthOpen'];
            headMesh.morphTargetInfluences[jawIdx] = 1;
            setTimeout(() => headMesh.morphTargetInfluences[jawIdx] = 0, 100);
        }
    };

    speech.onend = () => {
        talkBtn.innerText = "ابدأ التحدث الآن";
        if (headMesh) {
            const jawIdx = headMesh.morphTargetDictionary['jawOpen'] || headMesh.morphTargetDictionary['mouthOpen'];
            headMesh.morphTargetInfluences[jawIdx] = 0;
        }
    };

    window.speechSynthesis.speak(speech);
}

// 4. حلقة التحريك المستمر (تنفس، رمش، مفاصل)
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getElapsedTime();

    if (model) {
        // تنفس الصدر
        const spine = model.getObjectByName('Spine2');
        if (spine) spine.rotation.x = Math.sin(delta * 1.5) * 0.02;

        // رمش العيون التلقائي
        if (headMesh) {
            const blink = Math.sin(delta * 4) > 0.98 ? 1 : 0;
            const bLeft = headMesh.morphTargetDictionary['eyeBlinkLeft'];
            const bRight = headMesh.morphTargetDictionary['eyeBlinkRight'];
            headMesh.morphTargetInfluences[bLeft] = blink;
            headMesh.morphTargetInfluences[bRight] = blink;
        }

        // حركة أصابع خفيفة (تفاعل طبيعي)
        model.traverse(o => {
            if (o.isBone && o.name.includes('Hand')) {
                o.rotation.y += Math.sin(delta * 2) * 0.0005;
            }
        });
    }
    
    renderer.render(scene, camera);
}

init();
animate();

// ضبط الحجم عند تغيير نافذة المتصفح
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
