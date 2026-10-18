//Download button: guess the visitor's operating system.
const downloadButton = document.getElementById('download-button');
const platform = (navigator.userAgentData?.platform || navigator.userAgent).toLowerCase();

let os = null;
if (/android|iphone|ipad/.test(platform)) {
    os = null;
} else if (platform.includes('win')) {
    os = 'Windows';
} else if (platform.includes('mac')) {
    os = 'Mac';
} else if (platform.includes('linux')) {
    os = 'Linux';
} 

if (os) {
    downloadButton.textContent = 'Download for ' + os;
    downloadButton.href = '#download-' + os.toLowerCase();
    document.getElementById('download-' + os.toLowerCase()).classList.add('yours');
} else {
    downloadButton.textContent = 'Get it for your computer';
}

//Ultron blinks every few seconds, like in the app.
const heroUltron = document.getElementById('hero-ultron');

function blink() {
    heroUltron.src = 'media/blinking.png';
    setTimeout(() => {
        heroUltron.src = 'media/idle.png';
    }, 150);
    setTimeout(blink, 2000 + Math.random() * 4000);
}
setTimeout(blink, 2000);

const heroBubbleText = document.getElementById('hero-bubble-text');
const greeting = 'TODO: what Ultron says to visitors';
let shown = 0;

const typing = setInterval(() => {
    shown++;
    heroBubbleText.textContent = greeting.slice(0, shown);
    if (shown >= greeting.length) {
        clearInterval(typing);
    }
}, 50);