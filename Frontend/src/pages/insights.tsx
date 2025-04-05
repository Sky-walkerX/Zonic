import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import { Button } from "@/registry/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/ui/card"; 
import { Separator } from "@/registry/ui/separator"; 
import { FaSearch, FaCloudSun, FaArrowLeft } from 'react-icons/fa';

// Context Hook
import { usePlayerContext } from '@/context/PlayerContext';


interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  source: { name: string };
  publishedAt: string;
}

interface WeatherData {
  name: string;
  main: { temp: number; feels_like: number; humidity: number };
  weather: { main: string; description: string; icon: string }[];
  wind: { speed: number };
}

interface SearchResultItem {
  title: string;
  link: string;
  snippet: string;
}

// --- API BASE URL (Keep existing) ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';


// Weather Display Component (No changes needed)
const WeatherDisplay: React.FC<{
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}> = ({ weather, loading, error, onRefresh }) => {
    if (loading)
      return <div className="text-xs text-muted-foreground animate-pulse px-2">Loading...</div>;
    if (!weather || error)
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className={`text-xs hover:text-primary ${error ? 'text-red-400 hover:text-red-300' : ''}`}
          title={error ?? "Get current weather"}
        >
          <FaCloudSun className="mr-1" />
          {error ? 'Retry' : 'Weather'}
        </Button>
      );

    const iconUrl = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;
    return (
      <div
        className="flex items-center space-x-1 text-sm text-muted-foreground border border-border/50 rounded-full px-2 py-0.5 bg-background/30 hover:bg-muted/50 cursor-default"
        title={`Feels like ${Math.round(weather.main.feels_like)}°C`}
      >
        <img src={iconUrl} alt={weather.weather[0].description} className="w-6 h-6 -ml-1" />
        <span className="font-medium">{Math.round(weather.main.temp)}°C</span>
        <span className="hidden md:inline capitalize text-xs">
          ({weather.weather[0].description})
        </span>
        <span className="hidden lg:inline text-xs">in {weather.name}</span>
      </div>
    );
};

// News Display Component (No changes needed)
const ArtistNews: React.FC<{
  articles: NewsArticle[];
  loading: boolean;
  artistName: string | null;
}> = ({ articles, loading, artistName }) => {
  if (!artistName && !loading) return null; // Only render if there's an artist or it's loading
  if (loading)
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
      </div>
    );
  if (!articles || articles.length === 0)
    return (
      <p className="text-sm text-muted-foreground italic">
        No recent news found{artistName ? ` for ${artistName}` : ''}.
      </p>
    );

  return (
    // Reduced max-height for better fit in card
    <div className="mt-1">
      <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent">
        {articles.map((article) => (
          <li
            key={article.url}
            className="text-xs border-b border-border/30 pb-1.5 last:border-b-0"
          >
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
  );
};

// Giphy Display Component (No changes needed, consider max-height adjustment if needed)
const MoodGif: React.FC<{
  gifUrl: string | null;
  loading: boolean;
  searchTerm: string | null;
}> = ({ gifUrl, loading, searchTerm }) => {
  if (!searchTerm && !loading) return null; // Only render if there's a term or it's loading
  if (loading)
    return (
      <div className="h-32 w-full bg-muted rounded flex items-center justify-center text-xs text-muted-foreground animate-pulse">
        Loading GIF...
      </div>
    );
  if (!gifUrl)
    return (
      <div className="h-32 w-full bg-muted/50 rounded flex items-center justify-center text-xs text-muted-foreground italic">
        No relevant GIF found.
      </div>
    );
  return (
    <div className="mt-1 flex justify-center"> {/* Center the GIF container */}
      <img
        src={gifUrl}
        alt={`GIF related to ${searchTerm}`}
        className="w-auto h-auto max-h-36 object-contain rounded shadow-md" // Adjusted max-height
      />
    </div>
  );
};

// Search Results Display Component (No changes needed)
const SearchResultsDisplay: React.FC<{
  results: SearchResultItem[];
  loading: boolean;
  query: string | null;
}> = ({ results, loading, query }) => {
  if (!query && !loading) return null;
  if (loading)
    return (
      <div className="space-y-1 mt-2">
        <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
        <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
      </div>
    );
  if (query && (!results || results.length === 0))
    return (
      <p className="text-sm text-muted-foreground italic mt-2">
        No Google results found for "{query}".
      </p>
    );
  if (!results || results.length === 0) return null;

  return (
    // Adjusted max-height
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
  );
};


// --- Insights Page Component (Beautified Structure) ---
function InsightsPage() {
  // Get currently playing track info from context
  const { playerState } = usePlayerContext();
  const { trackUri, trackName, artistName } = playerState;

  // State for this page's API calls (Keep existing state)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [isLoadingGif, setIsLoadingGif] = useState<boolean>(false);
  const [googleSearchResults, setGoogleSearchResults] = useState<SearchResultItem[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null); // General error for news/search

  // --- Fetch Weather Data (Keep existing function) ---
   const fetchWeather = useCallback(() => {
    if (!navigator.geolocation) {
      setWeatherError("Geolocation is not supported.");
      return;
    }
    setIsLoadingWeather(true);
    setWeatherError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await axios.get<WeatherData>(`${API_BASE_URL}/api/weather`, {
            params: { lat: position.coords.latitude, lon: position.coords.longitude },
          });
          setWeatherData(response.data);
        } catch (err) {
          setWeatherError("Could not fetch weather.");
          console.error(err);
        } finally {
          setIsLoadingWeather(false);
        }
      },
      (error) => {
        setWeatherError("Geolocation Error.");
        console.error(error);
        setIsLoadingWeather(false);
      }
    );
  }, []);

  // Fetch weather on initial load (Keep existing effect)
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  useEffect(() => {
    let isMounted = true;
    setApiError(null); // Reset general error on track change

    // If no track is playing, clear external data
    if (!trackUri) {
      setNewsArticles([]);
      setGifUrl(null);
      setGoogleSearchResults([]);
      setCurrentSearchQuery(null);
      setIsLoadingNews(false); 
      setIsLoadingGif(false);
      setIsLoadingSearch(false);
      return;
    }

    let newsFetched = false;
    let gifFetched = false;

    // Fetch News if artistName is available
    if (artistName) {
      setIsLoadingNews(true);
      newsFetched = true;
      axios
        .get<NewsArticle[]>(`${API_BASE_URL}/api/news`, { params: { q: artistName } })
        .then((response) => {
          if (isMounted) setNewsArticles(response.data);
        })
        .catch((err) => {
          console.error("News Error:", err);
          if (isMounted) {
            setNewsArticles([]);
             setApiError((prev) => prev ? `${prev} | News failed.` : "Could not load news.");
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingNews(false);
        });
    } else {
      setNewsArticles([]);
      setIsLoadingNews(false);
    }

    // Fetch GIF based on track or artist (prioritize artist if available)
    const gifQuery = artistName || trackName;
    if (gifQuery) {
        setIsLoadingGif(true);
        gifFetched = true;
        axios
          .get<{ url: string | null }>(`${API_BASE_URL}/api/gifs`, { params: { q: gifQuery } })
          .then((response) => {
            if (isMounted) setGifUrl(response.data.url);
          })
          .catch((err) => {
            console.error("Gif Error:", err);
            if (isMounted) {
                setGifUrl(null);
            }
          })
          .finally(() => {
            if (isMounted) setIsLoadingGif(false);
          });
    } else {
        setGifUrl(null);
        setIsLoadingGif(false);
    }

    // Clear previous Google search data when track context changes
    setGoogleSearchResults([]);
    setCurrentSearchQuery(null);
    setIsLoadingSearch(false);

    return () => {
      isMounted = false;
    };
  }, [trackUri, artistName, trackName]); 

  const doGoogleSearch = useCallback(async (query: string) => {
    setIsLoadingSearch(true);
    setCurrentSearchQuery(query);
    setGoogleSearchResults([]);
    setApiError(null); 
    try {
      const response = await axios.get<SearchResultItem[]>(`${API_BASE_URL}/api/search`, {
        params: { q: query },
      });
      setGoogleSearchResults(response.data);
    } catch (err) {
      console.error("Search Error:", err);
      setApiError("Failed Google Search.");
      setGoogleSearchResults([]); 
    } finally {
      setIsLoadingSearch(false);
    }
  }, []);

  const handleLyricsSearch = useCallback(() => {
    if (!trackName || !artistName) return;
    const query = `${trackName} by ${artistName} lyrics`;
    doGoogleSearch(query);
  }, [trackName, artistName, doGoogleSearch]);

  const handleArtistInfoSearch = useCallback(() => {
    if (!artistName) return;
    const query = `${artistName} official website OR bio`;
    doGoogleSearch(query);
  }, [artistName, doGoogleSearch]);

  const primarySubjectName = artistName || trackName;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="flex items-center text-sm text-primary hover:underline">
          <FaArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Link>
        {/* Weather Display aligned to the right */}
        <WeatherDisplay
            weather={weatherData}
            loading={isLoadingWeather}
            error={weatherError}
            onRefresh={fetchWeather}
          />
      </div>

      {/* Main Title */}
      <h1 className="text-3xl font-bold tracking-tight">Insights {primarySubjectName ? `for ${primarySubjectName}` : ''}</h1>

      {/* Content Sections using Cards */}

      {/* Artist News Card (Only renders if artistName exists) */}
      {artistName && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Artist News</CardTitle>
          </CardHeader>
          <CardContent>
            <ArtistNews articles={newsArticles} loading={isLoadingNews} artistName={artistName} />
             {/* Display news-specific error here if needed, or rely on general apiError */}
             {apiError && apiError.includes("news") && <p className="mt-2 text-xs text-red-500">{apiError}</p>}
          </CardContent>
        </Card>
      )}


      {/* Visual Vibe Card (Only renders if track or artist exists) */}
       {(trackName || artistName) && (
         <Card>
           <CardHeader>
             <CardTitle className="text-xl">Visual Vibe</CardTitle>
           </CardHeader>
           <CardContent>
             <MoodGif
               gifUrl={gifUrl}
               loading={isLoadingGif}
               searchTerm={artistName || trackName} // Use determined term
             />
             {/* Display gif-specific error here if needed */}
           </CardContent>
         </Card>
       )}

      {/* Find More Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Find More</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Buttons Side-by-Side */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4"> {/* Stack on small, row on larger */}
            <Button
              onClick={handleLyricsSearch}
              disabled={isLoadingSearch || !trackName || !artistName}
              size="sm"
              className="flex-1 flex items-center justify-center" // flex-1 helps them take equal space
            >
              <FaSearch className="mr-2 h-3 w-3" />
              Search Lyrics
            </Button>

            <Button
              onClick={handleArtistInfoSearch}
              disabled={isLoadingSearch || !artistName}
              size="sm"
              className="flex-1 flex items-center justify-center" // flex-1 helps them take equal space
            >
              <FaSearch className="mr-2 h-3 w-3" />
              Search Artist Info
            </Button>
          </div>

           {/* Separator before results if query exists */}
           {currentSearchQuery && <Separator className="my-3" />}

          {/* Combined Search Results */}
          <SearchResultsDisplay
            results={googleSearchResults}
            loading={isLoadingSearch}
            query={currentSearchQuery}
          />
           {/* Display search-specific error here */}
           {apiError && apiError.includes("Search") && <p className="mt-2 text-xs text-red-500">{apiError}</p>}
        </CardContent>
      </Card>

    </div>
  );
}

export default InsightsPage;