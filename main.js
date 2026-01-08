import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

let scene, camera, renderer, model, clock = new THREE.Clock();
const loader = new FBXLoader();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); // خلفية تبرز المجسم

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 200, 500); // وضعية افتراضية

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(renderer.domElement);

    // إضاءة قوية جداً من كل الزوايا لإظهار تفاصيل الـ FBX
    scene.add(new THREE.AmbientLight(0xffffff, 3)); 
    const pointLight = new THREE.PointLight(0xffffff, 2);
    pointLight.position.set(200, 500, 200);
    scene.add(pointLight);

    loader.load('models/Stylized_Paladin.fbx', (object) => {
        model = object;
        
        // ضبط الحجم والمكان
        model.scale.set(0.12, 0.12, 0.12); 
        model.position.y = -100;
        scene.add(model);

        // إظهار الموديل حتى لو الصور ناقصة (بإضافة لمعان معدني)
        model.traverse(child => {
            if (child.isMesh) {
                child.material.color.setHex(0xcccccc); // لون رمادي فاتح كالحديد
                child.material.shininess = 100;
            }
        });

        // زووم تلقائي على المجسم
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        camera.lookAt(center);

        document.getElementById('loader-info').style.display = 'none';
        console.log("البالادين جاهز للعمل");
    }, (xhr) => {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        document.getElementById('loader-info').innerText = "تحميل: " + percent + "%";
    });
}

// محرك الكلام وحركة اليدين
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
                // تحريك الأصابع والرسغ (لغة إشارة)
                if (o.isBone && (o.name.toLowerCase().includes('finger') || o.name.toLowerCase().includes('hand'))) {
                    o.rotation.y = (Math.random() - 0.5) * 0.7;
                    o.rotation.z = (Math.random() - 0.5) * 0.7;
                }
            });
            // تمايل الجسم بالكامل مع نبرة الصوت
            model.rotation.y = Math.sin(Date.now() * 0.005) * 0.2;
        }
    };

    window.speechSynthesis.speak(speech);
};

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (model) {
        // حركة "نبض الحياة" المستمرة
        const spine = model.getObjectByName('Spine2') || model.getObjectByName('Spine');
        if (spine) spine.rotation.x = Math.sin(t * 1.2) * 0.05;
    }
    renderer.render(scene, camera);
}

init(); animate();
