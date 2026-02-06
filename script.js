function fillBlinkies(elementID, path, height=50, width=100) {
    const extensions = ["png", "gif", "jpg"]
    const threads = Math.floor(navigator.hardwareConcurrency / 2)
    var knownLimit = Infinity
    for (let index = 1; index <= threads; index++) {
        tryBlinky(index,threads,0)   
    }
    async function tryBlinky(index, jumpSize, ext_index) {
        if (index > knownLimit) { return }     
        // console.log(index, knownLimit, ext_index)
        let test_url = `${path}/${index}.${extensions[ext_index]}`
        const http = new XMLHttpRequest();
        http.open('HEAD', test_url, true);
        http.send();
        http.onload = () => {
            // console.log(http);
            if (http.status!=404) {
                var img = document.createElement("img")
                img.height = height
                img.width = width
                img.src = http.responseURL
                document.getElementById(elementID).appendChild(img)
                tryBlinky(index + jumpSize, jumpSize, 0)
            } else {
                if (ext_index < extensions.length - 1) {
                    tryBlinky(index, jumpSize, ext_index + 1)
                } else {
                    if (index < knownLimit) {
                        // console.log(index)
                        knownLimit = index
                    }
                }
            }
        }
    }
}