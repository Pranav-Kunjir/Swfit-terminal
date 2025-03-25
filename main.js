const { app, BrowserWindow,ipcMain } = require('electron')
const path = require('node:path')
const { spawn } = require('child_process');
const os = require('os');


var shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

const createMainWindow = () =>{
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 900,
        webPreferences:{
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    })
    mainWindow.loadFile("index.html")
}


app.whenReady().then(() =>{
    createMainWindow()
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit()
    })
    ipcMain.on("prompt", (event, data) =>{
        console.log(data)
    })
})