"use client"

import { Clock, Play } from "lucide-react"
import { formatDuration } from "@/lib/utils"

interface TrackListItemProps {
  track: {
    id: string
    name: string
    uri: string
    artists: { name: string }[]
    album: {
      name: string
      images: { url: string; height?: number; width?: number }[]
    }
    duration_ms: number
  }
  onPlay: (trackDetails: { uri: string; name: string; artistName: string | null }) => void
}

export function TrackListItem({ track, onPlay }: TrackListItemProps) {
  const handlePlay = () => {
    onPlay({
      uri: track.uri,
      name: track.name,
      artistName: track.artists[0]?.name || null,
    })
  }

  return (
    <div className="group flex items-center gap-4 rounded-md p-2 hover:bg-muted/50 cursor-pointer" onClick={handlePlay}>
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
        <img
          src={track.album.images[0]?.url || "/placeholder.svg?height=48&width=48"}
          alt={track.album.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-6 w-6 fill-white text-white" />
        </div>
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <span className="truncate font-medium">{track.name}</span>
        <span className="truncate text-sm text-muted-foreground">
          {track.artists.map((artist) => artist.name).join(", ")}
        </span>
      </div>
      <div className="text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatDuration(track.duration_ms)}</span>
        </div>
      </div>
    </div>
  )
}
