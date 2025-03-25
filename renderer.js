const prompt = document.getElementById("prompt")

if (window.location.pathname.includes("index.html")){
    prompt.addEventListener("keydown", (e) =>{
        if (e.key === "Enter"){
            let prompt_value = prompt.value;
            console.log(prompt_value)
            window.electron.sendPrompt(prompt_value);
            setTimeout(() =>{
                prompt.value = "";
            }, 100);
        }
    })
    const term = new Terminal({
        cursorBlink: true,
        fontSize: 20,
        theme: {
            background: '#fdf6e3',
            cursor: '#ffffff',
            cursorAccent: '#ffffff'
        },
    })
    
    term.open(document.getElementById('terminal'))
    
    // Handle terminal input
    term.onData(data => {
        window.electron.sendTerminalInput(data)
    })
    
    // Handle output from PTY
    window.electron.onTerminalOutput((data) => {
        term.write(data)
    })
    
    // Handle terminal resize
    term.onResize((size) => {
        window.electron.resizeTerminal(size.cols, size.rows)
    })
    
    // Initial resize
    setTimeout(() => {
        term.resize(80, 40)
    }, 10)
    
    // Optional: Add fit addon for better resizing
    // Add this to index.html: <script src="node_modules/@xterm/addon-fit/lib/xterm-addon-fit.js"></script>
    if (typeof FitAddon !== 'undefined') {
        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        fitAddon.fit()
        window.addEventListener('resize', () => fitAddon.fit())
    }
}else{
    console.log("prompt skipped not found")
}