"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/registry/ui/button" // Adjust path if necessary
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/ui/card" // Adjust path if necessary
import axios from "axios"

// Keep the interface for search result items
interface SearchResultItem {
  title: string
  link: string
  snippet: string
}

interface LyricsDisplayProps {
  trackName: string | null
  artistName: string | null
}

// Base URL for your backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""

export function LyricsDisplay({ trackName, artistName }: LyricsDisplayProps) {
  // State specifically for lyrics search
  const [lyricsSearchResults, setLyricsSearchResults] = useState<SearchResultItem[]>([])
  const [isLoadingLyricsSearch, setIsLoadingLyricsSearch] = useState(false)
  const [lyricsSearchError, setLyricsSearchError] = useState<string | null>(null)
  const [searchAttempted, setSearchAttempted] = useState(false) // Track if search was tried

  // Reset state when track changes
  useEffect(() => {
    setLyricsSearchResults([])
    setLyricsSearchError(null)
    setIsLoadingLyricsSearch(false)
    setSearchAttempted(false) // Reset search attempt
  }, [trackName, artistName])

  // Function to fetch lyrics search results from the backend
  const findLyricsLinks = useCallback(async () => {
    if (!trackName || !artistName) return

    setIsLoadingLyricsSearch(true)
    setLyricsSearchError(null)
    setLyricsSearchResults([])
    setSearchAttempted(true) // Mark that search has been attempted

    try {
      console.log(`Frontend: Requesting lyrics search for "${trackName}" by ${artistName}`)
      const response = await axios.get<SearchResultItem[]>(`${API_BASE_URL}/api/search-lyrics`, {
        params: { trackName, artistName },
      })
      console.log(`Frontend: Received ${response.data.length} results.`)
      setLyricsSearchResults(response.data)
      if (response.data.length === 0) {
        setLyricsSearchError("No relevant lyrics links found.")
      }
    } catch (err) {
      console.error("Error fetching lyrics search results:", err)
      const errorMsg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to search for lyrics. Please check the console or try again."
      setLyricsSearchError(errorMsg)
      setLyricsSearchResults([]) // Clear results on error
    } finally {
      setIsLoadingLyricsSearch(false)
    }
  }, [trackName, artistName])

  // Render when no track or artist is selected
  if (!trackName || !artistName) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl">Lyrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Play a track to search for lyrics</p>
        </CardContent>
      </Card>
    )
  }

  // Main render with lyrics search results (links)
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Lyrics Finder</CardTitle>
        <Button size="sm" onClick={findLyricsLinks} disabled={isLoadingLyricsSearch}>
          {isLoadingLyricsSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find Lyrics Links"}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isLoadingLyricsSearch && (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-2 text-sm text-muted-foreground">Searching...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoadingLyricsSearch && lyricsSearchError && (
          <p className="text-sm text-red-500">{lyricsSearchError}</p>
        )}

        {/* Results State */}
        {!isLoadingLyricsSearch && !lyricsSearchError && lyricsSearchResults.length > 0 && (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            <p className="text-xs text-muted-foreground mb-2">
              Potential lyrics links for "{trackName}" by {artistName}:
            </p>
            {lyricsSearchResults.map((result) => (
              <div key={result.link} className="border-b border-border/30 pb-2 last:border-b-0">
                <a
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline flex items-center group"
                  title={`Open link: ${result.link}`}
                >
                  {result.title}
                  <ExternalLink className="h-3 w-3 ml-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.snippet}</p>
              </div>
            ))}
          </div>
        )}

        {/* Initial/No Results State */}
        {!isLoadingLyricsSearch && !lyricsSearchError && lyricsSearchResults.length === 0 && searchAttempted && (
          <p className="text-sm text-muted-foreground">No lyrics links found for this track.</p>
        )}

        {/* Default state before search */}
        {!isLoadingLyricsSearch && !searchAttempted && (
          <p className="text-sm text-muted-foreground">
            Click "Find Lyrics Links" to search for lyrics online.
          </p>
        )}
      </CardContent>
    </Card>
  )
}