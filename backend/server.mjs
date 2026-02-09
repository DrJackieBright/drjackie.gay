import express from 'express'
import cors from 'cors'
import https from 'https'

const app = express();
const port = 8888;

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
console.log(\`${response.log.join("\n")}\`)
let track = JSON.parse('${JSON.stringify(response.track).replace("'", "\'")}')
console.dir(track)
document.getElementById("spotify-embed").src = document.getElementById("spotify-embed").src.replace("4PTG3Z6ehGkBFwjybzWkR8", track.spotify_track_ids[0])
document.getElementById("lastfm-title").innerText = track.name
document.getElementById("lastfm-title").href = track.url
document.getElementById("lastfm-artist").innerText = track.artist["#text"]
document.getElementById("lastfm-album").innerText = track.album["#text"]
document.getElementById("lastfm-cover").src = track.image[track.image.length - 1]["#text"]
    `
    res.setHeader('Content-Type', 'text/javascript')
    res.setHeader('Cache-Control', 'max-age=300, stale-while-revalidate=3600, stale-if-error=3600');
    res.send(jsEmbed)
  })
})

function fetchLastFM(callback) {
  let lastFMOutput = '';
  var response = {}
  response.log = []
  function log(input) {
    console.log(input)
    response.log.push(input.toString())
  }
  https.get(new URL(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfm.user}&api_key=${lastfm.api_key}&format=json&limit=1`), (lastFMres) => {
    lastFMres.setEncoding('utf8');

    lastFMres.on('data', (chunk) => {
      lastFMOutput += chunk;
    });

    lastFMres.on('end', () => {
      log("LastFM API status: " + lastFMres.statusCode)
      response.track = JSON.parse(lastFMOutput).recenttracks.track[0];

      let LBOutput = '';
      https.get(new URL(`https://labs.api.listenbrainz.org/spotify-id-from-mbid/json?recording_mbid=${response.track.mbid}`), (LBres) => {
        LBres.setEncoding('utf8');

        LBres.on('data', (chunk) => {
          LBOutput += chunk;
        });

        LBres.on('end', () => {
          if (LBres.statusCode != 200 || LBOutput == "[]") {
            log(`Error getting ID for mbid ${response.track.mbid}`)
            log("ListenBrainz API status: " + LBres.statusCode)
            log("ListenBrainz response: " + LBOutput)
            log("Using metadata search fallback")
            LBOutput = '';
            https.get(new URL(`https://labs.api.listenbrainz.org/spotify-id-from-metadata/json?artist_name=${encodeURIComponent(response.track.artist['#text'])}&release_name=${encodeURIComponent(response.track.album['#text'])}&track_name=${encodeURIComponent(response.track.name)}`), (LBres) => {
              LBres.setEncoding('utf8');

              LBres.on('data', (chunk) => {
                LBOutput += chunk;
              });

              LBres.on('end', () => {
                if (LBres.statusCode != 200 || LBOutput == "[]") {
                  log(`Error getting ID for metadata: ?artist_name=${encodeURIComponent(response.track.artist['#text'])}&release_name=${encodeURIComponent(response.track.album['#text'])}&track_name=${encodeURIComponent(response.track.name)}`)
                  log("ListenBrainz API status: " + LBres.statusCode)
                  log("ListenBrainz response: " + LBOutput)
                  response.track.spotify_track_ids = ["5qTjsVvPsQkKiPCMNWIOd1"]
                  callback(response)
                  return
                } else {
                  response.track.spotify_track_ids = JSON.parse(LBOutput)[0].spotify_track_ids;
                  callback(response)
                  return
                }
              });
            }).on('error', (error) => {
              log(error)
              callback(response, error)
            })
          } else {
            response.track.spotify_track_ids = JSON.parse(LBOutput)[0].spotify_track_ids;
            callback(response)
            return
          }
        });
      }).on('error', (error) => {
      log(error)
      callback(response, error)
  })
    });
  }).on('error', (error) => {
    log(error)
    callback(response, error)
  })
}

app.listen(port, () => {
  console.log(`listening on port ${port}`);
}); 