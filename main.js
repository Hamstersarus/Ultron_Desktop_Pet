const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

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

ipcMain.handle('ask', async(event, question) => {
  let response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELS[0],
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

function createWindow() {
  const win = new BrowserWindow({
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
}

app.whenReady().then(createWindow);