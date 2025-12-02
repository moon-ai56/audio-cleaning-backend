const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Store uploaded files in /uploads/
const upload = multer({ dest: "uploads/" });

/* -----------------------------
   GLOBAL REQUEST LOGGER
------------------------------ */
app.use((req, res, next) => {
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

/* -----------------------------
   HEALTH CHECK
------------------------------ */
app.get("/", (req, res) => {
  res.send("Audio cleaning backend is running 🔊");
});

/* -----------------------------
   CLEAN AUDIO (FINAL VERSION)
   → Uses REAL transcription timestamps
   → Mutes ONLY the selected bad words
------------------------------ */
app.post("/clean-audio", upload.single("audio"), async (req, res) => {
  console.log("🔥 CLEANING (FULL MODE) STARTED");

  try {
    // Ensure file exists
    const inputPath = req.file?.path;
    if (!inputPath) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ error: "No audio uploaded" });
    }

    console.log("📁 Input Path:", inputPath);

    // Parse badwords timestamps
    let badwords = [];
    try {
      badwords = JSON.parse(req.body.badwords || "[]");
    } catch (err) {
      console.log("❌ Failed to parse badwords JSON:", err);
      badwords = [];
    }

    console.log("📝 Badwords received:", badwords);

    const outputPath = path.join("uploads", `cleaned_${Date.now()}.wav`);

    // If no words selected, return original audio
    if (!badwords.length) {
      console.log("⚠️ No words selected — returning original file.");
      return res.download(inputPath);
    }

    /* -----------------------------
       BUILD FILTER:
       volume=enable='between(t,start,end)':volume=0
       One filter per bad word, separated by commas
    ------------------------------ */
    const filters = badwords
      .map(seg => `volume=enable='between(t,${seg.start},${seg.end})':volume=0`)
      .join(",");

    const cmd = `ffmpeg -y -i "${inputPath}" -af "${filters}" "${outputPath}"`;

    console.log("🧨 FFmpeg CMD:", cmd);

    exec(cmd, (err, stdout, stderr) => {
      console.log("FFmpeg stdout:", stdout);
      console.log("FFmpeg stderr:", stderr);

      if (err) {
        console.error("❌ FFmpeg error:", err);
        return res.status(500).json({ error: "FFmpeg failed" });
      }

      // Optional: Log file sizes
      try {
        const inputSize = fs.statSync(inputPath).size;
        const outputSize = fs.statSync(outputPath).size;
        console.log("📏 Input size:", inputSize);
        console.log("📏 Output size:", outputSize);
      } catch (e) {
        console.log("⚠️ Could not read file sizes:", e);
      }

      console.log("✅ FULL CLEANING DONE:", outputPath);

      // Return cleaned audio file to frontend
      return res.download(outputPath);
    });

  } catch (err) {
    console.error("💥 CLEAN ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* -----------------------------
   START SERVER
------------------------------ */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
