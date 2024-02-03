import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Playlist } from "../models/playlist.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const isUserOwner = async(videoId,req)=>{
  const video = await Video.findById(videoId);
  if(video?.owner.toString() == req.user?._id.toString()){
      return true;
  }
  return false;
}

const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'asc', userId } = req.query;

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  // videos based on user 
  if(userId && !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user");
  }

  // sorting videos
  const sortMethod = {};
  sortMethod[sortBy] = (sortType === 'asc') ? 1 : -1;

  const userVideos = await Video.aggregate([
    ...(userId ? [{
      $match: {
        owner: mongoose.Types.ObjectId(userId),
      }
    }] : []),
    ...(query ? [{
      $match: {
        $text: {
          $search: query,
        }
      }
    }] : []),
    {
      $sort: sortMethod,
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    }
  ]) || [];

  if(userVideos.length === 0) {
    return res
        .status(404)
        .json(
          new ApiResponse(404, [], "No videos found")
        );
  }

  return res
        .status(200)
        .json(
          new ApiResponse(200, userVideos, "Successfully fetched all videos")
        );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if(!(title && description)) {
    throw new ApiError(400, "title or description missing");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if(!videoLocalPath) {
    throw new ApiError(404, "Video file is required");
  }
  if(!thumbnailLocalPath) {
    throw new ApiError(404, "Thumbnail file is required");
  }

  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if(!(video?.url && thumbnail?.url)) {
    throw new ApiError(500, "Something went wrong while uploading video || thumbnail");
  }

  const newVideo = await Video.create({
    videoFile: video?.url,
    thumbnail: thumbnail?.url,
    title,
    description,
    duration: video?.duration,
    isPublished: true,
    owner: req.user._id,
  });

  return res
        .status(201)
        .json(
          new ApiResponse(201, newVideo, "Video published successfully")
        );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if( !videoId ) {
    throw new ApiError(400, "Video ID is required");
  }

  const video = await Video.findById(videoId);
  if(!video || !(video?.isPublished && video?.owner?.toString() == req.user._id.toString())) {
    throw new ApiError(404, "video not found");
  }

  return res
        .status(200)
        .json(
          new ApiResponse(200, video, "Video fetched successfully")
        );        
});

const updateVideo = asyncHandler(async (req, res) => {  
  const { videoId } = req.params;
  const {title = "", description = ""} = req.body;

  if(!videoId) {
    throw new ApiError(400, "Video id is required");
  }

  if(title === "" && description === "") {
    throw new ApiError(400, "Title or Description is required")
  }

  const userVideo = Video.findById(videoId);
  if(!userVideo) {
    throw new ApiError(404, "Video does not exist");
  }

  const isUserAuthorized = await isUserOwner(videoId, req);
  if(!isUserAuthorized) {
    throw new ApiError(300, "User not authorized to update the video");
  }

  const thumbnaillocalpath = req.file?.path;

  const thumbnail = await uploadOnCloudinary(thumbnaillocalpath);
  if(!thumbnail?.url){
   throw new ApiError(400,"Something went wrong while updating the thumbnail")
  }

  const updateVideo = await Video.findByIdAndUpdate(videoId, 
    {
      $set: {
      title,
      description,
      thumbnail: thumbnail?.url,
    }},
    {
      new: true,
    }
  );

  if(!updateVideo){
    throw new ApiError(500,"Something went wrong while updating the details")
   }
   return res
          .status(200)
          .json(
            new ApiResponse(200,updateVideo,"Video Updated Successfully")
          );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if(!videoId) {
    throw new ApiError(404,"videoId is required !!!")
  }
  const video = await Video.findById(videoId);
  if(!video) {
      throw new ApiError(404,"Video doesnt exist")
  }
  const authorized = await isUserOwner(videoId,req)
  if(!authorized) {
      throw new ApiError(300,"Unauthorized Access")
  } 

  const videoDeleted = await Video.findByIdAndDelete(videoId);
  await Comment.deleteMany({video:videoId})
  await Like.deleteMany({video:videoId})
  //removing the video id if it exists in any playlist
  const playlists = await Playlist.find({videos:videoId})
  for(const playlist of playlists){
      await Playlist.findByIdAndUpdate(
          playlist._id,
          {
              $pull:{videos:videoId}
          },
          {
              new:true
          }
      )
  }

  if(!videoDeleted ){
      throw new ApiError(400,"Something error happened while deleting the video")
  }

  return res
  .status(200)
  .json(new ApiResponse(200,{},"Video Deleted Successfully"))

});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if(!videoId){
    throw new ApiError(404,"videoId is required !!!")
  }
  const video = await Video.findById(videoId);
  if (!video) {
      throw new ApiError(404, "Video not found");
  }
  const authorized = await isUserOwner(videoId,req)
  if(!authorized){
      throw new ApiError(300,"Unauthorized Access")
  } 

  const updatedVideo = await Video.findByIdAndUpdate(videoId,
    {
      $set:{
          isPublished : !video.isPublished

      }
    },
    {new:true}
  );

  if(!updatedVideo){
  throw new ApiError(500,"Something went wrong while toggling the status")
  }

  return res
  .status(200)
  .json(new ApiResponse(200,updatedVideo," PublishStatus of the video  is toggled successfully"))
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
