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
let wingLGroup, wingRGroup, wingL, wingR;
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
        colorMain = 0xe6b87d;   // Soft Tan
        colorAccent = 0xfff3e3; // Cream
        colorEars = 0x8c6239;   // Warm Dark Brown
        colorDark = 0x3e2723;   // Very Dark Brown (Eyes/Nose)
        colorPink = 0xff8a80;   // Tongue/Blush
    } else if (type === 'poodle') {
        colorMain = 0xd78a50;   // Apricot / Warm Teddy Bear Brown
        colorAccent = 0xfbe0c8; // Lighter Apricot
        colorEars = 0xd78a50;   // Apricot
        colorDark = 0x3e2723;   // Very Dark Brown
        colorPink = 0xff8a80;   // Tongue/Blush
    } else if (type === 'bulldog') {
        colorMain = 0xa19c95;   // Warm Grey
        colorAccent = 0xf5f3f0; // Off-white
        colorEars = 0x6b6762;   // Dark Slate Grey
        colorDark = 0x272727;   // Dark Grey
        colorPink = 0xff8a80;   // Tongue/Blush
    } else if (type === 'cat') {
        colorMain = 0xf5b072;   // Ginger / Orange-Cream
        colorAccent = 0xffffff; // White
        colorEars = 0xf5b072;   // Ginger
        colorDark = 0x272727;   // Dark Grey
        colorPink = 0xffa4a2;   // Light Pink
    } else if (type === 'parrot') {
        colorMain = 0xef4444;   // Bright Red
        colorAccent = 0xfacc15; // Yellow
        colorEars = 0x3b82f6;   // Blue (wings)
        colorDark = 0x374151;   // Grey Beak
        colorPink = 0xff8a80;   // Pink (dummy)
    }

    const matMain = new THREE.MeshStandardMaterial({ color: colorMain, roughness: 0.8, metalness: 0.1 });
    const matAccent = new THREE.MeshStandardMaterial({ color: colorAccent, roughness: 0.8, metalness: 0.1 });
    const matEars = new THREE.MeshStandardMaterial({ color: colorEars, roughness: 0.9, metalness: 0.1 });
    const matDark = new THREE.MeshStandardMaterial({ color: colorDark, roughness: 0.4, metalness: 0.1 });
    const matPink = new THREE.MeshStandardMaterial({ color: colorPink, roughness: 0.6, metalness: 0.1 });

    // --- Body ---
    body = createSphere(1.6, matMain);
    if (type === 'bulldog') {
        body.scale.set(1.2, 0.95, 1.1);
        body.position.y = 1.2;
    } else if (type === 'cat') {
        body.scale.set(0.75, 0.75, 1.25);
        body.position.y = 1.3;
    } else if (type === 'parrot') {
        body.scale.set(0.85, 1.15, 0.85); // Upright bird body
        body.position.y = 1.4;
    } else {
        body.scale.set(0.9, 0.85, 1.2);
        body.position.y = 1.3;
    }
    dogGroup.add(body);

    // --- Belly ---
    belly = createSphere(1.4, matAccent);
    if (type === 'bulldog') {
        belly.scale.set(1.0, 0.85, 1.05);
        belly.position.set(0, 1.0, 0.2);
    } else if (type === 'cat') {
        belly.scale.set(0.65, 0.65, 1.2);
        belly.position.set(0, 1.1, 0.2);
    } else if (type === 'parrot') {
        belly.scale.set(0.75, 0.9, 0.8);
        belly.position.set(0, 1.3, 0.25); // Yellow chest feathers
    } else {
        belly.scale.set(0.8, 0.8, 1.15);
        belly.position.set(0, 1.1, 0.2);
    }
    dogGroup.add(belly);

    // --- Head Group & Head ---
    headGroup = new THREE.Group();
    if (type === 'parrot') {
        headGroup.position.set(0, 2.7, 0.4);
    } else if (type === 'bulldog') {
        headGroup.position.set(0, 2.4, 1.1);
    } else {
        headGroup.position.set(0, 2.8, 1.2);
    }
    dogGroup.add(headGroup);

    head = createSphere(1.5, matMain);
    if (type === 'bulldog') {
        head.scale.set(1.25, 0.9, 1.05);
    } else if (type === 'cat') {
        head.scale.set(1.0, 0.85, 0.9);
    } else if (type === 'parrot') {
        head.scale.set(0.95, 0.95, 0.95);
    } else {
        head.scale.set(1.1, 0.95, 1.0);
    }
    headGroup.add(head);

    // Fluffy puff on head for Toy Poodle
    if (type === 'poodle') {
        const topknot = createSphere(0.65, matMain);
        topknot.position.set(0, 0.9, 0);
        headGroup.add(topknot);
    }

    // --- Snout & Mouth (or Beak for Parrot) ---
    if (type === 'parrot') {
        // Parrot hooked beak
        const beakUpperGeo = new THREE.SphereGeometry(0.45, 32, 32);
        const beakUpper = new THREE.Mesh(beakUpperGeo, matDark);
        beakUpper.scale.set(0.7, 1.1, 1.2);
        beakUpper.position.set(0, -0.1, 0.85);
        beakUpper.rotation.x = 0.25;
        headGroup.add(beakUpper);
        beak = beakUpper;

        const beakLowerGeo = new THREE.SphereGeometry(0.28, 32, 32);
        const beakLower = new THREE.Mesh(beakLowerGeo, matDark);
        beakLower.scale.set(0.6, 0.6, 0.8);
        beakLower.position.set(0, -0.4, 0.7);
        headGroup.add(beakLower);

        // Dummy snout for bone fetching positioning
        const dummySnout = new THREE.Group();
        dummySnout.position.set(0, -0.2, 0.95);
        headGroup.add(dummySnout);
        snout = dummySnout;
        
        nose = new THREE.Group();
        tongue = new THREE.Group();
    } else {
        snout = createSphere(0.7, matAccent);
        if (type === 'bulldog') {
            snout.scale.set(1.1, 0.6, 0.5);
            snout.position.set(0, -0.3, 0.95);
        } else if (type === 'cat') {
            snout.scale.set(0.5, 0.45, 0.45);
            snout.position.set(0, -0.25, 0.9);
        } else if (type === 'poodle') {
            snout.scale.set(0.6, 0.55, 0.75);
            snout.position.set(0, -0.2, 1.0);
        } else {
            snout.scale.set(1.2, 0.8, 1.0);
            snout.position.set(0, -0.2, 1.3);
        }
        headGroup.add(snout);

        // Nose
        nose = createSphere(0.2, type === 'cat' ? matPink : matDark);
        if (type === 'cat') {
            nose.scale.set(0.6, 0.4, 0.4);
            nose.position.set(0, 0.12, 0.4);
        } else if (type === 'bulldog') {
            nose.scale.set(1.3, 0.7, 0.7);
            nose.position.set(0, 0.35, 0.35);
        } else if (type === 'poodle') {
            nose.scale.set(0.9, 0.7, 0.7);
            nose.position.set(0, 0.25, 0.6);
        } else {
            nose.scale.set(1.2, 0.8, 0.8);
            nose.position.set(0, 0.3, 0.65);
        }
        snout.add(nose);

        // Tongue
        tongue = createSphere(0.25, matPink);
        tongue.scale.set(0.8, 0.3, 1.2);
        if (type === 'cat') {
            tongue.position.set(0, -0.15, 0.4);
        } else {
            tongue.position.set(0, -0.4, 0.6);
        }
        tongue.rotation.x = 0.4;
        snout.add(tongue);
    }

    // --- Eyes ---
    const eyeGroupBase = new THREE.Group();
    headGroup.add(eyeGroupBase);

    if (type === 'parrot') {
        // Large cartoon bird eyes with pupils
        const eyeLWhite = createSphere(0.32, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
        eyeLWhite.position.set(0.52, 0.3, 0.7);
        eyeGroupBase.add(eyeLWhite);
        eyeL = createSphere(0.15, matDark);
        eyeL.position.set(0.08, 0, 0.22);
        eyeLWhite.add(eyeL);
        eyeL = eyeLWhite; // blink system operates on eyeL scale

        const eyeRWhite = createSphere(0.32, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
        eyeRWhite.position.set(-0.52, 0.3, 0.7);
        eyeGroupBase.add(eyeRWhite);
        eyeR = createSphere(0.15, matDark);
        eyeR.position.set(-0.08, 0, 0.22);
        eyeRWhite.add(eyeR);
        eyeR = eyeRWhite;
    } else if (type === 'cat') {
        // Cat eyes (green iris with vertical slit pupil)
        const matCatEye = new THREE.MeshStandardMaterial({ color: 0xa3e635, roughness: 0.1, metalness: 0.1 });
        
        const catEyeL = createSphere(0.22, matCatEye);
        catEyeL.position.set(0.48, 0.35, 0.85);
        eyeGroupBase.add(catEyeL);
        eyeL = createSphere(0.08, matDark);
        eyeL.scale.set(0.3, 1.0, 0.3); // Slit pupil
        eyeL.position.set(0, 0, 0.18);
        catEyeL.add(eyeL);
        eyeL = catEyeL;

        const catEyeR = createSphere(0.22, matCatEye);
        catEyeR.position.set(-0.48, 0.35, 0.85);
        eyeGroupBase.add(catEyeR);
        eyeR = createSphere(0.08, matDark);
        eyeR.scale.set(0.3, 1.0, 0.3);
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
            wL.rotation.y = 0.2;
            wL.position.set(0.65 + i * 0.03, -0.22 + (i - 1) * 0.08, 0.8);
            headGroup.add(wL);
            whiskersL.push(wL);

            const wR = new THREE.Mesh(wGeo, wMat);
            wR.rotation.z = -Math.PI / 2 - (i - 1) * 0.12;
            wR.rotation.y = -0.2;
            wR.position.set(-0.65 - i * 0.03, -0.22 + (i - 1) * 0.08, 0.8);
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
        // Pointy ears
        earLGroup.position.set(0.9, 0.9, 0.2);
        const earLMesh = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.9, 4), matEars);
        earLMesh.scale.set(0.7, 1.1, 0.4);
        earLMesh.rotation.set(0.2, 0, -0.4);
        earLGroup.add(earLMesh);
        earL = earLMesh;

        earRGroup.position.set(-0.9, 0.9, 0.2);
        const earRMesh = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.9, 4), matEars);
        earRMesh.scale.set(0.7, 1.1, 0.4);
        earRMesh.rotation.set(0.2, 0, 0.4);
        earRGroup.add(earRMesh);
        earR = earRMesh;
    } else if (type === 'cat') {
        // Pointy ears with pink insides
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
        // Fluffy poodle ears
        earLGroup.position.set(1.1, 0.6, 0.1);
        const earLMesh = createSphere(0.65, matEars);
        earLMesh.scale.set(0.6, 1.3, 0.7);
        earLMesh.position.set(0, -0.5, 0);
        earLGroup.add(earLMesh);
        const fluffL = createSphere(0.52, matEars);
        fluffL.position.set(0, -1.0, 0.1);
        earLGroup.add(fluffL);
        earL = earLMesh;

        earRGroup.position.set(-1.1, 0.6, 0.1);
        const earRMesh = createSphere(0.65, matEars);
        earRMesh.scale.set(0.6, 1.3, 0.7);
        earRMesh.position.set(0, -0.5, 0);
        earRGroup.add(earRMesh);
        const fluffR = createSphere(0.52, matEars);
        fluffR.position.set(0, -1.0, 0.1);
        earRGroup.add(fluffR);
        earR = earRMesh;
    } else if (type === 'bulldog') {
        // Small folded floppy ears
        earLGroup.position.set(1.2, 0.7, 0.1);
        const earLMesh = createSphere(0.5, matEars);
        earLMesh.scale.set(0.4, 0.85, 0.65);
        earLMesh.position.set(0, -0.3, 0.1);
        earLGroup.add(earLMesh);
        earL = earLMesh;

        earRGroup.position.set(-1.2, 0.7, 0.1);
        const earRMesh = createSphere(0.5, matEars);
        earRMesh.scale.set(0.4, 0.85, 0.65);
        earRMesh.position.set(0, -0.3, 0.1);
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
        // Bird stands on 2 thin legs
        const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 16);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.7 });
        
        legBL = new THREE.Mesh(legGeo, legMat);
        legBL.castShadow = true;
        const footL = createSphere(0.18, legMat);
        footL.scale.set(1.5, 0.4, 1.8);
        footL.position.set(0, -0.45, 0.15);
        legBL.add(footL);
        legBL.position.set(0.35, 0.45, 0.0);
        dogGroup.add(legBL);

        legBR = new THREE.Mesh(legGeo, legMat);
        legBR.castShadow = true;
        const footR = createSphere(0.18, legMat);
        footR.scale.set(1.5, 0.4, 1.8);
        footR.position.set(0, -0.45, 0.15);
        legBR.add(footR);
        legBR.position.set(-0.35, 0.45, 0.0);
        dogGroup.add(legBR);

        // Dummy invisible front legs
        legFL = new THREE.Group();
        legFR = new THREE.Group();
        dogGroup.add(legFL);
        dogGroup.add(legFR);

        // Wings on the sides (Blue feathers)
        wingLGroup = new THREE.Group();
        wingLGroup.position.set(0.95, 1.5, 0);
        dogGroup.add(wingLGroup);
        wingL = createSphere(0.65, matEars);
        wingL.scale.set(0.18, 1.35, 0.85);
        wingL.rotation.z = -0.15;
        wingL.rotation.x = -0.1;
        wingLGroup.add(wingL);

        wingRGroup = new THREE.Group();
        wingRGroup.position.set(-0.95, 1.5, 0);
        dogGroup.add(wingRGroup);
        wingR = createSphere(0.65, matEars);
        wingR.scale.set(0.18, 1.35, 0.85);
        wingR.rotation.z = 0.15;
        wingR.rotation.x = -0.1;
        wingRGroup.add(wingR);
    } else {
        let pawColor = colorAccent;
        if (type === 'poodle') pawColor = colorMain;

        legFL = createStandardLeg(colorMain, pawColor);
        legFR = createStandardLeg(colorMain, pawColor);
        legBL = createStandardLeg(colorMain, pawColor);
        legBR = createStandardLeg(colorMain, pawColor);

        // Puffy ankle cuffs for Poodle
        if (type === 'poodle') {
            const cuffFL = createSphere(0.42, matMain); cuffFL.position.set(0, -0.3, 0.05); legFL.add(cuffFL);
            const cuffFR = createSphere(0.42, matMain); cuffFR.position.set(0, -0.3, 0.05); legFR.add(cuffFR);
            const cuffBL = createSphere(0.42, matMain); cuffBL.position.set(0, -0.3, 0.05); legBL.add(cuffBL);
            const cuffBR = createSphere(0.42, matMain); cuffBR.position.set(0, -0.3, 0.05); legBR.add(cuffBR);
        }

        if (type === 'bulldog') {
            legFL.position.set(1.0, 0.5, 0.9);
            legFR.position.set(-1.0, 0.5, 0.9);
            legBL.position.set(1.0, 0.5, -0.7);
            legBR.position.set(-1.0, 0.5, -0.7);
            
            legFL.scale.set(1.2, 0.75, 1.2);
            legFR.scale.set(1.2, 0.75, 1.2);
            legBL.scale.set(1.2, 0.75, 1.2);
            legBR.scale.set(1.2, 0.75, 1.2);
        } else if (type === 'cat') {
            legFL.position.set(0.7, 0.5, 0.9);
            legFR.position.set(-0.7, 0.5, 0.9);
            legBL.position.set(0.7, 0.5, -0.7);
            legBR.position.set(-0.7, 0.5, -0.7);
            
            legFL.scale.set(0.8, 1.0, 0.8);
            legFR.scale.set(0.8, 1.0, 0.8);
            legBL.scale.set(0.8, 1.0, 0.8);
            legBR.scale.set(0.8, 1.0, 0.8);
        } else {
            legFL.position.set(0.8, 0.5, 1.0);
            legFR.position.set(-0.8, 0.5, 1.0);
            legBL.position.set(0.8, 0.5, -0.8);
            legBR.position.set(-0.8, 0.5, -0.8);
        }

        dogGroup.add(legFL);
        dogGroup.add(legFR);
        dogGroup.add(legBL);
        dogGroup.add(legBR);
    }

    // --- Tail Group & Tail ---
    tailGroup = new THREE.Group();
    if (type === 'parrot') {
        tailGroup.position.set(0, 1.0, -0.8);
    } else if (type === 'bulldog') {
        tailGroup.position.set(0, 1.6, -1.2);
    } else if (type === 'cat') {
        tailGroup.position.set(0, 1.6, -1.3);
    } else {
        tailGroup.position.set(0, 1.8, -1.8);
    }
    dogGroup.add(tailGroup);

    if (type === 'shiba') {
        // Curled Shiba tail
        tail = createSphere(0.45, matEars);
        tail.scale.set(0.9, 1.3, 0.9);
        tail.position.set(0, 0.5, -0.3);
        tail.rotation.x = -1.6;
        
        const tailTip = createSphere(0.35, matAccent);
        tailTip.position.set(0, 0.5, 0.3);
        tail.add(tailTip);
        tailGroup.add(tail);
    } else if (type === 'poodle') {
        // Fluffy poodle tail (thin stem + puffy end)
        const tailBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8), matMain);
        tailBase.position.set(0, 0.3, -0.3);
        tailBase.rotation.x = 0.8;
        tailGroup.add(tailBase);
        
        const tailPuff = createSphere(0.42, matEars);
        tailPuff.position.set(0, 0.45, 0);
        tailBase.add(tailPuff);
        tail = tailBase;
    } else if (type === 'bulldog') {
        // Short stubby tail
        tail = createSphere(0.32, matEars);
        tail.scale.set(0.6, 0.6, 0.6);
        tail.position.set(0, 0.2, -0.2);
        tail.rotation.x = -0.3;
        tailGroup.add(tail);
    } else if (type === 'cat') {
        // Cat long curved segmented tail
        const t1 = createSphere(0.22, matMain);
        t1.position.set(0, 0.2, -0.2);
        tailGroup.add(t1);
        
        const t2 = createSphere(0.19, matMain); t2.position.set(0, 0.28, 0.08); t1.add(t2);
        const t3 = createSphere(0.17, matMain); t3.position.set(0, 0.28, 0.15); t2.add(t3);
        const t4 = createSphere(0.15, matMain); t4.position.set(0, 0.25, 0.22); t3.add(t4);
        
        tail = t1;
    } else if (type === 'parrot') {
        // Parrot flat feather tail
        tail = createSphere(0.4, matMain);
        tail.scale.set(0.8, 1.7, 0.18);
        tail.position.set(0, -0.3, -0.6);
        tail.rotation.x = -0.8;

        const tailAccent = createSphere(0.3, matEars);
        tailAccent.scale.set(0.8, 1.4, 0.15);
        tailAccent.position.set(0, -0.3, -0.05);
        tail.add(tailAccent);
        tailGroup.add(tail);
    }

    // Trigger update shape size rules
    const shapeParams = {
        body: parseFloat(sliderBody.value),
        head: parseFloat(sliderHead.value),
        ears: parseFloat(sliderEars.value),
        legs: parseFloat(sliderLegs.value)
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

    // Reset positions/rotations
    dogGroup.position.set(0, 0, 0);
    dogGroup.rotation.set(0, 0, 0);
    if (headGroup) headGroup.rotation.set(0, 0, 0);
    if (tailGroup) tailGroup.rotation.set(0, 0, 0);
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

        // Splay legs
        if (legFL) { legFL.rotation.x = -1.0; legFL.position.z = 1.5; legFL.position.y = 0.5; }
        if (legFR) { legFR.rotation.x = -1.0; legFR.position.z = 1.5; legFR.position.y = 0.5; }
        if (legBL) { legBL.rotation.x = 1.0; legBL.position.z = -1.5; legBL.position.y = 0.5; }
        if (legBR) { legBR.rotation.x = 1.0; legBR.position.z = -1.5; legBR.position.y = 0.5; }

        if (tongue && tongue.scale) tongue.scale.set(0.01, 0.01, 0.01);
    } else if (animName === 'sit') {
        dogGroup.position.y = -0.5;
        if (legFL) { legFL.rotation.x = -0.4; legFL.position.z = 1.2; legFL.position.y = 0.5; }
        if (legFR) { legFR.rotation.x = -0.4; legFR.position.z = 1.2; legFR.position.y = 0.5; }
        if (legBL) { legBL.rotation.x = -1.2; legBL.position.z = -0.8; legBL.position.y = 0.2; }
        if (legBR) { legBR.rotation.x = -1.2; legBR.position.z = -0.8; legBR.position.y = 0.2; }
        if (headGroup) headGroup.rotation.x = -0.1;
        if (tailGroup) tailGroup.rotation.x = -0.3;
    } else if (animName === 'paw') {
        dogGroup.position.y = -0.3;
        if (legFL) { legFL.rotation.x = -1.4; legFL.position.y = 1.1; legFL.position.z = 1.2; }
        if (legFR) { legFR.rotation.x = 0; legFR.position.y = 0.5; legFR.position.z = 1.0; }
        if (legBL) { legBL.rotation.x = -0.8; legBL.position.y = 0.3; legBL.position.z = -0.8; }
        if (legBR) { legBR.rotation.x = -0.8; legBR.position.y = 0.3; legBR.position.z = -0.8; }
        if (headGroup) headGroup.rotation.z = -0.15;
    } else if (animName === 'fetch') {
        fetchPhase = 'throwing';
        fetchTime = 0;
        boneGroup.visible = true;
        boneGroup.position.set(0, 5, 8);
        boneGroup.rotation.set(Math.random()*2, Math.random()*2, Math.random()*2);
    } else {
        if (legFL) { legFL.rotation.x = 0; legFL.position.y = 0.5; legFL.position.z = 1.0; legFL.rotation.z = 0; }
        if (legFR) { legFR.rotation.x = 0; legFR.position.y = 0.5; legFR.position.z = 1.0; legFR.rotation.z = 0; }
        if (legBL) { legBL.rotation.x = 0; legBL.position.y = 0.5; legBL.position.z = -0.8; legBL.rotation.z = 0; }
        if (legBR) { legBR.rotation.x = 0; legBR.position.y = 0.5; legBR.position.z = -0.8; legBR.rotation.z = 0; }
    }
};

window.updateDogShape = function (params) {
    const type = window.activePetType || 'shiba';
    
    if (params.body && body && belly && tailGroup && legBL && legBR) {
        let s = params.body;
        if (type === 'bulldog') {
            body.scale.set(1.2, 0.95, 1.1 * s);
            belly.scale.set(1.0, 0.85, 1.05 * s);
            tailGroup.position.z = -1.2 * s;
            legBL.position.z = -0.7 * s;
            legBR.position.z = -0.7 * s;
        } else if (type === 'cat') {
            body.scale.set(0.75, 0.75, 1.25 * s);
            belly.scale.set(0.65, 0.65, 1.2 * s);
            tailGroup.position.z = -1.3 * s;
            legBL.position.z = -0.7 * s;
            legBR.position.z = -0.7 * s;
        } else if (type === 'parrot') {
            body.scale.set(0.85, 1.15, 0.85 * s);
            belly.scale.set(0.75, 0.9, 0.8 * s);
            tailGroup.position.z = -0.8 * s;
            legBL.position.z = 0;
            legBR.position.z = 0;
        } else {
            body.scale.set(0.9, 0.85, 1.2 * s);
            belly.scale.set(0.8, 0.8, 1.15 * s);
            tailGroup.position.z = -1.8 * s;
            legBL.position.z = -0.8 * s;
            legBR.position.z = -0.8 * s;
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
            earL.scale.set(0.6, 1.3 * s, 0.7);
            earR.scale.set(0.6, 1.3 * s, 0.7);
            earL.position.y = -0.5 * s;
            earR.position.y = -0.5 * s;
        } else if (type === 'bulldog') {
            earL.scale.set(0.4, 0.85 * s, 0.65);
            earR.scale.set(0.4, 0.85 * s, 0.65);
            earL.position.y = -0.3 * s;
            earR.position.y = -0.3 * s;
        }
    }

    if (params.legs && legFL && legFR && legBL && legBR) {
        let s = params.legs;
        if (type === 'parrot') {
            legBL.scale.y = s;
            legBR.scale.y = s;
            if (legBL.children[0]) legBL.children[0].position.y = -0.45 * s;
            if (legBR.children[0]) legBR.children[0].position.y = -0.45 * s;
        } else {
            legFL.scale.y = s; legFR.scale.y = s;
            legBL.scale.y = s; legBR.scale.y = s;
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

    if (currentAnim === 'idle' && body && headGroup && tailGroup && earLGroup && earRGroup) {
        // Breathing
        body.scale.y = (petType === 'bulldog' ? 0.95 : (petType === 'cat' ? 0.75 : (petType === 'parrot' ? 1.15 : 0.85))) + Math.sin(animTime * 2) * 0.02;
        body.scale.x = (petType === 'bulldog' ? 1.2 : (petType === 'cat' ? 0.75 : (petType === 'parrot' ? 0.85 : 0.9))) + Math.sin(animTime * 2) * 0.01;

        headGroup.rotation.y = Math.sin(animTime * 1.5) * 0.15;
        headGroup.rotation.x = Math.sin(animTime * 1.0) * 0.05;
        tailGroup.rotation.y = Math.sin(animTime * 4) * 0.3;
        
        if (petType !== 'parrot') {
            earLGroup.rotation.z = (petType === 'poodle' ? -0.1 : (petType === 'bulldog' ? -0.1 : -0.3)) + Math.sin(animTime * 2) * 0.05;
            earRGroup.rotation.z = (petType === 'poodle' ? 0.1 : (petType === 'bulldog' ? 0.1 : 0.3)) - Math.sin(animTime * 2) * 0.05;
        }
        
        if (tongue && tongue.scale) {
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
        // Jumping up down
        dogGroup.position.y = Math.abs(Math.sin(animTime * 10)) * 1.0;
        tailGroup.rotation.y = Math.sin(animTime * 20) * 0.8;
        headGroup.rotation.x = -0.2 + Math.sin(animTime * 10) * 0.1;
        
        if (petType !== 'parrot') {
            earLGroup.rotation.z = -0.4 + Math.sin(animTime * 10) * 0.2;
            earRGroup.rotation.z = 0.4 - Math.sin(animTime * 10) * 0.2;
        }

        if (eyeL && eyeR) {
            eyeL.scale.y = 0.3;
            eyeR.scale.y = 0.3;
        }
        if (tongue && tongue.scale) {
            tongue.scale.z = 1.4 + Math.abs(Math.sin(animTime * 15)) * 0.4;
        }

    } else if (currentAnim === 'sleep' && body && earLGroup) {
        // Slow shallow breathing
        body.scale.y = (petType === 'bulldog' ? 0.95 : (petType === 'cat' ? 0.75 : (petType === 'parrot' ? 1.15 : 0.85))) + Math.sin(animTime * 1.5) * 0.02;
        body.scale.x = (petType === 'bulldog' ? 1.2 : (petType === 'cat' ? 0.75 : (petType === 'parrot' ? 0.85 : 0.9))) + Math.sin(animTime * 1.5) * 0.01;
        if (petType !== 'parrot') {
            earLGroup.rotation.z = -0.8 + Math.sin(animTime * 1.5) * 0.02;
        }

    } else if (currentAnim === 'sit' && body && headGroup && tailGroup) {
        body.scale.y = (petType === 'bulldog' ? 0.95 : (petType === 'cat' ? 0.75 : (petType === 'parrot' ? 1.15 : 0.85))) + Math.sin(animTime * 2) * 0.02;
        headGroup.rotation.y = Math.sin(animTime * 1.2) * 0.1;
        tailGroup.rotation.y = Math.sin(animTime * 3) * 0.15;

    } else if (currentAnim === 'paw' && legFL && tailGroup && headGroup) {
        if (petType !== 'parrot') {
            legFL.rotation.z = Math.sin(animTime * 8) * 0.1;
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
                legFL.rotation.x = Math.sin(fetchTime * 15) * 0.7;
                legFR.rotation.x = -Math.sin(fetchTime * 15) * 0.7;
                legBL.rotation.x = -Math.sin(fetchTime * 15) * 0.7;
                legBR.rotation.x = Math.sin(fetchTime * 15) * 0.7;
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
                legFL.rotation.x = Math.sin(fetchTime * 15) * 0.6;
                legFR.rotation.x = -Math.sin(fetchTime * 15) * 0.6;
                legBL.rotation.x = -Math.sin(fetchTime * 15) * 0.6;
                legBR.rotation.x = Math.sin(fetchTime * 15) * 0.6;
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
            // Wave left wing!
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
