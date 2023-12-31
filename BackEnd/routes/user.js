const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
//const keys = require("../config/keys");
const passport = require("passport");

//Load validation function
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");

//Load User Model
const User = require("../models/user");
//Load Property Model
const Property = require("../models/property");

// @Route api/user/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  //validate registration detail
  const { errors, isValid } = validateRegisterInput(req.body);
  if (!isValid) return res.status(400).send(errors);

  //check if user already exists

  const user = await User.findOne({ email: email });

  if (user) {
    res.status(400).send({ error: "Email already exists" });
  } else {
    const newUser = new User({
      name,
      email,
      password
    });

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(newUser.password, salt);
    await newUser.save();
    res.status(200).send({ msg: "registration completed please login!" });
  }
});

//@Route api/user/login
router.post("/login", async (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).send(errors);
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email: email });
  if (!user) {
    errors.email = "user not found";
    res.status(400).send(errors);
  } else {
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      // res.status(200).send("success");

      const payload = {
        id: user.id,
        name: user.name,
        email: user.email
      };

      const token = jwt.sign(payload, keys.secretOrKey, { expiresIn: 3600 });

      res
        .status(200)
        .send({ payload: payload, success: true, token: "Bearer " + token });
    } else {
      res.status(400).send({ error: "email or password incorrect" });
    }
  }
});

//get all user properties
//@Route /api/user/property/all

router.get(
  "/property/all",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const currentPage = req.query.currentPage;
    const pageSize = req.query.pageSize;

    const propertyList = await Property.find({
      user: mongoose.Types.ObjectId(req.user.id)
    })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize * 1)
      .sort({ date: -1 })
      .populate("user", ["-password"]);

    console.log("total couunt:", propertyList.length);

    if (propertyList.length > 0) {
      res.status(200).send(propertyList);
    } else {
      res.status(400).send({ msg: "no property found" });
    }
  }
);

//get user property count
//@Route /api/user/propertyCount
router.get(
  "/propertyCount",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const totalCount = await Property.find({
      user: mongoose.Types.ObjectId(req.user.id)
    }).countDocuments();

    if (totalCount === 0) {
      res.status(400).send({ err: "1no property found" });
    } else {
      res.status(200).send({ totalCount: totalCount });
    }
  }
);

//get user properties list with user id to count total properties
//@Route /api/user/property/:id
router.get("/property/:id", async (req, res) => {
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    const propertyList = await Property.find({
      user: mongoose.Types.ObjectId(req.params.id)
    });
    if (propertyList) {
      res.status(200).send(propertyList);
    } else {
      res.status(400).send("not found");
    }
  } else {
    res.status(400).send({ err: "not found" });
  }
});

module.exports = router;s