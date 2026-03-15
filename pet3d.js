// Setup Scene, Camera, and Renderer
const container = document.getElementById('pet-canvas-container');
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 5, 14);
camera.lookAt(0, 1.5, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// soft shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xffe6e6, 0.3);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

// Colors
const colorMain = 0xe6b87d;   // Soft Tan
const colorAccent = 0xfff3e3; // Cream
const colorEars = 0x8c6239;   // Warm Dark Brown
const colorDark = 0x3e2723;   // Very Dark Brown (Eyes/Nose)
const colorPink = 0xff8a80;   // Tongue/Blush

// Materials (using MeshStandardMaterial for softer look)
const matMain = new THREE.MeshStandardMaterial({ color: colorMain, roughness: 0.8, metalness: 0.1 });
const matAccent = new THREE.MeshStandardMaterial({ color: colorAccent, roughness: 0.8, metalness: 0.1 });
const matEars = new THREE.MeshStandardMaterial({ color: colorEars, roughness: 0.9, metalness: 0.1 });
const matDark = new THREE.MeshStandardMaterial({ color: colorDark, roughness: 0.4, metalness: 0.1 });
const matPink = new THREE.MeshStandardMaterial({ color: colorPink, roughness: 0.6, metalness: 0.1 });

// Dog Construction
const dogGroup = new THREE.Group();
scene.add(dogGroup);

// Utility for creating spheres
function createSphere(r, mat) {
    const geo = new THREE.SphereGeometry(r, 32, 32);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// --- Body ---
const body = createSphere(1.6, matMain);
// Scale to make it pill/bean shaped
body.scale.set(0.9, 0.85, 1.2);
body.position.y = 1.3;
dogGroup.add(body);

const belly = createSphere(1.4, matAccent);
belly.scale.set(0.8, 0.8, 1.15);
belly.position.set(0, 1.1, 0.2);
dogGroup.add(belly);

// --- Head ---
const headGroup = new THREE.Group();
headGroup.position.set(0, 2.8, 1.2);
dogGroup.add(headGroup);

const head = createSphere(1.5, matMain);
// Slightly wide and squished
head.scale.set(1.1, 0.95, 1.0);
headGroup.add(head);

// Snout (Muzzle)
const snout = createSphere(0.7, matAccent);
snout.scale.set(1.2, 0.8, 1.0);
snout.position.set(0, -0.2, 1.3);
headGroup.add(snout);

// Nose
const nose = createSphere(0.2, matDark);
nose.scale.set(1.2, 0.8, 0.8);
nose.position.set(0, 0.3, 0.65);
snout.add(nose);

// Tongue
const tongue = createSphere(0.25, matPink);
tongue.scale.set(0.8, 0.3, 1.2);
tongue.position.set(0, -0.4, 0.6);
tongue.rotation.x = 0.4;
snout.add(tongue);

// Eyes
const eyeGroupBase = new THREE.Group();
headGroup.add(eyeGroupBase);

const eyeL = createSphere(0.18, matDark);
eyeL.position.set(0.6, 0.4, 1.2);
eyeGroupBase.add(eyeL);

const eyeR = createSphere(0.18, matDark);
eyeR.position.set(-0.6, 0.4, 1.2);
eyeGroupBase.add(eyeR);

// Blush underneath eyes
const blushL = createSphere(0.2, matPink);
blushL.scale.set(1.5, 0.5, 0.5);
blushL.position.set(0.8, 0.1, 1.15);
headGroup.add(blushL);

const blushR = createSphere(0.2, matPink);
blushR.scale.set(1.5, 0.5, 0.5);
blushR.position.set(-0.8, 0.1, 1.15);
headGroup.add(blushR);

// Ears (Floppy)
const earLGroup = new THREE.Group();
earLGroup.position.set(1.3, 0.8, 0);
headGroup.add(earLGroup);
const earL = createSphere(0.7, matEars);
earL.scale.set(0.4, 1.2, 0.8);
earL.position.set(0, -0.6, 0); // Offset so it rotates from the attach point
earLGroup.add(earL);

const earRGroup = new THREE.Group();
earRGroup.position.set(-1.3, 0.8, 0);
headGroup.add(earRGroup);
const earR = createSphere(0.7, matEars);
earR.scale.set(0.4, 1.2, 0.8);
earR.position.set(0, -0.6, 0);
earRGroup.add(earR);

// --- Legs ---
function createLeg() {
    const legGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.0, 16);
    const legMesh = new THREE.Mesh(legGeo, matMain);
    legMesh.castShadow = true;

    // Paw
    const paw = createSphere(0.4, matAccent);
    paw.scale.set(1.1, 0.8, 1.2);
    paw.position.set(0, -0.5, 0.1);
    legMesh.add(paw);

    return legMesh;
}

const legFL = createLeg();
legFL.position.set(0.8, 0.5, 1.0);
dogGroup.add(legFL);

const legFR = createLeg();
legFR.position.set(-0.8, 0.5, 1.0);
dogGroup.add(legFR);

const legBL = createLeg();
legBL.position.set(0.8, 0.5, -0.8);
dogGroup.add(legBL);

const legBR = createLeg();
legBR.position.set(-0.8, 0.5, -0.8);
dogGroup.add(legBR);

// --- Tail ---
const tailGroup = new THREE.Group();
tailGroup.position.set(0, 1.8, -1.8);
dogGroup.add(tailGroup);

const tail = createSphere(0.4, matEars);
tail.scale.set(0.8, 1.5, 0.8);
tail.position.set(0, 0.4, -0.4);
tail.rotation.x = -0.5;
tailGroup.add(tail);


// === Animation System ===
let clock = new THREE.Clock();
let currentAnim = 'idle';
let animTime = 0;
window.currentPersonality = 'normal';

window.setDogPersonality = function (p) {
    window.currentPersonality = p;
};

window.setDogAnimation = function (animName) {
    currentAnim = animName;
    animTime = 0;

    // Reset positions/rotations
    dogGroup.position.y = 0;
    dogGroup.rotation.set(0, 0, 0);
    headGroup.rotation.set(0, 0, 0);
    tailGroup.rotation.set(0, 0, 0);
    earLGroup.rotation.z = -0.3; earLGroup.rotation.x = 0.2;
    earRGroup.rotation.z = 0.3; earRGroup.rotation.x = 0.2;
    tongue.scale.set(0.8, 0.3, 1.2); // Hide/show tongue logic

    // Eye state logic (blink vs close)
    eyeL.scale.y = 1;
    eyeR.scale.y = 1;

    if (animName === 'sleep') {
        // Lay down
        dogGroup.position.y = -0.8;
        dogGroup.rotation.x = 0;
        headGroup.rotation.x = 0.5; // head resting
        headGroup.rotation.z = 0.2;
        // Close eyes
        eyeL.scale.y = 0.1;
        eyeR.scale.y = 0.1;
        // Ears flat
        earLGroup.rotation.z = -0.8;
        earRGroup.rotation.z = 0.5;
        // Tuck tail
        tailGroup.rotation.x = -0.5;

        // Splay legs
        legFL.rotation.x = -1.0; legFL.position.z = 1.5;
        legFR.rotation.x = -1.0; legFR.position.z = 1.5;
        legBL.rotation.x = 1.0; legBL.position.z = -1.5;
        legBR.rotation.x = 1.0; legBR.position.z = -1.5;

        tongue.scale.set(0.01, 0.01, 0.01); // Hide tongue
    } else {
        // Reset legs
        legFL.rotation.x = 0; legFL.position.z = 1.0;
        legFR.rotation.x = 0; legFR.position.z = 1.0;
        legBL.rotation.x = 0; legBL.position.z = -0.8;
        legBR.rotation.x = 0; legBR.position.z = -0.8;
    }
};

window.updateDogShape = function (params) {
    if (params.body) {
        // Uniform scaling for length, offset position
        let s = params.body;
        body.scale.set(0.9, 0.85, 1.2 * s);
        belly.scale.set(0.8, 0.8, 1.15 * s);
        // Move tail back further if body is longer
        tailGroup.position.z = -1.8 * s;
        // Move back legs further back if body is longer
        legBL.position.z = -0.8 * s;
        legBR.position.z = -0.8 * s;
    }

    if (params.head) {
        let s = params.head;
        headGroup.scale.set(s, s, s);
    }

    if (params.ears) {
        let s = params.ears;
        earL.scale.set(0.4, 1.2 * s, 0.8);
        earR.scale.set(0.4, 1.2 * s, 0.8);
        // Move the visible ear mesh further down so it hangs from the same pivot
        earL.position.y = -0.6 * s;
        earR.position.y = -0.6 * s;
    }

    if (params.legs) {
        let s = params.legs;
        // Scale the legs on the Y axis
        legFL.scale.y = s; legFR.scale.y = s;
        legBL.scale.y = s; legBR.scale.y = s;
        // Adjust the dog's overall height so it doesn't clip into the floor
        // Default leg height is 1.0 (at s=1.0)
        let heightDiff = (s - 1.0) * 0.5;
        dogGroup.position.y = heightDiff;

        // When sleeping, counter the height diff so it still lays flat
        if (currentAnim === 'sleep') {
            dogGroup.position.y = -0.8;
        }
    }
};

// Initial state logic calling
window.setDogAnimation('idle');

function animate() {
    requestAnimationFrame(animate);

    let delta = clock.getDelta();

    let speedMulti = 1.0;
    if (window.currentPersonality === 'energetic') speedMulti = 1.5;
    else if (window.currentPersonality === 'lazy') speedMulti = 0.5;
    else if (window.currentPersonality === 'glutton') speedMulti = 1.1;

    animTime += delta * speedMulti;

    if (currentAnim === 'idle') {
        // Breathing
        body.scale.y = 0.85 + Math.sin(animTime * 2) * 0.02;
        body.scale.x = 0.9 + Math.sin(animTime * 2) * 0.01;

        // Head look around
        headGroup.rotation.y = Math.sin(animTime * 1.5) * 0.15;
        headGroup.rotation.x = Math.sin(animTime * 1.0) * 0.05;

        // Slow tail wag
        tailGroup.rotation.y = Math.sin(animTime * 4) * 0.3;

        // Ear subtle flop
        earLGroup.rotation.z = -0.3 + Math.sin(animTime * 2) * 0.05;
        earRGroup.rotation.z = 0.3 - Math.sin(animTime * 2) * 0.05;

        // Panting tongue
        tongue.scale.z = 1.2 + Math.abs(Math.sin(animTime * 5)) * 0.3;

        // Blinking
        if (Math.random() < 0.01) {
            eyeL.scale.y = 0.1;
            eyeR.scale.y = 0.1;
            setTimeout(() => {
                if (currentAnim !== 'sleep' && currentAnim !== 'happy') { eyeL.scale.y = 1; eyeR.scale.y = 1; }
            }, 150);
        }

    } else if (currentAnim === 'happy') {
        // Jumping up down
        dogGroup.position.y = Math.abs(Math.sin(animTime * 10)) * 1.0;

        // Fast tail wagging
        tailGroup.rotation.y = Math.sin(animTime * 20) * 0.8;

        // Head bobbing and looking up
        headGroup.rotation.x = -0.2 + Math.sin(animTime * 10) * 0.1;

        // floppy ears jumping
        earLGroup.rotation.z = -0.4 + Math.sin(animTime * 10) * 0.2;
        earRGroup.rotation.z = 0.4 - Math.sin(animTime * 10) * 0.2;

        // Happy eyes (curved) -> just close them slightly to look like a smile
        eyeL.scale.y = 0.3;
        eyeR.scale.y = 0.3;

        // Excited panting
        tongue.scale.z = 1.4 + Math.abs(Math.sin(animTime * 15)) * 0.4;

    } else if (currentAnim === 'sleep') {
        // Slow shallow breathing
        body.scale.y = 0.85 + Math.sin(animTime * 1.5) * 0.02;
        body.scale.x = 0.9 + Math.sin(animTime * 1.5) * 0.01;

        // Ear breathing drift
        earLGroup.rotation.z = -0.8 + Math.sin(animTime * 1.5) * 0.02;
    }

    // Slow Auto-Rotation of the whole object (optional, for viewing)
    if (currentAnim !== 'sleep') {
        dogGroup.rotation.y = Math.sin(animTime * 0.3) * 0.4;
    }

    renderer.render(scene, camera);
}

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// Start loop
animate();
