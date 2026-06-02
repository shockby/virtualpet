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

// Global references for animation and styling
let body, belly, headGroup, head, snout, nose, tongue, eyeL, eyeR, blushL, blushR, earLGroup, earL, earRGroup, earR;
let legFL, legFR, legBL, legBR, tailGroup, tail;
// Parrot specific
let wingLGroup, wingRGroup, wingL, wingR, beak;
// Cat specific
let whiskersL = [], whiskersR = [];

// Pet Construction Group
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

// Clear a group's children helper
function clearGroup(group) {
    while (group.children.length > 0) {
        const obj = group.children[0];
        group.remove(obj);
    }
}

// Species Anatomical Configurations (Positions, Rotations, Scales)
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
    bulldog: {
        legFL: { x: 1.1, y: 0.5, z: 0.9, rx: 0, ry: 0, rz: 0.15, sx: 1.2, sy: 0.75, sz: 1.2 },
        legFR: { x: -1.1, y: 0.5, z: 0.9, rx: 0, ry: 0, rz: -0.15, sx: 1.2, sy: 0.75, sz: 1.2 },
        legBL: { x: 1.0, y: 0.5, z: -0.7, rx: 0, ry: 0, rz: 0, sx: 1.1, sy: 0.75, sz: 1.1 },
        legBR: { x: -1.0, y: 0.5, z: -0.7, rx: 0, ry: 0, rz: 0, sx: 1.1, sy: 0.75, sz: 1.1 },
        headGroup: { x: 0, y: 2.3, z: 1.1, rx: 0, ry: 0, rz: 0 },
        tailGroup: { x: 0, y: 1.5, z: -1.2, rx: 0, ry: 0, rz: 0 },
        bodyScale: { x: 1.2, y: 0.95, z: 1.1 },
        bellyScale: { x: 1.0, y: 0.85, z: 1.05 },
        bellyPos: { x: 0, y: 1.0, z: 0.2 },
        bodyPos: { x: 0, y: 1.2, z: 0 }
    },
    cat: {
        legFL: { x: 0.7, y: 0.5, z: 0.9, rx: 0, ry: 0, rz: 0, sx: 0.8, sy: 1.0, sz: 0.8 },
        legFR: { x: -0.7, y: 0.5, z: 0.9, rx: 0, ry: 0, rz: 0, sx: 0.8, sy: 1.0, sz: 0.8 },
        legBL: { x: 0.7, y: 0.5, z: -0.7, rx: 0, ry: 0, rz: 0, sx: 0.8, sy: 1.0, sz: 0.8 },
        legBR: { x: -0.7, y: 0.5, z: -0.7, rx: 0, ry: 0, rz: 0, sx: 0.8, sy: 1.0, sz: 0.8 },
        headGroup: { x: 0, y: 2.8, z: 1.2, rx: 0, ry: 0, rz: 0 },
        tailGroup: { x: 0, y: 1.6, z: -1.3, rx: 0, ry: 0, rz: 0 },
        bodyScale: { x: 0.75, y: 0.75, z: 1.25 },
        bellyScale: { x: 0.65, y: 0.65, z: 1.2 },
        bellyPos: { x: 0, y: 1.1, z: 0.2 },
        bodyPos: { x: 0, y: 1.3, z: 0 }
    },
    parrot: {
        legFL: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 0.001, sy: 0.001, sz: 0.001 },
        legFR: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 0.001, sy: 0.001, sz: 0.001 },
        legBL: { x: 0.35, y: 0.45, z: 0.0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
        legBR: { x: -0.35, y: 0.45, z: 0.0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
        headGroup: { x: 0, y: 2.7, z: 0.4, rx: 0, ry: 0, rz: 0 },
        tailGroup: { x: 0, y: 1.0, z: -0.8, rx: 0, ry: 0, rz: 0 },
        bodyScale: { x: 0.85, y: 1.15, z: 0.85 },
        bellyScale: { x: 0.75, y: 0.9, z: 0.8 },
        bellyPos: { x: 0, y: 1.3, z: 0.25 },
        bodyPos: { x: 0, y: 1.4, z: 0 }
    }
};

// Dynamic Pet Rebuilding Function
window.setPetType = function (type) {
    window.activePetType = type;
    
    // Clear existing children
    clearGroup(dogGroup);
    
    // Reset lists
    whiskersL = [];
    whiskersR = [];
    wingLGroup = null;
    wingRGroup = null;

    // Define colors and materials based on pet type
    let colorMain, colorAccent, colorEars, colorDark, colorPink;
    
    if (type === 'shiba') {
        colorMain = 0xd97706;   // Warm Shiba Tan
        colorAccent = 0xfffbeb; // Soft Cream
        colorEars = 0xb45309;   // Dark Tan (Ear backs)
        colorDark = 0x1f2937;   // Dark Charcoal Eyes/Nose
        colorPink = 0xfca5a5;   // Pink Tongue
    } else if (type === 'poodle') {
        colorMain = 0xd97706;   // Rich Apricot/Bronze
        colorAccent = 0xfef3c7; // Warm Soft Apricot
        colorEars = 0xb45309;   // Poodle Ear Accent
        colorDark = 0x1f2937;   // Dark Charcoal
        colorPink = 0xfca5a5;   // Pink
    } else if (type === 'bulldog') {
        colorMain = 0x9ca3af;   // Slate Grey
        colorAccent = 0xf3f4f6; // Soft Off-White
        colorEars = 0x4b5563;   // Dark Slate
        colorDark = 0x111827;   // Dark Grey
        colorPink = 0xfca5a5;   // Pink
    } else if (type === 'cat') {
        colorMain = 0xf97316;   // Bright Ginger
        colorAccent = 0xffffff; // White Belly/Whiskers
        colorEars = 0xea580c;   // Dark Ginger
        colorDark = 0x111827;   // Dark Charcoal
        colorPink = 0xfca5a5;   // Light Pink Nose
    } else if (type === 'parrot') {
        colorMain = 0xef4444;   // Bright Scarlet
        colorAccent = 0xeab308; // Bright Yellow (Chest/Beak Accent)
        colorEars = 0x2563eb;   // Blue Wings
        colorDark = 0x1f2937;   // Dark Grey Beak
        colorPink = 0xfca5a5;   // Pink
    }

    const matMain = new THREE.MeshStandardMaterial({ color: colorMain, roughness: 0.85, metalness: 0.05 });
    const matAccent = new THREE.MeshStandardMaterial({ color: colorAccent, roughness: 0.85, metalness: 0.05 });
    const matEars = new THREE.MeshStandardMaterial({ color: colorEars, roughness: 0.85, metalness: 0.05 });
    const matDark = new THREE.MeshStandardMaterial({ color: colorDark, roughness: 0.3, metalness: 0.1 });
    const matPink = new THREE.MeshStandardMaterial({ color: colorPink, roughness: 0.6, metalness: 0.05 });

    const cfg = PET_BASE_CONFIGS[type] || PET_BASE_CONFIGS.shiba;

    // --- Body ---
    if (type === 'poodle') {
        // Assemble fluffy poodle core & surrounding puff spheres (cloud body)
        body = createSphere(1.0, matMain);
        body.position.y = cfg.bodyPos.y;
        body.scale.set(cfg.bodyScale.x, cfg.bodyScale.y, cfg.bodyScale.z);
        
        const puffs = [
            [0.6, 0.4, 0.4, 0.65], [-0.6, 0.4, 0.4, 0.65],
            [0.6, -0.3, 0.3, 0.6], [-0.6, -0.3, 0.3, 0.6],
            [0.5, 0.2, -0.4, 0.6], [-0.5, 0.2, -0.4, 0.6],
            [0, 0.5, 0.5, 0.7], [0, 0.4, -0.5, 0.7],
            [0, -0.4, -0.3, 0.6]
        ];
        puffs.forEach(([x, y, z, r]) => {
            const puff = createSphere(r, matMain);
            puff.position.set(x, y, z);
            body.add(puff);
        });
    } else {
        body = createSphere(1.6, matMain);
        body.position.y = cfg.bodyPos.y;
        body.scale.set(cfg.bodyScale.x, cfg.bodyScale.y, cfg.bodyScale.z);
    }

    // Body additions
    if (type === 'shiba') {
        // White chest fur patch (Urajiro)
        const chestFur = createSphere(0.75, matAccent);
        chestFur.scale.set(1.0, 0.8, 0.5);
        chestFur.position.set(0, 0.35, 0.85);
        body.add(chestFur);
    } else if (type === 'bulldog') {
        // Bulldog neck fold / collar wrinkles
        const neckFold1 = createSphere(1.2, matMain);
        neckFold1.scale.set(1.15, 0.35, 1.05);
        neckFold1.position.set(0, 0.5, 0.4);
        body.add(neckFold1);
        
        const neckFold2 = createSphere(1.1, matMain);
        neckFold2.scale.set(1.1, 0.3, 1.0);
        neckFold2.position.set(0, 0.25, 0.55);
        body.add(neckFold2);
    } else if (type === 'cat') {
        // Cat Collar & Bell
        const collarGeo = new THREE.TorusGeometry(0.8, 0.08, 8, 24);
        const collarMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
        const collar = new THREE.Mesh(collarGeo, collarMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.set(0, 0.6, 0.45);
        body.add(collar);
        
        const bellGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const bellMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 });
        const bell = new THREE.Mesh(bellGeo, bellMat);
        bell.position.set(0, -0.6, 0.6);
        collar.add(bell);

        // Dark Stripes on ginger cat
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8 }); // Darker Orange
        for (let i = 0; i < 3; i++) {
            const sL = createSphere(0.08, stripeMat);
            sL.scale.set(0.15, 0.7, 1.5);
            sL.position.set(0.65, 0.1, -0.3 + i * 0.3);
            sL.rotation.z = 0.25;
            body.add(sL);
            
            const sR = createSphere(0.08, stripeMat);
            sR.scale.set(0.15, 0.7, 1.5);
            sR.position.set(-0.65, 0.1, -0.3 + i * 0.3);
            sR.rotation.z = -0.25;
            body.add(sR);
        }
    } else if (type === 'poodle') {
        // Toy Poodle extra fluffy details
        const chestFluff = createSphere(0.65, matMain);
        chestFluff.position.set(0, 0.5, 0.6);
        body.add(chestFluff);
        
        const hipFluffL = createSphere(0.55, matMain);
        hipFluffL.position.set(0.5, 0.3, -0.6);
        body.add(hipFluffL);
        const hipFluffR = createSphere(0.55, matMain);
        hipFluffR.position.set(-0.5, 0.3, -0.6);
        body.add(hipFluffR);
    }
    dogGroup.add(body);

    // --- Belly ---
    belly = createSphere(1.4, matAccent);
    belly.position.set(cfg.bellyPos.x, cfg.bellyPos.y, cfg.bellyPos.z);
    belly.scale.set(cfg.bellyScale.x, cfg.bellyScale.y, cfg.bellyScale.z);
    if (type !== 'poodle') {
        dogGroup.add(belly);
    }

    // --- Head Group & Head ---
    headGroup = new THREE.Group();
    headGroup.position.set(cfg.headGroup.x, cfg.headGroup.y, cfg.headGroup.z);
    dogGroup.add(headGroup);

    if (type === 'poodle') {
        // Fluffy poodle head core + extra cheek puffs
        head = createSphere(0.9, matMain);
        head.scale.set(1.1, 0.95, 1.0);
        headGroup.add(head);

        const headPuffs = [
            [0, 0.65, 0.15, 0.58],    // Topknot hair puff
            [0.45, 0.15, 0.35, 0.45],  // L Cheek puff
            [-0.45, 0.15, 0.35, 0.45], // R Cheek puff
            [0, -0.35, 0.28, 0.45]     // Chin fluff
        ];
        headPuffs.forEach(([x, y, z, r]) => {
            const p = createSphere(r, matMain);
            p.position.set(x, y, z);
            head.add(p);
        });
    } else {
        head = createSphere(1.5, matMain);
        if (type === 'bulldog') head.scale.set(1.25, 0.9, 1.05);
        else if (type === 'cat') head.scale.set(1.0, 0.85, 0.9);
        else if (type === 'parrot') head.scale.set(0.95, 0.95, 0.95);
        else head.scale.set(1.1, 0.95, 1.0);
        headGroup.add(head);
    }

    // Head details (fluff, cheeks, crest, eyebrows)
    if (type === 'shiba') {
        // Shiba signature cream cheek spots
        const cheekL = createSphere(0.45, matAccent);
        cheekL.scale.set(0.8, 0.6, 0.5);
        cheekL.position.set(0.7, -0.3, 0.8);
        headGroup.add(cheekL);
        
        const cheekR = createSphere(0.45, matAccent);
        cheekR.scale.set(0.8, 0.6, 0.5);
        cheekR.position.set(-0.7, -0.3, 0.8);
        headGroup.add(cheekR);

        // White eyebrow dots (Maro-mayu)
        const eyebrowL = createSphere(0.13, matAccent);
        eyebrowL.scale.set(1.3, 0.8, 0.5);
        eyebrowL.position.set(0.26, 0.45, 0.9);
        eyebrowL.rotation.z = -0.1;
        headGroup.add(eyebrowL);

        const eyebrowR = createSphere(0.13, matAccent);
        eyebrowR.scale.set(1.3, 0.8, 0.5);
        eyebrowR.position.set(-0.26, 0.45, 0.9);
        eyebrowR.rotation.z = 0.1;
        headGroup.add(eyebrowR);
    } else if (type === 'parrot') {
        // White skin eye patches
        const cheekL = createSphere(0.55, new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.9}));
        cheekL.scale.set(0.1, 0.85, 0.85);
        cheekL.position.set(0.82, 0.15, 0.25);
        headGroup.add(cheekL);

        const cheekR = createSphere(0.55, new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.9}));
        cheekR.scale.set(0.1, 0.85, 0.85);
        cheekR.position.set(-0.82, 0.15, 0.25);
        headGroup.add(cheekR);

        // Multi-layered colorful feather crest
        const crestColors = [0xef4444, 0xeab308, 0x2563eb]; // Red, Yellow, Blue
        for (let i = 0; i < 3; i++) {
            const crest = createSphere(0.24, new THREE.MeshStandardMaterial({ color: crestColors[i], roughness: 0.9 }));
            crest.scale.set(0.25, 0.9, 0.45);
            crest.position.set(0, 0.85 + i * 0.15, -0.2 - i * 0.1);
            crest.rotation.x = -0.3 - i * 0.35;
            headGroup.add(crest);
        }
    } else if (type === 'bulldog') {
        // Bulldog forehead and snout wrinkle folds
        const w1 = createSphere(0.4, matMain);
        w1.scale.set(1.2, 0.2, 0.3);
        w1.position.set(0, 0.42, 0.9);
        headGroup.add(w1);

        const w2 = createSphere(0.4, matMain);
        w2.scale.set(0.9, 0.18, 0.25);
        w2.position.set(0, 0.25, 0.95);
        headGroup.add(w2);
    } else if (type === 'cat') {
        // Cat head tabby stripes
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8 });
        for (let i = -1; i <= 1; i++) {
            const stripe = createSphere(0.06, stripeMat);
            stripe.scale.set(0.25, 0.9, 2.5);
            stripe.position.set(i * 0.28, 0.55, 0.4);
            stripe.rotation.x = 0.45;
            head.add(stripe);
        }
    }

    // --- Snout & Mouth (or Beak for Parrot) ---
    if (type === 'parrot') {
        // Hooked parrot beak (Upper hooks down over lower beak)
        const beakUpperGeo = new THREE.SphereGeometry(0.46, 32, 32);
        const beakUpper = new THREE.Mesh(beakUpperGeo, matDark);
        beakUpper.scale.set(0.72, 1.25, 1.35);
        beakUpper.position.set(0, -0.05, 0.88);
        beakUpper.rotation.x = 0.4;
        headGroup.add(beakUpper);
        beak = beakUpper;

        const beakLowerGeo = new THREE.SphereGeometry(0.3, 32, 32);
        const beakLower = new THREE.Mesh(beakLowerGeo, matDark);
        beakLower.scale.set(0.65, 0.5, 0.8);
        beakLower.position.set(0, -0.45, 0.72);
        headGroup.add(beakLower);

        // Dummy snout for bone fetch
        const dummySnout = new THREE.Group();
        dummySnout.position.set(0, -0.2, 0.95);
        headGroup.add(dummySnout);
        snout = dummySnout;
        
        nose = new THREE.Group();
        tongue = new THREE.Group();
    } else {
        if (type === 'bulldog') {
            // Bulldog flat face with jowls
            snout = createSphere(0.7, matAccent);
            snout.scale.set(1.2, 0.55, 0.5);
            snout.position.set(0, -0.3, 0.95);
            headGroup.add(snout);

            const jowlL = createSphere(0.38, matAccent);
            jowlL.scale.set(0.8, 1.25, 0.8);
            jowlL.position.set(0.42, -0.25, 0.1);
            snout.add(jowlL);

            const jowlR = createSphere(0.38, matAccent);
            jowlR.scale.set(0.8, 1.25, 0.8);
            jowlR.position.set(-0.42, -0.25, 0.1);
            snout.add(jowlR);

            // Underbite chin + 2 tiny teeth
            const chin = createSphere(0.42, matAccent);
            chin.scale.set(1.05, 0.5, 0.85);
            chin.position.set(0, -0.55, 0.85);
            headGroup.add(chin);

            const toothGeo = new THREE.ConeGeometry(0.06, 0.22, 8);
            const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
            const tL = new THREE.Mesh(toothGeo, toothMat);
            tL.rotation.x = -0.15;
            tL.position.set(0.24, 0.18, 0.2);
            chin.add(tL);
            const tR = new THREE.Mesh(toothGeo, toothMat);
            tR.rotation.x = -0.15;
            tR.position.set(-0.24, 0.18, 0.2);
            chin.add(tR);
        } else if (type === 'cat') {
            // Cat ω whisker pads
            snout = new THREE.Group();
            headGroup.add(snout);

            const padL = createSphere(0.28, matAccent);
            padL.position.set(0.22, -0.22, 0.88);
            headGroup.add(padL);

            const padR = createSphere(0.28, matAccent);
            padR.position.set(-0.22, -0.22, 0.88);
            headGroup.add(padR);
        } else if (type === 'poodle') {
            // Sleek poodle snout
            snout = createSphere(0.6, matMain);
            snout.scale.set(0.65, 0.6, 0.95);
            snout.position.set(0, -0.2, 0.95);
            headGroup.add(snout);
        } else if (type === 'shiba') {
            // Shiba two-toned snout (White bottom, tan bridge)
            snout = createSphere(0.7, matAccent);
            snout.scale.set(1.2, 0.8, 1.0);
            snout.position.set(0, -0.2, 1.3);
            headGroup.add(snout);

            const bridge = createSphere(0.48, matMain);
            bridge.scale.set(0.95, 0.65, 0.95);
            bridge.position.set(0, 0.28, -0.05);
            snout.add(bridge);
        } else {
            snout = createSphere(0.7, matAccent);
            snout.scale.set(1.2, 0.8, 1.0);
            snout.position.set(0, -0.2, 1.3);
            headGroup.add(snout);
        }

        // Nose
        nose = createSphere(0.2, type === 'cat' ? matPink : matDark);
        if (type === 'cat') {
            nose.scale.set(0.55, 0.38, 0.38);
            nose.position.set(0, -0.08, 0.98);
            headGroup.add(nose); // mounted directly above pads
        } else if (type === 'bulldog') {
            nose.scale.set(1.3, 0.7, 0.7);
            nose.position.set(0, 0.32, 0.32);
            snout.add(nose);
        } else if (type === 'poodle') {
            nose.scale.set(0.85, 0.65, 0.65);
            nose.position.set(0, 0.28, 0.7);
            snout.add(nose);
        } else {
            nose.scale.set(1.2, 0.8, 0.8);
            nose.position.set(0, 0.3, 0.65);
            snout.add(nose);
        }

        // Tongue
        tongue = createSphere(0.25, matPink);
        tongue.scale.set(0.8, 0.3, 1.2);
        if (type === 'cat') {
            tongue.position.set(0, -0.32, 0.88);
            headGroup.add(tongue);
        } else {
            tongue.position.set(0, -0.4, 0.6);
            snout.add(tongue);
        }
        tongue.rotation.x = 0.4;
    }

    // --- Eyes ---
    const eyeGroupBase = new THREE.Group();
    headGroup.add(eyeGroupBase);

    if (type === 'parrot') {
        // Large cartoon bird eyes with pupils + bright reflection spheres
        const eyeLWhite = createSphere(0.34, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
        eyeLWhite.position.set(0.48, 0.32, 0.66);
        eyeGroupBase.add(eyeLWhite);
        const pupilL = createSphere(0.16, matDark);
        pupilL.position.set(0.06, 0.04, 0.24);
        eyeLWhite.add(pupilL);
        const hilightL = createSphere(0.06, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 }));
        hilightL.position.set(0.11, 0.11, 0.31);
        eyeLWhite.add(hilightL);
        eyeL = eyeLWhite;

        const eyeRWhite = createSphere(0.34, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
        eyeRWhite.position.set(-0.48, 0.32, 0.66);
        eyeGroupBase.add(eyeRWhite);
        const pupilR = createSphere(0.16, matDark);
        pupilR.position.set(-0.06, 0.04, 0.24);
        eyeRWhite.add(pupilR);
        const hilightR = createSphere(0.06, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 }));
        hilightR.position.set(-0.11, 0.11, 0.31);
        eyeRWhite.add(hilightR);
        eyeR = eyeRWhite;
    } else if (type === 'cat') {
        // Cat eyes (Almond-shaped green iris with slit pupil)
        const matCatEye = new THREE.MeshStandardMaterial({ color: 0xa3e635, roughness: 0.1, metalness: 0.1 });
        
        const catEyeL = createSphere(0.22, matCatEye);
        catEyeL.scale.set(1.2, 0.95, 0.95);
        catEyeL.position.set(0.46, 0.32, 0.82);
        catEyeL.rotation.z = -0.15; // tilted cute look
        eyeGroupBase.add(catEyeL);
        eyeL = createSphere(0.08, matDark);
        eyeL.scale.set(0.35, 1.1, 0.35); // Slit pupil
        eyeL.position.set(0, 0, 0.18);
        catEyeL.add(eyeL);
        eyeL = catEyeL;

        const catEyeR = createSphere(0.22, matCatEye);
        catEyeR.scale.set(1.2, 0.95, 0.95);
        catEyeR.position.set(-0.46, 0.32, 0.82);
        catEyeR.rotation.z = 0.15;
        eyeGroupBase.add(catEyeR);
        eyeR = createSphere(0.08, matDark);
        eyeR.scale.set(0.35, 1.1, 0.35);
        eyeR.position.set(0, 0, 0.18);
        catEyeR.add(eyeR);
        eyeR = catEyeR;
    } else {
        // Standard Dark Eyes
        eyeL = createSphere(0.18, matDark);
        eyeL.position.set(0.52, 0.4, 0.95);
        eyeGroupBase.add(eyeL);

        eyeR = createSphere(0.18, matDark);
        eyeR.position.set(-0.52, 0.4, 0.95);
        eyeGroupBase.add(eyeR);
    }

    // Blush
    blushL = createSphere(0.2, matPink);
    blushL.scale.set(1.5, 0.5, 0.5);
    blushL.position.set(0.72, 0.05, 0.88);
    headGroup.add(blushL);

    blushR = createSphere(0.2, matPink);
    blushR.scale.set(1.5, 0.5, 0.5);
    blushR.position.set(-0.72, 0.05, 0.88);
    headGroup.add(blushR);

    // Whiskers for Cats
    if (type === 'cat') {
        const wGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.9, 8);
        const wMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.2 });
        for (let i = 0; i < 3; i++) {
            const wL = new THREE.Mesh(wGeo, wMat);
            wL.rotation.z = Math.PI / 2 + (i - 1) * 0.12;
            wL.rotation.y = 0.25;
            wL.position.set(0.55 + i * 0.03, -0.22 + (i - 1) * 0.08, 0.8);
            headGroup.add(wL);
            whiskersL.push(wL);

            const wR = new THREE.Mesh(wGeo, wMat);
            wR.rotation.z = -Math.PI / 2 - (i - 1) * 0.12;
            wR.rotation.y = -0.25;
            wR.position.set(-0.55 - i * 0.03, -0.22 + (i - 1) * 0.08, 0.8);
            headGroup.add(wR);
            whiskersR.push(wR);
        }
    }

    // --- Ears (or empty group for bird) ---
    earLGroup = new THREE.Group();
    earRGroup = new THREE.Group();
    headGroup.add(earLGroup);
    headGroup.add(earRGroup);

    if (type === 'shiba') {
        // Triangular Shiba ears with pink inner layer
        earLGroup.position.set(0.85, 0.85, 0.2);
        const earLMesh = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.9, 4), matMain);
        earLMesh.scale.set(0.7, 1.1, 0.4);
        earLMesh.rotation.set(0.2, 0, -0.4);
        earLGroup.add(earLMesh);
        
        const innerL = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 4), matPink);
        innerL.scale.set(0.65, 0.95, 0.25);
        innerL.position.set(0, -0.05, 0.16);
        earLMesh.add(innerL);
        earL = earLMesh;

        earRGroup.position.set(-0.85, 0.85, 0.2);
        const earRMesh = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.9, 4), matMain);
        earRMesh.scale.set(0.7, 1.1, 0.4);
        earRMesh.rotation.set(0.2, 0, 0.4);
        earRGroup.add(earRMesh);

        const innerR = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 4), matPink);
        innerR.scale.set(0.65, 0.95, 0.25);
        innerR.position.set(0, -0.05, 0.16);
        earRMesh.add(innerR);
        earR = earRMesh;
    } else if (type === 'cat') {
        // Pointy cat ears with pink insides
        earLGroup.position.set(0.85, 0.85, 0.1);
        const earLMesh = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.85, 4), matMain);
        earLMesh.scale.set(0.7, 1.1, 0.45);
        earLMesh.rotation.set(0.1, 0, -0.3);
        earLGroup.add(earLMesh);
        
        const innerL = createSphere(0.2, matPink);
        innerL.scale.set(0.65, 0.85, 0.25);
        innerL.position.set(0, -0.05, 0.18);
        earLMesh.add(innerL);
        earL = earLMesh;

        earRGroup.position.set(-0.85, 0.85, 0.1);
        const earRMesh = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.85, 4), matMain);
        earRMesh.scale.set(0.7, 1.1, 0.45);
        earRMesh.rotation.set(0.1, 0, 0.3);
        earRGroup.add(earRMesh);

        const innerR = createSphere(0.2, matPink);
        innerR.scale.set(0.65, 0.85, 0.25);
        innerR.position.set(0, -0.05, 0.18);
        earRMesh.add(innerR);
        earR = earRMesh;
    } else if (type === 'poodle') {
        // Long fluffy dangling poodle ears (3 overlapping fluff spheres)
        earLGroup.position.set(1.1, 0.6, 0.1);
        const earLMesh = createSphere(0.45, matEars);
        earLMesh.scale.set(0.6, 1.0, 0.7);
        earLMesh.position.set(0, -0.3, 0);
        earLGroup.add(earLMesh);
        
        const ep1 = createSphere(0.42, matEars); ep1.position.set(0, -0.4, 0.05); earLMesh.add(ep1);
        const ep2 = createSphere(0.38, matEars); ep2.position.set(0, -0.8, 0.1); earLMesh.add(ep2);
        const ep3 = createSphere(0.32, matEars); ep3.position.set(0, -1.1, 0.12); earLMesh.add(ep3);
        earL = earLMesh;

        earRGroup.position.set(-1.1, 0.6, 0.1);
        const earRMesh = createSphere(0.45, matEars);
        earRMesh.scale.set(0.6, 1.0, 0.7);
        earRMesh.position.set(0, -0.3, 0);
        earRGroup.add(earRMesh);
        
        const epR1 = createSphere(0.42, matEars); epR1.position.set(0, -0.4, 0.05); earRMesh.add(epR1);
        const epR2 = createSphere(0.38, matEars); epR2.position.set(0, -0.8, 0.1); earRMesh.add(epR2);
        const epR3 = createSphere(0.32, matEars); epR3.position.set(0, -1.1, 0.12); earRMesh.add(epR3);
        earR = earRMesh;
    } else if (type === 'bulldog') {
        // Bulldog folded floppy rose ears
        earLGroup.position.set(1.1, 0.7, 0.1);
        const earLMesh = createSphere(0.45, matEars);
        earLMesh.scale.set(0.5, 0.6, 0.75);
        earLMesh.position.set(0, -0.2, 0.1);
        earLMesh.rotation.set(-0.4, 0, -0.3); // Rose ear fold
        earLGroup.add(earLMesh);
        earL = earLMesh;

        earRGroup.position.set(-1.1, 0.7, 0.1);
        const earRMesh = createSphere(0.45, matEars);
        earRMesh.scale.set(0.5, 0.6, 0.75);
        earRMesh.position.set(0, -0.2, 0.1);
        earRMesh.rotation.set(-0.4, 0, 0.3);
        earRGroup.add(earRMesh);
        earR = earRMesh;
    } else {
        // Parrot - dummy groups
        earL = new THREE.Group();
        earLGroup.add(earL);
        earR = new THREE.Group();
        earRGroup.add(earR);
    }

    // --- Legs ---
    function createStandardLeg(colorLeg, colorPaw) {
        const legGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.0, 16);
        const legM = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: colorLeg, roughness: 0.8 }));
        legM.castShadow = true;

        const pawM = createSphere(0.4, new THREE.MeshStandardMaterial({ color: colorPaw, roughness: 0.8 }));
        pawM.scale.set(1.1, 0.8, 1.2);
        pawM.position.set(0, -0.5, 0.1);
        legM.add(pawM);
        
        return legM;
    }

    if (type === 'parrot') {
        // Bird stands on 2 thin legs with talons grasping a bar/perch
        const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.9, 16);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.7 });
        
        legBL = new THREE.Mesh(legGeo, legMat);
        legBL.castShadow = true;
        // 2 front claws, 1 back claw
        const clawGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8);
        const c1L = new THREE.Mesh(clawGeo, legMat); c1L.rotation.x = Math.PI/2; c1L.rotation.y = 0.2; c1L.position.set(0.08, -0.45, 0.18); legBL.add(c1L);
        const c2L = new THREE.Mesh(clawGeo, legMat); c2L.rotation.x = Math.PI/2; c2L.rotation.y = -0.2; c2L.position.set(-0.08, -0.45, 0.18); legBL.add(c2L);
        const c3L = new THREE.Mesh(clawGeo, legMat); c3L.rotation.x = -Math.PI/2; c3L.position.set(0, -0.45, -0.18); legBL.add(c3L);
        legBL.position.set(cfg.legBL.x, cfg.legBL.y, cfg.legBL.z);
        dogGroup.add(legBL);

        legBR = new THREE.Mesh(legGeo, legMat);
        legBR.castShadow = true;
        const c1R = new THREE.Mesh(clawGeo, legMat); c1R.rotation.x = Math.PI/2; c1R.rotation.y = 0.2; c1R.position.set(0.08, -0.45, 0.18); legBR.add(c1R);
        const c2R = new THREE.Mesh(clawGeo, legMat); c2R.rotation.x = Math.PI/2; c2R.rotation.y = -0.2; c2R.position.set(-0.08, -0.45, 0.18); legBR.add(c2R);
        const c3R = new THREE.Mesh(clawGeo, legMat); c3R.rotation.x = -Math.PI/2; c3R.position.set(0, -0.45, -0.18); legBR.add(c3R);
        legBR.position.set(cfg.legBR.x, cfg.legBR.y, cfg.legBR.z);
        dogGroup.add(legBR);

        // Dummy invisible front legs to keep loop code happy
        legFL = new THREE.Group();
        legFR = new THREE.Group();
        legFL.scale.set(0.001, 0.001, 0.001);
        legFR.scale.set(0.001, 0.001, 0.001);
        dogGroup.add(legFL);
        dogGroup.add(legFR);

        // Multi-layered feather wings on the sides
        wingLGroup = new THREE.Group();
        wingLGroup.position.set(0.95, 1.5, 0);
        dogGroup.add(wingLGroup);
        // Red base wing
        const wLRed = createSphere(0.65, new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.8 }));
        wLRed.scale.set(0.18, 1.25, 0.85);
        wLRed.rotation.z = -0.1;
        wingLGroup.add(wLRed);
        // Yellow mid layers
        const wLYellow = createSphere(0.55, new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.8 }));
        wLYellow.scale.set(0.2, 0.95, 0.78);
        wLYellow.position.set(0.08, -0.2, 0.15);
        wingLGroup.add(wLYellow);
        // Blue tips
        const wLBlue = createSphere(0.45, new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.8 }));
        wLBlue.scale.set(0.22, 0.7, 0.7);
        wLBlue.position.set(0.12, -0.5, 0.25);
        wingLGroup.add(wLBlue);
        wingL = wLRed;

        wingRGroup = new THREE.Group();
        wingRGroup.position.set(-0.95, 1.5, 0);
        dogGroup.add(wingRGroup);
        // Red base wing
        const wRRed = createSphere(0.65, new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.8 }));
        wRRed.scale.set(0.18, 1.25, 0.85);
        wRRed.rotation.z = 0.1;
        wingRGroup.add(wRRed);
        // Yellow mid layers
        const wRYellow = createSphere(0.55, new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.8 }));
        wRYellow.scale.set(0.2, 0.95, 0.78);
        wRYellow.position.set(-0.08, -0.2, 0.15);
        wingRGroup.add(wRYellow);
        // Blue tips
        const wRBlue = createSphere(0.45, new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.8 }));
        wRBlue.scale.set(0.22, 0.7, 0.7);
        wRBlue.position.set(-0.12, -0.5, 0.25);
        wingRGroup.add(wRBlue);
        wingR = wRRed;
    } else {
        let pawColor = colorAccent;
        if (type === 'poodle') pawColor = colorMain;

        legFL = createStandardLeg(colorMain, pawColor);
        legFR = createStandardLeg(colorMain, pawColor);
        legBL = createStandardLeg(colorMain, pawColor);
        legBR = createStandardLeg(colorMain, pawColor);

        // Puffy ankle cuffs for Poodle
        if (type === 'poodle') {
            const cuffFL = createSphere(0.48, matMain); cuffFL.position.set(0, -0.28, 0.08); legFL.add(cuffFL);
            const cuffFR = createSphere(0.48, matMain); cuffFR.position.set(0, -0.28, 0.08); legFR.add(cuffFR);
            const cuffBL = createSphere(0.48, matMain); cuffBL.position.set(0, -0.28, 0.08); legBL.add(cuffBL);
            const cuffBR = createSphere(0.48, matMain); cuffBR.position.set(0, -0.28, 0.08); legBR.add(cuffBR);
        }

        legFL.position.set(cfg.legFL.x, cfg.legFL.y, cfg.legFL.z);
        legFR.position.set(cfg.legFR.x, cfg.legFR.y, cfg.legFR.z);
        legBL.position.set(cfg.legBL.x, cfg.legBL.y, cfg.legBL.z);
        legBR.position.set(cfg.legBR.x, cfg.legBR.y, cfg.legBR.z);
        
        legFL.scale.set(cfg.legFL.sx, cfg.legFL.sy, cfg.legFL.sz);
        legFR.scale.set(cfg.legFR.sx, cfg.legFR.sy, cfg.legFR.sz);
        legBL.scale.set(cfg.legBL.sx, cfg.legBL.sy, cfg.legBL.sz);
        legBR.scale.set(cfg.legBR.sx, cfg.legBR.sy, cfg.legBR.sz);

        // Apply visual tilt to bulldog legs
        legFL.rotation.z = cfg.legFL.rz;
        legFR.rotation.z = cfg.legFR.rz;

        dogGroup.add(legFL);
        dogGroup.add(legFR);
        dogGroup.add(legBL);
        dogGroup.add(legBR);
    }

    // --- Tail Group & Tail ---
    tailGroup = new THREE.Group();
    tailGroup.position.set(cfg.tailGroup.x, cfg.tailGroup.y, cfg.tailGroup.z);
    dogGroup.add(tailGroup);

    if (type === 'shiba') {
        // Curled Shiba tail with white tip (Double-sphere curled construction)
        tail = createSphere(0.45, matEars);
        tail.scale.set(0.95, 1.3, 0.95);
        tail.position.set(0, 0.45, -0.2);
        tail.rotation.x = -1.55;
        
        const tailMid = createSphere(0.38, matEars);
        tailMid.position.set(0, 0.4, 0.22);
        tail.add(tailMid);

        const tailTip = createSphere(0.32, matAccent);
        tailTip.position.set(0, 0.32, 0.28);
        tailMid.add(tailTip);

        tailGroup.add(tail);
    } else if (type === 'poodle') {
        // Fluffy poodle tail (thin stem + puffy puff pom-pom)
        const tailBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.65, 8), matMain);
        tailBase.position.set(0, 0.28, -0.28);
        tailBase.rotation.x = 0.8;
        tailGroup.add(tailBase);
        
        const tailPuff = createSphere(0.45, matEars);
        tailPuff.position.set(0, 0.4, 0);
        tailBase.add(tailPuff);
        tail = tailBase;
    } else if (type === 'bulldog') {
        // Short stubby corkscrew tail
        tail = createSphere(0.32, matEars);
        tail.scale.set(0.65, 0.65, 0.65);
        tail.position.set(0, 0.18, -0.18);
        tail.rotation.x = -0.3;
        tailGroup.add(tail);
    } else if (type === 'cat') {
        // Cat long curved segmented tail (4 chain-linked spheres)
        const t1 = createSphere(0.22, matMain);
        t1.position.set(0, 0.18, -0.18);
        tailGroup.add(t1);
        
        const t2 = createSphere(0.19, matMain); t2.position.set(0, 0.26, 0.08); t1.add(t2);
        const t3 = createSphere(0.17, matMain); t3.position.set(0, 0.26, 0.15); t2.add(t3);
        const t4 = createSphere(0.15, matMain); t4.position.set(0, 0.22, 0.2); t3.add(t4);
        
        tail = t1;
    } else if (type === 'parrot') {
        // Multi-feathered flat parrot tail
        const tailCenter = createSphere(0.4, matMain);
        tailCenter.scale.set(0.8, 1.8, 0.15);
        tailCenter.position.set(0, -0.4, -0.65);
        tailCenter.rotation.x = -0.75;
        tailGroup.add(tailCenter);

        const tailL = createSphere(0.32, new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.8 }));
        tailL.scale.set(0.7, 1.5, 0.15);
        tailL.position.set(0.22, -0.45, -0.6);
        tailL.rotation.x = -0.75;
        tailL.rotation.y = -0.15;
        tailGroup.add(tailL);

        const tailR = createSphere(0.32, new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.8 }));
        tailR.scale.set(0.7, 1.5, 0.15);
        tailR.position.set(-0.22, -0.45, -0.6);
        tailR.rotation.x = -0.75;
        tailR.rotation.y = 0.15;
        tailGroup.add(tailR);

        tail = tailCenter;
    }

    // Trigger shape size parameters update
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
    
    // Animate to current action
    window.setDogAnimation(currentAnim);
};

// --- Bone Mesh ---
const boneGroup = new THREE.Group();
const boneMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9, metalness: 0.05 });
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
    const cfg = PET_BASE_CONFIGS[petType] || PET_BASE_CONFIGS.shiba;

    // Reset positions/rotations to species baseline
    dogGroup.position.set(0, 0, 0);
    dogGroup.rotation.set(0, 0, 0);
    if (headGroup) {
        headGroup.position.set(cfg.headGroup.x, cfg.headGroup.y, cfg.headGroup.z);
        headGroup.rotation.set(cfg.headGroup.rx, cfg.headGroup.ry, cfg.headGroup.rz);
    }
    if (tailGroup) {
        tailGroup.position.set(cfg.tailGroup.x, cfg.tailGroup.y, cfg.tailGroup.z);
        tailGroup.rotation.set(cfg.tailGroup.rx, cfg.tailGroup.ry, cfg.tailGroup.rz);
    }
    if (earLGroup) { earLGroup.rotation.z = -0.3; earLGroup.rotation.x = 0.2; }
    if (earRGroup) { earRGroup.rotation.z = 0.3; earRGroup.rotation.x = 0.2; }
    if (tongue && tongue.scale) tongue.scale.set(0.8, 0.3, 1.2);

    // Eye state logic
    if (eyeL) eyeL.scale.y = 1;
    if (eyeR) eyeR.scale.y = 1;

    // Bone Visibility
    if (animName !== 'fetch') {
        boneGroup.visible = false;
    }

    if (animName === 'sleep') {
        // Lay down
        dogGroup.position.y = -0.8;
        if (headGroup) { headGroup.rotation.x = 0.5; headGroup.rotation.z = 0.2; }
        if (eyeL) eyeL.scale.y = 0.1;
        if (eyeR) eyeR.scale.y = 0.1;
        if (earLGroup) earLGroup.rotation.z = -0.8;
        if (earRGroup) earRGroup.rotation.z = 0.5;
        if (tailGroup) tailGroup.rotation.x = -0.5;

        // Splay legs relative to baseline configurations
        if (legFL && petType !== 'parrot') {
            legFL.rotation.x = -1.0;
            legFL.position.set(cfg.legFL.x, cfg.legFL.y, cfg.legFL.z + 0.5);
            legFL.scale.set(cfg.legFL.sx, cfg.legFL.sy, cfg.legFL.sz);
        }
        if (legFR && petType !== 'parrot') {
            legFR.rotation.x = -1.0;
            legFR.position.set(cfg.legFR.x, cfg.legFR.y, cfg.legFR.z + 0.5);
            legFR.scale.set(cfg.legFR.sx, cfg.legFR.sy, cfg.legFR.sz);
        }
        if (legBL) {
            legBL.rotation.x = 1.0;
            legBL.position.set(cfg.legBL.x, cfg.legBL.y, cfg.legBL.z - 0.7);
            legBL.scale.set(cfg.legBL.sx, cfg.legBL.sy, cfg.legBL.sz);
        }
        if (legBR) {
            legBR.rotation.x = 1.0;
            legBR.position.set(cfg.legBR.x, cfg.legBR.y, cfg.legBR.z - 0.7);
            legBR.scale.set(cfg.legBR.sx, cfg.legBR.sy, cfg.legBR.sz);
        }

        if (tongue && tongue.scale) tongue.scale.set(0.01, 0.01, 0.01);
    } else if (animName === 'sit') {
        dogGroup.position.y = -0.5;
        
        if (legFL && petType !== 'parrot') {
            legFL.rotation.x = -0.4;
            legFL.position.set(cfg.legFL.x, cfg.legFL.y, cfg.legFL.z + 0.2);
            legFL.scale.set(cfg.legFL.sx, cfg.legFL.sy, cfg.legFL.sz);
        }
        if (legFR && petType !== 'parrot') {
            legFR.rotation.x = -0.4;
            legFR.position.set(cfg.legFR.x, cfg.legFR.y, cfg.legFR.z + 0.2);
            legFR.scale.set(cfg.legFR.sx, cfg.legFR.sy, cfg.legFR.sz);
        }
        if (legBL) {
            legBL.rotation.x = -1.2;
            legBL.position.set(cfg.legBL.x, cfg.legBL.y - 0.3, cfg.legBL.z);
            legBL.scale.set(cfg.legBL.sx, cfg.legBL.sy, cfg.legBL.sz);
        }
        if (legBR) {
            legBR.rotation.x = -1.2;
            legBR.position.set(cfg.legBR.x, cfg.legBR.y - 0.3, cfg.legBR.z);
            legBR.scale.set(cfg.legBR.sx, cfg.legBR.sy, cfg.legBR.sz);
        }
        if (headGroup) headGroup.rotation.x = -0.1;
        if (tailGroup) tailGroup.rotation.x = -0.3;
    } else if (animName === 'paw') {
        dogGroup.position.y = -0.3;
        
        if (legFL && petType !== 'parrot') {
            legFL.rotation.x = -1.4;
            legFL.position.set(cfg.legFL.x, cfg.legFL.y + 0.6, cfg.legFL.z + 0.2);
            legFL.scale.set(cfg.legFL.sx, cfg.legFL.sy, cfg.legFL.sz);
        }
        if (legFR && petType !== 'parrot') {
            legFR.rotation.x = 0;
            legFR.position.set(cfg.legFR.x, cfg.legFR.y, cfg.legFR.z);
            legFR.scale.set(cfg.legFR.sx, cfg.legFR.sy, cfg.legFR.sz);
        }
        if (legBL) {
            legBL.rotation.x = -0.8;
            legBL.position.set(cfg.legBL.x, cfg.legBL.y - 0.2, cfg.legBL.z);
            legBL.scale.set(cfg.legBL.sx, cfg.legBL.sy, cfg.legBL.sz);
        }
        if (legBR) {
            legBR.rotation.x = -0.8;
            legBR.position.set(cfg.legBR.x, cfg.legBR.y - 0.2, cfg.legBR.z);
            legBR.scale.set(cfg.legBR.sx, cfg.legBR.sy, cfg.legBR.sz);
        }
        if (headGroup) headGroup.rotation.z = -0.15;
    } else if (animName === 'fetch') {
        fetchPhase = 'throwing';
        fetchTime = 0;
        boneGroup.visible = true;
        boneGroup.position.set(0, 5, 8);
        boneGroup.rotation.set(Math.random()*2, Math.random()*2, Math.random()*2);
    } else {
        // Normal alignment restore
        if (legFL) {
            legFL.rotation.set(cfg.legFL.rx, cfg.legFL.ry, cfg.legFL.rz);
            legFL.position.set(cfg.legFL.x, cfg.legFL.y, cfg.legFL.z);
            legFL.scale.set(cfg.legFL.sx, cfg.legFL.sy, cfg.legFL.sz);
        }
        if (legFR) {
            legFR.rotation.set(cfg.legFR.rx, cfg.legFR.ry, cfg.legFR.rz);
            legFR.position.set(cfg.legFR.x, cfg.legFR.y, cfg.legFR.z);
            legFR.scale.set(cfg.legFR.sx, cfg.legFR.sy, cfg.legFR.sz);
        }
        if (legBL) {
            legBL.rotation.set(cfg.legBL.rx, cfg.legBL.ry, cfg.legBL.rz);
            legBL.position.set(cfg.legBL.x, cfg.legBL.y, cfg.legBL.z);
            legBL.scale.set(cfg.legBL.sx, cfg.legBL.sy, cfg.legBL.sz);
        }
        if (legBR) {
            legBR.rotation.set(cfg.legBR.rx, cfg.legBR.ry, cfg.legBR.rz);
            legBR.position.set(cfg.legBR.x, cfg.legBR.y, cfg.legBR.z);
            legBR.scale.set(cfg.legBR.sx, cfg.legBR.sy, cfg.legBR.sz);
        }
    }
};

window.updateDogShape = function (params) {
    const type = window.activePetType || 'shiba';
    const cfg = PET_BASE_CONFIGS[type] || PET_BASE_CONFIGS.shiba;

    if (params.body && body && belly && tailGroup && legBL && legBR) {
        let s = params.body;
        body.scale.set(cfg.bodyScale.x, cfg.bodyScale.y, cfg.bodyScale.z * s);
        belly.scale.set(cfg.bellyScale.x, cfg.bellyScale.y, cfg.bellyScale.z * s);
        tailGroup.position.z = cfg.tailGroup.z * s;
        if (type !== 'parrot') {
            legBL.position.z = cfg.legBL.z * s;
            legBR.position.z = cfg.legBR.z * s;
        }
    }

    if (params.head && headGroup) {
        let s = params.head;
        headGroup.scale.set(s, s, s);
    }

    if (params.ears && earL && earR) {
        let s = params.ears;
        if (type === 'shiba') {
            earL.scale.set(0.7, 1.1 * s, 0.4);
            earR.scale.set(0.7, 1.1 * s, 0.4);
        } else if (type === 'cat') {
            earL.scale.set(0.7, 1.1 * s, 0.45);
            earR.scale.set(0.7, 1.1 * s, 0.45);
        } else if (type === 'poodle') {
            earL.scale.set(0.6, 1.0 * s, 0.7);
            earR.scale.set(0.6, 1.0 * s, 0.7);
        } else if (type === 'bulldog') {
            earL.scale.set(0.5, 0.6 * s, 0.75);
            earR.scale.set(0.5, 0.6 * s, 0.75);
        }
    }

    if (params.legs && legFL && legFR && legBL && legBR) {
        let s = params.legs;
        if (type === 'parrot') {
            legBL.scale.y = cfg.legBL.sy * s;
            legBR.scale.y = cfg.legBR.sy * s;
            if (legBL.children[0]) legBL.children[0].position.y = -0.45 * s;
            if (legBR.children[0]) legBR.children[0].position.y = -0.45 * s;
        } else {
            legFL.scale.y = cfg.legFL.sy * s;
            legFR.scale.y = cfg.legFR.sy * s;
            legBL.scale.y = cfg.legBL.sy * s;
            legBR.scale.y = cfg.legBR.sy * s;
        }
        let heightDiff = (s - 1.0) * 0.5;
        dogGroup.position.y = heightDiff;

        if (currentAnim === 'sleep') {
            dogGroup.position.y = -0.8;
        } else if (currentAnim === 'sit') {
            dogGroup.position.y = -0.5 + heightDiff;
        } else if (currentAnim === 'paw') {
            dogGroup.position.y = -0.3 + heightDiff;
        }
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
    const cfg = PET_BASE_CONFIGS[petType] || PET_BASE_CONFIGS.shiba;

    if (currentAnim === 'idle' && body && headGroup && tailGroup && earLGroup && earRGroup) {
        // Breathing
        body.scale.y = cfg.bodyScale.y + Math.sin(animTime * 2) * 0.02;
        body.scale.x = cfg.bodyScale.x + Math.sin(animTime * 2) * 0.01;

        headGroup.rotation.y = Math.sin(animTime * 1.5) * 0.15;
        headGroup.rotation.x = Math.sin(animTime * 1.0) * 0.05;
        tailGroup.rotation.y = Math.sin(animTime * 4) * 0.3;
        
        if (petType !== 'parrot') {
            earLGroup.rotation.z = (petType === 'poodle' ? -0.1 : (petType === 'bulldog' ? -0.4 : -0.3)) + Math.sin(animTime * 2) * 0.05;
            earRGroup.rotation.z = (petType === 'poodle' ? 0.1 : (petType === 'bulldog' ? 0.4 : 0.3)) - Math.sin(animTime * 2) * 0.05;
        }
        
        if (tongue && tongue.scale && petType !== 'parrot') {
            tongue.scale.z = 1.2 + Math.abs(Math.sin(animTime * 5)) * 0.3;
        }

        // Blinking
        if (Math.random() < 0.01 && eyeL && eyeR) {
            eyeL.scale.y = 0.1;
            eyeR.scale.y = 0.1;
            setTimeout(() => {
                if (currentAnim !== 'sleep' && currentAnim !== 'happy' && eyeL && eyeR) { 
                    eyeL.scale.y = 1; 
                    eyeR.scale.y = 1; 
                }
            }, 150);
        }

    } else if (currentAnim === 'happy' && dogGroup && tailGroup && headGroup && earLGroup && earRGroup) {
        // Jumping up and down
        dogGroup.position.y = Math.abs(Math.sin(animTime * 10)) * 1.0;
        tailGroup.rotation.y = Math.sin(animTime * 20) * 0.8;
        headGroup.rotation.x = -0.2 + Math.sin(animTime * 10) * 0.1;
        
        if (petType !== 'parrot') {
            earLGroup.rotation.z = (petType === 'poodle' ? -0.3 : (petType === 'bulldog' ? -0.5 : -0.4)) + Math.sin(animTime * 10) * 0.2;
            earRGroup.rotation.z = (petType === 'poodle' ? 0.3 : (petType === 'bulldog' ? 0.5 : 0.4)) - Math.sin(animTime * 10) * 0.2;
        }

        if (eyeL && eyeR) {
            eyeL.scale.y = 0.3;
            eyeR.scale.y = 0.3;
        }
        if (tongue && tongue.scale && petType !== 'parrot') {
            tongue.scale.z = 1.4 + Math.abs(Math.sin(animTime * 15)) * 0.4;
        }

    } else if (currentAnim === 'sleep' && body && earLGroup) {
        // Slow shallow breathing
        body.scale.y = cfg.bodyScale.y + Math.sin(animTime * 1.5) * 0.02;
        body.scale.x = cfg.bodyScale.x + Math.sin(animTime * 1.5) * 0.01;
        if (petType !== 'parrot') {
            earLGroup.rotation.z = (petType === 'poodle' ? -0.4 : (petType === 'bulldog' ? -0.6 : -0.8)) + Math.sin(animTime * 1.5) * 0.02;
        }

    } else if (currentAnim === 'sit' && body && headGroup && tailGroup) {
        body.scale.y = cfg.bodyScale.y + Math.sin(animTime * 2) * 0.02;
        headGroup.rotation.y = Math.sin(animTime * 1.2) * 0.1;
        tailGroup.rotation.y = Math.sin(animTime * 3) * 0.15;

    } else if (currentAnim === 'paw' && legFL && tailGroup && headGroup) {
        if (petType !== 'parrot') {
            legFL.rotation.z = Math.sin(animTime * 8) * 0.15;
        }
        tailGroup.rotation.y = Math.sin(animTime * 15) * 0.6;
        headGroup.rotation.y = Math.sin(animTime * 1.0) * 0.1;

    } else if (currentAnim === 'fetch') {
        fetchTime += delta;

        if (fetchPhase === 'throwing') {
            let t = Math.min(fetchTime / 1.0, 1.0);
            let start = new THREE.Vector3(0, 5, 8);
            let end = new THREE.Vector3(0, 0.2, 3);
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
                if (petType === 'parrot') {
                    legBL.rotation.x = Math.sin(fetchTime * 15) * 0.7;
                    legBR.rotation.x = -Math.sin(fetchTime * 15) * 0.7;
                } else {
                    legFL.rotation.x = Math.sin(fetchTime * 15) * 0.7;
                    legFR.rotation.x = -Math.sin(fetchTime * 15) * 0.7;
                    legBL.rotation.x = -Math.sin(fetchTime * 15) * 0.7;
                    legBR.rotation.x = Math.sin(fetchTime * 15) * 0.7;
                }
            }
            if (tailGroup) tailGroup.rotation.y = Math.sin(fetchTime * 25) * 0.8;

            if (t >= 1.0) {
                fetchPhase = 'returning';
                fetchTime = 0;
            }
        } else if (fetchPhase === 'returning') {
            let t = Math.min(fetchTime / 0.9, 1.0);
            dogGroup.position.z = THREE.MathUtils.lerp(1.6, 0, t);

            // Bone in mouth
            let snoutWorld = new THREE.Vector3();
            if (snout) {
                snout.getWorldPosition(snoutWorld);
                boneGroup.position.copy(snoutWorld);
            }
            if (headGroup) {
                boneGroup.rotation.copy(headGroup.rotation);
                boneGroup.rotation.y += Math.PI / 2;
            }

            // Run cycle
            if (legFL && legFR && legBL && legBR) {
                if (petType === 'parrot') {
                    legBL.rotation.x = Math.sin(fetchTime * 15) * 0.6;
                    legBR.rotation.x = -Math.sin(fetchTime * 15) * 0.6;
                } else {
                    legFL.rotation.x = Math.sin(fetchTime * 15) * 0.6;
                    legFR.rotation.x = -Math.sin(fetchTime * 15) * 0.6;
                    legBL.rotation.x = -Math.sin(fetchTime * 15) * 0.6;
                    legBR.rotation.x = Math.sin(fetchTime * 15) * 0.6;
                }
            }
            if (tailGroup) tailGroup.rotation.y = Math.sin(fetchTime * 25) * 0.8;

            if (t >= 1.0) {
                fetchPhase = 'happy';
                fetchTime = 0;
            }
        } else if (fetchPhase === 'happy') {
            boneGroup.visible = false;
            let t = Math.min(fetchTime / 1.5, 1.0);

            dogGroup.position.y = Math.abs(Math.sin(fetchTime * 10)) * 0.8;
            if (tailGroup) tailGroup.rotation.y = Math.sin(fetchTime * 25) * 0.8;
            if (headGroup) headGroup.rotation.x = -0.2 + Math.sin(fetchTime * 10) * 0.1;

            if (t >= 1.0) {
                window.setDogAnimation('idle');
            }
        }
    }

    // Parrot Wing Flapping Animation
    if (petType === 'parrot' && wingLGroup && wingRGroup) {
        if (currentAnim === 'idle') {
            wingLGroup.rotation.z = -1.1 - Math.sin(animTime * 2.0) * 0.08;
            wingRGroup.rotation.z = 1.1 + Math.sin(animTime * 2.0) * 0.08;
            wingLGroup.rotation.x = -0.1 + Math.sin(animTime * 1.0) * 0.04;
            wingRGroup.rotation.x = -0.1 + Math.sin(animTime * 1.0) * 0.04;
        } else if (currentAnim === 'happy' || fetchPhase === 'grabbing' || fetchPhase === 'returning') {
            // Rapid flapping
            wingLGroup.rotation.z = -0.7 - Math.sin(animTime * 25.0) * 0.6;
            wingRGroup.rotation.z = 0.7 + Math.sin(animTime * 25.0) * 0.6;
        } else if (currentAnim === 'sleep') {
            wingLGroup.rotation.z = -0.3;
            wingRGroup.rotation.z = 0.3;
            wingLGroup.rotation.x = -0.2;
            wingRGroup.rotation.x = -0.2;
        } else if (currentAnim === 'sit') {
            wingLGroup.rotation.z = -0.8 - Math.sin(animTime * 1.5) * 0.05;
            wingRGroup.rotation.z = 0.8 + Math.sin(animTime * 1.5) * 0.05;
        } else if (currentAnim === 'paw') {
            // Wave left wing
            wingLGroup.rotation.z = -0.6 - Math.sin(animTime * 15.0) * 0.5;
            wingRGroup.rotation.z = 0.9;
        }
    }

    // Cat organic tail wave
    if (petType === 'cat' && tail) {
        if (currentAnim === 'idle') {
            tail.rotation.z = Math.sin(animTime * 2) * 0.15;
            if (tail.children[0]) {
                tail.children[0].rotation.z = Math.sin(animTime * 2 + 0.5) * 0.15;
                if (tail.children[0].children[0]) {
                    tail.children[0].children[0].rotation.z = Math.sin(animTime * 2 + 1.0) * 0.15;
                }
            }
        }
    }

    if (currentAnim !== 'sleep' && currentAnim !== 'fetch' && dogGroup) {
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
