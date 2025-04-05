import React from "react"; // Import React explicitly
import { cn } from "@/lib/utils";
import { Button } from "@/registry/ui/button"; // Assuming Button is from your registry/ui path
import { ScrollArea } from "@/registry/ui/scroll-area"; // Assuming ScrollArea is from your registry/ui path

// --- Define or Import UserPlaylist Interface ---
// Option 1: Define directly here if not shared (match structure from MusicPage.tsx)
interface SpotifyImage {
    url: string;
    height?: number;
    width?: number;
}

interface UserPlaylist {
    id: string;
    name: string;
    images: SpotifyImage[];
    description: string;
    owner: { display_name: string; id: string };
    public: boolean;
    tracks: { href: string; total: number };
    uri: string;
}

// Option 2: Import if defined elsewhere
// import type { UserPlaylist } from '@/path/to/types'; // Adjust path as needed

// --- Define Sidebar Props ---
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  // playlists: Playlist[]; // Change from the original Playlist type if it was just string[]
  playlists: UserPlaylist[]; // Correctly type the playlists prop
}

// --- Sidebar Component ---
export function Sidebar({ className, playlists }: SidebarProps) {
  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        {/* --- Discover Section (Static) --- */}
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Discover
          </h2>
          <div className="space-y-1">
            <Button variant="secondary" className="w-full justify-start">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4" > <circle cx="12" cy="12" r="10" /> <polygon points="10 8 16 12 10 16 10 8" /> </svg>
              Listen Now
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4" > <rect width="7" height="7" x="3" y="3" rx="1" /> <rect width="7" height="7" x="14" y="3" rx="1" /> <rect width="7" height="7" x="14" y="14" rx="1" /> <rect width="7" height="7" x="3" y="14" rx="1" /> </svg>
              Browse
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4" > <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /> <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" /> <circle cx="12" cy="12" r="2" /> <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" /> <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" /> </svg>
              Radio
            </Button>
          </div>
        </div>

        {/* --- Library Section (Static) --- */}
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Library
          </h2>
          <div className="space-y-1">
             {/* These could potentially trigger actions/navigation */}
            <Button variant="ghost" className="w-full justify-start"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4" > <path d="M21 15V6" /> <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /> <path d="M12 12H3" /> <path d="M16 6H3" /> <path d="M12 18H3" /> </svg> Playlists </Button>
            <Button variant="ghost" className="w-full justify-start"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4" > <circle cx="8" cy="18" r="4" /> <path d="M12 18V2l7 4" /> </svg> Songs </Button>
            <Button variant="ghost" className="w-full justify-start"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4" > <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /> <circle cx="12" cy="7" r="4" /> </svg> Made for You </Button>
            <Button variant="ghost" className="w-full justify-start"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4" > <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" /> <circle cx="17" cy="7" r="5" /> </svg> Artists </Button>
            <Button variant="ghost" className="w-full justify-start"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4" > <path d="m16 6 4 14" /> <path d="M12 6v14" /> <path d="M8 8v12" /> <path d="M4 4v16" /> </svg> Albums </Button>
          </div>
        </div>

        {/* --- Playlists Section (Dynamic) --- */}
        <div className="py-2">
          <h2 className="relative px-7 text-lg font-semibold tracking-tight">
            Playlists
          </h2>
          {/* Add Create/Liked buttons here if desired */}
          <ScrollArea className="h-[300px] px-1"> {/* Adjust height if necessary */}
            <div className="space-y-1 p-2">
              {playlists && playlists.length > 0 ? (
                  playlists.map((playlist) => ( // No index needed if using ID for key
                    <Button
                      key={playlist.id} // Use the unique playlist ID for the key
                      variant="ghost"
                      className="w-full justify-start font-normal"
                      // Add onClick later if needed, e.g., onClick={() => navigateToPlaylist(playlist.id)}
                    >
                      {/* Playlist Icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4" > <path d="M21 15V6" /> <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /> <path d="M12 12H3" /> <path d="M16 6H3" /> <path d="M12 18H3" /> </svg>
                      {/* Display playlist name */}
                      <span className="truncate">{playlist.name}</span>
                    </Button>
                  ))
              ) : (
                  // Show a message if no playlists are loaded
                  <p className="px-2 py-1 text-sm text-muted-foreground">No playlists found.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}