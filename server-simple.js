const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// HEALTH CHECK
app.get("/", (req, res) => {
    res.send("Audio cleaning backend is running 🚀");
});

// Upload + Clean Route
app.post("/clean-audio", upload.single("audio"), (req, res) => {
    const badWords = req.body.badWords ? JSON.parse(req.body.badWords) : [];
    const inputPath = req.file.path;
    const outputPath = `cleaned_${Date.now()}.wav`;

    // badwords = array of { start, end } in seconds
const conditions = (badwords || [])
  .map((seg) => `between(t,${seg.start},${seg.end})`)
  .join("+");

// If no words selected, just return original audio
if (!conditions) {
  return res.download(inputPath, () => {
    try { fs.unlinkSync(inputPath); } catch (e) {}
  });
}

// Mute whenever any of the ranges is “true”
const filter = `volume='if(${conditions},0,1)'`;

// -y = overwrite output if it already exists
const cmd = `ffmpeg -y -i "${inputPath}" -af "${filter}" "${outputPath}"`;



    exec(cmd, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error cleaning audio" });
        }

        res.download(outputPath, () => {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        });
    });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log("Server running on port " + PORT));
