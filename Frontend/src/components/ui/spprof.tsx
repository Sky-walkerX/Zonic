import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
// Import Tailwind CSS base styles if not done globally
// import './index.css'; // Or your main CSS file with Tailwind directives

// --- Interfaces ---
// (Keep previous ones: SpotifyImage, UserProfile, Artist, Album, SavedTrackItem)
// Track interface doesn't strictly need preview_url for embeds, but keep uri/id
interface SpotifyImage {
  url: string;
  height?: number;
  width?: number;
}
interface UserProfile {
  display_name: string;
  email: string;
  id: string;
  images: SpotifyImage[];
}
interface Artist {
  name: string;
  id: string;
}
interface Album {
  name: string;
  id: string;
  images: SpotifyImage[];
}
interface Track {
    id: string; // <<< Needed for embed URL
    name: string;
    artists: Artist[];
    album: Album;
    duration_ms: number;
    uri: string;
    preview_url?: string | null; // Optional now
}
interface SavedTrackItem {
  added_at: string;
  track: Track;
}
interface SavedTracksResponse {
  href: string;
  items: SavedTrackItem[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}


// --- Constants ---
const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

// --- Main Component ---
const SpotifyProfileAndEmbeds: React.FC = () => {
    // --- State ---
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [likedSongs, setLikedSongs] = useState<SavedTracksResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    // No preview player state needed anymore

    // --- Token Handling & Data Fetching (Keep previous useEffect hooks) ---
    useEffect(() => {
       // Get Token logic (same as before)
       const hashParams = new URLSearchParams(window.location.hash.substring(1));
       let token = hashParams.get("access_token");

       if (token) {
           localStorage.setItem("spotify_access_token", token);
           setAccessToken(token);
           window.location.hash = "";
       } else {
           token = localStorage.getItem("spotify_access_token");
           if (token) setAccessToken(token);
           else setError("Spotify Access Token not found. Please log in.");
       }

    }, []);

    useEffect(() => {
        if (!accessToken) return;
        // Fetch User Profile & Liked Songs logic (same as before using axios)
         const fetchSpotifyData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const headers = { Authorization: `Bearer ${accessToken}` };
                const [profileResponse, likedSongsResponse] = await Promise.all([
                     axios.get<UserProfile>(`${SPOTIFY_API_BASE_URL}/me`, { headers }),
                     axios.get<SavedTracksResponse>(`${SPOTIFY_API_BASE_URL}/me/tracks`, {
                         headers,
                         params: { limit: 50 } // Fetch first 50 liked songs
                     }),
                 ]);
                 setUserProfile(profileResponse.data);
                 setLikedSongs(likedSongsResponse.data);
            } catch (err: unknown) {
                console.error("Error fetching Spotify data:", err);
                let errorMessage = "Failed to fetch Spotify data.";
                 if (axios.isAxiosError(err)) {
                     const axiosError = err as AxiosError<{ error?: { message?: string; status?: number; reason?: string } }>;
                     const status = axiosError.response?.status;
                     const spotifyError = axiosError.response?.data?.error;
                    if (status === 401) {
                       errorMessage = "Authorization failed for API calls. Your token might be invalid or expired. Please log in again.";
                    } else if (spotifyError?.message) {
                       errorMessage = `API Error (${status}): ${spotifyError.message}${spotifyError.reason ? ` (${spotifyError.reason})` : ''}`;
                    } else {
                       errorMessage = `API request failed with status ${status}`;
                    }
                 } else if (err instanceof Error) {
                    errorMessage = `Error: ${err.message}`;
                 }
                setError(errorMessage);
            } finally {
                 setIsLoading(false);
            }
         };
         fetchSpotifyData();

    }, [accessToken]);

    // No preview control functions needed anymore

    // --- Rendering ---
    return (
        // Removed bottom padding as there's no fixed playbar
        <div className="container mx-auto px-4 pb-10">
            <h1 className="text-3xl font-bold my-6 text-center text-green-600">
                Spotify Profile & Liked Songs (Embeds)
            </h1>

            {/* Auth/Error Area */}
            <div className="my-4 text-center">
                 {error && <p className="text-red-600 font-semibold">Error: {error}</p>}
                 {!accessToken && !error && <p>Checking authentication...</p>}
                 {/* Add login button suggestion */}
            </div>

            {/* Loading Indicator */}
            {isLoading && <p className="text-center my-5">Loading Spotify data...</p>}

             {/* Grid Layout */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Profile Section (Tailwind classes same as before) */}
                 {!isLoading && userProfile && (
                    <div className="md:col-span-1 bg-white p-4 rounded-lg shadow border border-gray-200">
                        <h2 className="text-xl font-semibold mb-3 text-gray-800">Profile</h2>
                         <div className="flex flex-col items-center">
                            {userProfile.images?.[0]?.url && (
                                <img src={userProfile.images[0].url} alt="Profile" className="w-24 h-24 rounded-full object-cover my-2 shadow-md" />
                            )}
                            <h3 className="text-lg font-medium mt-2 text-gray-900">{userProfile.display_name}</h3>
                            <p className="text-sm text-gray-600">{userProfile.email}</p>
                        </div>
                    </div>
                )}

                {/* Liked Songs (Embeds) Section */}
                {!isLoading && likedSongs && (
                    // Adjust column span and start if profile is not present
                    <div className={`md:col-span-2 bg-white p-4 rounded-lg shadow border border-gray-200 ${!userProfile ? 'md:col-start-1' : ''}`}>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">
                            Liked Songs ({likedSongs.total} total - showing {likedSongs.items.length})
                        </h2>
                        {likedSongs.items.length > 0 ? (
                            // Use a simpler list or just divs, as interaction is within iframe
                            <div className="space-y-4">
                                {likedSongs.items.map((item: SavedTrackItem) => (
                                    <div
                                        key={item.track.id + item.added_at}
                                        className="flex flex-col sm:flex-row items-center sm:items-start p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        {/* Track Info (Optional: Can be removed if iframe is enough) */}
                                        <div className="flex items-center w-full sm:w-auto mb-3 sm:mb-0 sm:mr-4">
                                            {item.track.album.images?.length > 0 && (
                                                <img
                                                    src={item.track.album.images.slice(-1)[0].url} // Smallest image
                                                    alt={`${item.track.album.name} cover`}
                                                    className="w-12 h-12 mr-3 object-cover rounded flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-grow overflow-hidden">
                                                <strong className="block truncate text-gray-900 text-sm">{item.track.name}</strong>
                                                <span className="text-xs text-gray-600 block truncate">
                                                    {item.track.artists.map(a => a.name).join(", ")}
                                                </span>
                                            </div>
                                        </div>

                                        {/* == Spotify Embed Iframe == */}
                                        <div className="ml-auto flex-shrink-0 w-full sm:w-[300px] md:w-[340px]"> {/* Adjust width as needed, make full width on mobile */}
                                            <iframe
                                                title={`Spotify Embed: ${item.track.name}`}
                                                style={{ borderRadius: '12px' }} // Can keep this inline style or use Tailwind 'rounded-xl' on parent
                                                className="rounded-xl" // Tailwind alternative for border radius
                                                src={`https://open.spotify.com/embed/track/${item.track.id}?utm_source=generator&theme=0`} // Added theme=0 for light theme embed
                                                width="100%"
                                                height="80" // Standard compact embed height
                                                frameBorder="0"
                                                allowFullScreen={false} // Embeds usually don't need fullscreen
                                                // Allow necessary permissions for the iframe
                                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                loading="lazy" // Important for performance with many embeds
                                            ></iframe>
                                        </div>
                                        {/* == End Spotify Embed Iframe == */}

                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No liked songs found.</p>
                        )}
                         {likedSongs.next && (
                             <p className="text-center text-gray-500 italic text-sm mt-4">
                                 More songs available (pagination not implemented).
                             </p>
                        )}
                    </div>
                )}
            </div>
            {/* No separate playbar needed */}
        </div>
    );
};

export default SpotifyProfileAndEmbeds;