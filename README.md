# Ultron Desktop Pet

A tiny pixel-art Ultron that flies around your desktop and answers your questions, in character.

Free · Windows, Mac and Linux · [All downloads](#download)

**Website:** https://hamstersarus.github.io/Ultron_Desktop_Pet/

## Features

### He flies around
He wanders your screen on his own and rests between flights. Drag him anywhere, or tell him to stay put.

### Ask him anything
Click 💬 and type a question. His eyes turn yellow while he thinks it over.

### He answers in character
Answers type out letter by letter in his speech bubble, with his mouth moving and his attitude intact.

### He feels alive
He blinks, hovers and glows. Right-click him to stop flying or to shut him down.

## Download

| System | Download | Note |
|---|---|---|
| Windows | [Download .exe](https://github.com/Hamstersarus/Ultron_Desktop_Pet/releases/latest/download/Ultron-Setup.exe) | Windows may say "Windows protected your PC". Click **More info** → **Run anyway**. |
| Mac | [Download .dmg](https://github.com/Hamstersarus/Ultron_Desktop_Pet/releases/latest/download/Ultron.dmg) | If Mac says the developer can't be verified: right-click the app → **Open** → **Open**. |
| Linux | [Download .deb](https://github.com/Hamstersarus/Ultron_Desktop_Pet/releases/latest/download/Ultron.deb) | For Ubuntu and Debian. Other distros: [AppImage](https://github.com/Hamstersarus/Ultron_Desktop_Pet/releases/latest/download/Ultron.AppImage) |

All versions and source code: [GitHub Releases](https://github.com/Hamstersarus/Ultron_Desktop_Pet/releases)

## Getting Started

1. **Download and install**\
   Pick your system in the [Download](#download) section and open the file.

2. **Get a free OpenRouter key**\
   Ultron's brain runs on free AI models from OpenRouter. Sign in at [openrouter.ai](https://openrouter.ai), open **Keys** → **Create Key** and copy the key (it starts with `sk-or-`). In [Privacy settings](https://openrouter.ai/settings/privacy), allow free models.

3. **Give Ultron the key**\
   On first launch he asks for it. Paste it into the box and click **Save**. He checks it and remembers it from then on.

4. **Ask him something**\
   Click 💬, type your question and press Enter. His eyes turn yellow while he thinks, then he answers in his speech bubble. Click the bubble to skip the typing.

5. **Let him roam**\
   He flies around on his own and rests between trips. Drag him wherever you want. Right-click him to turn flying off or to quit.

## Running from source

You need [Node.js](https://nodejs.org) 22.12 or newer. The version this project uses is in `.nvmrc`, so with nvm you can run `nvm use`.

```bash
git clone https://github.com/Hamstersarus/Ultron_Desktop_Pet.git
cd Ultron_Desktop_Pet
npm install
npm start
```

On first launch, Ultron asks for your OpenRouter key (see [Getting Started](#getting-started)). For development you can instead put it in a `.env` file in the project folder, which git ignores:

```
OPENROUTER_API_KEY=sk-or-...
```

**Linux:** if Electron stops with an error about `chrome-sandbox`, give the sandbox helper the permissions it needs:

```bash
sudo chown root:root node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
```

## Credits

Made by Hamstersarus · [Source on GitHub](https://github.com/Hamstersarus/Ultron_Desktop_Pet)

Ultron is a Marvel character. This is a fan project, not affiliated with Marvel.\
Font: VT323 by Peter Hull (SIL Open Font License).
