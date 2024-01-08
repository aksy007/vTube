import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError..js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidEmail } from "../utils/utils.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from FE or postman
  const { username, fullname, email, password } = req.body;

  // validation not empty and valid email
  // not duplicate
  if (
    [username, fullname, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  if (!isValidEmail(email)) {
    throw new ApiError(400, "Invalid Email");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with duplicate username or email");
  }

  // check for images and avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage[0].length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // upload images to cloudinary...
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // create user object -> create entry in db
  const user = await User.create({
    username: username.toLowerCase(),
    fullname,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check for user creation
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering user");
  }

  // retrun response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully!"));
});

export { registerUser };
