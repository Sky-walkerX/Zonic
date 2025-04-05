import React, { createContext, useState, useContext, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';

interface PlayerState {
    trackUri: string | null;
    trackName: string | null;
    artistName: string | null;
}

interface PlayerContextProps {
    playerState: PlayerState;
    setPlayerState: Dispatch<SetStateAction<PlayerState>>; // Allows updating the state
}

// Initial default state when the app loads or no track is selected
const defaultState: PlayerState = {
    trackUri: null,
    trackName: null,
    artistName: null,
};

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);  //context (initially undefined)

// Define props for the Provider component
interface PlayerProviderProps {
    children: ReactNode;
}


export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
    const [playerState, setPlayerState] = useState<PlayerState>(defaultState);

    useEffect(() => {
        console.log("PlayerContext STATE CHANGED:", playerState);
    }, [playerState]); 

    return (
        <PlayerContext.Provider value={{ playerState, setPlayerState }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayerContext = (): PlayerContextProps => { //custom hook
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayerContext must be used within a PlayerProvider');
    }
    return context;
};