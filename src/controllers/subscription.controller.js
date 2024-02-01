import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  
  if(!channelId) {
    throw new ApiError(400, "ChannelId is required");
  }

  const subscriber = { subscriber: req.user._id, channel: channelId };
  
  try {
    const userSubscribed = await Subscription.findOne(subscriber);
    if(!userSubscribed) {
      const newSubscriber = await Subscription.create(subscriber);
      if(!newSubscriber) {
        throw new ApiError(500, "Something went wrong while subscribing channel");
      }

      return res
            .status(200)
            .json(
              new ApiResponse(200, {}, "User subscribed channel successfully")
            );
    }
    
    const unsubscribe = await Subscription.deleteOne(subscriber);
    if(!unsubscribe) {
      throw new ApiError(500, "Something went wrong while unsubscribing channel");
    }

    return res
          .status(200)
          .json(
            new ApiResponse(200, {}, "Channel unsubscribed successfully")
          )
  } catch (error) {
    throw new ApiError(500, error);
  }

});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if(!subscriberId){
    throw new ApiError(400,"subscriebr Id is Requitred")
  }

  try {
    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(subscriberId)
        }
      },
      {
        $group: {
          _id: "channel",
          subscribers: {
            $push: "$subscriber",
          }
        }
      },
      {
        $project: {
          _id: 0,
          subscribers: 1,
        }
      }
    ]);

    if(!subscribers || subscribers.length === 0) {
      return res
            .status(200)
            .json(
              new ApiResponse(200, [], "No subscribers found")
            );
    }
    return res
            .status(200)
            .json(
              new ApiResponse(200, subscribers, "Subscribers fetched successfully")
            );
  } catch (error) {
    throw new ApiError(500, error);
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if(!subscriberId){
    throw new ApiError(400,"subscriebr Id is Requitred")
  }

  try {
    const subscriberList = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(subscriberId)
        }
      },
      {
        $group: {
          _id: "subscriber",
          subscribedChannels: {
            $push: "$channel"
          }
        }
      },
      {
        $project: {
          _id: 0,
          subscribedChannels: 1,
        }
      },
    ]);

    if(!subscriberList || subscriberList.length === 0) {
      return res
            .status(200)
            .json(
              new ApiResponse(200, [], "User has not subscribed any channels")
            );
    }
    return res
          .status(200)
          .json(new ApiResponse(200, subscriberList, "Successfully fetched subscribed channels"));

  } catch (error) {
      throw new ApiError(500, error);
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
