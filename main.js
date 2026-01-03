import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1. إعداد المسرح
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. الإضاءة
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
scene.add(light);

// 3. تحميل المجسم (هنا سنضع المجسم الذي يشبه الشخص)
let model, headMesh, mixer;
const loader = new GLTFLoader();

// ملاحظة: استبدل هذا الرابط برابط مجسمك لاحقاً
loader.load('https://models.readyplayer.me/64c009383617185316335359.glb', (gltf) => {
    model = gltf.scene;
    scene.add(model);
    camera.position.set(0, 1.6, 2); // تركيز الكاميرا على الوجه
    
    model.traverse(o => {
        if (o.morphTargetDictionary) headMesh = o; // تحديد عضلات الوجه
    });
});

// 4. كود التنفس وحركة الوجه
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;

    if (model) {
        // تحريك الصدر (تنفس)
        const spine = model.getObjectByName('Spine2');
        if (spine) spine.rotation.x = Math.sin(time * 2) * 0.03;
        
        // رمش العيون تلقائياً
        if (headMesh) {
            const blink = Math.sin(time * 4) > 0.98 ? 1 : 0;
            const blinkIdx = headMesh.morphTargetDictionary['eyeBlinkLeft'];
            headMesh.morphTargetInfluences[blinkIdx] = blink;
        }
    }
    renderer.render(scene, camera);
}
animate();
