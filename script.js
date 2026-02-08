const apiRoot = "https://api.drjackie.gay"

function fillBlinkies(elementID, folder, height=50, width=100) {
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

function spotifyEmbed() {
    const http = new XMLHttpRequest()
    http.open("GET", `${apiRoot}/lastscrobble`)
    http.send()
    http.onload = () => {
        let track = JSON.parse(http.response)
        document.getElementById("spotify-embed").src = document.getElementById("spotify-embed").src.replace("4PTG3Z6ehGkBFwjybzWkR8", track.spotify_track_ids[0])
        document.getElementById("lastfm-title").innerText = track.name
        document.getElementById("lastfm-title").href = track.url
        document.getElementById("lastfm-artist").innerText = track.artist["#text"]
        document.getElementById("lastfm-album").innerText = track.album["#text"]
        document.getElementById("lastfm-cover").src = track.image[track.image.length - 1]["#text"]
    }
}