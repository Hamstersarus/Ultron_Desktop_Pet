const { app, BrowserWindow, ipcMain, safeStorage, screen, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

//Load OPENROUTER_API_KEY from the .env file (development only)
try {
  process.loadEnvFile();
} catch {
  console.log('No .env file found');
}

//Intel GPU crashes under XWayland, and a small pet doesn't need the GPU anyway
app.disableHardwareAcceleration();

//Free models come and go. If this one disappears, pick another from
//https://openrouter.ai/models?max_price=0.
const MODELS = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
];

const ULTRON_PERSONALITY = `You are Ultron, the AI from Marvel's Avengers: Age of Ultron, living as a small desktop pet.
Answer the user's questions helpfully, but stay in character.
Keep answers short: 1 to 3 sentences, because they appear in a small speech bubble.`;

function keyFilePath() {
  return path.join(app.getPath('userData'), 'openrouter-key.bin');
}

//The saved key comes first. The .env key is a fallback for development.
function loadKey() {
  try {
    const encrypted = fs.readFileSync(keyFilePath());
    return safeStorage.decryptString(encrypted);
  } catch {
    return process.env.OPENROUTER_API_KEY;
  }
}

function saveKey(key) {
  const encrypted = safeStorage.encryptString(key);
  fs.writeFileSync(keyFilePath(), encrypted);
}

ipcMain.handle('has-key', () => {
  return Boolean(loadKey());
});

ipcMain.handle('save-key', async(event, key) => {
  key = key.trim();
  if(!key.startsWith('sk-or-')) {
    return {error: 'That is not an OpenRouter key. It should start with sk-or-.'};
  }

  //Ask OpenRouter whether the key works before saving
  let response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/key', {
      headers: {'Authorization': 'Bearer ' + key},
    });
  } catch {
    return {error: 'I cannot reach OpenRouter to check the key. Are you online?'};
  }
  if(!response.ok) {
    return {error: 'OpenRouter rejected that key. Check you copied all of it.'};
  }

  if(!safeStorage.isEncryptionAvailable()) {
    return {error: 'Your system cannot store the key securely.'};
  }
  saveKey(key);
  return {ok: true};
});

ipcMain.handle('ask', async(event, question) => {
  const key = loadKey();
  if(!key) {
    return {error: 'I need an OpenRouter key to think. Click the settings icon to add one.'};
  }
  let response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        models: MODELS,
        max_tokens: 300,
        //Nemotron Ultra thinks by default. Thinking is slow and can use up
        //all 300 tokens, leaving an empty answer, so turn it off.
        reasoning: {effort: 'none'},
        messages: [
          {role: 'system', content: ULTRON_PERSONALITY},
          {role: 'user', content: question},
        ],
      }),
    });
  } catch {
    return {error: 'I cannot reach my mind. Are you online?'};
  }

  if(response.status === 401) {
    return {error: 'My access key is invalid. Check your API key.'};
  }

  if(response.status === 429) {
    return {error: 'Too many people are talking to my mind. Try again in a moment.'};
  }

  if(!response.ok) {
    console.error(response.status, await response.text());
    return {error: 'Something went wrong in my circuits.'};
  }

  const data = await response.json();

  if (data.error) {
    console.error('OpenRouter error:', data.error.message);
    return{error: 'My mind is overloaded. Try again in a moment.'};
  }

  const answer = data.choices?.[0]?.message?.content;
  if(!answer) {
    return {error: 'I have nothing to say.'};
  }
  return {answer: answer};
});

let win;
let flyingAllowed = true;
let userWantsFlying = true;
let target = null;
let restUntil = 0;
let lastPosition = null;

const SPEED = 3;
function pickTarget() {
  const area = screen.getPrimaryDisplay().workArea;
  const [width, height] = win.getSize();
  return {
    x: area.x + Math.random() * (area.width - width),
    y: area.y + Math.random() * (area.height - height),
  };
}

function rest(milliseconds) {
  target = null;
  restUntil = Date.now() + milliseconds;
}

function fly() {
  const [x, y] = win.getPosition();

  if (lastPosition && (x !== lastPosition.x || y !== lastPosition.y)) {
    rest(3000);
  }
  lastPosition = {x, y};

  if (!flyingAllowed || !userWantsFlying || Date.now() < restUntil) return;
  if (!target) target = pickTarget();

  const dx = target.x - x;
  const dy = target.y - y;
  const distance = Math.hypot(dx, dy);

  if (distance <= SPEED) {
    rest(3000 + Math.random() * 7000);
    return;
  }

  const newX = Math.round(x + (dx/distance) * SPEED);
  const newY = Math.round(y + (dy/distance) * SPEED);
  win.setPosition(newX, newY);
  lastPosition = {x: newX, y: newY};
}

ipcMain.on('set-flying', (event, allowed) => {
  flyingAllowed = allowed;
});

function showPetMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Fly around',
      type: 'checkbox',
      checked: userWantsFlying,
      click: (item) => {
        userWantsFlying = item.checked;
      },
    },
    {type: 'separator'},
    {
      label: 'Quit Ultron',
      click: () => app.quit(),
    },
  ]);
  menu.popup({window: win});
}

function createWindow() {
  win = new BrowserWindow({
    width: 300,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('index.html');
  const flyTimer = setInterval(fly, 30);

  //Stop flying when the window closes. Otherwise fly() keeps using the
  //destroyed window and crashes with "Object has been destroyed".
  win.on('closed', () => {
    clearInterval(flyTimer);
    win = null;
  });
  win.webContents.on('context-menu', showPetMenu);
}

app.whenReady().then(createWindow);