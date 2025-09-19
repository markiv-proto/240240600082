const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const shortid = require("shortid");
const Url = require("./models/url");
const { Log } = require("logging_middleware");   // ✅ Import middleware

dotenv.config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL;

// --- Custom logging middleware for all requests ---
app.use(async (req, res, next) => {
  await Log("info", `Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");
    Log("info", "MongoDB connection established");
  })
  .catch((err) => {
    console.error(err);
    Log("error", `MongoDB connection error: ${err.message}`);
  });

/**
 * @route   POST /api/shorten
 * @desc    Create short URL
 */
app.post("/api/shorten", async (req, res) => {
  const { longUrl } = req.body;

  if (!longUrl) {
    await Log("warn", "Attempted shorten without longUrl");
    return res.status(400).json({ error: "Long URL is required" });
  }

  try {
    const urlCode = shortid.generate();
    const shortUrl = `${BASE_URL}/${urlCode}`;

    let url = await Url.findOne({ longUrl });

    if (url) {
      await Log("info", `Existing short URL returned for ${longUrl}`);
      return res.json(url);
    } else {
      url = new Url({
        longUrl,
        shortUrl,
        urlCode,
        date: new Date()
      });

      await url.save();
      await Log("info", `New short URL created: ${shortUrl} -> ${longUrl}`);
      return res.json(url);
    }
  } catch (err) {
    console.error(err);
    await Log("error", `Server error in /api/shorten: ${err.message}`);
    res.status(500).json("Server error");
  }
});

/**
 * @route   GET /:code
 * @desc    Redirect to original URL
 */
app.get("/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });

    if (url) {
      await Log("info", `Redirected: ${req.params.code} -> ${url.longUrl}`);
      return res.redirect(url.longUrl);
    } else {
      await Log("warn", `No URL found for code: ${req.params.code}`);
      return res.status(404).json("No URL found");
    }
  } catch (err) {
    console.error(err);
    await Log("error", `Server error in redirect: ${err.message}`);
    res.status(500).json("Server error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  Log("info", `Server started on port ${PORT}`);
});
