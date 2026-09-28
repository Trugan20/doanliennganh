"use strict";

const fs = require("fs");
const path = require("path");
const Conversation = require("../models/Conversation");
const connectDB = require("../config/db");

/**
 * Script to clean up invalid media URLs from conversations
 * Removes audioUrl/imageUrl if file doesn't exist on disk
 */
const cleanupMediaUrls = async () => {
  try {
    await connectDB();
    console.log("🔍 Starting media URL cleanup...\n");

    const uploadDir = path.join(
      __dirname,
      "../../",
      process.env.UPLOAD_DIR || "uploads",
    );

    // Get all conversations with media
    const conversations = await Conversation.find({
      "messages.audioUrl": { $exists: true, $ne: null },
    }).select("_id messages.audioUrl messages.imageUrl");

    let cleanedCount = 0;
    let totalIssues = 0;

    for (const conversation of conversations) {
      let hasChanges = false;

      for (const message of conversation.messages) {
        // Check audio
        if (message.audioUrl) {
          const filename = path.basename(message.audioUrl);
          const audioPath = path.join(uploadDir, "audio", filename);

          if (!fs.existsSync(audioPath)) {
            console.log(`❌ Audio file missing: ${message.audioUrl}`);
            message.audioUrl = null;
            hasChanges = true;
            totalIssues++;
          }
        }

        // Check image
        if (message.imageUrl) {
          const filename = path.basename(message.imageUrl);
          // Try both images and audio folders since some might be misplaced
          let imagePath = path.join(uploadDir, "images", filename);

          if (!fs.existsSync(imagePath)) {
            // Try audio folder
            imagePath = path.join(uploadDir, "audio", filename);
            if (!fs.existsSync(imagePath)) {
              console.log(`❌ Image file missing: ${message.imageUrl}`);
              message.imageUrl = null;
              hasChanges = true;
              totalIssues++;
            } else {
              // Found in audio folder, update URL
              message.imageUrl = `/uploads/audio/${filename}`;
              console.log(`✅ Fixed image URL in audio folder: ${filename}`);
              hasChanges = true;
            }
          }
        }
      }

      if (hasChanges) {
        await conversation.save();
        cleanedCount++;
        console.log(`✅ Cleaned conversation ${conversation._id}\n`);
      }
    }

    console.log(`\n📊 Cleanup Complete!`);
    console.log(`   Conversations cleaned: ${cleanedCount}`);
    console.log(`   Issues found: ${totalIssues}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  cleanupMediaUrls();
}

module.exports = cleanupMediaUrls;
