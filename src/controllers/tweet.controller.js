import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { tweet } = req.body;
    const userId = req.user?._id;
    if(!tweet) {
      throw new ApiError(404, "Tweets cannnot be empty");
    }

    const createNewTweet = await Tweet.create({
      owner: userId,
      tweet
    })
    if(!createNewTweet) {
      throw new ApiError(500, "Something went wrong!");
    }

    return res
          .status(200)
          .json(new ApiResponse(200, { createNewTweet }, "Tweet successfully created!"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const userTweets = await Tweet.findOne({
    owner: new mongoose.Types.ObjectId(userId)
  }); 
  if(!userTweets) {
    return res
    .status(200)
    .json(new ApiResponse(200, [], "No Tweets found"));
  }

  return res
        .status(200)
        .json(new ApiResponse(200, { userTweets }, "Tweets fetched successfully"))
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { tweet } = req.body;
  const userId = req.user?._id;

  const tweetOwner = await Tweet.findOne({
    owner: new mongoose.Types.ObjectId(userId)
  }).select("-tweet");

  if(!tweetOwner) {
    throw new ApiError(401, "User not found");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { $set: { tweet: tweet }},
    { new: true }
  );

  if(!updatedTweet) {
    throw new ApiError(500, "Unable to update tweet")
  }

  return res
        .status(200)
        .json(
          new ApiResponse(200, { updatedTweet }, "Tweet updated successfully")
        )
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const tweetOwner = await Tweet.findOne({
    owner: new mongoose.Types.ObjectId(req.user?._id)
  }).select("-tweet");

  if(!tweetOwner) {
    throw new ApiError(401, "Unauthorized error");
  }
  const deleteTweet = await Tweet.findByIdAndDelete(tweetId);
  if(!deleteTweet) {
    throw new ApiError(500, "Unable to delete tweet, try again");
  }

  return res
        .status(200)
        .json(
          new ApiResponse(200, {}, "Tweet deleted successfully")
        );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
