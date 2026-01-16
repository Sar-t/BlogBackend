import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(cors({
    origin: [
        'https://blog-web-application-main.vercel.app',
        'http://localhost:5174',
    ],
    credentials: true,
}));

app.use(cookieParser()); // Parse cookies from incoming requests
app.use(express.json({limit: '16kb'})); // Limit JSON body size to 16kb
app.use(express.urlencoded({extended:true, limit: '16kb'})); // express.urlencoded() parses the urlencoded payload and attaches it to req.body. ✅
//extended allows nested objects
app.use(express.static('public')); // Serve static files from the 'public' directory



import userRoutes from "./routes/user.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import reactionRoutes from "./routes/reaction.routes.js";
import commentRoutes from "./routes/comments.routes.js";
import { errorHandler } from './middlewares/error.middleware.js';
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/reactions', reactionRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use(errorHandler);
export default app;