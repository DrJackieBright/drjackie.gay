import express from 'express'
import cors from 'cors'
import https from 'https'

const app = express();
const port = 8888;

var lastfm = {
  api_key: process.env.Last-FM-Key,
  user: 'Dr-Jackie'
};

app.use(cors())

app.get("/lastScrobble", (req, res) => {
  fetchLastFM((track) => {res.send(track)})
})

app.get("/lastScrobble.js", (req, res) => {
  fetchLastFM((track) => {
    let jsEmbed = `
let track = JSON.parse('${JSON.stringify(track)}')
document.getElementById("spotify-embed").src = document.getElementById("spotify-embed").src.replace("4PTG3Z6ehGkBFwjybzWkR8", track.spotify_track_ids[0])
document.getElementById("lastfm-title").innerText = track.name
document.getElementById("lastfm-title").href = track.url
document.getElementById("lastfm-artist").innerText = track.artist["#text"]
document.getElementById("lastfm-album").innerText = track.album["#text"]
document.getElementById("lastfm-cover").src = track.image[track.image.length - 1]["#text"]
    `
    res.setHeader('Content-Type', 'text/javascript')
    res.send(jsEmbed)
  })
})

function fetchLastFM(callback) {
  let lastFMOutput = '';
  let track = {}
  https.get(new URL(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfm.user}&api_key=${lastfm.api_key}&format=json&limit=1`), (lastFMres) => {
    lastFMres.setEncoding('utf8');

    lastFMres.on('data', (chunk) => {
      lastFMOutput += chunk;
    });

    lastFMres.on('end', () => {
      track = JSON.parse(lastFMOutput).recenttracks.track[0];
      let LBOutput = '';
      https.get(new URL(`https://labs.api.listenbrainz.org/spotify-id-from-mbid/json?recording_mbid=${track.mbid}`), (LBres) => {
        LBres.setEncoding('utf8');

        LBres.on('data', (chunk) => {
          LBOutput += chunk;
        });

        LBres.on('end', () => {
          track.spotify_track_ids = JSON.parse(LBOutput)[0].spotify_track_ids;
          callback(track)
        });
      })
    });
  })
}


app.listen(port, () => {
  console.log(`listening on port ${port}`);
}); 