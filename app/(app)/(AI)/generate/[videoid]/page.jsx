"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { getCldImageUrl, getCldVideoUrl } from "next-cloudinary";
import axios from "axios";
import {
  FileText,
  Copy,
  Check,
  PlayCircle,
  VideoIcon,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

export default function AIComponent() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const params = useParams();
  const videoid=params.videoid
  const [video, setVideo] = useState(null);
  const [platform, setPlatform] = useState("");
  const [postText, setPostText] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ai_postText");
    if (saved) setPostText(saved);
  }, []);

  // Save postText persistently
  useEffect(() => {
    if (postText) localStorage.setItem("ai_postText", postText);
  }, [postText]);

  // Fetch video data
  useEffect(() => {
    async function fetchVideo() {
      if (!videoid) return;
      try {
        const res = await axios.get(`/api/video/${params.videoid}`);
        setVideo(res.data.video);
      } catch (err) {
        console.error("Error fetching video:", err);
      }
    }
    fetchVideo();
  }, [videoid]);

  // Generate AI Post
  const handleGeneratePost = async () => {
    if (!platform) {
      setPostText("⚠️ Please select a platform first.");
      return;
    }
    if (!video) {
      setPostText("⚠️ No video data available.");
      return;
    }

    const captionUrl = video.captionsUrl;
    if (!captionUrl) {
      setPostText("⚠️ No captions available for this video.");
      return;
    }

    try {
      setLoading(true);
      const captionResponse = await axios.get(captionUrl);
      const captions =
        typeof captionResponse.data === "string"
          ? captionResponse.data
          : JSON.stringify(captionResponse.data);

      const response = await axios.post(
        "http://localhost:5000/generate",
        { platform, captions },
        { headers: { "Content-Type": "application/json" } }
      );
      setPostText(response.data);
    } catch (err) {
      console.error(err);
      setPostText("⚠️ Failed to generate post. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const getThumbnailUrl = useCallback((publicId) => {
    return getCldImageUrl({
      src: publicId,
      crop: "fill",
      gravity: "auto",
      format: "jpg",
      quality: "auto",
      assetType: "video",
    });
  }, []);

  const getPreviewVideoUrl = useCallback((publicId) => {
    return getCldVideoUrl({
      src: publicId,
      width: 640,
      height: 360,
      rawTransformations: ["e_preview:duration_15:max_seg_9:min_seg_dur_1"],
    });
  }, []);

  const handlePreviewError = () => setPreviewError(true);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(postText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // UI starts here
  return (
    <div className="min-h-screen bg-base-100 px-4 py-8">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
        {/* Left Side - Video Card */}
        <div
          className="relative bg-base-200/60 backdrop-blur-md border border-base-300 rounded-2xl p-6 shadow-md transition hover:shadow-lg"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <div className="flex items-center gap-2 mb-4">
            <VideoIcon className="text-primary w-6 h-6" />
            <h2 className="text-lg font-semibold">Video Preview</h2>
          </div>

          {!video ? (
            <div className="flex flex-col items-center justify-center h-56 bg-base-300/50 rounded-xl border border-base-300">
              <AlertTriangle className="text-warning mb-2" />
              <p className="text-sm text-base-content/70">
                No video data available.
              </p>
            </div>
          ) : (
            <div className="aspect-video rounded-xl overflow-hidden border border-base-300 bg-base-300/40">
              {hover ? (
                previewError ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-error">Preview not available</p>
                  </div>
                ) : (
                  <video
                    src={getPreviewVideoUrl(video.publicId)}
                    autoPlay
                    muted
                    loop
                    onError={handlePreviewError}
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <img
                  src={getThumbnailUrl(video.publicId)}
                  alt="Video thumbnail"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          )}
        </div>

        {/* Right Side - Post Generator */}
        <div className="bg-base-200/60 backdrop-blur-md border border-base-300 rounded-2xl p-6 shadow-md transition hover:shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-primary w-6 h-6" />
            <h2 className="text-lg font-semibold">AI Post Generator</h2>
          </div>

          <select
            className="select select-bordered w-full mb-4"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="">Select Platform</option>
            <option value="Twitter">Twitter</option>
            <option value="Instagram">Instagram</option>
            <option value="LinkedIn">LinkedIn</option>
          </select>

          {postText && (
            <div className="bg-base-100 border border-base-300 rounded-xl p-4 relative">
              {/* Copy button (moved outside the <p>) */}
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 btn btn-xs btn-outline z-10"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" /> Copy
                  </>
                )}
              </button>

              {/* Post text */}
              <p className="whitespace-pre-wrap text-sm leading-relaxed mt-4 max-h-36 overflow-y-auto">
                {postText}
              </p>

              {/* Generate again button */}
              <button
                onClick={handleGeneratePost}
                disabled={loading}
                className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Again
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
