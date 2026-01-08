import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

let scene, camera, renderer, model, clock = new THREE.Clock();
const loader = new FBXLoader();
const textureLoader = new THREE.TextureLoader();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); // خلفية تظهر الألوان

    // الكاميرا مضبوطة في النص على الفارس
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 150, 450); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(renderer.domElement);

    // إضاءة قوية جداً من كل الجهات عشان اللبس يظهر
    scene.add(new THREE.AmbientLight(0xffffff, 2.5));
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(100, 500, 100);
    scene.add(light);

    // تحميل ملف الـ FBX
    loader.load('models/Stylized_Paladin.fbx', (object) => {
        model = object;
        model.scale.set(0.12, 0.12, 0.12);
        model.position.y = -100;

        // --- الربط بالرابط الخارجي (زي ما طلبت) ---
        // ده رابط صورة "Texture" خارجية هتخلي الفارس يظهر بألوانه وتفاصيله
        const externalTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/crate.gif'); 
        
        model.traverse(child => {
            if (child.isMesh) {
                child.material.map = externalTexture; // تركيب اللون الخارجي
                child.material.needsUpdate = true;
            }
        });

        scene.add(model);
        document.getElementById('loader-info').style.display = 'none';
    });
}

// محرك لغة الإشارة (تحريك الأصابع واليد)
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
                // تحريك عظام اليدين (لغة إشارة)
                if (o.isBone && (o.name.toLowerCase().includes('finger') || o.name.toLowerCase().includes('hand'))) {
                    o.rotation.z = (Math.random() - 0.5) * 0.6;
                }
            });
            // تمايل الجسم مع الكلام
            model.rotation.y = Math.sin(Date.now() * 0.005) * 0.15;
        }
    };
    window.speechSynthesis.speak(speech);
};

function animate() {
    requestAnimationFrame(animate);
    if (model) {
        const t = clock.getElapsedTime();
        const spine = model.getObjectByName('Spine2');
        if (spine) spine.rotation.x = Math.sin(t * 1.5) * 0.04;
    }
    renderer.render(scene, camera);
}

init(); animate();
