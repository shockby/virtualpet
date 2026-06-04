// Setup Scene, Camera, and Renderer
const container = document.getElementById('pet-canvas-container');
const scene = new THREE.Scene();
window.scene = scene; // Expose for debugging

// Camera setup (shifted down by 0.7 units to focus on the grounded pet)
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 4.3, 14);
camera.lookAt(0, 0.8, 0);
window.camera = camera; // Expose for debugging

// Renderer setup
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
renderer.outputEncoding = THREE.sRGBEncoding; // Modern color management

// soft shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Cinematic three-point lighting setup
const ambientLight = new THREE.AmbientLight(0xfefafd, 0.55); // Warm ambient base
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff7ec, 1.0); // Warm bright main sunlight
dirLight.position.set(6, 12, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048; // High res shadows
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.bias = -0.0005; // Fix shadow acne
dirLight.shadow.radius = 4; // Blurs shadow edges slightly for realism

// Tight shadow camera to maximize resolution focus on the pet area
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 25;
dirLight.shadow.camera.left = -5;
dirLight.shadow.camera.right = 5;
dirLight.shadow.camera.top = 5;
dirLight.shadow.camera.bottom = -5;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xe0e7ff, 0.35); // Cool blue sky bounce light
fillLight.position.set(-6, 4, -6);
scene.add(fillLight);

// Floor plane that is completely transparent but receives soft shadows, grounding the pet
const floorGeo = new THREE.PlaneGeometry(40, 40);
const floorMat = new THREE.ShadowMaterial({ opacity: 0.22 }); // Soft subtle shadow
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.9; // Base ground level
floor.receiveShadow = true;
scene.add(floor);

// Colors
const colorMain = 0xe6b87d;   // Soft Tan
const colorAccent = 0xfff3e3; // Cream
const colorEars = 0x8c6239;   // Warm Dark Brown
const colorDark = 0x3e2723;   // Very Dark Brown (Eyes/Nose)
const colorPink = 0xff8a80;   // Tongue/Blush

// Global references for animation and styling
let body, belly, headGroup, head, snout, nose, tongue, eyeL, eyeR, blushL, blushR, earLGroup, earL, earRGroup, earR;
let legFL, legFR, legBL, legBR, tailGroup, tail;
// Parrot specific
let wingLGroup, wingRGroup, wingL, wingR, beak;
// Cat specific
let whiskersL = [], whiskersR = [];

// Realistic 3D Model globals
const loader = new THREE.GLTFLoader();
let activeModel = null;
let activeMixer = null;
let currentLoadId = 0;
let modelBaseY = 0;

let defaultRotations = {
    headGroup: new THREE.Euler(),
    tailGroup: new THREE.Euler(),
    earLGroup: new THREE.Euler(),
    earRGroup: new THREE.Euler(),
    legFL: new THREE.Euler(),
    legFR: new THREE.Euler(),
    legBL: new THREE.Euler(),
    legBR: new THREE.Euler(),
};

let defaultScales = {
    body: new THREE.Vector3(1, 1, 1),
    headGroup: new THREE.Vector3(1, 1, 1),
    earLGroup: new THREE.Vector3(1, 1, 1),
    earRGroup: new THREE.Vector3(1, 1, 1),
    legFL: new THREE.Vector3(1, 1, 1),
    legFR: new THREE.Vector3(1, 1, 1),
    legBL: new THREE.Vector3(1, 1, 1),
    legBR: new THREE.Vector3(1, 1, 1),
};

// Pet Construction Group
const dogGroup = new THREE.Group();
scene.add(dogGroup);
window.dogGroup = dogGroup; // Expose for debugging

// Utility for creating spheres
function createSphere(r, mat) {
    const geo = new THREE.SphereGeometry(r, 32, 32);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// Clear a group's children helper
function clearGroup(group) {
    while (group.children.length > 0) {
        const obj = group.children[0];
        group.remove(obj);
    }
}

// Species Anatomical Configurations (Positions, Rotations, Scales)
// These define the physical proportions (poodle's tall square stance, bulldog's wide pear shape)
const PET_BASE_CONFIGS = {
    shiba: {
        legFL: { x: 0.8, y: 0.5, z: 1.0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
        legFR: { x: -0.8, y: 0.5, z: 1.0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
        legBL: { x: 0.8, y: 0.5, z: -0.8, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
        legBR: { x: -0.8, y: 0.5, z: -0.8, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
        headGroup: { x: 0, y: 2.8, z: 1.2, rx: 0, ry: 0, rz: 0 },
        tailGroup: { x: 0, y: 1.8, z: -1.8, rx: 0, ry: 0, rz: 0 },
        bodyScale: { x: 0.9, y: 0.85, z: 1.2 },
        bellyScale: { x: 0.8, y: 0.8, z: 1.15 },
        bellyPos: { x: 0, y: 1.1, z: 0.2 },
        bodyPos: { x: 0, y: 1.3, z: 0 }
    },
    poodle: {
        legFL: { x: 0.7, y: 0.6, z: 0.8, rx: 0, ry: 0, rz: 0, sx: 0.8, sy: 1.35, sz: 0.8 },
        legFR: { x: -0.7, y: 0.6, z: 0.8, rx: 0, ry: 0, rz: 0, sx: 0.8, sy: 1.35, sz: 0.8 },
        legBL: { x: 0.7, y: 0.6, z: -0.7, rx: 0, ry: 0, rz: 0, sx: 0.8, sy: 1.35, sz: 0.8 },
        legBR: { x: -0.7, y: 0.6, z: -0.7, rx: 0, ry: 0, rz: 0, sx: 0.8, sy: 1.35, sz: 0.8 },
        headGroup: { x: 0, y: 3.1, z: 0.9, rx: 0, ry: 0, rz: 0 },
        tailGroup: { x: 0, y: 1.8, z: -1.4, rx: 0, ry: 0, rz: 0 },
        bodyScale: { x: 0.8, y: 0.75, z: 1.05 },
        bellyScale: { x: 0.7, y: 0.7, z: 0.95 },
        bellyPos: { x: 0, y: 1.1, z: 0.2 },
        bodyPos: { x: 0, y: 1.45, z: 0 }
    },
    bulldog: {
        // Reduced rotation angle and pulled back-legs further back to represent a sturdy dog alignment
        legFL: { x: 1.1, y: 0.45, z: 0.7, rx: 0, ry: 0, rz: 0.12, sx: 1.25, sy: 0.7, sz: 1.25 },
        legFR: { x: -1.1, y: 0.45, z: 0.7, rx: 0, ry: 0, rz: -0.12, sx: 1.25, sy: 0.7, sz: 1.25 },
        legBL: { x: 0.85, y: 0.45, z: -0.9, rx: 0, ry: 0, rz: 0, sx: 1.05, sy: 0.7, sz: 1.05 },
        legBR: { x: -0.85, y: 0.45, z: -0.9, rx: 0, ry: 0, rz: 0, sx: 1.05, sy: 0.7, sz: 1.05 },
        headGroup: { x: 0, y: 2.2, z: 1.2, rx: 0, ry: 0, rz: 0 },
        tailGroup: { x: 0, y: 1.3, z: -1.2, rx: 0, ry: 0, rz: 0 },
        bodyScale: { x: 1.35, y: 0.9, z: 1.15 },
        bellyScale: { x: 1.1, y: 0.8, z: 1.1 },
        bellyPos: { x: 0, y: 0.95, z: 0.2 },
        bodyPos: { x: 0, y: 1.15, z: 0 }
    },
    cat: {
        legFL: { x: 0.65, y: 0.55, z: 0.9, rx: 0, ry: 0, rz: 0, sx: 0.75, sy: 1.25, sz: 0.75 },
        legFR: { x: -0.65, y: 0.55, z: 0.9, rx: 0, ry: 0, rz: 0, sx: 0.75, sy: 1.25, sz: 0.75 },
        legBL: { x: 0.65, y: 0.55, z: -0.7, rx: 0, ry: 0, rz: 0, sx: 0.75, sy: 1.25, sz: 0.75 },
        legBR: { x: -0.65, y: 0.55, z: -0.7, rx: 0, ry: 0, rz: 0, sx: 0.75, sy: 1.25, sz: 0.75 },
        headGroup: { x: 0, y: 2.9, z: 1.0, rx: 0, ry: 0, rz: 0 },
        tailGroup: { x: 0, y: 1.6, z: -1.3, rx: 0, ry: 0, rz: 0 },
        bodyScale: { x: 0.7, y: 0.7, z: 1.25 },
        bellyScale: { x: 0.6, y: 0.6, z: 1.2 },
        bellyPos: { x: 0, y: 1.1, z: 0.2 },
        bodyPos: { x: 0, y: 1.35, z: 0 }
    },
    parrot: {
        legFL: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 0.001, sy: 0.001, sz: 0.001 },
        legFR: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 0.001, sy: 0.001, sz: 0.001 },
        // Angle legs slightly forward for parrot perched posture
        legBL: { x: 0.32, y: 0.45, z: 0.1, rx: -0.2, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
        legBR: { x: -0.32, y: 0.45, z: 0.1, rx: -0.2, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
        headGroup: { x: 0, y: 2.7, z: 0.6, rx: 0, ry: 0, rz: 0 },
        tailGroup: { x: 0, y: 0.8, z: -0.9, rx: 0, ry: 0, rz: 0 },
        bodyScale: { x: 0.8, y: 1.2, z: 0.8 },
        bellyScale: { x: 0.7, y: 0.9, z: 0.75 },
        bellyPos: { x: 0, y: 1.25, z: 0.35 },
        bodyPos: { x: 0, y: 1.45, z: 0 }
    }
};

// Dynamic Pet Rebuilding Function
window.setPetType = function (type) {
    window.activePetType = type;
    
    const myLoadId = ++currentLoadId;
    
    clearGroup(dogGroup);
    activeModel = null;
    window.activeModel = null;
    activeMixer = null;

    // Reset default rotations and scales to identity/defaults
    defaultRotations = {
        headGroup: new THREE.Euler(),
        tailGroup: new THREE.Euler(),
        earLGroup: new THREE.Euler(),
        earRGroup: new THREE.Euler(),
        legFL: new THREE.Euler(),
        legFR: new THREE.Euler(),
        legBL: new THREE.Euler(),
        legBR: new THREE.Euler(),
    };
    defaultScales = {
        body: new THREE.Vector3(1, 1, 1),
        headGroup: new THREE.Vector3(1, 1, 1),
        earLGroup: new THREE.Vector3(1, 1, 1),
        earRGroup: new THREE.Vector3(1, 1, 1),
        legFL: new THREE.Vector3(1, 1, 1),
        legFR: new THREE.Vector3(1, 1, 1),
        legBL: new THREE.Vector3(1, 1, 1),
        legBR: new THREE.Vector3(1, 1, 1),
    };
    
    // Reset references
    body = null; belly = null; headGroup = null; head = null; snout = null;
    nose = null; tongue = null; eyeL = null; eyeR = null; blushL = null; blushR = null;
    earLGroup = null; earL = null; earRGroup = null; earR = null;
    legFL = null; legFR = null; legBL = null; legBR = null; tailGroup = null; tail = null;
    wingLGroup = null; wingRGroup = null; wingL = null; wingR = null; beak = null;
    whiskersL = []; whiskersR = [];

    let glbPath = '';
    const cacheBuster = '?v=' + Date.now();
    if (type === 'shiba') {
        glbPath = '/assets/ShibaInu.glb' + cacheBuster;
    } else if (type === 'poodle') {
        glbPath = '/assets/Poodle.glb' + cacheBuster;
    } else if (type === 'pug') {
        glbPath = '/assets/Pug.glb' + cacheBuster;
    } else if (type === 'beagle') {
        glbPath = '/assets/Beagle.glb' + cacheBuster;
    } else if (type === 'cat') {
        glbPath = '/assets/Kitten.glb' + cacheBuster;
    } else if (type === 'parrot') {
        glbPath = '/assets/Parrot.glb' + cacheBuster;
    } else {
        glbPath = '/assets/ShibaInu.glb' + cacheBuster;
    }

    loader.load(glbPath, function (gltf) {
        if (myLoadId !== currentLoadId) return;

        const model = gltf.scene;
        activeModel = model;
        window.activeModel = model; // Expose to window for debugging

        console.log(`[GLTF LOAD] Loading ${type}...`);

        // Apply shadows and customize materials
        model.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });

        // Model transformation parameters hand-tuned for visual excellence
        const configs = {
            shiba:   { scale: 2.2,  x: 0, y: -1.1,  z: 0, rotY: 0 },
            poodle:  { scale: 0.35, x: 0, y: -1.3,  z: 0, rotY: 0 },
            pug:     { scale: 13.2, x: 0, y: -0.9,  z: 0, rotY: 0 },
            beagle:  { scale: 0.072,x: 0, y: -0.9,  z: 0, rotY: 0 },
            cat:     { scale: 0.16, x: 0, y: -0.9,  z: 0, rotY: 0 }, // rotY = 0 is facing forward for new kitten
            parrot:  { scale: 0.54, x: 0, y: -0.9,  z: 0, rotY: 0 }
        };

        const config = configs[type] || configs.shiba;

        model.scale.set(config.scale, config.scale, config.scale);
        model.position.set(config.x, config.y, config.z);
        model.rotation.y = config.rotY;

        console.log(`[GLTF LOAD] Configured ${type} with scale=${config.scale}, position=(${config.x}, ${config.y}, ${config.z}), rotationY=${config.rotY}`);

        dogGroup.add(model);
        modelBaseY = model.position.y;

        // Map bones/parts for animation and sliders
        model.traverse(node => {
            const name = node.name.toLowerCase();

            // Head mapping
            if (!headGroup && (name.includes('head') || name.includes('neck') || name.includes('skull'))) {
                headGroup = node;
            }
            // Tail mapping
            if (!tailGroup && name.includes('tail')) {
                tailGroup = node;
            }
            // Body mapping
            if (!body && (name.includes('body') || name.includes('spine') || name.includes('torso') || name.includes('chest'))) {
                body = node;
            }
            // Legs mapping
            const isLeft = name.includes('left') || name.includes('l_') || name.endsWith('l');
            const isRight = name.includes('right') || name.includes('r_') || name.endsWith('r');
            const isFront = name.includes('front') || name.includes('fore') || name.includes('arm') || name.includes('shoulder') || name.includes('hand') || name.includes('clavicle');
            const isBack = name.includes('back') || name.includes('hind') || name.includes('upleg');
            const isLegPart = name.includes('leg') || name.includes('thigh') || name.includes('calf') || name.includes('foot') || name.includes('paw') || isFront;

            if (isLegPart) {
                if (isFront || (!isBack && (name.includes('arm') || name.includes('shoulder') || name.includes('hand')))) {
                    if (isLeft && !legFL) legFL = node;
                    else if (isRight && !legFR) legFR = node;
                } else {
                    if (isLeft && !legBL) legBL = node;
                    else if (isRight && !legBR) legBR = node;
                }
            }
            // Ears mapping
            if (name.includes('ear')) {
                if (name.includes('left') || name.includes('l_') || name.endsWith('l')) earLGroup = node;
                else if (name.includes('right') || name.includes('r_') || name.endsWith('r')) earRGroup = node;
            }
        });

        // Store default rotations and scales
        if (headGroup) {
            defaultRotations.headGroup.copy(headGroup.rotation);
            defaultScales.headGroup.copy(headGroup.scale);
        }
        if (tailGroup) {
            defaultRotations.tailGroup.copy(tailGroup.rotation);
        }
        if (body) {
            defaultScales.body.copy(body.scale);
        }
        if (earLGroup) {
            defaultRotations.earLGroup.copy(earLGroup.rotation);
            defaultScales.earLGroup.copy(earLGroup.scale);
        }
        if (earRGroup) {
            defaultRotations.earRGroup.copy(earRGroup.rotation);
            defaultScales.earRGroup.copy(earRGroup.scale);
        }
        if (legFL) {
            defaultRotations.legFL.copy(legFL.rotation);
            defaultScales.legFL.copy(legFL.scale);
        }
        if (legFR) {
            defaultRotations.legFR.copy(legFR.rotation);
            defaultScales.legFR.copy(legFR.scale);
        }
        if (legBL) {
            defaultRotations.legBL.copy(legBL.rotation);
            defaultScales.legBL.copy(legBL.scale);
        }
        if (legBR) {
            defaultRotations.legBR.copy(legBR.rotation);
            defaultScales.legBR.copy(legBR.scale);
        }

        // For Parrot, set up AnimationMixer
        if (gltf.animations && gltf.animations.length > 0) {
            activeMixer = new THREE.AnimationMixer(model);
            const action = activeMixer.clipAction(gltf.animations[0]);
            action.play();
        }

        // Apply sliders parameters
        const elBody = document.getElementById('slider-body');
        const elHead = document.getElementById('slider-head');
        const elEars = document.getElementById('slider-ears');
        const elLegs = document.getElementById('slider-legs');

        const shapeParams = {
            body: elBody ? parseFloat(elBody.value) : 1.0,
            head: elHead ? parseFloat(elHead.value) : 1.0,
            ears: elEars ? parseFloat(elEars.value) : 1.0,
            legs: elLegs ? parseFloat(elLegs.value) : 1.0
        };
        window.updateDogShape(shapeParams);

        // Update animation pose
        window.setDogAnimation(currentAnim);

    }, undefined, function (error) {
        console.error('An error happened while loading GLTF pet model:', error);
    });
};

// --- Bone Mesh ---
const boneGroup = new THREE.Group();
const boneMat = new THREE.MeshPhysicalMaterial({ color: 0xf5f5f5, roughness: 0.4, metalness: 0.05, clearcoat: 0.1 });
const boneShaftGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16);
const shaft = new THREE.Mesh(boneShaftGeo, boneMat);
shaft.rotation.z = Math.PI / 2;
boneGroup.add(shaft);

const jointGeo = new THREE.SphereGeometry(0.18, 16, 16);
const j1 = new THREE.Mesh(jointGeo, boneMat); j1.position.set(-0.4, 0.12, 0.12); boneGroup.add(j1);
const j2 = new THREE.Mesh(jointGeo, boneMat); j2.position.set(-0.4, -0.12, -0.12); boneGroup.add(j2);
const j3 = new THREE.Mesh(jointGeo, boneMat); j3.position.set(0.4, 0.12, 0.12); boneGroup.add(j3);
const j4 = new THREE.Mesh(jointGeo, boneMat); j4.position.set(0.4, -0.12, -0.12); boneGroup.add(j4);

boneGroup.visible = false;
scene.add(boneGroup);

// === Animation System ===
let clock = new THREE.Clock();
let currentAnim = 'idle';
let animTime = 0;
let fetchPhase = 'idle';
let fetchTime = 0;
window.currentPersonality = 'normal';

window.setDogPersonality = function (p) {
    window.currentPersonality = p;
};

window.setDogAnimation = function (animName) {
    currentAnim = animName;
    animTime = 0;

    const petType = window.activePetType || 'shiba';

    // Reset positions/rotations to baseline
    dogGroup.position.set(0, 0, 0);
    dogGroup.rotation.set(0, 0, 0);

    if (headGroup) headGroup.rotation.copy(defaultRotations.headGroup);
    if (tailGroup) tailGroup.rotation.copy(defaultRotations.tailGroup);
    if (earLGroup) earLGroup.rotation.copy(defaultRotations.earLGroup);
    if (earRGroup) earRGroup.rotation.copy(defaultRotations.earRGroup);
    if (legFL) legFL.rotation.copy(defaultRotations.legFL);
    if (legFR) legFR.rotation.copy(defaultRotations.legFR);
    if (legBL) legBL.rotation.copy(defaultRotations.legBL);
    if (legBR) legBR.rotation.copy(defaultRotations.legBR);

    // Bone Visibility
    if (animName !== 'fetch') {
        boneGroup.visible = false;
    }

    if (animName === 'sleep') {
        // Lay down the model
        dogGroup.position.y = -0.3;
        dogGroup.rotation.x = 0.2;
        dogGroup.rotation.z = 1.35; // Lay on side
        
        if (headGroup) headGroup.rotation.y = defaultRotations.headGroup.y + 0.3;
        if (legFL) legFL.rotation.x = defaultRotations.legFL.x + 0.4;
        if (legFR) legFR.rotation.x = defaultRotations.legFR.x + 0.4;
        if (legBL) legBL.rotation.x = defaultRotations.legBL.x - 0.4;
        if (legBR) legBR.rotation.x = defaultRotations.legBR.x - 0.4;
    } else if (animName === 'sit') {
        // Sit baseline
        dogGroup.position.y = -0.15;
        dogGroup.rotation.x = -0.1;
        if (legBL) legBL.rotation.x = defaultRotations.legBL.x - 0.6;
        if (legBR) legBR.rotation.x = defaultRotations.legBR.x - 0.6;
    } else if (animName === 'paw') {
        if (legFL) legFL.rotation.x = defaultRotations.legFL.x + 1.0;
        if (headGroup) headGroup.rotation.z = defaultRotations.headGroup.z - 0.15;
    } else if (animName === 'fetch') {
        fetchPhase = 'throwing';
        fetchTime = 0;
        boneGroup.visible = true;
        boneGroup.position.set(0, 5, 8);
        boneGroup.rotation.set(Math.random()*2, Math.random()*2, Math.random()*2);
    }
};

window.updateDogShape = function (params) {
    if (!activeModel) return;

    if (params.body && body) {
        body.scale.copy(defaultScales.body).multiply(new THREE.Vector3(1, 1, params.body));
    }

    if (params.head && headGroup) {
        headGroup.scale.copy(defaultScales.headGroup).multiplyScalar(params.head);
    }

    if (params.ears && (earLGroup || earRGroup)) {
        const s = params.ears;
        if (earLGroup) earLGroup.scale.copy(defaultScales.earLGroup).multiply(new THREE.Vector3(1, s, 1));
        if (earRGroup) earRGroup.scale.copy(defaultScales.earRGroup).multiply(new THREE.Vector3(1, s, 1));
    }

    if (params.legs && (legFL || legFR || legBL || legBR)) {
        const s = params.legs;
        if (legFL) legFL.scale.copy(defaultScales.legFL).multiply(new THREE.Vector3(1, s, 1));
        if (legFR) legFR.scale.copy(defaultScales.legFR).multiply(new THREE.Vector3(1, s, 1));
        if (legBL) legBL.scale.copy(defaultScales.legBL).multiply(new THREE.Vector3(1, s, 1));
        if (legBR) legBR.scale.copy(defaultScales.legBR).multiply(new THREE.Vector3(1, s, 1));
    }
};

// Initial state logic calling: default type from localstorage or shiba
const initType = localStorage.getItem('pet_type') || 'shiba';
window.setPetType(initType);

function animate() {
    requestAnimationFrame(animate);

    let delta = clock.getDelta();

    let speedMulti = 1.0;
    if (window.currentPersonality === 'energetic') speedMulti = 1.5;
    else if (window.currentPersonality === 'lazy') speedMulti = 0.5;
    else if (window.currentPersonality === 'glutton') speedMulti = 1.1;

    animTime += delta * speedMulti;

    const petType = window.activePetType || 'shiba';

    // Update GLTF animation mixer if exists (e.g. Parrot)
    if (activeMixer) {
        activeMixer.update(delta * speedMulti);
    }

    if (activeModel) {
        if (currentAnim === 'idle') {
            // Soft breathing motion
            activeModel.position.y = modelBaseY + Math.sin(animTime * 2.0) * 0.03;
            
            if (headGroup) {
                headGroup.rotation.y = defaultRotations.headGroup.y + Math.sin(animTime * 1.5) * 0.08;
                headGroup.rotation.x = defaultRotations.headGroup.x + Math.sin(animTime * 1.0) * 0.03;
            }
            if (tailGroup) {
                tailGroup.rotation.y = defaultRotations.tailGroup.y + Math.sin(animTime * 4) * 0.25;
            }
        } else if (currentAnim === 'happy') {
            // Jumping up and down
            dogGroup.position.y = Math.abs(Math.sin(animTime * 10)) * 0.7;
            if (tailGroup) {
                tailGroup.rotation.y = defaultRotations.tailGroup.y + Math.sin(animTime * 20) * 0.6;
            }
            if (headGroup) {
                headGroup.rotation.x = defaultRotations.headGroup.x - 0.1 + Math.sin(animTime * 10) * 0.05;
            }
        } else if (currentAnim === 'sleep') {
            // Shallow breathing
            activeModel.position.y = modelBaseY + Math.sin(animTime * 1.2) * 0.015;
        } else if (currentAnim === 'sit') {
            if (headGroup) headGroup.rotation.y = defaultRotations.headGroup.y + Math.sin(animTime * 1.2) * 0.05;
            if (tailGroup) tailGroup.rotation.y = defaultRotations.tailGroup.y + Math.sin(animTime * 3) * 0.08;
        } else if (currentAnim === 'paw') {
            if (legFL) legFL.rotation.z = defaultRotations.legFL.z + Math.sin(animTime * 8) * 0.12;
            if (tailGroup) tailGroup.rotation.y = defaultRotations.tailGroup.y + Math.sin(animTime * 15) * 0.4;
        } else if (currentAnim === 'fetch') {
            fetchTime += delta;

            if (fetchPhase === 'throwing') {
                let t = Math.min(fetchTime / 1.0, 1.0);
                let start = new THREE.Vector3(0, 5, 8);
                let end = new THREE.Vector3(0, -0.75, 3);
                boneGroup.position.x = THREE.MathUtils.lerp(start.x, end.x, t);
                boneGroup.position.y = THREE.MathUtils.lerp(start.y, end.y, t) + Math.sin(t * Math.PI) * 2.5;
                boneGroup.position.z = THREE.MathUtils.lerp(start.z, end.z, t);
                boneGroup.rotation.x += delta * 6;
                boneGroup.rotation.y += delta * 3;

                if (headGroup) headGroup.lookAt(boneGroup.position);

                if (t >= 1.0) {
                    fetchPhase = 'grabbing';
                    fetchTime = 0;
                }
            } else if (fetchPhase === 'grabbing') {
                let t = Math.min(fetchTime / 0.8, 1.0);
                dogGroup.position.z = THREE.MathUtils.lerp(0, 1.6, t);

                // Run cycle
                if (legFL && legFR && legBL && legBR) {
                    legFL.rotation.x = defaultRotations.legFL.x + Math.sin(fetchTime * 15) * 0.5;
                    legFR.rotation.x = defaultRotations.legFR.x - Math.sin(fetchTime * 15) * 0.5;
                    legBL.rotation.x = defaultRotations.legBL.x - Math.sin(fetchTime * 15) * 0.5;
                    legBR.rotation.x = defaultRotations.legBR.x + Math.sin(fetchTime * 15) * 0.5;
                }
                if (tailGroup) tailGroup.rotation.y = defaultRotations.tailGroup.y + Math.sin(fetchTime * 25) * 0.5;

                if (t >= 1.0) {
                    fetchPhase = 'returning';
                    fetchTime = 0;
                }
            } else if (fetchPhase === 'returning') {
                let t = Math.min(fetchTime / 0.9, 1.0);
                dogGroup.position.z = THREE.MathUtils.lerp(1.6, 0, t);

                // Bone in mouth
                let headWorld = new THREE.Vector3();
                if (headGroup) {
                    headGroup.getWorldPosition(headWorld);
                    boneGroup.position.copy(headWorld).add(new THREE.Vector3(0, 0, 0.4));
                    boneGroup.rotation.copy(headGroup.rotation);
                    boneGroup.rotation.y += Math.PI / 2;
                } else {
                    dogGroup.getWorldPosition(headWorld);
                    boneGroup.position.copy(headWorld).add(new THREE.Vector3(0, 0.5, 0.5));
                }

                // Run cycle
                if (legFL && legFR && legBL && legBR) {
                    legFL.rotation.x = defaultRotations.legFL.x + Math.sin(fetchTime * 15) * 0.4;
                    legFR.rotation.x = defaultRotations.legFR.x - Math.sin(fetchTime * 15) * 0.4;
                    legBL.rotation.x = defaultRotations.legBL.x - Math.sin(fetchTime * 15) * 0.4;
                    legBR.rotation.x = defaultRotations.legBR.x + Math.sin(fetchTime * 15) * 0.4;
                }
                if (tailGroup) tailGroup.rotation.y = defaultRotations.tailGroup.y + Math.sin(fetchTime * 25) * 0.5;

                if (t >= 1.0) {
                    fetchPhase = 'happy';
                    fetchTime = 0;
                }
            } else if (fetchPhase === 'happy') {
                boneGroup.visible = false;
                let t = Math.min(fetchTime / 1.5, 1.0);

                dogGroup.position.y = Math.abs(Math.sin(fetchTime * 10)) * 0.7;
                if (tailGroup) tailGroup.rotation.y = defaultRotations.tailGroup.y + Math.sin(fetchTime * 25) * 0.5;
                if (headGroup) headGroup.rotation.x = defaultRotations.headGroup.x - 0.1 + Math.sin(fetchTime * 10) * 0.05;

                if (t >= 1.0) {
                    window.setDogAnimation('idle');
                }
            }
        }
    }

    if (currentAnim !== 'sleep' && currentAnim !== 'fetch' && dogGroup) {
        dogGroup.rotation.y = Math.sin(animTime * 0.3) * 0.25;
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
