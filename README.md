# Zonic

> My own music-app

<!-- Optional: Add a screenshot or GIF demo here later -->
<!-- ![Zonic App Screenshot](link/to/your/screenshot.png) -->

A web application that integrates with Spotify to play music and podcasts, browse your library, and provides contextual insights like artist news, weather, and related GIFs.

---

## ✨ Features

*   **Spotify Integration:** Secure login via Spotify OAuth 2.0 (using Authorization Code Flow with PKCE recommended, currently using state cookie).

*   **Music Playback:** Play liked songs, top tracks, and tracks from user playlists using Spotify's embedded player.
*   **Library Browsing:** View saved playlists, liked songs, and top tracks.

*   **Artist Insights:** View recent news articles related to the currently playing artist (via NewsAPI).
*   **Visual Vibe:** Display a GIF related to the current track/artist mood (via Giphy API).
*   **Contextual Info:** Show current weather based on user location (via OpenWeatherMap).
*   **Quick Search:** Search Google for lyrics or artist information directly from the app (via Google Custom Search API).
*   **Persistent Playback:** Player continues across page navigations (Player component lifted to App level).

---

## 🚀 Tech Stack

*   **Frontend:**
    *   React
    *   Vite
    *   TypeScript
    *   Tailwind CSS (using Shadcn UI components)
    *   Axios (for API calls)
    *   React Router DOM (for navigation)
    *   React Context API (for player state management)
*   **Backend:**
    *   Node.js
    *   Express
    *   Axios
    *   CORS
    *   Dotenv (for environment variables)
    *   Cookie-Parser & UUID (for secure Spotify state handling)
*   **APIs:**
    *   Spotify API
    *   NewsAPI
    *   OpenWeatherMap API
    *   Giphy API
    *   Google Custom Search API

---

## 🛠️ Setup & Installation (Local Development)

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <your-project-directory>
    ```
2.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    ```
3.  **Install Frontend Dependencies:**
    ```bash
    cd ../frontend
    npm install
    ```
4.  **Set up Environment Variables:** See the section below.

---

### Environment Variables

This project requires two separate `.env` files. Create them based on the examples below. **Never commit your `.env` files containing secrets to Git.** Add `.env` to your `.gitignore` files.

*   **`backend/.env`:** (Create this file in the `backend` directory)
    ```dotenv
    # Spotify Credentials (Required)
    SPOTIFY_CLIENT_ID="e03a236e3b9044bc95cf871699d4a6ed"
    SPOTIFY_CLIENT_SECRET="7cb88ff52b7544ed8e3835eac016bed9"
    SPOTIFY_REDIRECT_URI=http://localhost:5000/callback

    # App URLs (Required)
    FRONTEND_URI=http://localhost:5173
    PORT=5000 # Or another port for the backend

    # External API Keys (Required for Insights)
    NEWS_API_KEY="2a5a5ec41c924863821840c39b40f82b"
    GIPHY_API_KEY="s2aqwnXetgAXhdI7ZWbO812golV0aFZq"
    GOOGLE_SEARCH_API_KEY="AIzaSyANz0EqMsst1eyRkpkLhuUPEMQZn228cX4"
    GOOGLE_SEARCH_ENGINE_ID="614af4e5a2f9548f7"
    OPENWEATHER_API_KEY="8b7c05d4c1763a81dfc801a50548f7e9"
    ```

*   **`frontend/.env`:** (Create this file in the `frontend` directory)
    ```dotenv
    # Base URL for the backend API during development
    VITE_API_BASE_URL=http://localhost:5000
    ```

---

## 🏃 Running Locally

You need to run both the backend and frontend servers concurrently in separate terminal windows.

1.  **Start the Backend Server:**
    ```bash
    cd backend
    npm run dev # Or node server.js if not using nodemon
    ```
    *(Make sure `backend/package.json` script points to the correct server file, e.g., `server.js` or `index.js`)*

2.  **Start the Frontend Dev Server:**
    ```bash
    cd frontend
    npm run dev
    ```
    Open your browser to the address provided by Vite (usually `http://localhost:5173`).

---

## 📦 NPM Packages Used

### Backend (`backend/package.json`)

*   **`express`:** The core web framework for Node.js. Used to create the server, define API routes (URLs), and handle HTTP requests and responses.
*   **`axios`:** A promise-based HTTP client. Used by the backend to make requests *to* external APIs (Spotify, NewsAPI, OpenWeatherMap, Giphy, Google Search).
*   **`cors`:** Middleware for enabling Cross-Origin Resource Sharing. Allows your frontend (running on a different origin/port) to make requests to this backend server securely.

*   **`dotenv`:** Loads environment variables (like secret API keys) from a `.env` file into `process.env`, keeping secrets out of the main codebase.

*   **`cookie-parser`:** Middleware to parse `Cookie` header data attached to client requests, making it available in `req.cookies`. Used here for securely handling the Spotify OAuth `state` parameter.

*   **`uuid`:** Generates unique identifiers (UUIDs). Used here to create a secure, unpredictable `state` value for the Spotify OAuth flow to prevent CSRF attacks.

*   **`body-parser`:** Middleware to parse incoming request bodies, particularly JSON data sent from the frontend.

*   **`nodemon`:** Automatically restarts the Node.js server when file changes are detected, speeding up development.

### Frontend (`frontend/package.json`)

*(Based on typical Vite/React/Shadcn setup - add/remove as needed)*

*   **`typescript`:** Adds static typing to JavaScript, improving code quality and maintainability.

*   **`tailwindcss`:** A utility-first CSS framework for rapidly styling components.

*   **`@radix-ui/*` & `shadcn-ui`:** Foundational components and tooling for the Shadcn UI component library.

*   **`axios`:** Used by the frontend to make HTTP requests *to* your backend API endpoints (e.g., `/api/weather`, `/playlists`).

*   **`react-router-dom`:** Handles client-side routing, allowing navigation between different "pages" (like `/` and `/insights`) without full page reloads.

*   **`react-icons`:** Library providing easy access to various icon sets (like Font Awesome - `FaPlay`, `FaSearch`, etc.).
