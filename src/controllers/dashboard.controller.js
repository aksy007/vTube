import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js"
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js"
import mongoose from "mongoose";

//  Get the channel stats like total video views, total subscribers, total videos, total likes etc.
const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    try {
        const channelStats = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "Likes",
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "owner",
                    foreignField: "channel",
                    as: "Subscribers"
                }
            },
            {
                $group: {
                    _id: null,
                    TotalVideos: { $sum: 1 },
                    TotalViews: { $sum: "$views" },
                    TotalSubscribers: {
                        $first: {
                            $size: "$Subscribers"
                        }
                    },
                    TotalLikes: {
                        $first: {
                            $size: "$Likes"
                        }
                    },
                }
            },
            {
                $project: {
                    _id: 0,
                    TotalLikes: 1,
                    TotalVideos: 1,
                    TotalSubscribers: 1,
                    TotalViews: 1,
                }
            }
        ]);

        if(!channelStats) {
            throw new ApiError(500, "Unable to fetch channel stats");
        }
        return res
                .status(200)
                .json(
                    new ApiResponse(200, channelStats, "Channel Stats fetched successfully")
                );
    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
});

//   Get all the videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const channelVideos = await Video.findOne({ owner: userId });

    if(!channelVideos) {
        return res
                .status(200)
                .json(
                    new ApiResponse(200, [], "No videos added yet to channel")
                );
    }

    return res
            .status(200)
            .json(
                new ApiResponse(200, channelVideos, "Channel Videos fetched successfully")
            );
});

export {
    getChannelStats,
    getChannelVideos
};