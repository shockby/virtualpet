// DOM Elements
const barHunger = document.getElementById('bar-hunger');
const barHappiness = document.getElementById('bar-happiness');
const barEnergy = document.getElementById('bar-energy');

const btnFeed = document.getElementById('btn-feed');
const btnPlay = document.getElementById('btn-play');
const btnSleep = document.getElementById('btn-sleep');
const btnBone = document.getElementById('btn-bone');

// Sliders and Value Labels
const sliderBody = document.getElementById('slider-body');
const sliderHead = document.getElementById('slider-head');
const sliderEars = document.getElementById('slider-ears');
const sliderLegs = document.getElementById('slider-legs');

const valBody = document.getElementById('val-body');
const valHead = document.getElementById('val-head');
const valEars = document.getElementById('val-ears');
const valLegs = document.getElementById('val-legs');

// AI Chat Elements
const btnToggleKey = document.getElementById('btn-toggle-key');
const keyConfigContainer = document.getElementById('key-config-container');
const inputApiKey = document.getElementById('input-api-key');
const btnSaveKey = document.getElementById('btn-save-key');
const activeDot = document.getElementById('active-dot');
const chatLog = document.getElementById('chat-log');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const btnMic = document.getElementById('btn-mic');
const btnTts = document.getElementById('btn-tts');
const thinkingIndicator = document.getElementById('thinking-indicator');
const petThoughtBubble = document.getElementById('pet-thought-bubble');
const thoughtText = document.getElementById('thought-text');
const quickPromptChips = document.querySelectorAll('.prompt-chip');

// Modals elements
const btnOpenCare = document.getElementById('btn-open-care');
const btnOpenPersonality = document.getElementById('btn-open-personality');
const modalCare = document.getElementById('modal-care');
const modalPersonality = document.getElementById('modal-personality');
const btnCloseCare = document.getElementById('btn-close-care');
const btnClosePersonality = document.getElementById('btn-close-personality');

// Name Input elements
const inputPetName = document.getElementById('input-pet-name');
const btnSaveName = document.getElementById('btn-save-name');
const selectPetType = document.getElementById('select-pet-type');

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
    personality: 'normal',
    petType: localStorage.getItem('pet_type') || 'shiba'
};

const personalities = {
    normal: { hungerDecay: -2, happinessDecay: -1, energyDecay: -1, playEnergyReq: 20, playEnergyCost: -20, playHappinessGain: 40, feedHungerGain: 30 },
    energetic: { hungerDecay: -2.5, happinessDecay: -1.5, energyDecay: -2, playEnergyReq: 15, playEnergyCost: -15, playHappinessGain: 60, feedHungerGain: 30 },
    lazy: { hungerDecay: -1.5, happinessDecay: -1, energyDecay: -0.5, playEnergyReq: 30, playEnergyCost: -30, playHappinessGain: 20, feedHungerGain: 30 },
    glutton: { hungerDecay: -4, happinessDecay: -1, energyDecay: -1, playEnergyReq: 20, playEnergyCost: -20, playHappinessGain: 30, feedHungerGain: 50 },
};

let apiKey = localStorage.getItem('gemini_api_key') || '';
let petName = localStorage.getItem('pet_name') || 'ポチ';
let speechEnabled = true;
let recognition;
let isRecording = false;
let lastActiveTime = Date.now();
let lastThoughtTime = parseInt(localStorage.getItem('last_thought_time') || '0', 10); // last time a spontaneous thought triggered
let useLocalMode = localStorage.getItem('use_local_mode') === 'true';

// Daily API quota tracker
// Gemini 2.0 Flash Lite free tier: 1500 RPD (requests per day)
// We use 500 as a safe daily limit with headroom
const DAILY_API_LIMIT = 500;
const today = new Date().toDateString();
const storedDate = localStorage.getItem('api_date');
if (storedDate !== today) {
    localStorage.setItem('api_date', today);
    localStorage.setItem('api_count', '0');
}
function getApiCount() { return parseInt(localStorage.getItem('api_count') || '0', 10); }
function incrementApiCount() {
    localStorage.setItem('api_count', String(getApiCount() + 1));
    updateApiCountDisplay();
}
function isApiQuotaOk() { return getApiCount() < DAILY_API_LIMIT; }
function updateApiCountDisplay() {
    const el = document.getElementById('api-count-display');
    if (el) el.textContent = getApiCount();
}

// Initialize
function init() {
    updateUI();
    updateApiKeyUI();
    updatePetNameUI();
    
    // Set initial greeting based on pet type
    if (chatLog) {
        const welcomeText = getWelcomeText(state.petType);
        chatLog.innerHTML = `<div class="chat-message pet"><div class="message-content">${welcomeText}</div></div>`;
    }

    // Set initial 3D pet type
    if (window.setPetType) {
        window.setPetType(state.petType);
    }

    // Start game loop: ticks every 3 seconds
    setInterval(gameTick, 3000);
    // Spontaneous thought checker: runs every 60 seconds
    setInterval(checkInactivityForThought, 60000);

    // Event Listeners for Care & Status
    btnFeed.addEventListener('click', feedPet);
    btnPlay.addEventListener('click', playPet);
    btnSleep.addEventListener('click', toggleSleep);
    btnBone.addEventListener('click', () => {
        modalCare.classList.add('hidden');
        throwBoneAction();
    });

    const selectPersonality = document.getElementById('select-personality');
    if (selectPersonality) {
        selectPersonality.addEventListener('change', (e) => {
            state.personality = e.target.value;
            if (window.setDogPersonality) {
                window.setDogPersonality(state.personality);
            }
            resetInactivityTimer();
        });
    }

    if (selectPetType) {
        selectPetType.value = state.petType;
        selectPetType.addEventListener('change', (e) => {
            state.petType = e.target.value;
            localStorage.setItem('pet_type', state.petType);
            if (window.setPetType) {
                window.setPetType(state.petType);
            }
            
            // Re-trigger greeting on change
            let changeReply = "";
            if (state.petType === 'cat') {
                changeReply = "ニャーオ！猫に変身したにゃ！よろしくにゃ🐾";
            } else if (state.petType === 'parrot') {
                changeReply = "ハロー！オウムに変身！パタパタパタ！🦜";
            } else if (state.petType === 'poodle') {
                changeReply = "クゥーン！トイプードルに変身したプー！よろしくワン🐾";
            } else if (state.petType === 'bulldog') {
                changeReply = "バウバウ！ブルドッグに変身したぜ！よろしくな！🐾";
            } else {
                changeReply = "ワン！柴犬に変身したワン！よろしくワン！🐾";
            }
            appendChatMessage('pet', changeReply);
            speakText(changeReply);
            
            resetInactivityTimer();
        });
    }

    // Modal Control Listeners
    btnOpenCare.addEventListener('click', () => {
        modalCare.classList.remove('hidden');
        resetInactivityTimer();
    });
    
    btnOpenPersonality.addEventListener('click', () => {
        modalPersonality.classList.remove('hidden');
        resetInactivityTimer();
    });
    
    btnCloseCare.addEventListener('click', () => {
        modalCare.classList.add('hidden');
    });
    
    btnClosePersonality.addEventListener('click', () => {
        modalPersonality.classList.add('hidden');
    });
    
    // Light dismiss clicks (close overlay if clicking backdrop)
    modalCare.addEventListener('click', (e) => {
        if (e.target === modalCare) {
            modalCare.classList.add('hidden');
        }
    });
    
    modalPersonality.addEventListener('click', (e) => {
        if (e.target === modalPersonality) {
            modalPersonality.classList.add('hidden');
        }
    });

    // Sliders Event Listeners
    setupSlider(sliderBody, valBody, 'body');
    setupSlider(sliderHead, valHead, 'head');
    setupSlider(sliderEars, valEars, 'ears');
    setupSlider(sliderLegs, valLegs, 'legs');

    // Pet Name Saving Listener
    btnSaveName.addEventListener('click', () => {
        const name = inputPetName.value.trim();
        if (name) {
            petName = name;
            localStorage.setItem('pet_name', petName);
            updatePetNameUI();
            
            let thankReply = `ワンッ！新しい名前「${petName}」にしてくれてありがとうだワン！🐾`;
            let thankSpeech = `新しい名前、${petName}にしてくれてありがとうだワン！`;
            if (state.petType === 'cat') {
                thankReply = `にゃおん！新しい名前「${petName}」にしてくれてありがとうにゃん！🐾`;
                thankSpeech = `新しい名前、${petName}にしてくれてありがとうにゃん！`;
            } else if (state.petType === 'parrot') {
                thankReply = `ハロー！新しい名前「${petName}」！ありがとうオウム！🦜`;
                thankSpeech = `新しい名前、${petName}！ありがとうオウム！`;
            } else if (state.petType === 'poodle') {
                thankReply = `キャッ！新しい名前「${petName}」にしてくれてありがとうプー！🐾`;
                thankSpeech = `新しい名前、${petName}にしてくれてありがとうプー！`;
            } else if (state.petType === 'bulldog') {
                thankReply = `フガッ！新しい名前「${petName}」にしてくれてありがとうだぜ！🐾`;
                thankSpeech = `新しい名前、${petName}にしてくれてありがとうだぜ！`;
            }
            appendChatMessage('pet', thankReply);
            speakText(thankSpeech);
            
            // Auto close modal to show title transition
            setTimeout(() => {
                modalPersonality.classList.add('hidden');
            }, 1200);
        }
        resetInactivityTimer();
    });

    // AI Chat Panel Event Listeners
    btnToggleKey.addEventListener('click', () => {
        keyConfigContainer.classList.toggle('hidden');
    });

    btnSaveKey.addEventListener('click', () => {
        apiKey = inputApiKey.value.trim();
        localStorage.setItem('gemini_api_key', apiKey);
        updateApiKeyUI();
        keyConfigContainer.classList.add('hidden');
        resetInactivityTimer();
    });

    const checkboxLocalMode = document.getElementById('checkbox-local-mode');
    if (checkboxLocalMode) {
        checkboxLocalMode.checked = useLocalMode;
        checkboxLocalMode.addEventListener('change', (e) => {
            useLocalMode = e.target.checked;
            localStorage.setItem('use_local_mode', String(useLocalMode));
            updateApiKeyUI();
            resetInactivityTimer();
        });
    }

    // API count reset button
    const btnResetCount = document.getElementById('btn-reset-count');
    if (btnResetCount) {
        btnResetCount.addEventListener('click', () => {
            localStorage.setItem('api_count', '0');
            localStorage.setItem('api_date', new Date().toDateString());
            updateApiCountDisplay();
            appendChatMessage('pet', 'APIカウンターをリセットしたワン！また話しかけてワン！🐾');
        });
    }

    // Initialize count display
    updateApiCountDisplay();

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) {
            submitMessage(text);
            chatInput.value = '';
        }
    });

    // Voice Synthesis Toggle
    btnTts.addEventListener('click', () => {
        speechEnabled = !speechEnabled;
        btnTts.classList.toggle('active', speechEnabled);
        resetInactivityTimer();
    });

    // Quick chips listeners
    quickPromptChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const promptText = chip.getAttribute('data-prompt');
            if (promptText === '骨を投げて！') {
                throwBoneAction();
            } else {
                submitMessage(promptText);
            }
        });
    });

    // Voice Recognition (Speech-to-Text) Initialization
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isRecording = true;
            btnMic.classList.add('recording');
            chatInput.placeholder = "聞き取り中...";
        };

        recognition.onend = () => {
            isRecording = false;
            btnMic.classList.remove('recording');
            chatInput.placeholder = "話しかけてみてね...";
        };

        recognition.onresult = (event) => {
            const speechToText = event.results[0][0].transcript;
            chatInput.value = speechToText;
            submitMessage(speechToText);
            chatInput.value = '';
        };

        recognition.onerror = (e) => {
            console.error("Speech recognition error:", e.error);
            isRecording = false;
            btnMic.classList.remove('recording');
            chatInput.placeholder = "話しかけてみてね...";
        };

        btnMic.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
            resetInactivityTimer();
        });
    } else {
        btnMic.style.display = 'none';
    }
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
        resetInactivityTimer();
    });
}

// Game Loop: decrease stats over time
function gameTick() {
    const p = personalities[state.personality] || personalities.normal;
    if (state.isSleeping) {
        modifyStat('energy', 5);
        modifyStat('hunger', -0.5);
        modifyStat('happiness', -0.2);
    } else {
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

function checkPetState() {
    if (state.currentAction || state.isSleeping) return;
}

// Actions
function feedPet() {
    if (state.isSleeping || state.currentAction) return;

    state.currentAction = 'feeding';
    disableButtons(true);

    const p = personalities[state.personality] || personalities.normal;
    modifyStat('hunger', p.feedHungerGain);
    window.setDogAnimation('happy');
    
    appendChatMessage('pet', `モグモグ…美味しいワン！🍖`);
    speakText('モグモグ、美味しいワン！');
    resetInactivityTimer();

    setTimeout(() => {
        modalCare.classList.add('hidden');
    }, 500);

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
        alert("眠くて遊べないワン！おやすみさせてワン。💤");
        return;
    }

    state.currentAction = 'playing';
    disableButtons(true);

    modifyStat('happiness', p.playHappinessGain);
    modifyStat('energy', p.playEnergyCost);
    modifyStat('hunger', -10);
    window.setDogAnimation('happy');

    appendChatMessage('pet', `わーい！楽しいワン！🎾`);
    speakText('わーい！楽しいワン！');
    resetInactivityTimer();

    setTimeout(() => {
        modalCare.classList.add('hidden');
    }, 500);

    setTimeout(() => {
        state.currentAction = null;
        window.setDogAnimation('idle');
        disableButtons(false);
    }, 2000);
}

function toggleSleep() {
    if (state.currentAction) return;

    state.isSleeping = !state.isSleeping;
    resetInactivityTimer();

    setTimeout(() => {
        modalCare.classList.add('hidden');
    }, 500);

    if (state.isSleeping) {
        window.setDogAnimation('sleep');
        btnFeed.disabled = true;
        btnPlay.disabled = true;
        btnBone.disabled = true;
        btnSleep.innerHTML = '<span class="icon">☀️</span> Wake Up';
        appendChatMessage('pet', `うにゃあ…おやすみワン…💤`);
        speakText('うにゃあ、おやすみワン');
    } else {
        window.setDogAnimation('idle');
        btnFeed.disabled = false;
        btnPlay.disabled = false;
        btnBone.disabled = false;
        btnSleep.innerHTML = '<span class="icon">💤</span> Sleep';
        appendChatMessage('pet', `ふわぁ！おはようワン！☀️`);
        speakText('ふわぁ、おはようワン！');
    }
}

// 3D Bone Throwing Action
function throwBoneAction() {
    if (state.isSleeping || state.currentAction) return;

    state.currentAction = 'fetching';
    disableButtons(true);
    resetInactivityTimer();

    // Stats updates
    modifyStat('hunger', 20);
    modifyStat('energy', -15);
    modifyStat('happiness', 30);

    appendChatMessage('user', '🦴 骨を投げた！');
    
    if (window.setDogAnimation) {
        window.setDogAnimation('fetch');
    }

    setTimeout(() => {
        if (!useLocalMode && apiKey) {
            submitMessageSilent(`投げられた骨を口でくわえて持ってきました！大はしゃぎして戻ってきた今の気持ちを${petName}として誇らしく喋って！`);
        } else {
            appendChatMessage('pet', `ワンワンッ！骨を取ってきたワン！うれしいワン！🐾`);
            speakText('ワンワンッ！骨を取ってきたワン！うれしいワン！');
        }
    }, 1000);

    setTimeout(() => {
        state.currentAction = null;
        disableButtons(false);
    }, 4200);
}

// API Key UI toggles
function updateApiKeyUI() {
    if (useLocalMode || apiKey) {
        activeDot.classList.add('active');
    } else {
        activeDot.classList.remove('active');
    }

    if (apiKey) {
        inputApiKey.value = apiKey;
        btnToggleKey.innerText = "🔑 Change Key";
    } else {
        btnToggleKey.innerText = "🔑 Enter Key";
    }
}

function getWelcomeText(type) {
    if (type === 'cat') return "ニャーオ！私とお話しするにゃ？🐾";
    if (type === 'parrot') return "ハロー！ハロー！ボクとお話ししよう！🦜";
    if (type === 'poodle') return "クゥーン！ぼくとお話しするプー？🐾";
    if (type === 'bulldog') return "バウバウ！オレとお話ししようぜ！🐾";
    return "ワンワン！ぼくとお話ししようワン！🐾";
}

function getPetTypeJA() {
    if (state.petType === 'cat') return '猫';
    if (state.petType === 'parrot') return 'オウム';
    if (state.petType === 'poodle') return 'トイプードル';
    if (state.petType === 'bulldog') return 'ブルドッグ';
    return '柴犬';
}

// Name UI updates
function updatePetNameUI() {
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.innerText = `${petName}の部屋`;
    }
    if (inputPetName) {
        inputPetName.value = petName;
    }
}

// Disable basic buttons
function disableButtons(disabled) {
    btnFeed.disabled = disabled;
    btnPlay.disabled = disabled;
    btnSleep.disabled = disabled;
    btnBone.disabled = disabled;
}

// Append messages to Chat Log
function appendChatMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', sender);
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerText = text;
    
    messageDiv.appendChild(contentDiv);
    chatLog.appendChild(messageDiv);
    
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Inactivity timer reset
function resetInactivityTimer() {
    lastActiveTime = Date.now();
    hideThoughtBubble();
}

// Local fallback thoughts (no API call)
const LOCAL_THOUGHTS = {
    shiba: {
        normal:   ['遊んで遊んで遊んでだワン！', 'お手やりたいなワン。', 'お散歩行きたいワン～'],
        energetic: ['生きてるの最高だワン！！', '走り回りたいワン！', '順調ルンルンワン！！！'],
        lazy:      ['ふにゃあ～ねむいワン…', 'なんか食べたいワン…', 'ごろごろしたいワン…'],
        glutton:  ['おなかすいたワン！', '骨におやつ欲しいワン…', 'ごはんまだワン？']
    },
    poodle: {
        normal:   ['なでなでしてプー！', '遊んでほしいプー！🐾', 'おやつほしいワン！'],
        energetic: ['遊ぼう！遊ぼう！遊ぼう！プー！', 'トイプーパワー全開だワン！', 'ルンルンプゥー！🌟'],
        lazy:      ['うにゃあ…ねむねむプー…', 'だらだらするプー…', '抱っこしてワン…'],
        glutton:  ['おいしいおやつまだプー？', 'お腹ぺこぺこだワン！', 'もぐもぐしたいプー！']
    },
    bulldog: {
        normal:   ['のんびりいこうぜ。', 'バウ！遊ぶか？', 'フガフガ…良い天気だぜ。'],
        energetic: ['バウバウ！走るぜ！相棒、ついてこいよな！🐾', 'フゴフゴ！絶好調だぜ！🐾', '楽しいぜ！'],
        lazy:      ['ふぅ…動くのめんどいぜ…', '寝るのが一番だぜ…', 'フガ…あくびが出るぜ…'],
        glutton:  ['肉！肉をくれだぜ！🍖', 'フガフガ…いい匂いがするぜ！', '腹減ったぜ…']
    },
    cat: {
        normal:   ['ニャーオ、遊ぶにゃ？', 'ゴロゴロ…撫でてにゃ。', '日向ぼっこするにゃ〜'],
        energetic: ['ニャッ！走り回るにゃ！🐾', 'おもちゃ追っかけるにゃ！', '元気いっぱいにゃ！'],
        lazy:      ['ふにゃあ…眠いにゃ…💤', 'こたつで丸くなりたいにゃ…', 'だらだらするにゃん…'],
        glutton:  ['ちゅーるほしいにゃ！', 'お魚の匂いがするにゃん！', 'ご飯まだにゃ？']
    },
    parrot: {
        normal:   ['ハロー！オハヨウ！', 'おしゃべりするオウム！', 'パタパタ…遊ぶ？'],
        energetic: ['パタパタパタ！飛ぶオウム！', 'ワッハッハ！元気オウム！', '楽しいね！楽しいね！'],
        lazy:      ['ふぅ…おやすみオウム…', 'ウトウト…眠いよ…', 'ボーっとするオウム…'],
        glutton:  ['ヒマワリのタネ！タネ！🦜', 'くだもの美味しいオウム！', 'お腹すいたオウム！']
    }
};

// Spontaneous thoughts timer checker
function checkInactivityForThought() {
    if (state.isSleeping || state.currentAction) return;

    const MIN_THOUGHT_INTERVAL = 10 * 60 * 1000; // 10 minutes minimum between API thoughts
    const now = Date.now();

    if (now - lastActiveTime > 90000) { // 90 seconds of inactivity
        lastActiveTime = now; // reset so it doesn't fire again immediately

        // Check if enough time has passed AND quota is available for AI thought, and not in local mode
        if (!useLocalMode && apiKey && (now - lastThoughtTime > MIN_THOUGHT_INTERVAL) && isApiQuotaOk()) {
            lastThoughtTime = now;
            localStorage.setItem('last_thought_time', String(now));
            triggerSpontaneousThought();
        } else {
            // Show a local thought without using the API
            triggerLocalThought();
        }
    }
}

function triggerLocalThought() {
    const typePool = LOCAL_THOUGHTS[state.petType] || LOCAL_THOUGHTS.shiba;
    const pool = typePool[state.personality] || typePool.normal;
    const text = pool[Math.floor(Math.random() * pool.length)];
    showThoughtBubble(text);
}

async function triggerSpontaneousThought() {
    const petTypeJA = getPetTypeJA();
    const prompt = `現在のステータスとあなたの性格を考慮して、ふと考えたことや今したいことを、${petTypeJA}（${petName}）としての可愛い独り言（1文、5文字以内）でつぶやいてください。`;
    
    incrementApiCount();
    const response = await getGeminiResponse(prompt, true);
    if (response && response.reply) {
        showThoughtBubble(response.reply);
        
        if (response.animation && window.setDogAnimation) {
            window.setDogAnimation(response.animation);
        }
        
        speakText(response.reply);
    }
}

function showThoughtBubble(text) {
    thoughtText.innerText = text;
    petThoughtBubble.classList.remove('hidden');
    
    setTimeout(hideThoughtBubble, 8000);
}

function hideThoughtBubble() {
    petThoughtBubble.classList.add('hidden');
}

// Send user message and get AI response
async function submitMessage(text) {
    resetInactivityTimer();
    appendChatMessage('user', text);

    modalCare.classList.add('hidden');
    modalPersonality.classList.add('hidden');

    // If local mode is forced, or no api key, or daily quota is exceeded, fallback to local response engine
    if (useLocalMode || !apiKey || !isApiQuotaOk()) {
        submitLocalMessage(text);
        return;
    }

    thinkingIndicator.classList.remove('hidden');
    chatLog.scrollTop = chatLog.scrollHeight;

    incrementApiCount();
    const response = await getGeminiResponse(text);
    
    thinkingIndicator.classList.add('hidden');

    if (response) {
        appendChatMessage('pet', response.reply);
        speakText(response.reply);

        if (response.animation && window.setDogAnimation) {
            window.setDogAnimation(response.animation);
            
            if (response.animation === 'sleep' && !state.isSleeping) {
                toggleSleep();
            } else if (response.animation !== 'sleep' && state.isSleeping) {
                toggleSleep();
            }
        }

        if (response.shapeChange) {
            applyShapeChanges(response.shapeChange);
        }

        if (response.statEffect) {
            if (response.statEffect.hunger) modifyStat('hunger', response.statEffect.hunger);
            if (response.statEffect.happiness) modifyStat('happiness', response.statEffect.happiness);
            if (response.statEffect.energy) modifyStat('energy', response.statEffect.energy);
        }
    }
}

const LOCAL_CHAT_RESPONSES = {
    shiba: {
        paw: 'お手だワン！ほら、できたワン！🐾',
        sit: 'お座りして待つワン！おやつある？骨投げしてほしいワン！🦴',
        sleep: 'ふにゃあ…おやすみワン。良い夢見るワン…💤',
        love: 'えへへ、なでなで大好きだワン！もっと撫でてワン！💖',
        name: `ぼくの名前は「\${petName}」だワン！かっこいい名前で嬉しいワン！🐶`,
        default: {
            normal: [
                'ワンワン！今日も一緒にいられて嬉しいワン！',
                'クーン…何かおもしろいことないワン？',
                'ジー…飼い主さんのこと、じっと見つめてるワン。',
                'お腹すいたワン！おやつかご飯ほしいワン！'
            ],
            energetic: [
                'ワンッ！！もっと走りたいワン！あそぼー！！',
                'ルンルン！お外に散歩に行きたいワン！！🐾',
                'テンションMAXだワン！飛び跳ねちゃうワン！',
                'わーい！楽しいこといっぱいで幸せワン！'
            ],
            lazy: [
                'ふにゃあ…なんだか、とっても眠いワン…💤',
                'のんびり、ごろごろするのが一番だワン…',
                'むにゃむにゃ…お昼寝の邪魔はしないでワン…',
                'ワン…あ、あくびが出ちゃったワン…ふぁあ'
            ],
            glutton: [
                'クーン…美味しそうなにおいがするワン！🍖',
                'おやつ！おやつどこワン！？早くほしいワン！',
                'モグモグ…もっといっぱい食べたいワン！',
                'ご飯の時間が一番大好きなんだワン！ヨダレが出ちゃうワン…'
            ]
        }
    },
    poodle: {
        paw: 'お手プー！できたプー！褒めて褒めてワン！🐾',
        sit: 'お座りだプー！おやつくれる？ワクワクワン！🦴',
        sleep: 'クゥーン…おやすみプー。抱っこして寝てほしいプー…💤',
        love: 'キャッキャッ！なでなでもっと！大好きだプー！💖',
        name: `ぼくの名前は「\${petName}」プー！とっても可愛い名前プー！🐶`,
        default: {
            normal: [
                '遊ぼう！遊ぼう！なでなでしてプー！🐾',
                '甘えん坊モードだプー！ずっとそばにいてワン！',
                'クゥーン…どこ行くの？置いていかないでプー！',
                'お腹すいたワン！美味しいクッキーほしいプー！'
            ],
            energetic: [
                'わーい！遊ぶプー！いっぱい走り回るプー！💨',
                'トイプーパワー大爆発だワン！元気いっぱいプー！',
                'ルンルン！お出かけ？お出かけするのプー！？',
                '嬉しすぎてしっぽがちぎれちゃうプー！'
            ],
            lazy: [
                'フニャ…抱っこしててほしいプー…💤',
                'ひざの上でとろんとしちゃうプー…',
                'お昼寝タイムだワン。なでなでしながら寝てプー…',
                'ふわぁ…眠たいプー。おやすみワン'
            ],
            glutton: [
                '美味しいおやつ！おやつプー！早くちょうだいワン！',
                'クンクン…ごはんの準備？いい匂いがするプー！🍖',
                'もぐもぐ…もっと美味しいものないのプー？',
                'お腹空いちゃったワン！何か食べるプー！'
            ]
        }
    },
    bulldog: {
        paw: 'フガッ、お手だぜ！どうだ、かっこいいだろ？🐾',
        sit: 'お座りだぜ。フガフガ…ご褒美あるよな？🦴',
        sleep: 'グォー…おやすみだぜ。いびきかいちゃうかもだぜ…💤',
        love: 'フガッ、照れるぜ。なでな後は悪くないぜ…💖',
        name: `オレの名前は「\${petName}」だぜ！力強くていい名前だぜ！🐶`,
        default: {
            normal: [
                'バウバウ！オレも一緒にいて楽しいぜ！',
                'フガ…何かうまいもん食おうぜ。',
                'ジー…飼い主のこと、守ってやるぜ！',
                'お腹減ったぜ。ガッツリ食べたい気分だぜ！'
            ],
            energetic: [
                'バウバウ！走るぜ！相棒、ついてこいよな！🐾',
                'フンフン！やる気満々だぜ！遊ぼうぜ！',
                'テンション上がってきたぜ！バウ！バウ！',
                'よっしゃー！楽しいことが一番だぜ！'
            ],
            lazy: [
                'ふぅ、ちょっと休憩だぜ。動くのめんどいぜ…💤',
                'ごろごろするのが至福の時間だぜ…',
                'フゴフゴ…お昼寝の邪魔はすんなよな…',
                'ふぁあ、眠いぜ。オレはここで寝るぜ'
            ],
            glutton: [
                'フガフガ…肉！肉のにおいがするぜ！🍖',
                '飯だ！飯の時間だぜ！大盛りで頼むぜ！',
                'ガツガツ…食うのが生きがいだぜ！',
                'まだまだ腹減ってるぜ。おかわりはないのか？'
            ]
        }
    },
    cat: {
        paw: 'にゃー、お手だにゃ！ほら、できたにゃん🐾',
        sit: 'お座りにゃ。気が向いたから待ってあげるにゃん🐾',
        sleep: 'ふにゃあ…おやすみにゃ。毛布をかけてにゃん…💤',
        love: 'ゴロゴロ…なでなで気持ちいいにゃ〜。もっと撫でるにゃ！💖',
        name: `私の名前は「\${petName}」にゃ！お上品で素敵にゃん！🐱`,
        default: {
            normal: [
                'ニャーオ。今日も気まぐれに付き合ってあげるにゃ。',
                'ゴロゴロ…喉を鳴らして甘えてみるにゃん。',
                'ジー…何してるにゃ？気になるにゃ。',
                'お腹すいたにゃ。高級なキャットフードがいいにゃ！'
            ],
            energetic: [
                'ニャッ！おもちゃだにゃ！捕まえるにゃ！🐾',
                '部屋中を大激走するにゃ！止められないにゃ！',
                'パタパタ動くもの、全部ロックオンにゃ！',
                '遊ぼうにゃ！おもちゃ投げてにゃん！'
            ],
            lazy: [
                'ふにゃあ…眠いにゃ。そっとしておいてにゃ…💤',
                'こたつか日向で一日中寝たいにゃ…',
                'むにゃむにゃ…邪魔しないでにゃ…',
                'ふわぁ…あくびが出ちゃったにゃ。おやすみ'
            ],
            glutton: [
                'クンクン…美味しそうなマグロのにおいがするにゃ！🐟',
                'ちゅーる！ちゅーるほしいにゃ！早くにゃ！',
                'モグモグ…美味しいにゃ。おかわり要求にゃ！',
                'ご飯をくれるなら、ちょっとだけ撫でさせてあげるにゃ。'
            ]
        }
    },
    parrot: {
        paw: 'パタパタ！お手！できたよ！褒めて！🦜',
        sit: 'お座り！待て！じっとしてるよ！🦴',
        sleep: 'ウトウト…おやすみオウム…静かにしてね…💤',
        love: 'ハロー！なでなで大好き！もっとパタパタ！💖',
        name: `ボクの名前は「\${petName}」！オウム！素敵な名前だね！🦜`,
        default: {
            normal: [
                'ハロー！ハロー！おしゃべりしよう！',
                'パタパタ…オウムだよ！元気？',
                'ジー…飼い主さんの顔、よく見えるよ！',
                'タネ！ヒマワリのタネが食べたいな！'
            ],
            energetic: [
                'パタパタパタ！飛んじゃうよ！元気いっぱい！💨',
                'オウムパワー全開！ワッハッハ！遊ぼう！',
                '楽しいね！お話しするの、とっても楽しいね！',
                'ピーピー！テンションマックスだよ！'
            ],
            lazy: [
                'ふぅ…ちょっと休憩オウム…💤',
                'ウトウト…お昼寝タイムかな？',
                'のんびり羽づくろいするよ。静かにね。',
                'ふわぁ…あくびオウム…眠いな'
            ],
            glutton: [
                'ご飯！美味しいくだものちょうだい！🍎',
                'モグモグ…おかわり！おかわりほしいオウム！',
                'タネ！タネどこ？いっぱい食べたいな！',
                '食べるの大好き！お腹ペコペコだよ！'
            ]
        }
    }
};

// Local offline fallback response engine
function submitLocalMessage(text) {
    thinkingIndicator.classList.remove('hidden');
    
    setTimeout(() => {
        thinkingIndicator.classList.add('hidden');
        
        let reply = '';
        let animation = 'idle';
        
        const cleanText = text.toLowerCase();
        const typePool = LOCAL_CHAT_RESPONSES[state.petType] || LOCAL_CHAT_RESPONSES.shiba;
        
        // Keyword checks
        if (cleanText.includes('お手') || cleanText.includes('おて')) {
            animation = 'paw';
            reply = typePool.paw;
        } else if (cleanText.includes('お座り') || cleanText.includes('おすわり') || cleanText.includes('待て') || cleanText.includes('まて')) {
            animation = 'sit';
            reply = typePool.sit;
        } else if (cleanText.includes('骨') || cleanText.includes('投げ') || cleanText.includes('ボール') || cleanText.includes('もってきて')) {
            throwBoneAction();
            return;
        } else if (cleanText.includes('寝る') || cleanText.includes('おやすみ') || cleanText.includes('眠')) {
            animation = 'sleep';
            if (!state.isSleeping) toggleSleep();
            reply = typePool.sleep;
        } else if (cleanText.includes('なでなで') || cleanText.includes('可愛い') || cleanText.includes('かわいい') || cleanText.includes('好き')) {
            animation = 'happy';
            reply = typePool.love;
        } else if (cleanText.includes('名前')) {
            animation = 'happy';
            reply = typePool.name;
        } else {
            // Parrot mimicking feature! If it's a parrot, occasionally mimic user words
            if (state.petType === 'parrot' && Math.random() < 0.4) {
                reply = `「${text}」！${text}！オウム真似っこ！🦜`;
                animation = 'happy';
            } else {
                const pool = typePool.default[state.personality] || typePool.default.normal;
                reply = pool[Math.floor(Math.random() * pool.length)];
                animation = Math.random() > 0.5 ? 'happy' : 'idle';
            }
        }
        
        appendChatMessage('pet', reply);
        speakText(reply);
        
        if (window.setDogAnimation) {
            window.setDogAnimation(animation);
        }
    }, 600);
}

async function submitMessageSilent(hiddenSystemPrompt) {
    if (!apiKey || useLocalMode || !isApiQuotaOk()) {
        // Safe offline response for silent calls (e.g. bone fetched)
        let boneReply = `ワンワンッ！骨を取ってきたワン！うれしいワン！🐾`;
        if (state.petType === 'cat') {
            boneReply = `にゃおん！骨を取ってきたにゃ！遊んでくれて嬉しいにゃ！🐾`;
        } else if (state.petType === 'parrot') {
            boneReply = `パタパタ！骨！持ってきたオウム！楽しいね！🦜`;
        } else if (state.petType === 'poodle') {
            boneReply = `キャッキャッ！骨を持ってきたプー！嬉しいプー！🐾`;
        } else if (state.petType === 'bulldog') {
            boneReply = `フガッ！骨を取ってきたぜ！もっと投げてくれぜ！🐾`;
        }
        appendChatMessage('pet', boneReply);
        speakText(boneReply);
        return;
    }
    
    thinkingIndicator.classList.remove('hidden');
    incrementApiCount();
    
    const response = await getGeminiResponse(hiddenSystemPrompt);
    
    thinkingIndicator.classList.add('hidden');
    
    if (response) {
        appendChatMessage('pet', response.reply);
        speakText(response.reply);
        
        if (response.shapeChange) {
            applyShapeChanges(response.shapeChange);
        }
    }
}

function applyShapeChanges(shape) {
    if (shape.body !== undefined) {
        sliderBody.value = shape.body;
        valBody.innerText = shape.body.toFixed(1);
        window.updateDogShape({ body: shape.body });
    }
    if (shape.head !== undefined) {
        sliderHead.value = shape.head;
        valHead.innerText = shape.head.toFixed(1);
        window.updateDogShape({ head: shape.head });
    }
    if (shape.ears !== undefined) {
        sliderEars.value = shape.ears;
        valEars.innerText = shape.ears.toFixed(1);
        window.updateDogShape({ ears: shape.ears });
    }
    if (shape.legs !== undefined) {
        sliderLegs.value = shape.legs;
        valLegs.innerText = shape.legs.toFixed(1);
        window.updateDogShape({ legs: shape.legs });
    }
}

// Model fallback chain for free tier quota management
const GEMINI_MODELS = [
    'gemini-3.5-flash',        // Latest GA Flash model (smart, fast)
    'gemini-3.1-flash-lite',   // High-volume, low-latency lite model
    'gemini-2.5-flash',        // Stable fallback Flash model
];

// Rate limiting: track last request time per model
const modelLastUsed = {};
let currentModelIndex = 0;

// Debounce: prevent overlapping requests
let pendingRequest = null;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Build API URL for a given model
function buildApiUrl(model) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

// Communicate with Google AI Studio Gemini API
async function getGeminiResponse(userPrompt, isThought = false) {
    // Debounce: if a request is already in flight, skip spontaneous thoughts
    if (pendingRequest && isThought) return null;

    let petTypeJA = "柴犬";
    let speechStyle = "返答は「ワン！」「〜だワン」などの犬らしい表現を交えて1〜3文で簡潔に。";
    if (state.petType === 'cat') {
        petTypeJA = "猫";
        speechStyle = "返答は「ニャー」「〜だニャン」「〜だにゃ」などの可愛い猫らしい表現を交えて1〜3文で簡潔に。";
    } else if (state.petType === 'parrot') {
        petTypeJA = "オウム";
        speechStyle = "返答は「ハロー！」「パタパタ」「〜だオウム」「〜だよ！」などの少し片言で鳥らしくお茶目で可愛い表現、あるいは時々飼い主の言葉を繰り返す表現を交えて1〜3文で簡潔に。";
    } else if (state.petType === 'poodle') {
        petTypeJA = "トイプードル";
        speechStyle = "返答は「クゥーン」「〜だプー」「〜ワン」などの非常に甘えん坊で愛らしいトイプードルらしい表現を交えて1〜3文で簡潔に。";
    } else if (state.petType === 'bulldog') {
        petTypeJA = "ブルドッグ";
        speechStyle = "返答は「バウバウ」「〜だぜ」「〜だワン」などの少しのんびり、または少し強気で愛嬌のあるブルドッグらしい表現を交えて1〜3文で簡潔に。";
    }

    const sysPrompt = `あなたは「${petName}」という名前の3Dバーチャルペット（${petTypeJA}）です。飼い主と日本語で自然に会話してください。
${speechStyle}

ステータス: Hunger=${state.hunger}/100, Happiness=${state.happiness}/100, Energy=${state.energy}/100, Sleeping=${state.isSleeping}
性格: ${state.personality} (normal=普通, energetic=ハイテンション!, lazy=のんびり…, glutton=食いしん坊)

アニメーション選択 (1つ): idle/happy/sleep/paw/sit/fetch
「骨投げ」「持ってきて」→fetch, 「お手」→paw, 「お座り」「待て」→sit

体型変更(省略可): body(0.5-1.5), head(0.7-1.3), ears(0.5-2.0), legs(0.5-1.8)
ステータス変更(省略可): hunger/happiness/energy の増減値

必ずJSONスキーマ通りに返答してください。`;

    const requestBody = {
        contents: [
            { role: 'user', parts: [{ text: userPrompt }] }
        ],
        systemInstruction: {
            parts: [{ text: sysPrompt }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    reply: { type: "STRING" },
                    animation: { type: "STRING", enum: ["idle", "happy", "sleep", "paw", "sit", "fetch"] },
                    shapeChange: {
                        type: "OBJECT",
                        properties: {
                            body: { type: "NUMBER" },
                            head: { type: "NUMBER" },
                            ears: { type: "NUMBER" },
                            legs: { type: "NUMBER" }
                        }
                    },
                    statEffect: {
                        type: "OBJECT",
                        properties: {
                            hunger: { type: "NUMBER" },
                            happiness: { type: "NUMBER" },
                            energy: { type: "NUMBER" }
                        }
                    }
                },
                required: ["reply", "animation"]
            }
        }
    };

    // Try models with exponential backoff on 429
    const startModelIndex = currentModelIndex;
    let attempt = 0;

    pendingRequest = (async () => {
        while (attempt < GEMINI_MODELS.length * 2) {
            const model = GEMINI_MODELS[currentModelIndex];
            const url = buildApiUrl(model);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (response.status === 429 || response.status === 404) {
                    // 429: quota exceeded, 404: model not available → try next
                    console.warn(`[Gemini] ${model} returned ${response.status}, switching model...`);
                    currentModelIndex = (currentModelIndex + 1) % GEMINI_MODELS.length;
                    const backoffMs = response.status === 429
                        ? Math.min(2000 * Math.pow(2, attempt), 30000)
                        : 500;
                    console.log(`[Gemini] Retrying with ${GEMINI_MODELS[currentModelIndex]} in ${backoffMs}ms...`);
                    await sleep(backoffMs);
                    attempt++;
                    continue;
                }

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`API Error: ${response.status} - ${errText}`);
                }

                const data = await response.json();
                const responseText = data.candidates[0].content.parts[0].text;
                return JSON.parse(responseText);

            } catch (error) {
                if (error.message && error.message.includes('429')) {
                    currentModelIndex = (currentModelIndex + 1) % GEMINI_MODELS.length;
                    await sleep(2000 * Math.pow(2, attempt));
                    attempt++;
                    continue;
                }
                console.error("Gemini API request failed:", error);
                if (isThought) return null;
                return {
                    reply: `クーン…頭がぼーっとするワン。ちょっと待ってほしいワン…🐶`,
                    animation: "idle"
                };
            }
        }

        // All models exhausted
        console.error("[Gemini] All models quota exhausted");
        if (isThought) return null;
        return {
            reply: `ふぅ…今日のAPIがいっぱいになったワン。明日また話しかけてワン！🐶`,
            animation: "sleep"
        };
    })();

    try {
        return await pendingRequest;
    } finally {
        pendingRequest = null;
    }
}

// Speech Synthesis text to speech helper
function speakText(text) {
    if (!speechEnabled) return;
    
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "");
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ja-JP';
    
    let pitch = 1.3;
    let rate = 1.15;
    
    // Animal base offsets
    if (state.petType === 'shiba') {
        pitch = 1.3;
        rate = 1.1;
    } else if (state.petType === 'poodle') {
        pitch = 1.6; // Higher pitched
        rate = 1.25; // Faster, energetic
    } else if (state.petType === 'bulldog') {
        pitch = 0.8; // Lower, gruff
        rate = 0.95; // Slightly slower
    } else if (state.petType === 'cat') {
        pitch = 1.5; // High, sweet
        rate = 1.15;
    } else if (state.petType === 'parrot') {
        pitch = 1.8; // Very high and squeaky
        rate = 1.3;  // Fast chatter
    }
    
    // Modify based on personality
    if (state.personality === 'energetic') {
        pitch += 0.2;
        rate *= 1.15;
    } else if (state.personality === 'lazy') {
        pitch -= 0.15;
        rate *= 0.8;
    } else if (state.personality === 'glutton') {
        pitch -= 0.05;
        rate *= 1.0;
    }
    
    utterance.pitch = pitch;
    utterance.rate = rate;
    
    window.speechSynthesis.speak(utterance);
}

// Start app
window.onload = init;
