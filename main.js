const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const pty = require('node-pty')
const os = require('node:os')
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
 
// constants



const gemini_api_key = process.env.GEMINI_API_KEY;
const googleAI = new GoogleGenerativeAI(gemini_api_key);
let mainWindow
let ptyProcess

const geminiConfig = {
  temperature: 0.9,
  topP: 1,
  topK: 1,
  maxOutputTokens: 4096,
};
 
const geminiModel = googleAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  geminiConfig,
});

const fs = require('fs');

function getLinuxDistro() {
    try {
        const data = fs.readFileSync('/etc/os-release', 'utf8');
        const match = data.match(/^PRETTY_NAME="(.+)"$/m);
        return match ? match[1] : "Unknown Linux Distribution";
    } catch (error) {
        return "Cannot determine Linux distribution";
    }
}


const distro = getLinuxDistro()

// functions
const generate = async (prompt) => {
  try {
    let final_prompt = `You are an AI assistant that provides structured and well-formatted responses. Follow these rules strictly:
                  1 )If your response includes any command-line instructions, they must be clearly formatted and visually separated from regular text.
                  2 )At the end add following:- {{[array]}}, an array containing dictionaries, which have all the commands with brief description, {{[{"command1":"explain it in brief","command2","explaination"}]}} if the output has multiple methods add a dictionary for each ouptu ie {{[dict1,dict2]}} make no mention of this in main content of the output
                  3 )  if no command is nessary skip the step 2 // no need to add the {{[array]}} at the end
                  4 ) the specifics fo the user are os: ${getLinuxDistro()} / ${os.platform()} || make sure to stick to the platform unless use asks to do other wise
                  5) this is the user prompt:= ${prompt}
                  `
    const result = await geminiModel.generateContent(final_prompt);
    const response = result.response;
    let ai_output = response.text() 
    mainWindow.webContents.send("ai_output", ai_output)
  } catch (error) {
    console.log("response error", error);
  }
};


const shell = os.platform() === 'win32' ? 'powershell.exe' : 'zsh'

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1500,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            sandbox: true
        }
    })
    mainWindow.loadFile("index.html")

    // Create PTY process
    ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 100,
        rows: 50,
        cwd: process.env.HOME,
        env: process.env
    })

    // Handle PTY data
    ptyProcess.onData(data => {
        mainWindow.webContents.send('terminal-output', data)

    })

    // Cleanup on window close
    mainWindow.on('closed', () => {
        ptyProcess.kill()
        ptyProcess = null
    })
}



// main app process
app.whenReady().then(() => {
    createMainWindow()

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit()
    })
    ipcMain.on("prompt", (event,data) =>{
        console.log(data)
        generate(data)
        // ptyProcess.write(data);
        // ptyProcess.write("\r"); this is how to eneter command
    })
    // IPC handlers
    ipcMain.on('terminal-input', (event, data) => {
        if (ptyProcess) {
            ptyProcess.write(data)
        }
    })

    ipcMain.on('terminal-resize', (event, cols, rows) => {
        if (ptyProcess) ptyProcess.resize(cols, rows)
    })
})