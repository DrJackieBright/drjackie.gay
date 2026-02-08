import express from 'express'
import https from 'https'
import fs from 'fs'

const app = express();
const port = 8888;

var lastfm = {
  api_key: '276f7d84bdca67ac53f075785c92533f',
  secret: 'b8597c9cd3a4ca5a0ff1e3fd0acffe26',
  user: 'Dr-Jackie'
};

app.get("/blinkies", (req, res) => {
  const validExts = [".gif", ".png", ".jpg", ".jpeg"]
  const blinkieTypes = ["blinkies", "stamps"]

  fs.readdir("images/blinkies", {withFileTypes: true, recursive: true} ,(err, files) => {
    files=files.filter((file) => {
      if (!file.isFile()) {
        return false
      }
      for (const index in validExts) {
        if (file.name.toLowerCase().endsWith(validExts[index])) {
          return true
        }
      }
      return false
    })
    var listing = {}
    for (const index in blinkieTypes) {
      listing[blinkieTypes[index]]=files.filter((file) => file.parentPath.endsWith(blinkieTypes[index])).map((file) => `${file.parentPath}\\${file.name}`)
    }
    res.send(listing)
  });
})

app.get("/lastScrobble", (req, res) => {
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
          res.send(track)
        });
      })
    });
  })

})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
}); 