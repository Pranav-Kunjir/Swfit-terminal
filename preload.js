const { contextBridge, ipcRenderer } = require("electron")



contextBridge.exposeInMainWorld("electron", {
    sendPrompt: (data)  => ipcRenderer.send("prompt", data)


})
