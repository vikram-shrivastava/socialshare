"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
function VideoUpload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [captionneeded, setCaptionneeded] = useState(false);
  const router = useRouter();
  //max file size of 70mb
  const MAX_FILE_SIZE = 1024 * 1024 * 70; // 70MB

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file");
    if (file.size > MAX_FILE_SIZE) return alert("File size exceeds 70MB");
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("captionneeded", captionneeded);
    formData.append("originalsize", file.size.toString());
    try {
      const response = await fetch("/api/video-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Video upload failed");
      const data = await response.json();
      router.push(`/home`);
    } catch (error) {
      console.log(error);
      alert("Failed to upload video");
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">
            <span className="label-text">Video File</span>
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="file-input file-input-bordered w-full"
            required
          />
        </div>
        <div className="flex items-center space-x-3">
          <input
            id="captionNeeded"
            type="checkbox"
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            checked={captionneeded}
            onChange={() => setCaptionneeded(!captionneeded)}
          />
          <label
            htmlFor="captionNeeded"
            className="text-sm font-medium text-gray-700 cursor-pointer select-none"
          >
            Caption file needed
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload Video"}
        </button>
      </form>
    </div>
  );
}

export default VideoUpload;
