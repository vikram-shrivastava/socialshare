"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getCldImageUrl, getCldVideoUrl } from "next-cloudinary";
import { Download, Clock, FileDown, FileUp } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { filesize } from "filesize";
import { useRouter } from "next/navigation";

dayjs.extend(relativeTime);

const VideoCard = ({ video, onDownload }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const router = useRouter();

  const getThumbnailUrl = useCallback((publicId) => {
    return getCldImageUrl({
      src: publicId,
      width: publicId.width,
      height: publicId.height,
      crop: "fill",
      gravity: "auto",
      format: "jpg",
      quality: "auto",
      assetType: "video",
    });
  }, []);

  const getFullVideoUrl = useCallback((publicId) => {
    return getCldVideoUrl({
      src: publicId,
      width: 1920,
      height: 1080,
      rawTransformations: ["fl_attachment"],
    });
  }, []);

  const getPreviewVideoUrl = useCallback((publicId) => {
    return getCldVideoUrl({
      src: publicId,
      width: 500,
      height: 225,
      rawTransformations: ["e_preview:duration_15:max_seg_9:min_seg_dur_1"],
    });
  }, []);

  const formatSize = useCallback((size) => filesize(size), []);
  const formatDuration = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const compressionPercentage = Math.round(
    (1 - Number(video.compressedsize) / Number(video.originalsize)) * 100
  );

  useEffect(() => setPreviewError(false), [isHovered]);

  const handlePreviewError = () => setPreviewError(true);

  const handleGeneratePost = () => router.push(`/generate/${video.id}`);

  return (
    <div className="card bg-base-200 shadow-md hover:shadow-lg rounded-lg transition-all duration-300 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <figure className="relative aspect-video">
        {isHovered ? (
          previewError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <p className="text-red-500">Preview not available</p>
            </div>
          ) : (
            <video
              src={getPreviewVideoUrl(video.publicId)}
              autoPlay
              muted
              loop
              className="w-full h-full object-contain"
              onError={handlePreviewError}
            />
          )
        ) : (
          <img
            src={getThumbnailUrl(video.publicId)}
            alt={video.id}
            className="w-full h-full object-contain"
          />
        )}
        <div className="absolute bottom-2 right-2 bg-base-100 bg-opacity-70 px-2 py-1 rounded-lg flex items-center text-sm">
          <Clock size={14} className="mr-1" /> {formatDuration(video.duration)}
        </div>
      </figure>

      <div className="card-body p-4 flex flex-col gap-3">
        <p className="text-sm text-base-content opacity-70">
          Uploaded {dayjs(video.createdAt).fromNow()}
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <FileUp size={18} className="text-primary" />
            <div>
              <div className="font-semibold">Original</div>
              <div>{formatSize(video.originalsize)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileDown size={18} className="text-secondary" />
            <div>
              <div className="font-semibold">Compressed</div>
              <div>{formatSize(video.compressedsize)}</div>
            </div>
          </div>
        </div>

        <div className="text-sm font-semibold">
          Compression: <span className="text-accent">{compressionPercentage}%</span>
        </div>

        <div className="flex justify-between items-center mt-2">
          {video.captionsUrl ? (
            <button
              className="text-success text-sm font-medium cursor-pointer"
              onClick={() => window.open(video.captionsUrl, "_blank")}
            >
              Download Captions
            </button>
          ) : (
            <span className="text-warning text-sm font-medium">No Captions</span>
          )}

          <button
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={() => onDownload(getFullVideoUrl(video.publicId), video.id)}
          >
            <Download size={16} /> Download
          </button>
        </div>

        <button
          className="btn btn-accent btn-sm mt-2 w-full"
          onClick={handleGeneratePost}
        >
          Generate Post
        </button>
      </div>
    </div>
  );
};

export default VideoCard;
