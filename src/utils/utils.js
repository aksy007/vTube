import { User } from "../models/user.model.js";

const isValidEmail = (email) => {
  // Define a regular expression pattern for a valid email address
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  // Test the email against the pattern
  const isValid = emailPattern.test(email);
  // Return true if there is a match, indicating a valid email, otherwise return false
  return isValid;
};

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generatating Refresh and Access Token"
    );
  }
};

export { isValidEmail, generateAccessAndRefreshToken };
