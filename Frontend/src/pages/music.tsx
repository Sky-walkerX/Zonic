"use client"

import { useState, useEffect, useCallback } from "react"
import axios, { type AxiosError } from "axios"
import { Switch } from "@/components/ui/switch"
import { ScrollArea, ScrollBar } from "@/registry/ui/scroll-area"
import { Separator } from "@/registry/ui/separator"
import { Button } from "@/registry/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/ui/tabs"

import { AlbumArtwork } from "@/components/ui/album-artwork"
import { Menu } from "@/components/ui/menu"
import { PodcastEmptyPlaceholder } from "@/components/ui/podcast-empty-placeholder"
import { TrackListItem } from "@/components/ui/track-list-item"
import { Sidebar } from "@/components/ui/sidebar"
import { FaPlay } from "react-icons/fa"
import { ArrowLeft, Loader2 } from "lucide-react"

// --- Import Player Context Hook ---
import { usePlayerContext } from "@/context/PlayerContext" // Adjust path if needed

// --- Interfaces (Keep these as they are) ---
interface SpotifyImage {
  url: string
  height?: number
  width?: number
}
interface Artist {
  name: string
  id: string
}
interface Album {
  id: string
  name: string
  images: SpotifyImage[]
  artists?: Artist[]
}
interface Track {
  id: string
  name: string
  artists: Artist[]
  album: Album
  duration_ms: number
  preview_url: string | null
  uri: string
}
interface SavedTrackItem {
  added_at: string
  track: Track
}
interface UserPlaylist {
  id: string
  name: string
  images: SpotifyImage[]
  description: string
  owner: { display_name: string; id: string }
  public: boolean
  tracks: { href: string; total: number }
  uri: string
}

// --- API Base URL ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""

// --- Main Music Page Component ---
function MusicPage() {
  // --- State ---
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([])
  const [likedTracks, setLikedTracks] = useState<Track[]>([])
  const [topTracks, setTopTracks] = useState<Track[]>([])

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [_currentlyPlayingTrackUri, setCurrentlyPlayingTrackUri] = useState<string | null>(null)

  // New state for search functionality
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)

  // New state for playlist functionality
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [selectedPlaylistName, setSelectedPlaylistName] = useState<string>("")
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([])
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState<boolean>(false)

  // Get the function to update the global player state from the context
  const { setPlayerState } = usePlayerContext()

  // 1. Handle Authentication Callback & Token Storage
  useEffect(() => {
    // ... (authentication logic remains the same) ...
    const hash = window.location.hash
    window.location.hash = "" // Clear hash

    if (accessToken) {
      setIsLoading(false)
      return
    }

    const params = new URLSearchParams(hash.substring(1))
    const tokenFromUrl = params.get("access_token")
    const errorParam = params.get("error")

    if (errorParam) {
      console.error("Spotify Login Error:", errorParam)
      setError(`Login failed: ${errorParam}. Please try again.`)
      setIsLoading(false)
    } else if (tokenFromUrl) {
      console.log("✅ Access Token Received from URL Hash")
      localStorage.setItem("spotify_access_token", tokenFromUrl)
      setAccessToken(tokenFromUrl)
    } else {
      const storedToken = localStorage.getItem("spotify_access_token")
      if (storedToken) {
        console.log("🔑 Using token from localStorage")
        setAccessToken(storedToken)
      } else {
        console.log("🤷 No token found. User needs to log in.")
        setIsLoading(false)
      }
    }
  }, []) // Empty dependency array is intentional here

  // Fetch Data when Access Token is Available
  useEffect(() => {
    if (!accessToken) {
      return
    }
    setIsLoading(true)
    setError(null)
    const fetchData = async () => {
      console.log("🚀 Fetching Spotify data...")
      try {
        const headers = { Authorization: `Bearer ${accessToken}` }
        const [likedResponse, topTracksResponse, playlistsResponse] = await Promise.all([
          axios.get<SavedTrackItem[]>(`${API_BASE_URL}/liked-songs`, { headers, params: { limit: 10 } }),
          axios.get<Track[]>(`${API_BASE_URL}/top-tracks`, {
            headers,
            params: { limit: 10, time_range: "short_term" },
          }),
          axios.get<UserPlaylist[]>(`${API_BASE_URL}/playlists`, { headers, params: { limit: 20 } }),
        ])
        setLikedTracks(likedResponse.data.map((item) => item.track))
        setTopTracks(topTracksResponse.data)
        setUserPlaylists(playlistsResponse.data)
      } catch (err: unknown) {
        console.error("❌ Error fetching data:", err)
        let errorMessage = "Failed to load music data."
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ error?: string | { message?: string } }>
          let specificError = "An unknown API error occurred."
          if (typeof axiosError.response?.data?.error === "string") specificError = axiosError.response.data.error
          else if (typeof axiosError.response?.data?.error?.message === "string")
            specificError = axiosError.response.data.error.message
          else if (axiosError.message) specificError = axiosError.message
          errorMessage = `API Error (${axiosError.response?.status || "Network Error"}): ${specificError}`
          if (axiosError.response?.status === 401) {
            errorMessage = "Your session expired. Please log in again."
            setError(errorMessage)
            localStorage.removeItem("spotify_access_token")
            setAccessToken(null)
            return
          }
        } else if (err instanceof Error) {
          errorMessage = err.message
        }
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [accessToken])

  // --- Playback Handler ---
  // Modify to accept necessary track details
  const handlePlayTrack = useCallback(
    (trackDetails: { uri: string; name: string; artistName: string | null }) => {
      console.log(`▶️ Playing track: ${trackDetails.name} by ${trackDetails.artistName || "Unknown Artist"}`)
      console.log("1. handlePlayTrack CALLED with:", trackDetails)

      // Update local state for the embed player
      setCurrentlyPlayingTrackUri(trackDetails.uri)

      // 2. Update the global PlayerContext state
      setPlayerState({
        trackUri: trackDetails.uri,
        trackName: trackDetails.name,
        artistName: trackDetails.artistName,
      })

      console.log("2. setPlayerState CALLED in handlePlayTrack")
    },
    [setPlayerState],
  ) // Add setPlayerState as a dependency

  // New function to handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !accessToken) return

    setIsSearching(true)
    setError(null)
    // Clear playlist selection when searching
    setSelectedPlaylistId(null)
    setPlaylistTracks([])

    try {
      const response = await axios.get(`${API_BASE_URL}/search`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { q: searchQuery },
      })

      setSearchResults(response.data.tracks || [])
    } catch (err) {
      console.error("Search error:", err)
      let errorMessage = "Failed to search tracks."
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error?: string }>
        errorMessage = `Search error: ${axiosError.response?.data?.error || axiosError.message}`
      }
      setError(errorMessage)
    } finally {
      setIsSearching(false)
    }
  }

  // New function to handle playlist selection
  const handlePlaylistSelect = async (playlistId: string, playlistName: string) => {
    if (!accessToken) return

    setIsLoadingPlaylist(true)
    setError(null)
    // Clear search results when selecting a playlist
    setSearchQuery("")
    setSearchResults([])
    setSelectedPlaylistId(playlistId)
    setSelectedPlaylistName(playlistName)

    try {
      const response = await axios.get(`${API_BASE_URL}/playlists/${playlistId}/tracks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      setPlaylistTracks(response.data.tracks || [])
    } catch (err) {
      console.error("Playlist tracks error:", err)
      let errorMessage = "Failed to load playlist tracks."
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error?: string }>
        errorMessage = `Playlist error: ${axiosError.response?.data?.error || axiosError.message}`
      }
      setError(errorMessage)
    } finally {
      setIsLoadingPlaylist(false)
    }
  }

  // Function to clear search and playlist selection
  const handleBackToMain = () => {
    setSearchQuery("")
    setSearchResults([])
    setSelectedPlaylistId(null)
    setPlaylistTracks([])
  }

  // Login Function
  const handleLogin = () => {
    setError(null)
    window.location.href = `${API_BASE_URL}/login`
  }

  // Login Screen
  if (!accessToken && !isLoading) {
    // ... (login screen JSX remains the same) ...
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white flex-col space-y-4 p-5 text-center">
        <h1 className="text-3xl font-bold">Welcome to Music</h1>
        {error && <p className="text-red-500 bg-red-900/50 px-4 py-2 rounded border border-red-700">{error}</p>}
        <p>Please log in with Spotify to continue.</p>
        <button
          onClick={handleLogin}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform hover:scale-105"
        >
          Log in with Spotify
        </button>
      </div>
    )
  }

  // Loading Screen
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white text-xl">Loading your music...</div>
    )
  }

  // Main Authenticated UI
  return (
    <>
      {/* Mobile Fallback  */}
      <div className="md:hidden">
        {/* ... (mobile fallback JSX remains the same) ... */}
        <p className="p-4 text-center bg-black text-white h-screen flex items-center justify-center">
          This experience is designed for larger screens.
        </p>
      </div>

      {/* Main Desktop Layout */}
      <div className="md:block h-screen flex flex-col">
        <Menu searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearchSubmit={handleSearch} />
        <div className="border-t flex-grow overflow-hidden">
          <div className="bg-background h-full">
            <div className="grid lg:grid-cols-5 h-full">
              <Sidebar
                playlists={userPlaylists}
                className="hidden lg:block h-full overflow-y-auto"
                onPlaylistSelect={handlePlaylistSelect}
              />
              <div className="col-span-3 lg:col-span-4 lg:border-l h-full flex flex-col">
                <div className="flex-grow overflow-y-auto px-4 py-6 lg:px-8 pb-[90px]">
                  <Tabs defaultValue="music" className="h-full space-y-6">
                    {/* Tabs Header (Keep as is) */}
                    <div className="space-between flex items-center">
                      {/* ... (tabs header JSX remains the same) ... */}
                      <TabsList>
                        <TabsTrigger value="music" className="relative">
                          Music
                        </TabsTrigger>
                        <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
                        <TabsTrigger value="live" disabled>
                          Live
                        </TabsTrigger>
                      </TabsList>
                      <div className="ml-auto mr-4">
                        <Switch />
                      </div>
                    </div>
                    {error && (
                      <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded my-4">{error}</div>
                    )}

                    <TabsContent value="music" className="border-none p-0 outline-none mt-0!">
                      {/* Back button for search results or playlist view */}
                      {(searchResults.length > 0 || selectedPlaylistId) && (
                        <Button variant="ghost" size="sm" onClick={handleBackToMain} className="mb-4">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Library
                        </Button>
                      )}

                      {/* Search Results View */}
                      {searchResults.length > 0 && (
                        <section>
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h2 className="text-2xl font-semibold tracking-tight">Search Results</h2>
                              <p className="text-sm text-muted-foreground">
                                Found {searchResults.length} tracks for "{searchQuery}"
                              </p>
                            </div>
                            {isSearching && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                          </div>
                          <Separator className="my-4" />
                          <div className="space-y-1">
                            {searchResults.map((track) => (
                              <TrackListItem key={`search-${track.id}`} track={track} onPlay={handlePlayTrack} />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Playlist Tracks View */}
                      {selectedPlaylistId && playlistTracks.length > 0 && (
                        <section>
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h2 className="text-2xl font-semibold tracking-tight">{selectedPlaylistName}</h2>
                              <p className="text-sm text-muted-foreground">{playlistTracks.length} tracks</p>
                            </div>
                            {isLoadingPlaylist && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                          </div>
                          <Separator className="my-4" />
                          <div className="space-y-1">
                            {playlistTracks.map((track) => (
                              <TrackListItem key={`playlist-${track.id}`} track={track} onPlay={handlePlayTrack} />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Default View (when no search or playlist is selected) */}
                      {!searchResults.length && !selectedPlaylistId && (
                        <>
                          {/* Section 1: Liked Songs */}
                          <section className="mb-8">
                            {/* ... (section header JSX remains the same) ... */}
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h2 className="text-2xl font-semibold tracking-tight">Listen Now</h2>
                                <p className="text-sm text-muted-foreground">Your recently liked tracks.</p>
                              </div>
                            </div>
                            <Separator className="my-4" />
                            <div className="relative">
                              <ScrollArea>
                                <div className="flex space-x-4 pb-4">
                                  {likedTracks.length > 0 ? (
                                    likedTracks.map((track) => {
                                      // Prepare details for the handler
                                      const trackDetails = {
                                        uri: track.uri,
                                        name: track.name,
                                        artistName: track.artists[0]?.name || null, // Get first artist
                                      }
                                      return (
                                        // *** UPDATE onClick ***
                                        <div
                                          key={track.id + "-liked"}
                                          onClick={() => handlePlayTrack(trackDetails)}
                                          className="cursor-pointer group relative"
                                        >
                                          <AlbumArtwork
                                            album={{
                                              name: track.name,
                                              artist: track.artists.map((a) => a.name).join(", "),
                                              cover: track.album.images?.[0]?.url,
                                            }}
                                            className="w-[200px]"
                                            aspectRatio="portrait"
                                            width={200}
                                            height={260}
                                          />
                                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
                                            <FaPlay className="text-white text-4xl drop-shadow-lg" />
                                          </div>
                                        </div>
                                      )
                                    })
                                  ) : (
                                    <p className="text-muted-foreground px-2">No liked songs found or loaded.</p>
                                  )}
                                </div>
                                <ScrollBar orientation="horizontal" />
                              </ScrollArea>
                            </div>
                          </section>

                          {/* Section 2: Top Tracks */}
                          <section>
                            {/* ... (section header JSX remains the same) ... */}
                            <div className="mt-6 space-y-1">
                              <h2 className="text-2xl font-semibold tracking-tight">Made for You</h2>
                              <p className="text-sm text-muted-foreground">Your recent top tracks.</p>
                            </div>
                            <Separator className="my-4" />
                            <div className="relative">
                              <ScrollArea>
                                <div className="flex space-x-4 pb-4">
                                  {topTracks.length > 0 ? (
                                    topTracks.map((track) => {
                                      // Prepare details for the handler
                                      const trackDetails = {
                                        uri: track.uri,
                                        name: track.name,
                                        artistName: track.artists[0]?.name || null, // Get first artist
                                      }
                                      return (
                                        // *** UPDATE onClick ***
                                        <div
                                          key={track.id + "-top"}
                                          onClick={() => handlePlayTrack(trackDetails)}
                                          className="cursor-pointer group relative"
                                        >
                                          <AlbumArtwork
                                            album={{
                                              name: track.name,
                                              artist: track.artists.map((a) => a.name).join(", "),
                                              cover: track.album.images?.[0]?.url,
                                            }}
                                            className="w-[150px]"
                                            aspectRatio="square"
                                            width={150}
                                            height={150}
                                          />
                                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
                                            <FaPlay className="text-white text-3xl drop-shadow-lg" />
                                          </div>
                                        </div>
                                      )
                                    })
                                  ) : (
                                    <p className="text-muted-foreground px-2">No top tracks found or loaded.</p>
                                  )}
                                </div>
                                <ScrollBar orientation="horizontal" />
                              </ScrollArea>
                            </div>
                          </section>
                        </>
                      )}
                    </TabsContent>

                    {/* Podcasts Tab Content (Keep as is) */}
                    <TabsContent value="podcasts" className="h-full flex-col border-none p-0 data-[state=active]:flex">
                      {/* ... (podcast placeholder JSX remains the same) ... */}
                      <PodcastEmptyPlaceholder />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MusicPage
