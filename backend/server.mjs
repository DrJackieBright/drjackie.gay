import express from 'express'
import cors from 'cors'
import https from 'https'
import {Datastore} from '@google-cloud/datastore'

const app = express();
const port = 8888;

const projectId = "project-f25dac72-101d-4c3d-aa1"
const datastore = new Datastore({ projectId })

var lastfm = {
  api_key: process.env["Last-FM-Key"],
  user: 'Dr-Jackie'
};

app.use(cors())

app.get("/lastScrobble.js", (req, res) => {
  fetchLastFM((response, error) => {
    console.log(response)
    if (error) {
      console.error(error)
      res.sendStatus(500)
      return
    }
    let jsEmbed = `
(() => {
  console.log(\`${response.log.join("\n")}\`)
  let track = JSON.parse('${JSON.stringify(response.track).replace("'", "\'")}')
  console.dir(track)
  document.getElementById("spotify-embed").src = document.getElementById("spotify-embed").src.replace(/\\/[^\\/]*$/, "/" + track.spotify_track_ids[0])
  document.getElementById("lastfm-title").innerText = track.name
  document.getElementById("lastfm-title").href = track.url
  document.getElementById("lastfm-artist").innerText = track.artist["#text"]
  document.getElementById("lastfm-album").innerText = track.album["#text"]
  document.getElementById("lastfm-cover").src = track.image[track.image.length - 1]["#text"]
})()
`
// setTimeout(() => {
//   newElement = document.getElementById("lastFM-script").insertAdjacentElement("afterend", document.createElement('script'))
//   newElement.src = \`\${apiRoot}/lastscrobble.js\` 
//   document.getElementById("lastFM-script").remove()
//   newElement.id = "lastFM-script"
// }, 300000)
    res.setHeader('Content-Type', 'text/javascript')
    res.setHeader('Cache-Control', 'max-age=300, stale-while-revalidate=3600, stale-if-error=3600');
    res.send(jsEmbed)
  })
})

var errorCount = 0
function fetchLastFM(callback) {
  let lastFMOutput = '';
  var response = {}
  response.log = []
  function log(input) {
    console.log(input)
    response.log.push(input.toString())
  }
  function handleError(error) {
    if (errorCount <= 3) {
      errorCount++
      log(`Error #${errorCount}`)
      log(error)
      fetchLastFM(callback)
    } else {
      log(error)
      callback(response, error)
    }
  }

  apiRequest(new URL(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfm.user}&api_key=${lastfm.api_key}&format=json&limit=1`), (data, error) => {
    if (error) { handleError(error); return; }

    response.track = JSON.parse(data).recenttracks.track[0];

    getSpotifyID(response.track.mbid, response.track.artist['#text'], response.track.album['#text'], response.track.name, (spotifyTrackIDs) => {
      response.track.spotify_track_ids = spotifyTrackIDs
      callback(response)
      errorCount = 0
    })

  })

}

function getSpotifyID(mbid, artist, album, track, callback) {
  datastore.get(datastore.key(["mbid", mbid]), (err, entity) => {
    if (entity == undefined || entity.spotifyTrackIDs == undefined) {
      apiRequest(new URL(`https://labs.api.listenbrainz.org/spotify-id-from-metadata/json?artist_name=${encodeURIComponent(artist)}&release_name=${encodeURIComponent(album)}&track_name=${encodeURIComponent(track)}`), (data) => {
        let spotifyTrackIDs = JSON.parse(data)[0].spotify_track_ids
        datastore.save({
          key: datastore.key(["mbid", mbid]),
          data: { spotifyTrackIDs: spotifyTrackIDs }
        })

        callback(spotifyTrackIDs)
      })
    } else {
      callback(entity.spotifyTrackIDs)
    }
  })
}

function apiRequest(URL, callback) {
  console.log(`Requesting ${URL.toString().replace(lastfm.api_key, "#### API KEY ####")}`) 
  https.get(URL, (response) => {
    response.setEncoding('utf8')
    
    let output = ''
    response.on('data', (chunk) => { output += chunk })

    response.on('end', () => {
      if (response.statusCode != 200) {
        callback("error", new Error(response.statusCode))
      } else {
        callback(output)
      }
    })
  }).on('error', (error) => { callback("error", error) })
}

app.listen(port, () => {
  console.log(`listening on port ${port}`);
}); 