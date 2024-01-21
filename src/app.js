import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

// routes importing
import userRouter from "./routes/user.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import likeRouter from "./routes/like.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";

// route declearation
app.use("/api/v1/users", userRouter);
app.use("/app/v1/likes", likeRouter);
app.use("/app/v1/videos", videoRouter);
app.use("/app/v1/comment", commentRouter);
app.use("/app/v1/tweets", tweetRouter);
app.use("/app/v1/playlist", playlistRouter);
app.use("/app/v1/subscriptions", subscriptionRouter);

export default app;
