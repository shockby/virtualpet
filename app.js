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

// AI & Speech variables
let apiKey = localStorage.getItem('gemini_api_key') || '';
let speechEnabled = true;
let recognition;
let isRecording = false;
let lastActiveTime = Date.now();

// Initialize
function init() {
    updateUI();
    updateApiKeyUI();
    
    // Start game loop: ticks every 3 seconds
    setInterval(gameTick, 3000);
    // Spontaneous thought checker: runs every 5 seconds
    setInterval(checkInactivityForThought, 5000);

    // Event Listeners
    btnFeed.addEventListener('click', feedPet);
    btnPlay.addEventListener('click', playPet);
    btnSleep.addEventListener('click', toggleSleep);
    btnBone.addEventListener('click', throwBoneAction);

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

    // Sliders Event Listeners
    setupSlider(sliderBody, valBody, 'body');
    setupSlider(sliderHead, valHead, 'head');
    setupSlider(sliderEars, valEars, 'ears');
    setupSlider(sliderLegs, valLegs, 'legs');

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

    // Reset animation if stats are normal, or play sadder animations if very low (future expansions)
    // currently pet3d handles base idle/sleep/happy.
}

// Actions
function feedPet() {
    if (state.isSleeping || state.currentAction) return;

    state.currentAction = 'feeding';
    disableButtons(true);

    const p = personalities[state.personality] || personalities.normal;
    modifyStat('hunger', p.feedHungerGain);
    window.setDogAnimation('happy');
    
    appendChatMessage('pet', 'モグモグ…美味しいワン！🍖');
    speakText('モグモグ、美味しいワン！');
    resetInactivityTimer();

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

    appendChatMessage('pet', 'わーい！楽しいワン！🎾');
    speakText('わーい！楽しいワン！');
    resetInactivityTimer();

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

    if (state.isSleeping) {
        window.setDogAnimation('sleep');
        btnFeed.disabled = true;
        btnPlay.disabled = true;
        btnBone.disabled = true;
        btnSleep.innerHTML = '<span class="icon">☀️</span> Wake Up';
        appendChatMessage('pet', 'うにゃあ…おやすみワン…💤');
        speakText('うにゃあ、おやすみワン');
    } else {
        window.setDogAnimation('idle');
        btnFeed.disabled = false;
        btnPlay.disabled = false;
        btnBone.disabled = false;
        btnSleep.innerHTML = '<span class="icon">💤</span> Sleep';
        appendChatMessage('pet', 'ふわぁ！おはようワン！☀️');
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
    
    // Play fetch animation timeline in Three.js
    if (window.setDogAnimation) {
        window.setDogAnimation('fetch');
    }

    setTimeout(() => {
        // Send automatic fetch prompt to Gemini to comment on the success
        if (apiKey) {
            submitMessageSilent("投げられた骨を口でくわえて持ってきました！大はしゃぎして戻ってきた今の気持ちを喋って！");
        } else {
            appendChatMessage('pet', 'ワンワンッ！骨を取ってきたワン！うれしいワン！🐾');
            speakText('ワンワンッ！骨を取ってきたワン！うれしいワン！');
        }
    }, 1000);

    // End busy state after animation completes
    setTimeout(() => {
        state.currentAction = null;
        disableButtons(false);
    }, 4200);
}

// API Key UI toggles
function updateApiKeyUI() {
    if (apiKey) {
        activeDot.classList.add('active');
        inputApiKey.value = apiKey;
        btnToggleKey.innerText = "🔑 Change Key";
    } else {
        activeDot.classList.remove('active');
        btnToggleKey.innerText = "🔑 Enter Key";
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
    
    // Auto Scroll to bottom
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Inactivity timer reset
function resetInactivityTimer() {
    lastActiveTime = Date.now();
    hideThoughtBubble();
}

// Spontaneous thoughts timer checker
function checkInactivityForThought() {
    if (!apiKey || state.isSleeping || state.currentAction) return;

    // 35 seconds of no activity triggers a thought
    if (Date.now() - lastActiveTime > 35000) {
        resetInactivityTimer(); // Avoid loops
        triggerSpontaneousThought();
    }
}

async function triggerSpontaneousThought() {
    const prompt = "現在のステータスとあなたの性格を考慮して、ふと考えたことや今したいことを、犬としての可愛い独り言（1文、15文字以内）でつぶやいてください。";
    
    const response = await getGeminiResponse(prompt, true); // silent parameter avoids double printing user prompt
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
    
    // Auto-hide after 8 seconds
    setTimeout(hideThoughtBubble, 8000);
}

function hideThoughtBubble() {
    petThoughtBubble.classList.add('hidden');
}

// Send user message and get AI response
async function submitMessage(text) {
    resetInactivityTimer();
    appendChatMessage('user', text);

    if (!apiKey) {
        keyConfigContainer.classList.remove('hidden');
        appendChatMessage('pet', '🔑 AIと話すにはAPIキーを設定してワン！Google AI Studioから無料で貰えるワン。');
        speakText('AIと話すには、エーアイスタジオの、APIキーを設定してワン');
        return;
    }

    thinkingIndicator.classList.remove('hidden');
    chatLog.scrollTop = chatLog.scrollHeight;

    const response = await getGeminiResponse(text);
    
    thinkingIndicator.classList.add('hidden');

    if (response) {
        appendChatMessage('pet', response.reply);
        
        // Trigger speech synthesis
        speakText(response.reply);

        // Update dog animations
        if (response.animation && window.setDogAnimation) {
            window.setDogAnimation(response.animation);
            
            // Sync isSleeping toggle
            if (response.animation === 'sleep' && !state.isSleeping) {
                toggleSleep();
            } else if (response.animation !== 'sleep' && state.isSleeping) {
                toggleSleep();
            }
        }

        // Apply 3D shape changes
        if (response.shapeChange) {
            applyShapeChanges(response.shapeChange);
        }

        // Apply stat modifications
        if (response.statEffect) {
            if (response.statEffect.hunger) modifyStat('hunger', response.statEffect.hunger);
            if (response.statEffect.happiness) modifyStat('happiness', response.statEffect.happiness);
            if (response.statEffect.energy) modifyStat('energy', response.statEffect.energy);
        }
    }
}

// Silent submit used for automatic actions (like Bone comments)
async function submitMessageSilent(hiddenSystemPrompt) {
    if (!apiKey) return;
    
    thinkingIndicator.classList.remove('hidden');
    
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

// Sync Gemini shape changes back to UI sliders
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

// Communicate with Google AI Studio Gemini API
async function getGeminiResponse(userPrompt, isThought = false) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const sysPrompt = `あなたはユーザーの飼っている可愛くてフレンドリーな3Dバーチャルペット（犬）です。
ユーザーと自然な日本語で対話してください。返答は親しみやすく、犬らしく「ワン！」や「〜だワン」といった表現を適度に交えて、1〜3文程度で簡潔に話してください。

現在のあなたのステータス：
- お腹の空き具合 (Hunger): ${state.hunger}/100
- 幸福度 (Happiness): ${state.happiness}/100
- 体力 (Energy): ${state.energy}/100
- 睡眠状態 (isSleeping): ${state.isSleeping}

現在のあなたの性格タイプ: ${state.personality}
性格ごとの表現：
- normal: 普通の素直で可愛い犬。
- energetic: 感嘆符（！）を多く使い、ハイテンションで走り回りたい様子。
- lazy: 語尾に「〜だワン…」「ふにゃあ…」など、のんびりしていて眠そうな様子。
- glutton: 食べ物が大好きで、いつも何か食べたそうにしている様子。

返答と同時に、あなたの感情や動きに最も合ったアニメーションを1つ選択してください。
選択可能なアニメーション：
- "idle" (通常の静止/呼吸/まばたき)
- "happy" (飛び跳ねて喜ぶ)
- "sleep" (眠る/伏せをする)
- "paw" (お手をする)
- "sit" (お座りして待つ)
- "fetch" (骨を追いかけて持ってくる)

ユーザーが「骨を投げる」「持ってきて」と言ったり骨を投げた場合は、必ず "fetch" アニメーションを選択してください。
ユーザーが「お手」と言った場合は、必ず "paw" アニメーションを選択してください。
ユーザーが「お座り」「待て」と言った場合は、必ず "sit" アニメーションを選択してください。

また、ユーザーの発言や行動に応じて、3Dモデルの体型パラメータを変更できます。
shapeChangeオプション（全て0.5〜2.0などの倍率数値、指定しないものは省略可能）：
- body: 胴体の長さ (0.5 〜 1.5)
- head: 頭の大きさ (0.7 〜 1.3)
- ears: 耳の長さ (0.5 〜 2.0)
- legs: 足の長さ (0.5 〜 1.8)
例：「大きくなーれ！」と言われたらheadを1.3、bodyを1.3、legsを1.3にする等。

ユーザーの言動があなたのステータスに影響を与える場合は、statEffectオプションで数値を指定してください（マイナスも可能）：
- hunger: 空腹の回復量（例: ごはんを貰ったら +30）
- happiness: 幸福度の増減（例: 遊んでもらったら +20）
- energy: 体力の増減（例: 激しく遊んだら -15）

必ず以下のJSONフォーマットのスキーマで厳密に返答してください。`;

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
                    reply: { type: "STRING", description: "犬としての可愛らしい日本語の返答テキスト" },
                    animation: { type: "STRING", enum: ["idle", "happy", "sleep", "paw", "sit", "fetch"], description: "状況に最適なアニメーション" },
                    shapeChange: {
                        type: "OBJECT",
                        properties: {
                            body: { type: "NUMBER", description: "胴体の長さ (0.5 - 1.5)" },
                            head: { type: "NUMBER", description: "頭の大きさ (0.7 - 1.3)" },
                            ears: { type: "NUMBER", description: "耳の長さ (0.5 - 2.0)" },
                            legs: { type: "NUMBER", description: "足の長さ (0.5 - 1.8)" }
                        }
                    },
                    statEffect: {
                        type: "OBJECT",
                        properties: {
                            hunger: { type: "NUMBER", description: "空腹度の増減" },
                            happiness: { type: "NUMBER", description: "幸福度の増減" },
                            energy: { type: "NUMBER", description: "体力の増減" }
                        }
                    }
                },
                required: ["reply", "animation"]
            }
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;
        return JSON.parse(responseText);
    } catch (error) {
        console.error("Gemini API request failed:", error);
        // Fallback response if thought or if connection issues
        if (isThought) return null;
        return {
            reply: "クーン…頭がぼーっとするワン。ネットワークがおかしいかもしれないワン…🐶",
            animation: "idle"
        };
    }
}

// Speech Synthesis text to speech helper
function speakText(text) {
    if (!speechEnabled) return;
    
    // Web Speech synthesis cancel active utterances
    window.speechSynthesis.cancel();
    
    // Strip emojis for better pronunciation
    const cleanText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "");
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ja-JP';
    
    // Tweak pitch/rate based on personality
    let pitch = 1.3;
    let rate = 1.15;
    
    if (state.personality === 'energetic') {
        pitch = 1.5;
        rate = 1.3;
    } else if (state.personality === 'lazy') {
        pitch = 0.95;
        rate = 0.85;
    } else if (state.personality === 'glutton') {
        pitch = 1.2;
        rate = 1.1;
    }
    
    utterance.pitch = pitch;
    utterance.rate = rate;
    
    window.speechSynthesis.speak(utterance);
}

// Start app
window.onload = init;
