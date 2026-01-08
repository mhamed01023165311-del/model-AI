import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

let scene, camera, renderer, model, headMesh, clock = new THREE.Clock();
const loader = new FBXLoader();
const loadingInfo = document.getElementById('loader-info');

// 1. إعداد المشهد
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 3.5); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(2, 5, 2);
    scene.add(dirLight);

    // تحميل ملفك الـ FBX الخاص بك
    loader.load('models/Stylized_Paladin.fbx', 
        (object) => {
            model = object;
            // تصغير الحجم لأن ملفات FBX تكون عملاقة أحياناً
            model.scale.set(0.01, 0.01, 0.01); 
            model.position.y = -1.2;
            scene.add(model);
            loadingInfo.style.display = 'none';

            model.traverse(child => {
                if (child.isMesh && child.morphTargetDictionary) headMesh = child;
            });
            console.log("المجسم جاهز!");
        }, 
        (xhr) => {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            loadingInfo.innerText = "جاري تحميل المجسم: " + percent + "%";
        }, 
        (err) => {
            loadingInfo.innerText = "خطأ في تحميل الموديل!";
            console.error(err);
        }
    );
}

// 2. محرك الكلام ولغة الإشارة
const talkBtn = document.getElementById('talkBtn');
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';

talkBtn.onclick = () => {
    recognition.start();
    talkBtn.innerText = "أنا أسمعك...";
};

recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'ar-SA';

    speech.onboundary = () => {
        if (model) {
            // تحريك عظام الأصابع واليدين كأنها لغة إشارة
            model.traverse(o => {
                if (o.isBone && (o.name.includes('Finger') || o.name.includes('Hand'))) {
                    o.rotation.z = (Math.random() - 0.5) * 0.6;
                    o.rotation.x = (Math.random() - 0.5) * 0.4;
                }
            });
            // تمايل الجسم بالكامل مع الكلام
            model.rotation.y = Math.sin(Date.now() * 0.005) * 0.2;
            
            // تحريك الشفايف (لو الموديل يدعم Morph Targets)
            if (headMesh) {
                const jaw = headMesh.morphTargetDictionary['jawOpen'] || 0;
                headMesh.morphTargetInfluences[jaw] = Math.random();
            }
        }
    };

    speech.onend = () => {
        talkBtn.innerText = "تحدث مرة أخرى";
        if (model) model.rotation.y = 0;
    };

    window.speechSynthesis.speak(speech);
};

// 3. التحريك المستمر (التنفس)
function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (model) {
        const spine = model.getObjectByName('Spine2');
        if (spine) spine.rotation.x = Math.sin(t * 1.5) * 0.03;
    }
    renderer.render(scene, camera);
}

init();
animate();
