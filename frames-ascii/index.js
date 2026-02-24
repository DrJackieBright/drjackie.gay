const fs = require("fs")
var frames = []

var frame = 1
while (frame < 6572){
    frames[frame] = fs.readFileSync(`frames-ascii/out${String(frame).padStart(4, "0")}.jpg.txt`, {encoding: "utf8"})
    frame+=5
}

console.log(frames)
fs.writeFileSync("frames.js", "var badApple = " + JSON.stringify(frames))
