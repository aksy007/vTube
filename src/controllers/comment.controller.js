import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if(!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id');
  }

  const videoComments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId) // matching raw videoId to videoId in DB
      }
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit:  parseInt(limit, 10)
    },
  ]);

  if(!videoComments) {
    throw new ApiError(500, "Something went wrong while fetching video comments");
  }

  return res
        .status(200)
        .json(
          new ApiResponse(200, { videoComments }, "Fetched video comments successfully")
        );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { comment } =  req.body;

  if(!comment) {
    throw new ApiError(400, "Comment is required");
  }

  if(!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id');
  }

  const video = await Video.findById(videoId);
  if(!video) {
    throw new ApiError(404, "Video not found");
  }

  const newComment = await Comment.create({
    comment,
    video: videoId,
    owner: req.user?._id,
  });

  if(!newComment) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
        .status(201)
        .json(
          new ApiResponse(201, { comment }, "Comment added successfully")
        );
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const comment =  req.body?.comment?.trim();

  if(!comment) {
    throw new ApiError(400, "Comment is required");
  }

  if(!isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment id');
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { comment: comment } },
    { new: true }
  );

  if(!updatedComment) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
        .status(201)
        .json(
          new ApiResponse(201, { updatedComment }, "Comment updated successfully")
        );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if(!isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment id');
  }

  const commentDeleted = await Comment.findByIdAndDelete(commentId);
  if(!commentDeleted) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
        .status(200)
        .json(
          new ApiResponse(200, {}, "Comment deleted successfully")
        )

});

export { getVideoComments, addComment, updateComment, deleteComment };
