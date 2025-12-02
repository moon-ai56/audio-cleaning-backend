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
   CLEAN AUDIO (TEST VERSION)
   → ALWAYS mutes first 0–3 seconds
   → If this works, backend is GOOD
------------------------------ */
app.post("/clean-audio", upload.single("audio"), async (req, res) => {
  console.log("🔥 CLEAN TEST STARTED");

  try {
    // Make sure file exists
    const inputPath = req.file?.path;
    if (!inputPath) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ error: "No audio uploaded" });
    }

    console.log("📁 Input Path:", inputPath);

    // Build output path
    const outputPath = path.join("uploads", `cleaned_${Date.now()}.wav`);

    // FFmpeg command: mute 0–3 seconds
    console.log("🎛 Running ffmpeg test mute 0-3 seconds...");
    const cmd = `ffmpeg -y -i "${inputPath}" -af "volume=enable='between(t,0,3)':volume=0" "${outputPath}"`;
    console.log("🧨 FFmpeg CMD:", cmd);

    exec(cmd, (err, stdout, stderr) => {
      console.log("FFmpeg stdout:", stdout);
      console.log("FFmpeg stderr:", stderr);

      if (err) {
        console.error("❌ FFmpeg error:", err);
        return res.status(500).json({ error: "FFmpeg failed" });
      }

      // Check sizes for debugging
      const inputSize = fs.statSync(inputPath).size;
      const outputSize = fs.statSync(outputPath).size;

      console.log("📏 Input size:", inputSize);
      console.log("📏 Output size:", outputSize);

      if (inputSize === outputSize) {
        console.log("⚠️ Warning: output same size as input (mute may have failed)");
      }

      console.log("✅ CLEANING DONE:", outputPath);

      // DO NOT DELETE OUTPUT FILE YET — let frontend download it
      return res.download(outputPath);
    });

  } catch (err) {
    console.error("💥 CLEAN TEST FAILED:", err);
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
