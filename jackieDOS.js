var cliElement;
var cliContent;
var runningCommand;
var exitRunningCommand = new Function();
var videoSrc;
const commands = {
    "helloworld.sh": () => {
        cliWrite("Hello World!");
        cliReturn();
    },
    "ls": () => {
        cliWrite(Object.keys(commands).join("     "));
        cliReturn();
    },
    "fullscreen": (params) => {
        if (params[0] != "true" && params[0] != "false") {
            params[0] = cliElement.parentElement.style.height == "99vh" ? "false" : "true";
        }
        if (params[0] != "true" && params[0] == "false") {
            cliElement.parentElement.style.height = "0px";
            cliElement.parentElement.style.minHeight = "fit-content";
            setTimeout(() => { cliElement.parentElement.style = null; }, 500);
            cliElement.style.height = null;
            cliElement.style.resize = null;
        } else {
            cliElement.parentElement.style.height = cliElement.parentElement.scrollHeight + "px";
            setTimeout(() => { cliElement.parentElement.style.height = "99vh"; }, 5);
            cliElement.style.height = "100%";
            cliElement.style.resize = "none";
            cliElement.parentElement.scrollIntoView({ behavior: "smooth" });
        }
        cliReturn();
    },
    "echo": (params, input) => {
        cliWrite(input.replace("echo ", ""));
        cliReturn();
    },
    "cat": (params) => {
        if (commands[params[0]] != undefined) {
            cliWrite(commands[params[0]].toString());
        } else {
            cliWrite("File not found");
        }
        cliReturn();
    },
    "exec": (params, input) => {
        cliWrite(eval(input.replace("exec ", "")));
        cliReturn();
    },
    "badapple.sh": (params, input) => {
        let options = {}

        options.rows = params.indexOf("rows") == -1 ? 60 : parseInt(params[params.indexOf("rows") + 1])
        options.fontSize = params.indexOf("size") == -1 ? null : params[params.indexOf("size") + 1]
        options.blockASCII = params.indexOf("block") != -1
        options.blur = params.indexOf("blur") != -1

        cliElement.style.textWrap = "nowrap"
        cliElement.style.fontSize = options.fontSize
        cliElement.rows = ((options.rows / 2) + 5) 
        if (options.blur) cliElement.style.filter = `blur(${options.fontSize ?? "5px"})`
        
        // https://paulbourke.net/dataformats/asciiart/        
        let chars = "@@@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'.   ".split("").reverse().join("")

        if (options.blockASCII) {
            chars = "██▓▓▒▒░░  ".split("").reverse().join("")
        }

        let canvas = cliElement.parentElement.insertBefore(document.createElement("canvas"), null)
        let video = cliElement.parentElement.insertBefore(document.createElement("video"), null)

        canvas.height = options.rows
        canvas.width = Math.round(canvas.height * 4 / 3)
        video.crossOrigin  = "anonymous"
        video.src = videoSrc ?? "//drjackie.gay/apple.mp4"
        video.mute = "true"
        video.style["display"] = "none"
        canvas.style["display"] = "none"

        console.log(canvas)

        exitRunningCommand = () => {
            canvas.remove()
            video.remove()
            cliElement.style.textWrap = null
            cliElement.style.fontSize = null
            cliElement.style.filter = null
            runningCommand ? clearTimeout(runningCommand) : ""
            cliElement.value = cliContent
            cliElement.rows = cliContent.split("\n").length + 5
            exitRunningCommand = new Function()
        }

        let ctx = canvas.getContext("2d", { willReadFrequently: true })

        video.addEventListener('play', function() {
            let $this = this; //cache
            (function loop() {
                if (!$this.paused && !$this.ended) {
                ctx.drawImage($this, 0, 0, ctx.canvas.width, ctx.canvas.height);
                renderASCII()
                runningCommand = setTimeout(loop, 1000 / 30);
                } else {
                    exitRunningCommand()
                    cliReturn()
                }
            })();
        }, 0)

        cliContent = cliElement.value
        video.play()

        function renderASCII() {
            let imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
            let pixels = imgData.data;
            cliElement.value = cliContent
            for (var i = 0; i < pixels.length; i += 4) {
                let lightness = parseInt((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
                cliElement.value += chars[Math.round(lightness / 256 * (chars.length-1))]
                if (((i/4)+1) % ctx.canvas.width == 0) {
                    cliElement.value += "\n"
                    i += ctx.canvas.width*4
                }
            }
        }
    },
    "uploadvideo.sh": () => {
        let fileInput = cliElement.parentElement.insertBefore(document.createElement("input"), null);

        exitRunningCommand = () => {
            fileInput.remove();
            exitRunningCommand = new Function();
        };

        fileInput.type = "file";
        fileInput.accept = "video/mp4";
        // https://stackoverflow.com/a/36850152
        fileInput.onchange = () => {
            if (fileInput.files && fileInput.files[0]) {
                var file = fileInput.files[0];
                var url = URL.createObjectURL(file);
                console.log(url);
                var reader = new FileReader();
                reader.onload = function () {
                    videoSrc = url;
                    console.log(url);
                    fileInput.remove();
                    cliReturn();
                };
                reader.readAsDataURL(file);
            }
        };
    },
    "reloadlastfm.sh": () => {
        newElement = document.getElementById("lastFM-script").insertAdjacentElement("afterend", document.createElement('script'));
        newElement.src = `\${apiRoot}/lastscrobble.js?callback=lastFMCallback`;
        document.getElementById("lastFM-script").remove();
        newElement.id = "lastFM-script";
        cliWrite(document.getElementById("lastfm-title").parentElement.parentElement.innerText.replaceAll("\n", " "));
        cliReturn();
    },
    "reloadtumblr.sh": () => {
        document.getElementById('tumbl').contentWindow.location.reload();
        cliReturn();
    },
    "cls": () => {
        cliElement.value = "";
        cliReturn();
    }
};
function cliInit() {
    cliElement = document.getElementById("cli-input");
    cliElement.value = "";
    cliContent = cliElement.value;
    cliElement.addEventListener("keyup", cliInput);
    cliElement.addEventListener("keydown", cliTab);
    cliReturn();
}
function cliReturn() {
    cliElement.value += "C:/> ";
    cliContent = cliElement.value;
    cliElement.scrollTop = cliElement.scrollHeight;
}
function cliWrite(text = "") {
    cliElement.value += text + "\n";
    cliElement.scrollTop = cliElement.scrollHeight;
}
function cliBell() {
    cliElement.parentElement.style.background = "lightgrey";
    var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
    snd.play();
    setTimeout(() => { cliElement.parentElement.style.background = "black"; }, 20);
}
var previousinput = "";
function cliInput(event) {
    // console.log(event.key)
    if (event.key == "Enter") {
        let input = cliElement.value.toString().replace(cliContent, "").replaceAll("\n", "");
        previousinput = input;
        let params = input.split(" ");
        let command = params.shift();
        // console.log(input)
        // console.log(command + " : " + params)
        if (commands[command] != undefined) {
            try { commands[command](params, input); }
            catch (error) { cliWrite("Command Failed: " + error.toString()); }
        } else {
            cliWrite("Unknown Command");
            cliReturn();
        }
    }
    if (event.key == "Backspace") {
        if (cliElement.value.length <= cliContent.length) {
            cliElement.value = cliContent;
            cliBell();
        }
    }
    if (event.key == "c" && event.ctrlKey) {
        exitRunningCommand ? exitRunningCommand() : "";
        cliWrite("");
        cliReturn();
    }
    if (event.key == "Tab") {
        let input = cliElement.value.toString().replace(cliContent, "").replaceAll("\n", "");
        let matches = Object.keys(commands).map((value) => {
            return value.startsWith(input);
        });
        if (matches.filter(Boolean).length != 1) {
            cliBell();
        } else {
            cliElement.value = cliContent + Object.keys(commands)[matches.findIndex(Boolean)];
        }
    }
    if (event.key == "ArrowUp") {
        cliElement.value = cliContent + previousinput;
    }
}
function cliTab(event) {
    if (event.key == "Tab") {
        event.preventDefault();
    }
}
