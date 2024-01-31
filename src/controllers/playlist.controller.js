import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js"
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if(!name) {
    throw new ApiError(400, "Name is required");
  }

  const createNewPlaylist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  })

  if(!createNewPlaylist) {
    throw new ApiError(500, "Something went wrong");
  }
  
  return res
        .status(201)
        .json(
          new ApiResponse(200, { createNewPlaylist }, "Playlist created successfully")
        )
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: 'videos',
        localfield: "videos",
        foreignField: '_id',
        as: 'videos',
        pipeline: [
          {
            $sort: { createdAt: -1 }
          },
          {
            $limit: 1,
          },
          {
            $project: {
              thumbnail: 1
            }
          }
        ]
      }
    },
    {
      $addFields: {
        playlistThumbnail: {
          $cond: {
            if: { $isArray: "$videos"},
            then: { $first: "$videos.thumbnail" },
            else: null,
          }
        }
      }
    },
    {
      $project: {
        name: 1,
        description: 1,
        playlistThumbnail: 1
      }
    },
  ]);

  if(!userPlaylists) {
    throw new ApiError(404, "Playlists not founds");
  }

  return res
        .status(200)
        .json(
          new ApiResponse(200, { userPlaylists }, "Fetched Playlists successfully")
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const doesPlaylistExist = await Playlist.findById(playlistId);
  if(!doesPlaylistExist) {
    throw new ApiError(404, "Playlist does not exist");
  }

  const userPlaylist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  }
                },
              ]
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              }
            }
          }
        ]
      }
    },
    {
      $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
              {
                  $project: {
                      username: 1,
                      fullName: 1,
                      avatar: 1
                  }
              }
          ]
      }
    },
    {
        $addFields: {
            owner: {
                $first: "$owner"
            }
        }
    },
    ]);

  if(!userPlaylist) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
        .status(200)
        .json(
          new ApiResponse(200, "Playlist fetched successfully")
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if(!(playlistId && videoId)) {
    throw new ApiError(400, "playlist id and video id required");
  }

  const userPlaylist = await Playlist.findById(playlistId);
  if (!userPlaylist) {
      throw new ApiError(404, "Playlist not found");
  }

  const doesVideoExist = await Video.findById(videoId);
  if (!doesVideoExist) {
      throw new ApiError(404, "Video not found");
  }

  if(userPlaylist.videos.includes(videoId)) {
    throw new ApiError(400, "Video is already present in playlist");
  }

  const addVideoToPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
    $push: { videos: videoId }
  });
  if(!addVideoToPlaylist) {
    throw new ApiError(500, "Something went wrong")
  }

  return res
        .status(201)
        .json(
          new ApiResponse(201, {}, "Video added to playlist successfullly")
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  
  if(!(playlistId && videoId)) {
    throw new ApiError(400, "playlist id and video id required");
  }

  const userPlaylist = await Playlist.findById(playlistId);
  if (!userPlaylist) {
      throw new ApiError(404, "Playlist not found");
  }

  const doesVideoExist = await Video.findById(videoId);
  if (!doesVideoExist) {
      throw new ApiError(404, "Video not found");
  }

  if(!userPlaylist.videos.includes(videoId)) {
    throw new ApiError(404, "Video is not present in playlist");
  }

  const removeVideoFromPlaylist = await Playlist.findByIdAndUpdate(
    playlistId, 
    {
      $pull: { videos: videoId }
    },
  );
  if(!removeVideoFromPlaylist) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
        .status(201)
        .json(
          new ApiResponse(201, {}, "Video removed from playlist successfully")
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if(!playlistId) {
    throw new ApiError(400, "playlist id required");
  }

  const userPlaylist = await Playlist.findById(playlistId);
  if (!userPlaylist) {
      throw new ApiError(404, "Playlist not found");
  }

  const deletePlaylist =  await Playlist.findByIdAndDelete(playlistId);
  if(!deletePlaylist) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
        .status(201)
        .json(
          new ApiResponse(201, {}, "Playlist deleted successfully")
        );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if(!playlistId) {
    throw new ApiError(400, "playlist id required");
  }

  const userPlaylist = await Playlist.findById(playlistId);
  if (!userPlaylist) {
      throw new ApiError(404, "Playlist not found");
  }

  if (!name || !description) {
    throw new ApiError(400, "All fields are required!");
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
    $set: {
        name,
        description
    }
  })

  if (!updatedPlaylist) {
    throw new ApiError(500, "Something went wrong while updating playlist!");
  }

  return res
        .status(201)
        .json(
          new ApiResponse(201, {}, "Playlist updated successfully")
        );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
