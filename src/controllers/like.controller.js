import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const likeStatus = { likedBy: req.user._id, video: videoId };
  const isVideoLiked = await Like.findOne(likeStatus);
  
  if(!isVideoLiked) {
    const likeVideo = await Like.create(likeStatus);
    if(!likeVideo) {
      throw new ApiError(500, "Something went wrong");
    }

    return res
          .status(200)
          .json(
            new ApiResponse(200, {likeVideo}, "Video Liked")
          );
  }
  const unlikeVideo = await Like.findOneAndDelete(likeStatus);
  if(!unlikeVideo) {
    throw new ApiError(500, "Something went wrong");
  }
  return res
          .status(200)
          .json(
            new ApiResponse(200, { unlikeVideo }, "Video Unliked")
          );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const likeStatus = { likedBy: req.user?._id, comment: commentId };
  const isCommentLiked = await Like.findOne(likeStatus);

  if(!isCommentLiked) {
    const likeComment = await Like.create(likeStatus);
    if(!likeComment) {
      throw new ApiError(500, "Something went wrong");
    }

    return res
          .status(200)
          .json(
            new ApiResponse(200, { likeComment }, "Comment liked successfully")
          );
  }
  const unLikeComment = await Like.findOneAndDelete(likeStatus);
  if(!unLikeComment) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
        .status(200)
        .json(
          new ApiResponse(200, {unLikeComment}, "Comment unliked successfully")
        );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const likeStatus = { likedBy: req.user?._id, comment: tweetId };
  const isTweetLiked = await Like.findOne(likeStatus);
  if(!isTweetLiked) {
    const likeTweet = await Like.create(likeStatus);
    if(!likeTweet) {
      throw new ApiError(500, "Something went wrong");
    }
    console.log("first", isTweetLiked, "\n\n\n")
    return res
          .status(200)
          .json(
            new ApiResponse(200, { likeTweet }, "Tweet liked successfully")
          );
  }
  const unLikeTweet = await Like.findOneAndDelete(likeStatus);
  if(!unLikeTweet) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
        .status(200)
        .json(
          new ApiResponse(200, {unLikeTweet}, "Tweet unliked successfully")
        );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.find({
      likedBy: req.user._id,
      video: { $exists: true },
    });

    if(!likedVideos) {
      throw new ApiError(500, "Something went wrong");
    }

    return res
          .status(200)
          .json(
            new ApiResponse(200, { likedVideos }, "Fetched all liked vidoes")
          );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
