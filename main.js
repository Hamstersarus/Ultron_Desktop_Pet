const { app, BrowserWindow, ipcMain, safeStorage, screen, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

if (process.platform === 'linux' &&
    process.env.XDG_SESSION_TYPE === 'wayland' &&
    !process.argv.includes('--ozone-platform=x11')) {
  app.relaunch({args: process.argv.slice(1).concat(['--ozone-platform=x11'])});
  app.exit(0);
}


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

const SPRITE_NAMES = ['idle', 'blinking', 'thinking', 'talking'];
const SHORT_ANSWERS = 'Keep answers short: 1 to 3 sentences, because they appear in a small speech bubble.';

//Custom characters live in the app's settings folder, one folder per character.
function charactersFolder() {
  const folder = path.join(app.getPath('userData'), 'characters');
  fs.mkdirSync(folder, {recursive: true});
  return folder;
}

function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2));
}

//Ultron is built in. Every folder with an idle.png is a custom character.
function listCharacters() {
  const custom = fs.readdirSync(charactersFolder(), {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(charactersFolder(), name, 'idle.png')));
  return ['Ultron', ...custom];
}

function currentCharacter() {
  const chosen = loadSettings().character;
  return listCharacters().includes(chosen) ? chosen : 'Ultron';
}

function characterFolder(name) {
  if (name === 'Ultron') {
    return path.join(__dirname, 'assets');
  }
  return path.join(charactersFolder(), name);
}

//Read the pictures as data URLs, so the page never needs file paths.
//Missing pictures fall back to idle.png.
function loadSprites(name) {
  const folder = characterFolder(name);
  const idle = fs.readFileSync(path.join(folder, 'idle.png'));
  const sprites = {};
  for (const sprite of SPRITE_NAMES) {
    let data;
    try {
      data = fs.readFileSync(path.join(folder, sprite + '.png'));
    } catch {
      data = idle;
    }
    sprites[sprite] = 'data:image/png;base64,' + data.toString('base64');
  }
  return sprites;
}

function loadPersonality(name) {
  if (name === 'Ultron') {
    return ULTRON_PERSONALITY;
  }
  try {
    const text = fs.readFileSync(path.join(characterFolder(name), 'personality.txt'), 'utf8').trim();
    if (text) {
      return text + '\n' + SHORT_ANSWERS;
    }
  } catch {}
  return `You are ${name}, a small desktop pet. Answer the user's questions helpfully and in character.
${SHORT_ANSWERS}`;
}

ipcMain.handle('get-sprites', () => {
  return loadSprites(currentCharacter());
});

ipcMain.handle('get-character-name', () => {
  return currentCharacter();
});


function chooseCharacter(name) {
  const settings = loadSettings();
  settings.character = name;
  saveSettings(settings);
  win.webContents.send('character-changed');
}

async function addCharacter() {
  const result = await dialog.showOpenDialog(win, {
    title: 'Choose your character folder',
    properties: ['openDirectory'],
  });
  if (result.canceled) {
    return;
  }

  const source = result.filePaths[0];
  if (!fs.existsSync(path.join(source, 'idle.png'))) {
    dialog.showMessageBox(win, {
      type: 'error',
      message: 'That folder needs at least an idle.png.',
    });
    return;
  }

  //Copy only the files we use into the characters folder.
  const name = path.basename(source);
  const target = path.join(charactersFolder(), name);
  fs.mkdirSync(target, {recursive: true});
  for (const file of [...SPRITE_NAMES.map((s) => s + '.png'), 'personality.txt']) {
    const from = path.join(source, file);
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, path.join(target, file));
    }
  }
  chooseCharacter(name);
}

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
          {role: 'system', content: loadPersonality(currentCharacter())},
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
      label: 'Character',
      submenu: [
        ...listCharacters().map((name) => ({
          label: name,
          type: 'radio',
          checked: name === currentCharacter(),
          click: () => chooseCharacter(name),
        })),
        {type: 'separator'},
        {label: 'Add character...', click: addCharacter},
        {label: 'Open characters folder', click: () => shell.openPath(charactersFolder())},
      ],
    },
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