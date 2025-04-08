import express from "express"
import querystring from "querystring"
import axios from "axios"
import bodyParser from "body-parser"
import cors from "cors"
import dotenv from "dotenv"
import { Buffer } from "buffer"
dotenv.config()
import { requireAuth } from "./middleware/requireAuth.js"
import { v4 as uuidv4 } from "uuid"
import cookieParser from "cookie-parser"

const redirect_uri = process.env.SPOTIFY_REDIRECT_URI
const frontend_uri = process.env.FRONTEND_URI
const app = express()
app.use(
  cors({
    origin: frontend_uri,
  }),
)
app.use(cookieParser())
app.use(bodyParser.json())

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const NEWS_API_KEY = process.env.NEWS_API_KEY
const GIPHY_API_KEY = process.env.GIPHY_API_KEY
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY
const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY
const GOOGLE_CSE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID

// Simple In-Memory Store
let storedAccessToken = null
let storedRefreshToken = null
let tokenExpiryTime = 0

app.get("/login", (req, res) => {
  const state = uuidv4() //Secure random UUID like "550e8400-e29b-41d4-a716-446655440000" as Spotify requires a state parameter to prevent CSRF attacks.
  res.cookie("spotify_auth_state", state, { httpOnly: true, secure: true, sameSite: "Lax" })
  const scope = [
    "user-read-private",
    "user-read-email",
    "user-library-read",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-top-read",
  ].join(" ")

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: SPOTIFY_CLIENT_ID,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      }),
  )
})

app.get("/callback", async (req, res) => {
  const code = req.query.code || null
  const state = req.query.state || null
  //Verify received state matches the stored state
  const storedState = req.cookies.spotify_auth_state

  if (state === null || state != storedState) {
    return res.redirect(`${frontend_uri}/#${querystring.stringify({ error: "state mismatch" })}`)
  }

  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code", //exchange type
        code: code,
        redirect_uri: redirect_uri, //login uri
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET).toString("base64"),
          //Authorization: Basic base64(client_id:client_secret)
        },
      },
    )

    storedAccessToken = tokenResponse.data.access_token //stores access token sent by spotify
    storedRefreshToken = tokenResponse.data.refresh_token // stores refresh token
    tokenExpiryTime = Date.now() + tokenResponse.data.expires_in * 1000 // 1 hr expiry time

    console.log("tokens obtained")

    // Redirect back to frontend with tokens in hash
    res.redirect(
      `${frontend_uri}/#${querystring.stringify({
        access_token: storedAccessToken,
        expires_in: tokenResponse.data.expires_in,
      })}`,
    ) // http://localhost:5173/#access_token=BQAx...&expires_in=3600
  } catch (error) {
    console.error("Error exchanging code for token:", error.response ? error.response.data : error.message)
    res.redirect(`${frontend_uri}/#${querystring.stringify({ error: "invalid token" })}`)
  }
})

app.post("/refresh_token", async (req, res) => {
  //refresh the user's access token when it expires using a refresh token without needing the user to log in again.
  const { refresh_token } = req.body
  if (!refresh_token && !storedRefreshToken) {
    // Check body first, then internal store
    return res.status(400).json({ error: "Refresh token not provided and not stored" })
  }
  const tokenToUse = refresh_token || storedRefreshToken

  try {
    const refreshResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokenToUse,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET).toString("base64"),
        },
      },
    )

    // Update internal store if internal token was refreshed
    if (!refresh_token) {
      storedAccessToken = refreshResponse.data.access_token
      tokenExpiryTime = Date.now() + refreshResponse.data.expires_in * 1000
      console.log("Spotify token refreshed")
    }

    res.json({
      access_token: refreshResponse.data.access_token,
      expires_in: refreshResponse.data.expires_in,
    })
  } catch (error) {
    console.error("Error refreshing token:", error.response ? error.response.data : error.message)
    // Clear internal tokens on failure if they were being used?
    if (!refresh_token) {
      storedAccessToken = null
      tokenExpiryTime = 0
    }
    res.status(error.response?.status || 500).json({ error: "Failed to refresh token" })
  }
})

// Apply auth middleware to Spotify proxy routes
app.get("/user", requireAuth, async (req, res) => {
  try {
    const response = await axios.get("https://api.spotify.com/v1/me", {
      //user info
      headers: { Authorization: `Bearer ${req.token}` },
    })
    res.json(response.data)
  } catch (error) {
    console.error("/user Error:", error.response?.status, error.response?.data?.error?.message)
    res
      .status(error.response?.status || 500)
      .json({ error: error.response?.data?.error?.message || "Failed fetching user data" })
  }
})

app.get("/playlists", requireAuth, async (req, res) => {
  try {
    const limit = req.query.limit || 20
    const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
      //user's playlist info
      headers: { Authorization: `Bearer ${req.token}` },
      params: { limit },
    })
    res.json(response.data.items || [])
  } catch (error) {
    console.error("/playlists Error:", error.response?.status, error.response?.data?.error?.message)
    res
      .status(error.response?.status || 500)
      .json({ error: error.response?.data?.error?.message || "Failed fetching playlists" })
  }
})

app.get("/liked-songs", requireAuth, async (req, res) => {
  try {
    const limit = req.query.limit || 20
    const offset = req.query.offset || 0
    const response = await axios.get("https://api.spotify.com/v1/me/tracks", {
      //liked songs info
      headers: { Authorization: `Bearer ${req.token}` },
      params: { limit, offset },
    })
    res.json(response.data.items || [])
  } catch (error) {
    console.error("/liked-songs Error:", error.response?.status, error.response?.data?.error?.message)
    res
      .status(error.response?.status || 500)
      .json({ error: error.response?.data?.error?.message || "Failed fetching liked songs" })
  }
})

app.get("/top-tracks", requireAuth, async (req, res) => {
  try {
    const limit = req.query.limit || 20
    const offset = req.query.offset || 0
    const time_range = req.query.time_range || "medium_term"
    const response = await axios.get("https://api.spotify.com/v1/me/top/tracks", {
      //most listened (top-tracks) info
      headers: { Authorization: `Bearer ${req.token}` },
      params: { limit, offset, time_range },
    })
    res.json(response.data.items || [])
  } catch (error) {
    console.error("/top-tracks Error:", error.response?.status, error.response?.data?.error?.message)
    res
      .status(error.response?.status || 500)
      .json({ error: error.response?.data?.error?.message || "Failed to fetch top tracks" })
  }
})

// NEW ENDPOINT: Search Tracks
app.get("/search", requireAuth, async (req, res) => {
  try {
    const q = req.query.q
    const limit = req.query.limit || 20
    const offset = req.query.offset || 0

    if (!q) {
      return res.status(400).json({ error: "Search query is required" })
    }

    const response = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${req.token}` },
      params: {
        q,
        type: "track",
        limit,
        offset,
      },
    })

    // Extract and simplify track objects
    const tracks = response.data.tracks.items.map((track) => ({
      id: track.id,
      name: track.name,
      uri: track.uri,
      artists: track.artists.map((artist) => ({ name: artist.name })),
      album: {
        name: track.album.name,
        images: track.album.images,
      },
      duration_ms: track.duration_ms,
    }))

    res.json({ tracks })
  } catch (error) {
    console.error("/search Error:", error.response?.status, error.response?.data?.error?.message)
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || "Failed to search tracks",
    })
  }
})

// NEW ENDPOINT: Get Playlist Tracks
app.get("/playlists/:playlistId/tracks", requireAuth, async (req, res) => {
  try {
    const { playlistId } = req.params
    const limit = req.query.limit || 50
    const offset = req.query.offset || 0

    const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: { Authorization: `Bearer ${req.token}` },
      params: {
        limit,
        offset,
        fields: "items(track(id,name,uri,artists(name),album(name,images),duration_ms))",
      },
    })

    // Extract and simplify track objects from playlist items
    const tracks = response.data.items.map((item) => ({
      id: item.track.id,
      name: item.track.name,
      uri: item.track.uri,
      artists: item.track.artists.map((artist) => ({ name: artist.name })),
      album: {
        name: item.track.album.name,
        images: item.track.album.images,
      },
      duration_ms: item.track.duration_ms,
    }))

    res.json({ tracks })
  } catch (error) {
    console.error("/playlists/:playlistId/tracks Error:", error.response?.status, error.response?.data?.error?.message)
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || "Failed to fetch playlist tracks",
    })
  }
})

// --- Insights API Routes ---

app.get("/api/weather", async (req, res) => {
  const lat = req.query.lat //latitude
  const lon = req.query.lon //longitude
  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing latitude or longitude" })
  }
  if (!OPENWEATHER_API_KEY) {
    console.error("API Key missing")
    return res.status(500).json({ error: "Server configuration error for weather." })
  }
  try {
    const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: { lat, lon, appid: OPENWEATHER_API_KEY, units: "metric" }, //celsius unit
    })
    res.json(response.data)
  } catch (error) {
    console.error("OpenWeather API Error:", error.response?.status, error.response?.data)
    res.status(error.response?.status || 500).json({ error: "Failed fetching weather data." })
  }
})

app.get("/api/news", async (req, res) => {
  const query = req.query.q
  if (!query) {
    return res.status(400).json({ error: "Missing query" })
  }
  if (!NEWS_API_KEY) {
    console.error("News API Key missing")
    return res.status(500).json({ error: "Server configuration error for news." })
  }
  try {
    const encodedQuery = encodeURIComponent(query)
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: encodedQuery, // Send encoded query
        apiKey: NEWS_API_KEY,
        pageSize: 5,
        sortBy: "publishedAt",
        language: "en",
      },
    })
    res.json(response.data.articles || [])
  } catch (error) {
    console.error("News API Error:", error.response?.status, error.response?.data)
    res.status(error.response?.status || 500).json({ error: "Failed fetching news articles." })
  }
})

app.get("/api/gifs", async (req, res) => {
  const query = req.query.q
  if (!query) {
    return res.status(400).json({ error: "Missing query parameter (q)." })
  }
  if (!GIPHY_API_KEY) {
    console.error("Giphy API Key missing")
    return res.status(500).json({ error: "Server configuration error for GIFs." })
  }
  try {
    const response = await axios.get("https://api.giphy.com/v1/gifs/search", {
      params: {
        q: query,
        api_key: GIPHY_API_KEY,
        limit: 1,
        rating: "g",
      },
    })
    res.json({ url: response.data.data?.[0]?.images?.downsized?.url || null })
  } catch (error) {
    console.error("Giphy API Error:", error.response?.status, error.response?.data)
    res.status(error.response?.status || 500).json({ error: "Failed fetching GIF." })
  }
})

app.get("/api/search", async (req, res) => {
  const query = req.query.q
  if (!query) {
    return res.status(400).json({ error: "Missing search query parameter (q)." })
  }
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    console.error("Google Search API Key or Search Engine ID missing")
    return res.status(500).json({ error: "Server configuration error for search." })
  }

  try {
    const googleApiUrl = `https://www.googleapis.com/customsearch/v1`
    const response = await axios.get(googleApiUrl, {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: query,
        num: 5, // Limit to 5 results
      },
    })

    // Transform results to match frontend interface
    const searchResults = (response.data.items || []).map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }))

    res.json(searchResults)
  } catch (error) {
    console.error(
      "Google Search API Error:",
      error.response?.status,
      error.response?.data?.error?.message || error.message,
    )
    res.status(error.response?.status || 500).json({ error: "Failed fetching Google search results." })
  }
})

app.get("/api/search-lyrics", async (req, res) => {
    const trackName = req.query.trackName
    const artistName = req.query.artistName
  
    if (!trackName || !artistName) {
      return res.status(400).json({ error: "Missing trackName or artistName query parameter." })
    }
    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
      console.error("Google Search API Key or Search Engine ID missing for lyrics search")
      return res.status(500).json({ error: "Server configuration error for lyrics search." })
    }
  
    const query = `"${trackName}" "${artistName}" lyrics`
  
    try {
      const googleApiUrl = `https://www.googleapis.com/customsearch/v1`
      console.log(`Searching Google for lyrics query: ${query}`) // Optional logging
      const response = await axios.get(googleApiUrl, {
        params: {
          key: GOOGLE_API_KEY,
          cx: GOOGLE_CSE_ID,
          q: query,
          num: 5, 
        },
      })
  
      
      const searchResults = (response.data.items || []).map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }))
  
      console.log(`Found ${searchResults.length} potential lyrics links.`) // Optional logging
      res.json(searchResults)
    } catch (error) {
      console.error(
        "Google Lyrics Search API Error:",
        error.response?.status,
        error.response?.data?.error?.message || error.message,
      )
      res.status(error.response?.status || 500).json({ error: "Failed fetching Google search results for lyrics." })
    }
  })

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`\n Backend server running at http://localhost:${PORT}`)
  console.log(` Configured Frontend URL: ${frontend_uri}`)
  console.log(`Initiate Spotify login via backend: http://localhost:${PORT}/login`)
  console.log(`Spotify Callback URL: ${redirect_uri}`)

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.warn("WARNING: SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET seem missing in .env!")
  }
  if (!OPENWEATHER_API_KEY || !NEWS_API_KEY || !GIPHY_API_KEY || !GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    console.warn(
      "WARNING: One or more external API keys (Weather, News, Giphy, Google Search) might be missing in .env!",
    )
  }
})
export default app
