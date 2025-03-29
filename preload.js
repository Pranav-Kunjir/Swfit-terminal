const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {
    sendPrompt: (data) => ipcRenderer.send("prompt", data),
    onTerminalOutput: (callback) => ipcRenderer.on('terminal-output', (event, data) => callback(data)),
    sendTerminalInput: (data) => ipcRenderer.send('terminal-input', data),
    resizeTerminal: (cols, rows) => ipcRenderer.send('terminal-resize', cols, rows),
    onai_output: (callback) => ipcRenderer.on('ai_output', (event,data) => callback(data)),
    oncommand_method: (callback) => ipcRenderer.on('command_method', (event,data) => callback(data)),
    sendCommand: (data) => ipcRenderer.send("command", data),


    
})