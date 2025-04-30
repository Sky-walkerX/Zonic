"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import { Button } from "@/registry/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/registry/ui/card"
import { Separator } from "@/registry/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/ui/tabs"
import { FaCloudSun, FaArrowLeft, FaMusic, FaInfoCircle, FaGlobe } from "react-icons/fa"
import { Music, Share2 } from "lucide-react"
import { usePlayerContext } from "@/context/PlayerContext"
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision"
import { GridDot } from "@/components/ui/GridDot"
import { LyricsDisplay } from "@/components/ui/lyrics-display"

interface NewsArticle {
  title: string
  description: string | null
  url: string
  source: { name: string }
  publishedAt: string
}

interface WeatherData {
  name: string
  main: { temp: number; feels_like: number; humidity: number }
  weather: { main: string; description: string; icon: string }[]
  wind: { speed: number }
}

interface SearchResultItem {
  title: string
  link: string
  snippet: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""

const WeatherDisplay: React.FC<{
  weather: WeatherData | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}> = ({ weather, loading, error, onRefresh }) => {
  if (loading) return <div className="text-xs text-muted-foreground animate-pulse px-2">Loading...</div>
  if (!weather || error)
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        className={`text-xs hover:text-primary ${error ? "text-red-400 hover:text-red-300" : ""}`}
        title={error ?? "Get current weather"}
      >
        <FaCloudSun className="mr-1" />
        {error ? "Retry" : "Weather"}
      </Button>
    )

  const iconUrl = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`
  return (
    <div
      className="flex items-center space-x-1 text-sm text-muted-foreground border border-border/50 rounded-full px-2 py-0.5 bg-background/30 hover:bg-muted/50 cursor-default"
      title={`Feels like ${Math.round(weather.main.feels_like)}°C`}
    >
      <img src={iconUrl || "/placeholder.svg"} alt={weather.weather[0].description} className="w-6 h-6 -ml-1" />
      <span className="font-medium">{Math.round(weather.main.temp)}°C</span>
      <span className="hidden md:inline capitalize text-xs">({weather.weather[0].description})</span>
      <span className="hidden lg:inline text-xs">in {weather.name}</span>
    </div>
  )
}

const ArtistNews: React.FC<{
  articles: NewsArticle[]
  loading: boolean
  artistName: string | null
}> = ({ articles, loading, artistName }) => {
  if (!artistName && !loading) return null
  if (loading)
    return (
      <div className="space-y-2 p-2">
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
      </div>
    )
  if (!articles || articles.length === 0)
    return (
      <p className="text-sm text-muted-foreground italic p-2">
        No recent news found{artistName ? ` for ${artistName}` : ""}.
      </p>
    )

  return (
    <div className="p-2">
      <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent">
        {articles.map((article) => (
          <li key={article.url} className="text-xs border-b border-border/30 pb-1.5 last:border-b-0">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary font-medium transition-colors line-clamp-1"
              title={article.title}
            >
              {article.title}
            </a>
            <div className="text-muted-foreground/80 text-[10px] mt-0.5">
              {article.source.name} - {new Date(article.publishedAt).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const MoodGif: React.FC<{
  gifUrl: string | null
  loading: boolean
  searchTerm: string | null
}> = ({ gifUrl, loading, searchTerm }) => {
  if (!searchTerm && !loading) return null
  if (loading)
    return (
      <div className="h-32 w-full bg-muted rounded flex items-center justify-center text-xs text-muted-foreground animate-pulse">
        Loading GIF...
      </div>
    )
  if (!gifUrl)
    return (
      <div className="h-32 w-full bg-muted/50 rounded flex items-center justify-center text-xs text-muted-foreground italic">
        No relevant GIF found.
      </div>
    )
  return (
    <div className="mt-1 flex justify-center">
      <img
        src={gifUrl || "/placeholder.svg"}
        alt={`GIF related to ${searchTerm}`}
        className="w-auto h-auto max-h-36 object-contain rounded shadow-md"
      />
    </div>
  )
}

const SearchResultsDisplay: React.FC<{
  results: SearchResultItem[]
  loading: boolean
  query: string | null
}> = ({ results, loading, query }) => {
  if (!query && !loading) return null
  if (loading)
    return (
      <div className="space-y-1 mt-2">
        <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
        <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
      </div>
    )
  if (query && (!results || results.length === 0))
    return <p className="text-sm text-muted-foreground italic mt-2">No Google results found for "{query}".</p>
  if (!results || results.length === 0) return null

  return (
    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent">
      {results.map((item) => (
        <div key={item.link} className="text-xs border-b border-border/30 pb-1.5 last:border-b-0">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium line-clamp-1"
            title={item.title}
          >
            {item.title}
          </a>
          <p className="text-muted-foreground/90 line-clamp-2 mt-0.5">{item.snippet}</p>
        </div>
      ))}
    </div>
  )
}

function InsightsPage() {
  const { playerState } = usePlayerContext()
  const { trackUri, trackName, artistName } = playerState
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false)
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [isLoadingGif, setIsLoadingGif] = useState<boolean>(false)
  const [googleSearchResults, setGoogleSearchResults] = useState<SearchResultItem[]>([])
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false)
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [_isPlaying, setIsPlaying] = useState(!!trackUri)

  // Effect to update isPlaying when trackUri changes
  useEffect(() => {
    setIsPlaying(!!trackUri)
  }, [trackUri])

  const fetchWeather = useCallback(() => {
    if (!navigator.geolocation) {
      setWeatherError("Geolocation is not supported.")
      return
    }
    setIsLoadingWeather(true)
    setWeatherError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await axios.get<WeatherData>(`${API_BASE_URL}/api/weather`, {
            params: { lat: position.coords.latitude, lon: position.coords.longitude },
          })
          setWeatherData(response.data)
        } catch (err) {
          setWeatherError("Could not fetch weather.")
          console.error(err)
        } finally {
          setIsLoadingWeather(false)
        }
      },
      (error) => {
        setWeatherError("Geolocation Error.")
        console.error(error)
        setIsLoadingWeather(false)
      },
    )
  }, [])

  useEffect(() => {
    fetchWeather()
  }, [fetchWeather])

  useEffect(() => {
    let isMounted = true
    setApiError(null)

    if (!trackUri) {
      setNewsArticles([])
      setGifUrl(null)
      setGoogleSearchResults([])
      setCurrentSearchQuery(null)
      setIsLoadingNews(false)
      setIsLoadingGif(false)
      setIsLoadingSearch(false)
      return
    }

    if (artistName) {
      setIsLoadingNews(true)
      axios
        .get<NewsArticle[]>(`${API_BASE_URL}/api/news`, { params: { q: artistName } })
        .then((response) => {
          if (isMounted) setNewsArticles(response.data)
        })
        .catch((err) => {
          console.error("News Error:", err)
          if (isMounted) {
            setNewsArticles([])
            setApiError((prev) => (prev ? `${prev} | News failed.` : "Could not load news."))
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingNews(false)
        })
    } else {
      setNewsArticles([])
      setIsLoadingNews(false)
    }

    const gifQuery = artistName || trackName
    if (gifQuery) {
      setIsLoadingGif(true)
      axios
        .get<{ url: string | null }>(`${API_BASE_URL}/api/gifs`, { params: { q: gifQuery } })
        .then((response) => {
          if (isMounted) setGifUrl(response.data.url)
        })
        .catch((err) => {
          console.error("Gif Error:", err)
          if (isMounted) {
            setGifUrl(null)
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingGif(false)
        })
    } else {
      setGifUrl(null)
      setIsLoadingGif(false)
    }

    setGoogleSearchResults([])
    setCurrentSearchQuery(null)
    setIsLoadingSearch(false)

    return () => {
      isMounted = false
    }
  }, [trackUri, artistName, trackName])

  const doGoogleSearch = useCallback(async (query: string) => {
    setIsLoadingSearch(true)
    setCurrentSearchQuery(query)
    setGoogleSearchResults([])
    setApiError(null)
    try {
      const response = await axios.get<SearchResultItem[]>(`${API_BASE_URL}/api/search`, {
        params: { q: query },
      })
      setGoogleSearchResults(response.data)
    } catch (err) {
      console.error("Search Error:", err)
      setApiError("Failed Google Search.")
      setGoogleSearchResults([])
    } finally {
      setIsLoadingSearch(false)
    }
  }, [])

  const handleArtistInfoSearch = useCallback(() => {
    if (!artistName) return
    const query = `${artistName} official website OR bio`
    doGoogleSearch(query)
  }, [artistName, doGoogleSearch])

  const handleShareTrack = useCallback(() => {
    if (!trackName || !artistName) return

    // Create share text
    const shareText = `I'm listening to "${trackName}" by ${artistName}`

    // Use Web Share API if available
    if (navigator.share) {
      navigator
        .share({
          title: "Check out this track!",
          text: shareText,
          url: "https://example.com/share",
        })
        .catch((err) => console.error("Error sharing:", err))
    } else {
      // Fallback to clipboard
      navigator.clipboard
        .writeText(shareText)
        .then(() => alert("Share text copied to clipboard!"))
        .catch((err) => console.error("Failed to copy:", err))
    }
  }, [trackName, artistName])

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text- hullabaloo">
      <BackgroundBeamsWithCollision className="absolute inset-0 top-100">{null}</BackgroundBeamsWithCollision>
      <div className="relative z-10 p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="flex items-center text-sm text-primary hover:underline">
            <FaArrowLeft className="mr-1.5 h-4 w-4" /> Back to Music
          </Link>
          <WeatherDisplay
            weather={weatherData}
            loading={isLoadingWeather}
            error={weatherError}
            onRefresh={fetchWeather}
          />
        </div>

        {/* Now Playing Section */}
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="bg-primary/5 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">
                {trackName ? <>Now Playing</> : <>No Track Playing</>}
              </CardTitle>
              {trackUri && (
                <Button variant="ghost" size="sm" onClick={handleShareTrack}>
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {trackUri ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-md bg-primary/10 flex items-center justify-center">
                    <Music className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{trackName}</h3>
                    <p className="text-muted-foreground">{artistName}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Play a track in the music player to see insights</p>
            )}
          </CardContent>
        </Card>

        {trackUri && (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">
                  <FaMusic className="mr-2 h-4 w-4" /> Overview
                </TabsTrigger>
                <TabsTrigger value="lyrics">
                  <Music className="mr-2 h-4 w-4" /> Lyrics
                </TabsTrigger>
                <TabsTrigger value="info">
                  <FaInfoCircle className="mr-2 h-4 w-4" /> Artist Info
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {artistName && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Artist News</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ArtistNews articles={newsArticles} loading={isLoadingNews} artistName={artistName} />
                      {apiError && apiError.includes("news") && <p className="mt-2 text-xs text-red-500">{apiError}</p>}
                    </CardContent>
                  </Card>
                )}

                {(trackName || artistName) && (
                  <Card className="relative min-h-[300px] overflow-hidden">
                    <div className="absolute inset-0 z-10 opacity-40">
                      <GridDot />
                    </div>

                    <div className="relative z-10">
                      <CardHeader>
                        <CardTitle className="text-xl">Visual Vibe</CardTitle>
                      </CardHeader>

                      <CardContent>
                        <MoodGif gifUrl={gifUrl} loading={isLoadingGif} searchTerm={artistName || trackName} />
                      </CardContent>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="lyrics" className="mt-4">
                <LyricsDisplay
                  trackName={trackName}
                  artistName={artistName}
                />
              </TabsContent>

              <TabsContent value="info" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Artist Information</CardTitle>
                    <CardDescription>Learn more about {artistName || "the artist"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <Button
                        onClick={handleArtistInfoSearch}
                        disabled={isLoadingSearch || !artistName}
                        className="w-full"
                      >
                        <FaGlobe className="mr-2 h-4 w-4" />
                        Find Artist Info
                      </Button>

                      {currentSearchQuery && <Separator className="my-3" />}
                      <SearchResultsDisplay
                        results={googleSearchResults}
                        loading={isLoadingSearch}
                        query={currentSearchQuery}
                      />
                      {apiError && apiError.includes("Search") && (
                        <p className="mt-2 text-xs text-red-500">{apiError}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}

export default InsightsPage