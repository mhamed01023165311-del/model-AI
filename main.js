import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model, headMesh;
const loader = new GLTFLoader();

// إعداد المشهد الأساسي
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
    scene.add(light);
    camera.position.set(0, 1.6, 0.7); // تقريب الكاميرا للوجه جداً
}

// وظيفة تحميل المجسم الجديد
function loadAvatar(url) {
    if (model) scene.remove(model); // حذف المجسم القديم إن وجد
    
    loader.load(url, (gltf) => {
        model = gltf.scene;
        scene.add(model);
        
        model.traverse(o => {
            if (o.morphTargetDictionary) headMesh = o;
        });
        document.getElementById('talkBtn').style.display = 'inline-block';
    });
}

// استقبال البيانات من نافذة التصوير
window.addEventListener('message', (event) => {
    const url = event.data;
    if (url && url.toString().startsWith('https://models.readyplayer.me')) {
        document.getElementById('avatar-frame').style.display = 'none';
        loadAvatar(url);
    }
});

document.getElementById('createBtn').onclick = () => {
    document.getElementById('avatar-frame').style.display = 'block';
};

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;
    if (model) {
        // 1. تنفس دقيق (حركة الصدر والكتف)
        const spine = model.getObjectByName('Spine2');
        if (spine) spine.rotation.x = Math.sin(time * 1.5) * 0.02;

        // 2. رمش العيون
        if (headMesh) {
            const blinkIdx = headMesh.morphTargetDictionary['eyeBlinkLeft'];
            headMesh.morphTargetInfluences[blinkIdx] = Math.sin(time * 4) > 0.98 ? 1 : 0;
        }
    }
    renderer.render(scene, camera);
}

init();
animate();
