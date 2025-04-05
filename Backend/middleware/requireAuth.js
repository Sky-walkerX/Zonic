// middleware/requireAuth.js
import { extractToken } from '../utils/helpers.js'; // Adjust path if needed

export const requireAuth = (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ error: "Authorization header missing or invalid (Bearer token required)" });
    }
    req.token = token; // Attach token to request for handlers
    next();
};