import * as THREE from 'three';
import { FBXLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/FBXLoader.js';

let scene, camera, renderer, model, mixer, headMesh, clock = new THREE.Clock();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 3); // زاوية قريبة للجسم كله

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    scene.add(light);

    // تحميل مجسم الـ FBX الخاص بك من مجلد models
    const loader = new FBXLoader();
    loader.load('models/Stylized_Paladin.fbx', (object) => {
        model = object;
        model.scale.set(0.01, 0.01, 0.01); // ضبط الحجم لو طلع كبير
        model.position.y = -1;
        scene.add(model);
        
        // البحث عن عظام الوجه والأصابع للتحريك
        model.traverse(child => {
            if (child.isMesh && child.morphTargetDictionary) headMesh = child;
        });
        
        console.log("المجسم جاهز للعمل!");
    }, undefined, (error) => {
        console.error("حدث خطأ في تحميل المجسم: ", error);
    });
}

// --- محرك الكلام ولغة الإشارة المتقدمة ---
const talkBtn = document.querySelector('button'); // زر "تكلم" الظاهر في صورتك
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';

talkBtn.onclick = () => recognition.start();

recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'ar-SA';
    speech.rate = 0.85; // صوت رزين

    speech.onboundary = (e) => {
        // 1. تحريك الفم والتعبيرات (لو المجسم يدعم MorphTargets)
        if (headMesh) {
            const jaw = headMesh.morphTargetDictionary['jawOpen'] || 0;
            headMesh.morphTargetInfluences[jaw] = Math.random();
        }

        // 2. لغة الإشارة (تحريك الأصابع واليدين بشكل حي)
        if (model) {
            model.traverse(o => {
                if (o.isBone && (o.name.includes('Finger') || o.name.includes('Hand'))) {
                    o.rotation.y = (Math.random() - 0.5) * 0.4;
                    o.rotation.z = (Math.random() - 0.5) * 0.4;
                }
            });
            // حركة الجسم يميناً ويساراً مع الكلام
            model.rotation.y = Math.sin(Date.now() * 0.005) * 0.2;
        }
    };

    speech.onend = () => {
        if (model) model.rotation.y = 0;
    };

    window.speechSynthesis.speak(speech);
};

function animate() {
    requestAnimationFrame(animate);
    if (model) {
        // حركة تنفس طبيعية
        const t = clock.getElapsedTime();
        model.position.y = -1 + Math.sin(t * 1.5) * 0.01;
    }
    renderer.render(scene, camera);
}

init();
animate();
