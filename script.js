var apiRoot = "https://api.drjackie.gay"

if (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    apiRoot = "http://localhost:8888"

var noembed = location.search.toLowerCase().includes("noembed")

window.onload = () => {
    if (noembed) {
        document.getElementById("tumblr-div").remove()
        document.getElementById("spotify-embed").remove()
    } else {
        document.getElementById("tumblr-frame").srcdoc = `
            <head>
                <link rel='stylesheet' href='tumblr.css'>
                <base target='_blank'>
            </head>
            <body>
                <p style='margin-left: 20px'>My last rebog:</p>
                <script type='text/javascript' src='https://dr-jackie.tumblr.com/js?num=1'></script>
            </body>
        `
    }
}

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
    if ( !noembed ) document.getElementById("spotify-embed").src = "https://open.spotify.com/embed/track/" + track.spotify_track_ids[0]
    document.getElementById("lastfm-title").innerText = track.name
    document.getElementById("lastfm-title").href = track.url
    document.getElementById("lastfm-artist").innerText = track.artist["#text"]
    document.getElementById("lastfm-album").innerText = track.album["#text"]
    document.getElementById("lastfm-cover").src = track.image[track.image.length - 1]["#text"]
}