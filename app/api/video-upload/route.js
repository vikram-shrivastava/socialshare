import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { PrismaClient } from '@/generated/prisma';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// helper: ensure Clerk user exists in DB
async function getOrCreateUser(clerkUserId) {
  let user = await prisma.user.findUnique({ where: { clerkUserId } });

  if (!user) {
    const clerkUser = await (await clerkClient()).users.getUser(clerkUserId);
    user = await prisma.user.create({
      data: {
        clerkUserId,
        email: clerkUser.emailAddresses[0].emailAddress,
        plan: 'free',
        uploadsThisMonth: 0,
        uploadLimit: 10,
      },
    });
  }

  return user;
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const originalSize = formData.get('originalsize');
    const captionneeded = formData.get('captionneeded') === 'true';

    if (!file || !originalSize || !captionneeded) {
      return NextResponse.json({ 
        message: 'File, captionneeded, and original size are required' 
      }, { status: 400 });
    }

    // ensure user exists
    const user = await getOrCreateUser(userId);

    // Check upload limits (optional)
    if (user.uploadsThisMonth >= user.uploadLimit) {
      return NextResponse.json({ 
        message: 'Upload limit reached for this month' 
      }, { status: 429 });
    }

    // upload video to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'video-uploads',
          transformation: [{ quality: 'auto', fetch_format: 'mp4' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      ).end(buffer);
    });
    console.log('Cloudinary upload result:', result);
    if (!result) {
      throw new Error('Cloudinary upload failed');
    }
    let captionsUrl = null;
    let transcriptionError = null;
    
      // --- call FastAPI Whisper API ---
      const form = new FormData();
      form.append("file", file, file.name);
      try {
        const apiResponse = await fetch(`${process.env.CAPTIONS_API}/transcribe`, {
          method: "POST",
          body: form,
        });

        if (apiResponse.ok) {
          const { captions, srt } = await apiResponse.json();

          // upload .srt to Cloudinary
          const srtBuffer = Buffer.from(srt, 'utf-8');
          const captionsResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { 
                resource_type: 'raw', 
                folder: 'captions',
                public_id: `${result.public_id}_captions`
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              },
            ).end(srtBuffer);
          });

          if (captionsResult) {
            captionsUrl = captionsResult.secure_url;
          }
        }
      } catch (error) {
        console.warn('Caption generation failed:', error.message);
        transcriptionError = error.message;
      }
    

    // save video in DB (with or without captions)
    const video = await prisma.video.create({
      data: {
        publicId: result.public_id,
        originalsize: originalSize,
        compressedsize: String(result.bytes),
        duration: result.duration || 0,
        captionsUrl,
        userId: user.id,
      },
    });

    // Update user's upload count
    await prisma.user.update({
      where: { id: user.id },
      data: { uploadsThisMonth: user.uploadsThisMonth + 1 },
    });

    return NextResponse.json({
      ...video,
      transcriptionError,
      message: transcriptionError ? 
        'Video uploaded successfully, but without caption generation failed' : 
        'Video uploaded successfully with captions'
    }, { status: 200 });

  } catch (error) {
    console.error('Upload Video failed:', error);
    
    // More specific error handling
    if (error.message.includes('Prisma')) {
      return NextResponse.json({ 
        message: 'Database error occurred',
        error: error.message 
      }, { status: 500 });
    }
    
    if (error.message.includes('Cloudinary')) {
      return NextResponse.json({ 
        message: 'File upload failed',
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Internal Server Error',
      error: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}