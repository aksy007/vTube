// require("dotenv").config({ path: "./env" });
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({ path: "./env" });

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.error("Error: ", error);
      throw error;
    });

    app.listen(process.env, PORT || 8000, () => {
      console.log("Server is running at PORT: ", process.env.PORT);
    });
  })
  .catch((err) => console.log("Mongodb connection failed!!", err));

// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
// import express from "express";
// const app = express();

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.error("Error: ", error);
//       throw error;
//     });

//     app.listen(process.env.PORT, ()=> { console.log("app is listening on PORT:", process.env.PORT)} )
//   } catch (error) {
//     console.error("Error: ", error);
//     throw error;
//   }
// })();
