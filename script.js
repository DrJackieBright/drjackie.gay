var apiRoot = "https://api.drjackie.gay"

if (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    apiRoot = "http://localhost:8888"

function fillBlinkies(elementID, folder, height = 50, width = 100) {
    const http = new XMLHttpRequest();
    http.open('GET', "/images/index.json", true);
    http.send();
    http.onload = () => {
        let listing = JSON.parse(http.response)
        let folderContents = listing.find((element) => element.name == ".").contents
            .find((element) => element.name == "blinkies").contents
            .find((element) => element.name == folder).contents
            .filter((element) => element.type == "file")
        for (const file of folderContents) {
            var img = document.createElement("img")
            img.height = height
            img.width = width
            img.src = `/images/blinkies/${folder}/${file.name}`
            document.getElementById(elementID).appendChild(img)
        }
    }
}

function lastFMCallback(track) {
    // console.log(track)
    document.getElementById("spotify-embed").src = document.getElementById("spotify-embed").src.replace(/\/[^\/]*$/, "/" + track.spotify_track_ids[0])
    document.getElementById("lastfm-title").innerText = track.name
    document.getElementById("lastfm-title").href = track.url
    document.getElementById("lastfm-artist").innerText = track.artist["#text"]
    document.getElementById("lastfm-album").innerText = track.album["#text"]
    document.getElementById("lastfm-cover").src = track.image[track.image.length - 1]["#text"]
}

var cliElement
var cliContent
var runningCommand

const commands = {
    "helloworld.sh": () => {
        cliWrite("Hello World!")
        cliReturn()
    },
    "ls": () => {
        cliWrite(Object.keys(commands).join("     "))
        cliReturn()
    },
    "fullscreen": (params) => {
        if (params[0] != "true" && params[0] != "false") {
            params[0] = cliElement.parentElement.style.height == "99vh" ? "false" : "true"
        }
        if (params[0] != "true" && params[0] == "false") {
            cliElement.parentElement.style.height = "0px"
            cliElement.parentElement.style.minHeight = "fit-content"
            setTimeout(() => { cliElement.parentElement.style = null }, 500)
            cliElement.style.height = null
            cliElement.style.resize = null
        } else {
            cliElement.parentElement.style.height = cliElement.parentElement.scrollHeight + "px"
            setTimeout(() => { cliElement.parentElement.style.height = "99vh" }, 5)
            cliElement.style.height = "100%"
            cliElement.style.resize = "none"
            cliElement.parentElement.scrollIntoView({ behavior: "smooth" })
        }
        cliReturn()
    },
    "echo": (params, input) => {
        cliWrite(input.replace("echo ", ""))
        cliReturn()
    },
    "cat": (params) => {
        if (commands[params[0]] != undefined) {
            cliWrite(commands[params[0]].toString())
        } else {
            cliWrite("File not found")
        }
        cliReturn()
    },
    "exec": (params, input) => {
        cliWrite(eval(input.replace("exec ", "")))
        cliReturn()
    },
    "badapple.sh": () => {
        cliElement.style.textWrap = "nowrap"
        document.getElementById("badappleframes").src = "frames.js"
        commands["fullscreen"]("true")
        var frame = 1
        runningCommand = setInterval(async () => {
            if (frame >= badApple.length) {
                clearInterval(runningCommand)
                liElement.style.textWrap = null
                cliReturn()
                commands["fullscreen"]("false")
            }
            cliElement.value = badApple[frame]
            frame += 5
        }, 1000 / 30 * 5)
    },
    "reloadlastfm.sh": () => {
        newElement = document.getElementById("lastFM-script").insertAdjacentElement("afterend", document.createElement('script'))
        newElement.src = `\${apiRoot}/lastscrobble.js?callback=lastFMCallback`
        document.getElementById("lastFM-script").remove()
        newElement.id = "lastFM-script"
        cliWrite(document.getElementById("lastfm-title").parentElement.parentElement.innerText.replaceAll("\n", " "))
        cliReturn()
    },
    "reloadtumblr.sh": () => {
        document.getElementById('tumbl').contentWindow.location.reload()
        cliReturn()
    }
}

function cliInit() {
    cliElement = document.getElementById("cli-input")
    cliElement.value = ""
    cliContent = cliElement.value
    cliElement.addEventListener("keyup", cliInput)
    cliElement.addEventListener("keydown", cliTab)
    cliReturn()
}

function cliReturn() {
    cliElement.value += "C:/> "
    cliContent = cliElement.value
    cliElement.scrollTop = cliElement.scrollHeight;
}

function cliWrite(text = "") {
    cliElement.value += text + "\n"
    cliElement.scrollTop = cliElement.scrollHeight;
}

function cliBell() {
    cliElement.parentElement.style.background = "lightgrey"
    var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
    snd.play();
    setTimeout(() => { cliElement.parentElement.style.background = "black" }, 20)
}

var previousinput = ""

function cliInput(event) {
    // console.log(event.key)
    if (event.key == "Enter") {
        let input = cliElement.value.toString().replace(cliContent, "").replaceAll("\n", "")
        previousinput = input
        let params = input.split(" ")
        let command = params.shift()
        // console.log(input)
        // console.log(command + " : " + params)
        if (commands[command] != undefined) {
            try { commands[command](params, input) }
            catch (error) { cliWrite("Command Failed: " + error.toString()) }
        } else {
            cliWrite("Unknown Command")
        }
    }
    if (event.key == "Backspace") {
        if (cliElement.value.length <= cliContent.length) {
            cliElement.value = cliContent
            cliBell()
        }
    }
    if (event.key == "c" && event.ctrlKey) {
        clearInterval(runningCommand)
        cliElement.style = null
        cliElement.parentElement.style = null
        cliReturn()
    }
    if (event.key == "Tab") {
        let input = cliElement.value.toString().replace(cliContent, "").replaceAll("\n", "")
        let matches = Object.keys(commands).map((value) => {
            return value.startsWith(input)
        })
        if (matches.filter(Boolean).length != 1) {
            cliBell()
        } else {
            cliElement.value = cliContent + Object.keys(commands)[matches.findIndex(Boolean)]
        }
    }
    if (event.key == "ArrowUp") {
        cliElement.value = cliContent + previousinput
    }
}

function cliTab(event) {
    if (event.key == "Tab") {
        event.preventDefault()
    }
}