import express from 'express'
import cors from 'cors'
import https from 'https'
import {Datastore} from '@google-cloud/datastore'
import puppeteer from 'puppeteer'
import { url } from 'inspector'

const app = express();
const port = 8888;

const projectId = "project-f25dac72-101d-4c3d-aa1"
const datastore = new Datastore({ projectId })

var lastfm = {
  api_key: process.env["Last-FM-Key"],
  user: 'Dr-Jackie'
};

app.use(cors())

app.get("/lastscrobble.js", async (req, res) => {
  try {
    let data = await fetchLastFM()
    console.log(data)
    res.setHeader('Content-Type', 'text/javascript')
    res.setHeader('Cache-Control', 'max-age=300, stale-while-revalidate=3600, stale-if-error=3600');
    res.send(`${req.query.callback}(${JSON.stringify(data)})`)
  } catch (error) {
    console.error(error)
  }
})

async function fetchLastFM() {
  var track = {}

  var recentTracks = await apiRequest(new URL(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfm.user}&api_key=${lastfm.api_key}&format=json&limit=1`))
  track = JSON.parse(recentTracks).recenttracks.track[0]
  console.debug(track)
  track.spotify_track_ids = await getSpotifyID(track.mbid, track.artist['#text'], track.album['#text'], track.name)

  return track
}

async function getSpotifyID(mbid, artist, album, track) {
  if (mbid == "") {
    console.debug("Blank MBID")
    return getSpotifyIDFallback(artist, album, track)
  }

  let entity = await datastore.get(datastore.key(["mbid", mbid]))
  if (entity != undefined && entity.spotifyTrackIDs != undefined) {
    return entity.spotifyTrackIDs()
  } 

  let spotifyTrackIDs = getSpotifyIDFallback(artist, album, track)
  datastore.save({
    key: datastore.key(["mbid", mbid]),
    data: { spotifyTrackIDs: spotifyTrackIDs }
  })
}

async function getSpotifyIDFallback(artist, album, track) {
  let data = await apiRequest(new URL(`https://labs.api.listenbrainz.org/spotify-id-from-metadata/json?artist_name=${encodeURIComponent(artist)}&release_name=${encodeURIComponent(album)}&track_name=${encodeURIComponent(track)}`))
  let spotifyTrackIDs = JSON.parse(data)[0].spotify_track_ids
  spotifyTrackIDs.push("")
  return spotifyTrackIDs
}

async function apiRequest(requestURL, retryCount = 0) { return new Promise((resolve, reject) => {
  console.debug(requestURL.href)
  https.get(requestURL, (response) => {
    response.setEncoding('utf8')
    
    let output = ''
    response.on('data', (chunk) => { output += chunk })

    response.on('end', () => {
      if (response.statusCode != 200) {
        reject(new Error(response.statusCode))
      } else {
        resolve(output)
        console.debug(output)
      }
    })
  }).on('error', (error) => {
    if (error.code == 'ECONNRESET' && retryCount <= 5) {
      retryCount++
      resolve(apiRequest(url, retryCount))
    } else {
      reject(error)
    }
  } )
})}

app.listen(port, () => {
  console.log(`listening on port ${port}`);
}); 