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
let activeActions = {};
let currentClipAction = null;
let currentClipName = '';
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

// Target rotations for smooth slerping / lerping
let targetRotations = {
    dogGroup: new THREE.Euler(),
    headGroup: new THREE.Euler(),
    tailGroup: new THREE.Euler(),
    earLGroup: new THREE.Euler(),
    earRGroup: new THREE.Euler(),
    legFL: new THREE.Euler(),
    legFR: new THREE.Euler(),
    legBL: new THREE.Euler(),
    legBR: new THREE.Euler(),
};
let targetDogPosition = new THREE.Vector3(0, 0, 0);

// Pet Construction Group
const dogGroup = new THREE.Group();
scene.add(dogGroup);
window.dogGroup = dogGroup; // Expose for debugging

// Clear a group's children helper
function clearGroup(group) {
    while (group.children.length > 0) {
        const obj = group.children[0];
        group.remove(obj);
    }
}

// Dynamic Pet Rebuilding Function
window.setPetType = function (type) {
    window.activePetType = type;
    
    const myLoadId = ++currentLoadId;
    
    clearGroup(dogGroup);
    activeModel = null;
    window.activeModel = null;
    activeMixer = null;
    activeActions = {};
    currentClipAction = null;
    currentClipName = '';

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
    } else if (type === 'baby_dog') {
        glbPath = '/assets/BabyDog.glb' + cacheBuster;
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
            shiba:    { scale: 2.2,   x: 0, y: -1.1,  z: 0, rotY: 0 },
            baby_dog: { scale: 0.026, x: 0, y: -0.9,  z: 0, rotY: 0 },
            poodle:   { scale: 0.35,  x: 0, y: -1.3,  z: 0, rotY: 0 },
            pug:      { scale: 13.2,  x: 0, y: -0.9,  z: 0, rotY: 0 },
            beagle:   { scale: 0.072, x: 0, y: -0.9,  z: 0, rotY: 0 },
            cat:      { scale: 0.16,  x: 0, y: -0.9,  z: 0, rotY: 0 },
            parrot:   { scale: 0.54,  x: 0, y: -0.9,  z: 0, rotY: 0 }
        };

        const config = configs[type] || configs.shiba;

        model.scale.set(config.scale, config.scale, config.scale);
        model.position.set(config.x, config.y, config.z);
        model.rotation.y = config.rotY;

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
            targetRotations.headGroup.copy(headGroup.rotation);
        }
        if (tailGroup) {
            defaultRotations.tailGroup.copy(tailGroup.rotation);
            targetRotations.tailGroup.copy(tailGroup.rotation);
        }
        if (body) {
            defaultScales.body.copy(body.scale);
        }
        if (earLGroup) {
            defaultRotations.earLGroup.copy(earLGroup.rotation);
            defaultScales.earLGroup.copy(earLGroup.scale);
            targetRotations.earLGroup.copy(earLGroup.rotation);
        }
        if (earRGroup) {
            defaultRotations.earRGroup.copy(earRGroup.rotation);
            defaultScales.earRGroup.copy(earRGroup.scale);
            targetRotations.earRGroup.copy(earRGroup.rotation);
        }
        if (legFL) {
            defaultRotations.legFL.copy(legFL.rotation);
            defaultScales.legFL.copy(legFL.scale);
            targetRotations.legFL.copy(legFL.rotation);
        }
        if (legFR) {
            defaultRotations.legFR.copy(legFR.rotation);
            defaultScales.legFR.copy(legFR.scale);
            targetRotations.legFR.copy(legFR.rotation);
        }
        if (legBL) {
            defaultRotations.legBL.copy(legBL.rotation);
            defaultScales.legBL.copy(legBL.scale);
            targetRotations.legBL.copy(legBL.rotation);
        }
        if (legBR) {
            defaultRotations.legBR.copy(legBR.rotation);
            defaultScales.legBR.copy(legBR.scale);
            targetRotations.legBR.copy(legBR.rotation);
        }

        // Setup AnimationMixer and Clip Actions if GLTF has embedded animations
        if (gltf.animations && gltf.animations.length > 0) {
            activeMixer = new THREE.AnimationMixer(model);
            activeActions = {};
            gltf.animations.forEach(clip => {
                activeActions[clip.name] = activeMixer.clipAction(clip);
            });
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

// === Animation System & Interactive State ===
let clock = new THREE.Clock();
let currentAnim = 'idle';
let animTime = 0;
let fetchPhase = 'idle';
let fetchTime = 0;
window.currentPersonality = 'normal';

// Navigation & Wandering state
let isWalking = false;
let walkTarget = new THREE.Vector3();
let idleWanderTimer = 0;
let lastInteractionTime = Date.now();

// Mouse Look-At State
const mouse = new THREE.Vector2(0, 0);
let isMouseActive = false;
let mouseInactiveTimer = 0;
const raycaster = new THREE.Raycaster();

// Ear twitch & head glance state
let earTwitchTimer = 0;
let earTwitchLeft = false;
let earTwitchAngle = 0;
let headGlanceTimer = 0;
let headGlanceOffset = new THREE.Euler();

window.setDogPersonality = function (p) {
    window.currentPersonality = p;
};

window.setDogAnimation = function (animName) {
    currentAnim = animName;
    animTime = 0;
    lastInteractionTime = Date.now();

    if (animName !== 'walk') {
        isWalking = false;
    }

    // Baseline target position and rotations for smooth slerping
    targetDogPosition.set(0, 0, 0);
    targetRotations.dogGroup.set(0, 0, 0);

    // Reset targets to baseline defaults
    targetRotations.headGroup.copy(defaultRotations.headGroup);
    targetRotations.tailGroup.copy(defaultRotations.tailGroup);
    targetRotations.earLGroup.copy(defaultRotations.earLGroup);
    targetRotations.earRGroup.copy(defaultRotations.earRGroup);
    targetRotations.legFL.copy(defaultRotations.legFL);
    targetRotations.legFR.copy(defaultRotations.legFR);
    targetRotations.legBL.copy(defaultRotations.legBL);
    targetRotations.legBR.copy(defaultRotations.legBR);

    // Handle embedded AnimationClip cross-fading if present (e.g. Baby Dog or Parrot)
    if (activeMixer && Object.keys(activeActions).length > 0) {
        let targetClipName = Object.keys(activeActions)[0]; // Default fallback clip

        if (animName === 'sit' && activeActions['sitting']) targetClipName = 'sitting';
        else if (animName === 'paw' && activeActions['shake']) targetClipName = 'shake';
        else if (animName === 'happy' && activeActions['rollover']) targetClipName = 'rollover';
        else if (animName === 'sleep' && activeActions['play_dead']) targetClipName = 'play_dead';
        else if ((animName === 'idle' || animName === 'walk') && activeActions['standing']) targetClipName = 'standing';

        if (activeActions[targetClipName]) {
            const nextAction = activeActions[targetClipName];
            if (currentClipAction && currentClipName !== targetClipName) {
                nextAction.reset().play();
                currentClipAction.crossFadeTo(nextAction, 0.4, true);
                currentClipAction = nextAction;
                currentClipName = targetClipName;
            } else if (!currentClipAction) {
                currentClipAction = nextAction;
                currentClipName = targetClipName;
                currentClipAction.play();
            }
        }
    }

    // Bone Visibility
    if (animName !== 'fetch') {
        boneGroup.visible = false;
    }

    if (animName === 'sleep') {
        targetDogPosition.y = -0.3;
        targetRotations.dogGroup.x = 0.2;
        targetRotations.dogGroup.z = 1.35; // Lay on side
        
        targetRotations.headGroup.y = defaultRotations.headGroup.y + 0.3;
        targetRotations.legFL.x = defaultRotations.legFL.x + 0.4;
        targetRotations.legFR.x = defaultRotations.legFR.x + 0.4;
        targetRotations.legBL.x = defaultRotations.legBL.x - 0.4;
        targetRotations.legBR.x = defaultRotations.legBR.x - 0.4;
    } else if (animName === 'sit') {
        targetDogPosition.y = -0.15;
        targetRotations.dogGroup.x = -0.1;
        targetRotations.legBL.x = defaultRotations.legBL.x - 0.6;
        targetRotations.legBR.x = defaultRotations.legBR.x - 0.6;
    } else if (animName === 'paw') {
        targetRotations.legFL.x = defaultRotations.legFL.x + 1.0;
        targetRotations.headGroup.z = defaultRotations.headGroup.z - 0.15;
    } else if (animName === 'fetch') {
        fetchPhase = 'throwing';
        fetchTime = 0;
        boneGroup.visible = true;
        boneGroup.position.set(0, 5, 8);
        boneGroup.rotation.set(Math.random()*2, Math.random()*2, Math.random()*2);
    }
};

// Initiate smooth walking to target coordinate
function walkTo(targetPos) {
    // Clamp walking destination to valid floor radius
    const maxRadius = 3.5;
    if (targetPos.length() > maxRadius) {
        targetPos.normalize().multiplyScalar(maxRadius);
    }
    
    walkTarget.copy(targetPos);
    walkTarget.y = 0; // Ground plane
    isWalking = true;
    currentAnim = 'walk';
    lastInteractionTime = Date.now();
}

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

// --- Event Listeners for Interaction (Click-to-Walk & Mouse Look-At) ---
window.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        isMouseActive = true;
        mouseInactiveTimer = 0;
    }
});

container.addEventListener('pointerdown', (e) => {
    // Raycast to find click position on floor
    const rect = container.getBoundingClientRect();
    const clickMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(clickMouse, camera);
    const intersects = raycaster.intersectObject(floor);

    if (intersects.length > 0) {
        const clickPoint = intersects[0].point;
        // Don't walk if fetch is active
        if (currentAnim !== 'fetch') {
            walkTo(clickPoint);
        }
    }
});

// Smooth Quaternion Slerp Helper for Euler Rotations
function slerpEuler(currentEuler, targetEuler, speed) {
    const qCurrent = new THREE.Quaternion().setFromEuler(currentEuler);
    const qTarget = new THREE.Quaternion().setFromEuler(targetEuler);
    qCurrent.slerp(qTarget, speed);
    currentEuler.setFromQuaternion(qCurrent);
}

function animate() {
    requestAnimationFrame(animate);

    let delta = clock.getDelta();
    let speedMulti = 1.0;
    if (window.currentPersonality === 'energetic') speedMulti = 1.4;
    else if (window.currentPersonality === 'lazy') speedMulti = 0.65;
    else if (window.currentPersonality === 'glutton') speedMulti = 1.05;

    animTime += delta * speedMulti;
    mouseInactiveTimer += delta;

    if (mouseInactiveTimer > 4.0) {
        isMouseActive = false;
    }

    // --- 1. Smooth Interpolation to Base Targets ---
    const lerpSpeed = delta * 6.0;
    dogGroup.position.lerp(targetDogPosition, lerpSpeed);
    slerpEuler(dogGroup.rotation, targetRotations.dogGroup, lerpSpeed);

    if (legFL) slerpEuler(legFL.rotation, targetRotations.legFL, lerpSpeed);
    if (legFR) slerpEuler(legFR.rotation, targetRotations.legFR, lerpSpeed);
    if (legBL) slerpEuler(legBL.rotation, targetRotations.legBL, lerpSpeed);
    if (legBR) slerpEuler(legBR.rotation, targetRotations.legBR, lerpSpeed);

    // --- 2. Idle Micro-Motions (Breathing, Ear Twitches, Glances) ---
    earTwitchTimer += delta;
    if (earTwitchTimer > 3.5 + Math.random() * 4.0) {
        earTwitchTimer = 0;
        earTwitchLeft = Math.random() > 0.5;
        earTwitchAngle = (Math.random() > 0.5 ? 1 : -1) * 0.25;
    }

    headGlanceTimer += delta;
    if (headGlanceTimer > 5.0 + Math.random() * 5.0) {
        headGlanceTimer = 0;
        if (Math.random() < 0.6) {
            headGlanceOffset.set(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.15
            );
        } else {
            headGlanceOffset.set(0, 0, 0);
        }
    }

    // --- 3. Autonomous Wandering (Idle Walk) ---
    if (currentAnim === 'idle' && !isWalking) {
        idleWanderTimer += delta;
        // Wander every 12 - 20 seconds if inactive
        if (idleWanderTimer > 12.0 && (Date.now() - lastInteractionTime > 10000)) {
            idleWanderTimer = 0;
            const randomAngle = Math.random() * Math.PI * 2;
            const randomDist = 1.2 + Math.random() * 1.8;
            const wanderPos = new THREE.Vector3(
                Math.cos(randomAngle) * randomDist,
                0,
                Math.sin(randomAngle) * randomDist
            );
            walkTo(wanderPos);
        }
    } else {
        idleWanderTimer = 0;
    }

    // --- 4. Walking Navigation & Walk Cycle Animation ---
    if (isWalking && currentAnim === 'walk') {
        const dist = dogGroup.position.distanceTo(walkTarget);
        if (dist > 0.15) {
            // Smoothly rotate towards target direction
            const dir = walkTarget.clone().sub(dogGroup.position).normalize();
            const targetAngle = Math.atan2(dir.x, dir.z);
            
            // Shortest angle rotation
            let diff = targetAngle - dogGroup.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            dogGroup.rotation.y += diff * delta * 7.0;

            // Move forward
            const stepDist = Math.min(delta * 2.2 * speedMulti, dist);
            dogGroup.position.add(dir.multiplyScalar(stepDist));

            // Procedural Walk Cycle if no embedded walk clip
            if (!activeMixer) {
                const walkCycle = animTime * 12.0 * speedMulti;
                const legSwing = Math.sin(walkCycle) * 0.45;
                
                if (legFL) legFL.rotation.x = defaultRotations.legFL.x + legSwing;
                if (legBR) legBR.rotation.x = defaultRotations.legBR.x + legSwing;
                if (legFR) legFR.rotation.x = defaultRotations.legFR.x - legSwing;
                if (legBL) legBL.rotation.x = defaultRotations.legBL.x - legSwing;

                dogGroup.position.y = targetDogPosition.y + Math.abs(Math.sin(walkCycle * 2.0)) * 0.08;
                dogGroup.rotation.z = Math.sin(walkCycle) * 0.04;

                if (tailGroup) {
                    tailGroup.rotation.y = defaultRotations.tailGroup.y + Math.sin(walkCycle * 1.5) * 0.4;
                }
            }
        } else {
            // Arrived at destination
            isWalking = false;
            window.setDogAnimation('idle');
        }
    }

    // Update GLTF animation mixer if exists (e.g. Baby Dog or Parrot)
    if (activeMixer) {
        activeMixer.update(delta * speedMulti);
    }

    if (activeModel) {
        if (currentAnim === 'idle') {
            // Organic Breathing motion
            const breath = Math.sin(animTime * 2.2);
            activeModel.position.y = modelBaseY + breath * 0.025;
            if (body) {
                body.scale.set(
                    defaultScales.body.x * (1 + breath * 0.015),
                    defaultScales.body.y * (1 + breath * 0.02),
                    defaultScales.body.z * (1 - breath * 0.01)
                );
            }
            
            // Dynamic Tail wagging
            if (tailGroup) {
                const wagSpeed = (window.currentPersonality === 'energetic') ? 6.5 : 3.5;
                tailGroup.rotation.y = defaultRotations.tailGroup.y + Math.sin(animTime * wagSpeed) * 0.3;
                tailGroup.rotation.z = defaultRotations.tailGroup.z + Math.cos(animTime * wagSpeed * 0.5) * 0.1;
            }
        } else if (currentAnim === 'happy') {
            // Joyful Jumping up and down with side wiggles
            dogGroup.position.y = Math.abs(Math.sin(animTime * 11)) * 0.7;
            dogGroup.rotation.z = Math.sin(animTime * 11) * 0.08;

            if (tailGroup) {
                tailGroup.rotation.y = defaultRotations.tailGroup.y + Math.sin(animTime * 22) * 0.7;
            }
            if (headGroup) {
                headGroup.rotation.x = defaultRotations.headGroup.x - 0.1 + Math.sin(animTime * 11) * 0.08;
            }
        } else if (currentAnim === 'sleep') {
            // Deep slow breathing sleeping posture
            const sleepBreath = Math.sin(animTime * 1.2);
            activeModel.position.y = modelBaseY + sleepBreath * 0.018;
            if (body) {
                body.scale.set(
                    defaultScales.body.x * (1 + sleepBreath * 0.025),
                    defaultScales.body.y * (1 + sleepBreath * 0.03),
                    defaultScales.body.z * (1 - sleepBreath * 0.015)
                );
            }
        } else if (currentAnim === 'sit') {
            const breath = Math.sin(animTime * 1.8);
            if (headGroup) headGroup.rotation.y = defaultRotations.headGroup.y + Math.sin(animTime * 1.2) * 0.06;
            if (tailGroup) tailGroup.rotation.y = defaultRotations.tailGroup.y + Math.sin(animTime * 3.5) * 0.12;
            if (body) {
                body.scale.set(
                    defaultScales.body.x * (1 + breath * 0.012),
                    defaultScales.body.y * (1 + breath * 0.018),
                    defaultScales.body.z
                );
            }
        } else if (currentAnim === 'paw') {
            if (legFL) legFL.rotation.z = defaultRotations.legFL.z + Math.sin(animTime * 8) * 0.15;
            if (tailGroup) tailGroup.rotation.y = defaultRotations.tailGroup.y + Math.sin(animTime * 15) * 0.45;
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
                    legFL.rotation.x = defaultRotations.legFL.x + Math.sin(fetchTime * 16) * 0.55;
                    legFR.rotation.x = defaultRotations.legFR.x - Math.sin(fetchTime * 16) * 0.55;
                    legBL.rotation.x = defaultRotations.legBL.x - Math.sin(fetchTime * 16) * 0.55;
                    legBR.rotation.x = defaultRotations.legBR.x + Math.sin(fetchTime * 16) * 0.55;
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
                    legFL.rotation.x = defaultRotations.legFL.x + Math.sin(fetchTime * 16) * 0.45;
                    legFR.rotation.x = defaultRotations.legFR.x - Math.sin(fetchTime * 16) * 0.45;
                    legBL.rotation.x = defaultRotations.legBL.x - Math.sin(fetchTime * 16) * 0.45;
                    legBR.rotation.x = defaultRotations.legBR.x + Math.sin(fetchTime * 16) * 0.45;
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

    // --- 5. Mouse & Glance Head Look-At Tracking ---
    if (headGroup && currentAnim !== 'sleep' && currentAnim !== 'fetch') {
        let lookTargetEuler = new THREE.Euler().copy(targetRotations.headGroup);

        if (isMouseActive) {
            // Inverse map mouse relative to pet's facing angle
            const mouseAngleY = -mouse.x * 0.45;
            const mouseAngleX = -mouse.y * 0.25;

            lookTargetEuler.y += mouseAngleY;
            lookTargetEuler.x += mouseAngleX;
        } else {
            // Apply gentle random head glances when mouse is inactive
            lookTargetEuler.x += headGlanceOffset.x;
            lookTargetEuler.y += headGlanceOffset.y;
            lookTargetEuler.z += headGlanceOffset.z;
        }

        slerpEuler(headGroup.rotation, lookTargetEuler, delta * 4.5);
    }

    // --- 6. Apply Ear Twitches ---
    if (earLGroup) {
        let targetEarL = defaultRotations.earLGroup.z + (earTwitchLeft ? earTwitchAngle : 0);
        earLGroup.rotation.z = THREE.MathUtils.lerp(earLGroup.rotation.z, targetEarL, delta * 12.0);
    }
    if (earRGroup) {
        let targetEarR = defaultRotations.earRGroup.z + (!earTwitchLeft ? earTwitchAngle : 0);
        earRGroup.rotation.z = THREE.MathUtils.lerp(earRGroup.rotation.z, targetEarR, delta * 12.0);
    }

    // Return ear twitch angle back to 0
    earTwitchAngle = THREE.MathUtils.lerp(earTwitchAngle, 0, delta * 8.0);

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
