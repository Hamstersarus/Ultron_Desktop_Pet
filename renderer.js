const bubble = document.getElementById('bubble');
const talkButton = document.getElementById('talk');
const askForm = document.getElementById('ask');
const questionInput = document.getElementById('question');
const ultron = document.getElementById('ultron');
const settingsButton = document.getElementById('settings-button');
const settingsForm = document.getElementById('settings');
const keyInput = document.getElementById('key-input');
const buttonsRow = document.getElementById('buttons');
const bubbleText = document.getElementById('bubble-text');


let busy = false;
let hoveringButtons = false;

function updateFlying() {
    const calm = !busy && ! hoveringButtons && askForm.hidden && settingsForm.hidden;
    window.ultronBrain.setFlying(calm);
}

buttonsRow.addEventListener('mouseenter', () => {
    hoveringButtons = true;
    updateFlying();
});
buttonsRow.addEventListener('mouseleave', () => {
    hoveringButtons = false;
    updateFlying();
});

let sprites = {};
let currentSprite = 'idle';

function setSprite(name) {
    currentSprite = name;
    if (sprites[name]) {
        ultron.src = sprites[name];
    }
}

async function loadCharacter() {
    sprites = await window.ultronBrain.getSprites();
    setSprite(currentSprite);
}
loadCharacter();
window.ultronBrain.onCharacterChanged(loadCharacter);

let typingTimer = null;
let finishTyping = null;
function say(text) {
    clearInterval(typingTimer);
    finishTyping = null;
    bubbleText.textContent = text;
    bubble.hidden = false;
}

function speak(text, onDone) {
    clearInterval(typingTimer);
    bubbleText.textContent = '';
    bubble.hidden = false;

    let shown = 0;
    finishTyping = () => {
        shown = text.length - 1;
    };

    typingTimer = setInterval(() => {
        shown++;
        bubbleText.textContent = text.slice(0, shown);
        bubbleText.scrollTop = bubbleText.scrollHeight;

        if (Math.floor(shown / 3) % 2 == 0) {
            setSprite('talking');
        } else {
            setSprite('idle');
        }

        if (shown >= text.length) {
            clearInterval(typingTimer);
            finishTyping = null;
            setSprite('idle');
            if (onDone) onDone();
        }
    }, 30);
}

bubble.addEventListener('click', () => {
    if (finishTyping) finishTyping();
});

talkButton.addEventListener('click', () => {
    settingsForm.hidden = true;
    askForm.hidden = !askForm.hidden;
    if (!askForm.hidden) {
        questionInput.focus();
    }
    updateFlying();
});

askForm.addEventListener('submit', async(event) => {
    event.preventDefault();

    const question = questionInput.value.trim();
    if(question === '') return;

    questionInput.value = '';
    busy = true;
    updateFlying();
    setSprite('thinking');
    say('...');

    const result = await window.ultronBrain.ask(question);

    speak(result.answer ?? result.error, () => {
        setTimeout(() => {
            busy = false;
            updateFlying();
        }, 1500);
    })
});

function blink() {
    if (currentSprite === 'idle' && !busy) {
        setSprite('blinking');
        setTimeout(() => setSprite('idle'), 150);
    }
    setTimeout(blink, 2000 + Math.random() * 4000);
}
blink();

settingsButton.addEventListener('click', () => {
    askForm.hidden = true;
    settingsForm.hidden = !settingsForm.hidden;
    if (!settingsForm.hidden) {
        keyInput.focus();
    }
    updateFlying();
});

settingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const key = keyInput.value.trim();
    if (key === '') return;

    setSprite('thinking');
    say('Checking your key...');

    const result = await window.ultronBrain.saveKey(key);
    setSprite('idle');

    if (result.error) {
        say(result.error);
        return;
    }

    keyInput.value = '';
    settingsForm.hidden = true;
    updateFlying();
    say('Key accepted. My mind is online. Ask me anything.');
});

async function checkForKey() {
    const hasKey = await window.ultronBrain.hasKey();
    if (!hasKey) {
        say('I need an OpenRouter key to think. Get a free one at openrouter.ai/keys and paste it below.');
        settingsForm.hidden = false;
        updateFlying();
    }
}
checkForKey();