import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

let scene, camera, renderer, model, headMesh, clock = new THREE.Clock();
const loader = new FBXLoader();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    // 1. الكاميرا هنا مضبوطة عشان تجيب المجسم الكبير من بعيد
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, 200, 600); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(100, 500, 100);
    scene.add(light);

    // تحميل الملفStylized_Paladin.fbx
    loader.load('models/Stylized_Paladin.fbx', (object) => {
        model = object;
        
        // 2. السر هنا: تصغير الموديل لـ 1% من حجمه عشان يبان طبيعي في المتصفح
        model.scale.set(0.1, 0.1, 0.1); 
        model.position.y = -100;
        scene.add(model);
        
        document.getElementById('loader-info').style.display = 'none';

        // الكاميرا هتبص على نص المجسم بالضبط
        const box = new THREE.Box3().setFromObject(model);
        camera.lookAt(box.getCenter(new THREE.Vector3()));
        
        console.log("البالادين جاهز!");
    }, (xhr) => {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        document.getElementById('loader-info').innerText = "جاري التحميل: " + percent + "%";
    });
}

// محرك لغة الإشارة (تحريك الأصابع بناءً على بنية العظام في ملفك)
const talkBtn = document.getElementById('talkBtn');
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';

talkBtn.onclick = () => recognition.start();

recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'ar-SA';

    speech.onboundary = () => {
        if (model) {
            model.traverse(o => {
                // البحث عن عظام الأصابع واليد في هيكل البالادين
                if (o.isBone && (o.name.includes('Finger') || o.name.includes('Hand') || o.name.includes('DEF'))) {
                    o.rotation.z = (Math.random() - 0.5) * 0.4;
                }
            });
            // حركة الجسم يمين وشمال
            model.rotation.y = Math.sin(Date.now() * 0.005) * 0.1;
        }
    };
    window.speechSynthesis.speak(speech);
};

function animate() {
    requestAnimationFrame(animate);
    if (model) {
        // حركة تنفس طبيعية
        const t = clock.getElapsedTime();
        model.position.y = -100 + Math.sin(t * 1.5) * 2;
    }
    renderer.render(scene, camera);
}

init();
animate();
