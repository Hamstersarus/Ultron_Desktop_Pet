const bubble = document.getElementById('bubble');
const talkButton = document.getElementById('talk');
const askForm = document.getElementById('ask');
const questionInput = document.getElementById('question');

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

askForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const question = questionInput.value.trim();
    if(question === '') return;

    questionInput.value = '';
    say('You asked: "' + question + '". I will answer once I am connected to my mind.');
});