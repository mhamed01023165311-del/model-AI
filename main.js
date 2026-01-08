import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model, headMesh, clock = new THREE.Clock();
const loader = new GLTFLoader();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    // تقريب المسافة قليلاً لتفاصيل لغة الجسد
    camera.position.set(0, 1.3, 2.8); 

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(0, 5, 5);
    scene.add(spotLight);
}

// رابط الأفاتار - تأكد من الضغط على (+) لرفع صورتك
document.getElementById('setupBtn').onclick = () => {
    const frame = document.getElementById('avatar-frame');
    frame.src = "https://demo.readyplayer.me/avatar?frameApi";
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

// --- محرك لغة الإشارة والتعبيرات الاحترافية ---
const talkBtn = document.getElementById('talkBtn');
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';

talkBtn.onclick = () => recognition.start();

recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'ar-SA';
    speech.rate = 0.85;

    speech.onboundary = (e) => {
        if (headMesh) {
            // 1. حركة الفم العميقة
            const jawIdx = headMesh.morphTargetDictionary['jawOpen'];
            headMesh.morphTargetInfluences[jawIdx] = 0.8 + Math.random() * 0.2;
            
            // 2. تعبيرات "التركيز" (تضييق العين ورفع الحاجب)
            const squint = headMesh.morphTargetDictionary['eyeSquintLeft'];
            const brow = headMesh.morphTargetDictionary['browInnerUp'];
            headMesh.morphTargetInfluences[squint] = 0.5;
            headMesh.morphTargetInfluences[brow] = 0.7;

            setTimeout(() => {
                headMesh.morphTargetInfluences[jawIdx] = 0;
                headMesh.morphTargetInfluences[squint] = 0;
                headMesh.morphTargetInfluences[brow] = 0;
            }, 120);
        }

        // 3. لغة الإشارة (تحريك الأصابع والرسغ بشكل معقد)
        if (model) {
            model.traverse(o => {
                if (o.isBone && o.name.includes('Finger')) {
                    o.rotation.x = Math.sin(Date.now() * 0.01) * 0.4;
                }
                if (o.isBone && o.name.includes('Hand')) {
                    o.rotation.y = (Math.random() - 0.5) * 0.6;
                }
            });
            // تمايل الجسم بالكامل يميناً ويساراً بسلاسة
            model.rotation.y = Math.sin(Date.now() * 0.002) * 0.15;
        }
    };

    window.speechSynthesis.speak(speech);
};

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (model) {
        // حركة "الحياة" المستمرة حتى في حالة الصمت
        const spine = model.getObjectByName('Spine2');
        if (spine) {
            spine.rotation.x = Math.sin(t * 1.2) * 0.03; // تنفس
            spine.rotation.y = Math.cos(t * 0.5) * 0.02; // تمايل بسيط
        }
        
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
