import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model, headMesh, mixer;
const clock = new THREE.Clock();
const loader = new GLTFLoader();

// ================= INIT =================
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.4, 2.8);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.3));

    const light = new THREE.SpotLight(0xffffff, 1);
    light.position.set(0, 5, 5);
    scene.add(light);

    window.addEventListener('resize', onResize);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ================= READY PLAYER ME =================
document.getElementById('setupBtn').onclick = () => {
    const frame = document.getElementById('avatar-frame');
    frame.src =
        "https://demo.readyplayer.me/avatar?frameApi&clearCache&bodyType=fullbody";
    frame.style.display = 'block';
};

window.addEventListener('message', (e) => {
    if (typeof e.data === 'string' && e.data.includes('models.readyplayer.me')) {
        document.getElementById('avatar-frame').style.display = 'none';

        loader.load(e.data, (gltf) => {
            if (model) scene.remove(model);

            model = gltf.scene;
            model.position.y = -1;
            scene.add(model);

            mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
                mixer.clipAction(clip).play();
            });

            model.traverse((o) => {
                if (o.morphTargetDictionary && o.name.toLowerCase().includes('head')) {
                    headMesh = o;
                }
            });

            document.getElementById('talkBtn').style.display = 'block';
        });
    }
});

// ================= SPEECH =================
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';

function getArabicVoice() {
    return speechSynthesis
        .getVoices()
        .find(v => v.lang.startsWith('ar') && v.name.toLowerCase().includes('google'));
}

document.getElementById('talkBtn').onclick = () => recognition.start();

recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'ar-SA';
    speech.voice = getArabicVoice();
    speech.rate = 0.9;
    speech.pitch = 1;

    speech.onboundary = (ev) => {
        lipSync(text, ev.charIndex);
        bodyGesture();
    };

    window.speechSynthesis.speak(speech);
};

// ================= LIP SYNC =================
function lipSync(text, index) {
    if (!headMesh) return;

    const dict = headMesh.morphTargetDictionary;
    const inf = headMesh.morphTargetInfluences;

    const map = {
        'ا': 'jawOpen',
        'م': 'mouthClose',
        'ب': 'mouthSmile',
        'ف': 'mouthFunnel',
        'و': 'mouthPucker'
    };

    const char = text[index];
    const target = map[char];

    if (target && dict[target] !== undefined) {
        inf[dict[target]] = 1;
        setTimeout(() => (inf[dict[target]] = 0), 120);
    }
}

// ================= BODY GESTURES =================
function bodyGesture() {
    if (!model) return;

    model.traverse((o) => {
        if (o.isBone) {
            if (o.name.includes('Hand')) {
                o.rotation.z = Math.sin(Date.now() * 0.01) * 0.6;
            }
            if (o.name.includes('Finger')) {
                o.rotation.x = Math.sin(Date.now() * 0.015) * 0.4;
            }
        }
    });

    model.rotation.y = Math.sin(Date.now() * 0.002) * 0.2;
}

// ================= ANIMATE =================
function animate() {
    requestAnimationFrame(animate);

    const t = clock.getElapsedTime();
    if (mixer) mixer.update(clock.getDelta());

    if (model) {
        const spine = model.getObjectByName('Spine2');
        const hips = model.getObjectByName('Hips');

        if (spine) spine.rotation.x = Math.sin(t * 1.2) * 0.04;
        if (hips) hips.position.y = Math.sin(t * 1.1) * 0.015;
    }

    if (headMesh) {
        const dict = headMesh.morphTargetDictionary;
        const inf = headMesh.morphTargetInfluences;

        const blink =
            Math.sin(t * 3 + Math.random()) > 0.97 ? 1 : 0;

        if (dict.eyeBlinkLeft !== undefined)
            inf[dict.eyeBlinkLeft] = blink;
        if (dict.eyeBlinkRight !== undefined)
            inf[dict.eyeBlinkRight] = blink;
    }

    renderer.render(scene, camera);
}

init();
animate();
