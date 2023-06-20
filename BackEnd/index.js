//import all packages
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const cors = require("cors");
const app = express();
const connectDb = require("./config/dbConnection");

//mongodb connect

connectDb ();

// starting server

app.listen(process.env.PORT, () =>
  console.log("server in running successfully")
);
