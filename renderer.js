const prompt = document.getElementById("prompt")
const chat = document.getElementById("chat")
const command_confirm = document.getElementById("command_confirm")
const execute = document.getElementById("execute")
const loader = document.getElementById("loader")
if (window.location.pathname.includes("index.html")){
    prompt.addEventListener("keydown", (e) =>{
        if (e.key === "Enter"){
            let prompt_value = prompt.value;
            let user_chat = `<p class="user_chat">${prompt_value}<p>`;
            chat.insertAdjacentHTML("beforeend",user_chat);
            loader.classList.toggle("hidden")
            window.electron.sendPrompt(prompt_value);
            setTimeout(() =>{
                prompt.value = "";
                command_confirm.innerHTML = ``
            }, 100);
        }
    })
    window.electron.onai_output((value) => {
        loader.classList.toggle("hidden")
        let ai_chat = `<p class="aichat">${value.toString()}</p>`;
        let formated_text = ai_chat.replace(/\n/g, "<br>")
        chat.insertAdjacentHTML("beforeend",formated_text);
    })
    window.electron.oncommand_method((value) =>{
        let command_final = `<div class="method"><h3>Method:${value[1]}<h3>`
        Object.entries(value[0]).forEach(([k,v]) => {
            command_final += `<div class="commandtorun">${k}</div>`
            command_final += `<div class="explaination">${v}</div>`
            command_final += `<button data-command="${k}">Execute</button>`
        })
        command_final += `</div>`
        command_confirm.insertAdjacentHTML("beforeend",command_final)
    })
    const term = new Terminal({
        cursorBlink: true,
        fontSize: 20,
        theme: {
            background: '#2e3440',
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
    document.querySelector(".command-confirm").addEventListener("click", function(event) {
        if (event.target.tagName === "BUTTON") {
            let command = event.target.getAttribute("data-command");
            if (command) {
                console.log("Command to Execute:", command);
                window.electron.sendCommand(command);
            }
        }
    });

}else{
    console.log("prompt skipped not found")
};

