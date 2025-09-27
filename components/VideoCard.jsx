import React, {useState, useEffect, useCallback} from 'react'
import {getCldImageUrl, getCldVideoUrl} from "next-cloudinary"
import { Download, Clock, FileDown, FileUp } from "lucide-react";
import dayjs from 'dayjs';
import realtiveTime from "dayjs/plugin/relativeTime"
import {filesize} from "filesize"

dayjs.extend(realtiveTime)


const  VideoCard= ({video, onDownload}) => {
    const [isHovered, setIsHovered] = useState(false)
    const [previewError, setPreviewError] = useState(false)

    const getThumbnailUrl = useCallback((publicId) => {
        return getCldImageUrl({
            src: publicId,
            width: publicId.width,
            height: publicId.height,
            crop: "fill",
            gravity: "auto",
            format: "jpg",
            quality: "auto",
            assetType: "video"
        })
    }, [])

    const getFullVideoUrl = useCallback((publicId) => {
      console.log("Generating full video URL for publicId:", publicId);
        const url= getCldVideoUrl({
            src: publicId,
            width: 1920,
            height: 1080,
            rawTransformations: ["fl_attachment"],
        })
        if(!url) console.log("Failed to generate URL: ",url);
        console.log("Generated URL: ",url);
        return url;
    }, [])

    const getPreviewVideoUrl = useCallback((publicId) => {
        return getCldVideoUrl({
            src: publicId,
            width: 500,
            height: 225,
            rawTransformations: ["e_preview:duration_15:max_seg_9:min_seg_dur_1"]

        })
    }, [])

    const formatSize = useCallback((size) => {
        return filesize(size)
    }, [])

    const formatDuration = useCallback((seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
      }, []);

      const compressionPercentage = Math.round(
        (1 - Number(video.compressedsize) / Number(video.originalsize)) * 100
      );

      useEffect(() => {
        setPreviewError(false);
      }, [isHovered]);

      const handlePreviewError = () => {
        setPreviewError(true);
      };

      return (
        <div
          className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <figure className="aspect-video relative">
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
            <div className="absolute bottom-2 right-2 bg-base-100 bg-opacity-70 px-2 py-1 rounded-lg text-sm flex items-center">
              <Clock size={16} className="mr-1" />
              {formatDuration(video.duration)}
            </div>
          </figure>
          <div className="card-body p-4">
            <p className="text-sm text-base-content opacity-70 mb-4">
              Uploaded {dayjs(video.createdAt).fromNow()}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <FileUp size={18} className="mr-2 text-primary" />
                <div>
                  <div className="font-semibold">Original</div>
                  <div>{formatSize((video.originalsize))}</div>
                </div>
              </div>
              <div className="flex items-center">
                <FileDown size={18} className="mr-2 text-secondary" />
                <div>
                  <div className="font-semibold">Compressed</div>
                  <div>{formatSize(Number(video.compressedsize))}</div>
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold">
                Compression:{" "}
                <span className="text-accent">{compressionPercentage}%</span>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm font-semibold">
                {video.captionsUrl && video.captionsUrl!=null? (
                  <button className="text-success cursor-pointer" onClick={()=>{
                    window.open(video.captionsUrl, "_blank");
                  }}>Download Captions</button>
                ) : (
                  <button className="text-warning mt-4">No Captions</button>
                )
              }
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const url = getFullVideoUrl(video.publicId);
                  if (!url) {
                    console.error("Download URL is invalid:", url);
                    return;
                  }
                  console.log("Initiating download for URL:", url);
                  onDownload(url, video.id);
                }}
              > Download Video
                <Download size={16} />
              </button>
            </div>
            <button className="mt-2 btn btn-accent btn-sm">Generate Post</button>
          </div>
        </div>
      );
}

export default VideoCard