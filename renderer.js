const prompt = document.getElementById("prompt")
const terminal = document.getElementById('terminal')
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
    var term = new Terminal();
    term.open(terminal);
    term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')

}else{
    console.log("prompt skipped not found")
}