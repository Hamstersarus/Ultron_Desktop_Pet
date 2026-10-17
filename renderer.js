const bubble = document.getElementById('bubble');
const talkButton = document.getElementById('talk');
const askForm = document.getElementById('ask');
const questionInput = document.getElementById('question');
const ultron = document.getElementById('ultron');

function setSprite(name) {
    ultron.src = 'assets/' + name + '.png';
}

function say(text) {
    bubble.textContent = text;
    bubble.hidden = false;
}

talkButton.addEventListener('click', () => {
    askForm.hidden = !askForm.hidden;
    if (!askForm.hidden) {
        questionInput.focus();
    }
});

askForm.addEventListener('submit', async(event) => {
    event.preventDefault();

    const question = questionInput.value.trim();
    if(question === '') return;

    questionInput.value = '';
    setSprite('thinking');
    say('...');

    const result = await window.ultronBrain.ask(question);

    setSprite('talking');
    say(result.answer ?? result.error);
    setTimeout(() => setSprite('idle'), 3000);
});

function blink() {
    if (ultron.src.endsWith('idle.png')) {
        setSprite('blinking');
        setTimeout(() => setSprite('idle'), 150);
    }
    setTimeout(blink, 2000 + Math.random() * 4000);
}
blink();