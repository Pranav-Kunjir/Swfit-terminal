const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const pty = require('node-pty')
const os = require('os')

let mainWindow
let ptyProcess

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'zsh'

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
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

app.whenReady().then(() => {
    createMainWindow()

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit()
    })
    ipcMain.on("prompt", (event,data) =>{
        console.log(data)
    })
    // IPC handlers
    ipcMain.on('terminal-input', (event, data) => {
        if (ptyProcess) ptyProcess.write(data)
    })

    ipcMain.on('terminal-resize', (event, cols, rows) => {
        if (ptyProcess) ptyProcess.resize(cols, rows)
    })
})