import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Image title is required"],
    },
    description: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    cloudinaryId: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const Gallery = mongoose.model("gallery", gallerySchema);

export default Gallery;
