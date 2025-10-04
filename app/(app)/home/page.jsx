"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import VideoCard from "@/components/VideoCard";
import Link from "next/link";
import {
  UploadIcon, ImageIcon, VideoIcon
} from 'lucide-react'
function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVideos = useCallback(async () => {
    try {
      const response = await axios.get("/api/videos");
      console.log("Fetched videos:", response.data.videos);
      if (Array.isArray(response.data.videos)) {
        setVideos(response.data.videos);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.log(error);
      setError("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleDownload = useCallback((url, id) => {
    const link = document.createElement("a");
    link.href = url;
    console.log("Download link URL:", url);
    link.setAttribute("download", `${id}.mp4`);
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

 return (
  <div className="flex flex-col h-full">
    {videos.length === 0 ? (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 space-y-6 bg-base-200 rounded-2xl shadow-inner border border-base-300">
        <div className="relative">
          <VideoIcon className="w-14 h-14 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-base-content">
          Welcome to <span className="text-primary">ChainPost</span> 👋
        </h2>
        <p className="text-base text-base-content/70 max-w-md leading-relaxed">
          You don’t have any videos yet. Start by uploading a video to compress it, generate AI captions, and create platform-ready posts — or resize images for your next project.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link href="/video-upload">
            <button className="btn btn-primary btn-md flex items-center gap-2">
              <UploadIcon className="w-4 h-4" /> Upload Video
            </button>
          </Link>
          <Link href="/social-share">
            <button className="btn btn-outline btn-md flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Resize Image
            </button>
          </Link>
        </div>
        <p className="text-sm text-base-content/60 pt-4">
          💡 You can access your videos anytime from <span className="font-semibold text-primary">My Videos</span> once uploaded.
        </p>
      </div>
    ) : (
      <div className="flex flex-col h-full">
        <h1 className="text-2xl font-bold mb-4">Videos</h1>
        <div className="overflow-y-auto max-h-[calc(100vh-160px)]">
          {/* 160px accounts for padding/header space; adjust as needed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDownload={handleDownload}
              />
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
);

}

export default Home;
