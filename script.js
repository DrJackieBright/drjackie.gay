var apiRoot = "https://api.drjackie.gay"

if (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    apiRoot = "http://localhost:8888"


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