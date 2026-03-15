// DOM Elements
const petImage = document.getElementById('pet-image');
const barHunger = document.getElementById('bar-hunger');
const barHappiness = document.getElementById('bar-happiness');
const barEnergy = document.getElementById('bar-energy');

const btnFeed = document.getElementById('btn-feed');
const btnPlay = document.getElementById('btn-play');
const btnSleep = document.getElementById('btn-sleep');

// Sliders and Value Labels
const sliderBody = document.getElementById('slider-body');
const sliderHead = document.getElementById('slider-head');
const sliderEars = document.getElementById('slider-ears');
const sliderLegs = document.getElementById('slider-legs');

const valBody = document.getElementById('val-body');
const valHead = document.getElementById('val-head');
const valEars = document.getElementById('val-ears');
const valLegs = document.getElementById('val-legs');

// Constants
const MAX_STAT = 100;
const LOW_THRESH = 30;

// Game State
let state = {
    hunger: 100,
    happiness: 100,
    energy: 100,
    isSleeping: false,
    currentAction: null, // 'eating', 'playing', etc.
    personality: 'normal'
};

const personalities = {
    normal: { hungerDecay: -2, happinessDecay: -1, energyDecay: -1, playEnergyReq: 20, playEnergyCost: -20, playHappinessGain: 40, feedHungerGain: 30 },
    energetic: { hungerDecay: -2.5, happinessDecay: -1.5, energyDecay: -2, playEnergyReq: 15, playEnergyCost: -15, playHappinessGain: 60, feedHungerGain: 30 },
    lazy: { hungerDecay: -1.5, happinessDecay: -1, energyDecay: -0.5, playEnergyReq: 30, playEnergyCost: -30, playHappinessGain: 20, feedHungerGain: 30 },
    glutton: { hungerDecay: -4, happinessDecay: -1, energyDecay: -1, playEnergyReq: 20, playEnergyCost: -20, playHappinessGain: 30, feedHungerGain: 50 },
};

// Removed Pet Assets 2D Image Object

// Initialize
function init() {
    updateUI();
    // Start game loop: ticks every 3 seconds
    setInterval(gameTick, 3000);

    // Event Listeners
    btnFeed.addEventListener('click', feedPet);
    btnPlay.addEventListener('click', playPet);
    btnSleep.addEventListener('click', toggleSleep);

    const selectPersonality = document.getElementById('select-personality');
    if (selectPersonality) {
        selectPersonality.addEventListener('change', (e) => {
            state.personality = e.target.value;
            if (window.setDogPersonality) {
                window.setDogPersonality(state.personality);
            }
        });
    }

    // Sliders Event Listeners
    setupSlider(sliderBody, valBody, 'body');
    setupSlider(sliderHead, valHead, 'head');
    setupSlider(sliderEars, valEars, 'ears');
    setupSlider(sliderLegs, valLegs, 'legs');
}

function setupSlider(slider, labelElement, paramName) {
    slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        labelElement.innerText = val.toFixed(1);

        // Pass param to 3D model
        let params = {};
        params[paramName] = val;
        if (window.updateDogShape) {
            window.updateDogShape(params);
        }
    });
}

// Game Loop: decrease stats over time
function gameTick() {
    const p = personalities[state.personality] || personalities.normal;
    if (state.isSleeping) {
        // Recovers energy while sleeping, hunger drops slower, happiness drops
        modifyStat('energy', 5);
        modifyStat('hunger', -0.5);
        modifyStat('happiness', -0.2);
    } else {
        // Normal degradation
        modifyStat('hunger', p.hungerDecay);
        modifyStat('happiness', p.happinessDecay);
        modifyStat('energy', p.energyDecay);
    }

    checkPetState();
}

// Helper to modify stat within bounds and update UI
function modifyStat(statName, amount) {
    state[statName] += amount;
    if (state[statName] > MAX_STAT) state[statName] = MAX_STAT;
    if (state[statName] < 0) state[statName] = 0;

    updateUI();
}

// Update DOM elements based on state
function updateUI() {
    updateBar(barHunger, state.hunger);
    updateBar(barHappiness, state.happiness);
    updateBar(barEnergy, state.energy);
}

function updateBar(element, value) {
    element.style.width = `${value}%`;
    if (value <= LOW_THRESH) {
        element.classList.add('low');
    } else {
        element.classList.remove('low');
    }
}

// Automatically change pet emotion/animation based on low stats if not busy
function checkPetState() {
    if (state.currentAction || state.isSleeping) return;

    if (state.happiness <= LOW_THRESH) {
        window.setDogAnimation('idle'); // Could add a sad animation later
    } else {
        window.setDogAnimation('idle');
    }
}

// Actions
function feedPet() {
    if (state.isSleeping || state.currentAction) return;

    // Set action state
    state.currentAction = 'feeding';
    disableButtons(true);

    const p = personalities[state.personality] || personalities.normal;

    // Action Logic
    modifyStat('hunger', p.feedHungerGain);
    window.setDogAnimation('happy');

    // End action after short delay
    setTimeout(() => {
        state.currentAction = null;
        window.setDogAnimation('idle');
        disableButtons(false);
    }, 2000);
}

function playPet() {
    if (state.isSleeping || state.currentAction) return;

    const p = personalities[state.personality] || personalities.normal;

    if (state.energy < p.playEnergyReq) {
        // Too tired to play
        alert("Pet is too tired to play! Let it sleep.");
        return;
    }

    state.currentAction = 'playing';
    disableButtons(true);

    modifyStat('happiness', p.playHappinessGain);
    modifyStat('energy', p.playEnergyCost);
    modifyStat('hunger', -10);
    window.setDogAnimation('happy');

    setTimeout(() => {
        state.currentAction = null;
        window.setDogAnimation('idle');
        disableButtons(false);
    }, 2000);
}

function toggleSleep() {
    if (state.currentAction) return; // Can't force sleep while eating/playing

    state.isSleeping = !state.isSleeping;

    if (state.isSleeping) {
        window.setDogAnimation('sleep');
        btnFeed.disabled = true;
        btnPlay.disabled = true;
        btnSleep.innerHTML = '<span class="icon">☀️</span> Wake Up';
        btnSleep.classList.add('bg-blue-100'); // small styling toggle
    } else {
        window.setDogAnimation('idle');
        btnFeed.disabled = false;
        btnPlay.disabled = false;
        btnSleep.innerHTML = '<span class="icon">💤</span> Sleep';
    }
}

// Removed setPetImage function

function disableButtons(disabled) {
    btnFeed.disabled = disabled;
    btnPlay.disabled = disabled;
    btnSleep.disabled = disabled;
}

// Start app
window.onload = init;
