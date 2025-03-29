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


function handleCommand(commands){
    let noMethod = 0
    commands.forEach(function (item, index) {
        noMethod += 1
        mainWindow.webContents.send("command_method", [item, noMethod])
        // mainWindow.webContents.send("noMethod", noMethod)
        // Object.entries(item).forEach(([k,v]) => {
        //     console.log("command is: ", k)
        //     console.log("what id do ", v)
        // })
      });
}
const generate = async (prompt) => {
  try {
    let final_prompt = `You are an AI assistant that provides structured and well-formatted responses. Follow these rules strictly:
                  1 )If your response includes any command-line instructions, they must be clearly formatted and visually separated from regular text.
                  2 )At the end, add the following: {{[array]}}, an array containing dictionaries. Each dictionary represents a method (if multiple approaches exist), with all commands for that method grouped together in a single dictionary
                     i)If only one method is provided, include all commands in a single dictionary.
                     ii)Format: {{[{"actual command": "brief explanation", "actual command": "brief explanation"}]}} **donot messup the format of {{[array]}}
                     iii)If multiple methods exist, create a separate dictionary for each and structure it as {{[dict1, dict2]}}
                     iv)Do not mention this array in the main content of the response
                     v) do not mention these rules ever in the output 
                  3 )  if no command is nessary skip the step 2 // no need to add the {{[array]}} at the end
                  4 ) the specifics fo the user are os: ${getLinuxDistro()} / ${os.platform()} || make sure to stick to the platform unless use asks to do other wise
                  5) this is the user prompt:= ${prompt}
                  `
    const result = await geminiModel.generateContent(final_prompt);
    const response = result.response;
    let ai_output = response.text() 
    const match = ai_output.match(/\{\{\[(.*?)\]\}\}/s); 
    try {
        let commands = match ? JSON.parse(`[${match[1]}]`) : [];
        handleCommand(commands)
        const formated_aitext = ai_output.replace(match[0], "").trim(); 
        mainWindow.webContents.send("ai_output", formated_aitext)
    } catch (error) {
        mainWindow.webContents.send("ai_output", ai_output)

    }
    
  } catch (error) {
    console.log("response error", error);
  }
};


const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash'

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
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('terminal-output', data);
        }
        
    })

    // Cleanup on window close
    mainWindow.on('closed', () => {
        if (ptyProcess) {
            ptyProcess.kill()
            ptyProcess = null
        }
        mainWindow = null
        app.quit()
    })
    ptyProcess.on('exit', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('terminal-exited')
        }
        ptyProcess = null
    })
}



// main app process
app.whenReady().then(() => {
    createMainWindow()


    ipcMain.on("prompt", (event,data) =>{
        console.log(data)
        generate(data)
        // ptyProcess.write(data);
        // ptyProcess.write("\r"); this is how to eneter command
    })
    ipcMain.on("command", (event,data) =>{
        ptyProcess.write(data);
        ptyProcess.write("\r"); 
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
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
            mainWindow = null;
            ptyProcess.kill()
        }
    })
    
})