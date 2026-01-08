import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model, headMesh, clock = new THREE.Clock();
const loader = new GLTFLoader();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    // الكاميرا بعيدة عشان تشوف الجسم كله وحركة الإيد
    camera.position.set(0, 1.2, 4); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 1), new THREE.DirectionalLight(0xffffff, 2));
}

// تعديل الرابط لإجبار الكاميرا على الظهور
document.getElementById('setupBtn').onclick = () => {
    const frame = document.getElementById('avatar-frame');
    frame.src = "https://demo.readyplayer.me/avatar?frameApi&clearCache"; // تحديث الرابط لطلب الكاميرا
    frame.style.display = 'block';
};

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

// --- محرك الذكاء الاصطناعي للحركة والصوت الفخم ---
const talkBtn = document.getElementById('talkBtn');
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';

talkBtn.onclick = () => recognition.start();

recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const speech = new SpeechSynthesisUtterance(text);
    
    // محرك اختيار أفضل صوت عربي (رصين)
    const voices = window.speechSynthesis.getVoices();
    speech.voice = voices.find(v => v.lang.includes('ar') && (v.name.includes('Google') || v.name.includes('Maged'))) || voices.find(v => v.lang.includes('ar')) || voices[0];
    speech.pitch = 1.0; 
    speech.rate = 0.85; // سرعة هادية وفخمة

    speech.onboundary = (e) => {
        // 1. حركة الفم
        if (headMesh) {
            const jawIdx = headMesh.morphTargetDictionary['jawOpen'] || headMesh.morphTargetDictionary['mouthOpen'];
            headMesh.morphTargetInfluences[jawIdx] = 1.0; 
            setTimeout(() => { if(headMesh) headMesh.morphTargetInfluences[jawIdx] = 0; }, 70);
        }
        
        // 2. حركة الجسم كله (التفاعل مع الشاشة)
        if (model) {
            // المجسم بيلف جسمه يمين وشمال كأنه بيكلم حد
            model.rotation.y = Math.sin(Date.now() * 0.005) * 0.3; 
            
            // حركة مفاصل العمود الفقري (إيماءات)
            const spine = model.getObjectByName('Spine2');
            if (spine) spine.rotation.z = (Math.random() - 0.5) * 0.2;
            
            // حركة الإيد كأنه بيشرح (Gestures)
            const lArm = model.getObjectByName('LeftArm');
            const rArm = model.getObjectByName('RightArm');
            if(lArm) lArm.rotation.x = -0.8 + (Math.random() * 0.4);
            if(rArm) rArm.rotation.x = -0.8 + (Math.random() * 0.4);
        }
    };

    speech.onend = () => {
        if (model) {
            // العودة لوضع الثبات بعد الكلام
            model.rotation.y = 0;
            const arms = ['LeftArm', 'RightArm'];
            arms.forEach(name => {
                const arm = model.getObjectByName(name);
                if(arm) arm.rotation.x = 0;
            });
        }
        talkBtn.innerText = "ابدأ التحدث الآن";
    };

    window.speechSynthesis.speak(speech);
    talkBtn.innerText = "نسختك تتحدث الآن...";
};

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (model) {
        // حركة التنفس الطبيعية للجسم كله
        const spine = model.getObjectByName('Spine2');
        if (spine) spine.rotation.x = Math.sin(t * 1.5) * 0.04;

        // رمش العيون التلقائي
        if (headMesh) {
            const blink = Math.sin(t * 4) > 0.98 ? 1 : 0;
            const bLeft = headMesh.morphTargetDictionary['eyeBlinkLeft'];
            const bRight = headMesh.morphTargetDictionary['eyeBlinkRight'];
            headMesh.morphTargetInfluences[bLeft] = blink;
            headMesh.morphTargetInfluences[bRight] = blink;
        }
    }
    renderer.render(scene, camera);
}
init(); animate();
