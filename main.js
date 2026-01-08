import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model, headMesh, clock = new THREE.Clock();
const loader = new GLTFLoader();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    
    // --- تعديل جذري للكاميرا لتظهر الجسم كاملاً ---
    // القيمة الثالثة (5) تعني أننا أبعدنا الكاميرا جداً للخلف لتأكيد ظهور الأرجل والأيدي
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.0, 5); 

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
            
            // ضبط مكان المجسم ليكون في المنتصف تماماً
            model.position.y = -1; 

            model.traverse(o => { 
                if (o.morphTargetDictionary) headMesh = o; 
            });
            document.getElementById('talkBtn').style.display = 'block';
        });
    }
});

document.getElementById('setupBtn').onclick = () => document.getElementById('avatar-frame').style.display = 'block';

// --- ضبط الصوت (سيري) وتحريك الشفايف ---
const talkBtn = document.getElementById('talkBtn');
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';

talkBtn.onclick = () => recognition.start();

recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const speech = new SpeechSynthesisUtterance(`لقد سمعتك تقول ${text}. كيف يمكنني مساعدتك؟`);
    
    // محاولة اختيار صوت ناعم (سيري)
    const voices = window.speechSynthesis.getVoices();
    // البحث عن صوت نسائي عربي أو صوت جوجل الناعم
    speech.voice = voices.find(v => v.lang.includes('ar') && (v.name.includes('Female') || v.name.includes('Google'))) || voices[0];
    speech.pitch = 1.3; // جعل الصوت أنعم وأرفع
    speech.rate = 1.0;

    // تحريك الشفايف المتزامن مع ذبذبات الكلمات
    speech.onboundary = (e) => {
        if (headMesh) {
            const jawIdx = headMesh.morphTargetDictionary['jawOpen'] || headMesh.morphTargetDictionary['mouthOpen'];
            // حركة شفايف قوية وواضحة
            headMesh.morphTargetInfluences[jawIdx] = 1.0; 
            setTimeout(() => { if(headMesh) headMesh.morphTargetInfluences[jawIdx] = 0; }, 100);
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
        // 1. حركة تنفس الصدر
        const spine = model.getObjectByName('Spine2');
        if (spine) spine.rotation.x = Math.sin(t * 1.5) * 0.03;

        // 2. حركة الأذرع والأيدي (لإظهار الحيوية في الجسم كامل)
        const leftArm = model.getObjectByName('LeftArm');
        const rightArm = model.getObjectByName('RightArm');
        if(leftArm) leftArm.rotation.z = Math.sin(t) * 0.1 + 0.2;
        if(rightArm) rightArm.rotation.z = -Math.sin(t) * 0.1 - 0.2;

        // 3. رمش العيون
        if (headMesh) {
            const blink = Math.sin(t * 4) > 0.98 ? 1 : 0;
            headMesh.morphTargetInfluences[headMesh.morphTargetDictionary['eyeBlinkLeft']] = blink;
            headMesh.morphTargetInfluences[headMesh.morphTargetDictionary['eyeBlinkRight']] = blink;
        }
    }
    renderer.render(scene, camera);
}
init(); animate();
