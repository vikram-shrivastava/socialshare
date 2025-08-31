import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@/generated/prisma';


const prisma = new PrismaClient();

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
    try {
        const { userId } = auth()
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return NextResponse.json({ message: "Cloudinary configuration required" }, { status: 500 })
        }

        const formData = await request.formData();
        const file = formData.get("file");
        const title=formData.get("title");
        const description=formData.get("description");
        const originalSize=formData.get("originalsize")
        if (!file) {
            return NextResponse.json({ message: "File is required" }, { status: 400 })
        }
        if(!title || !description || !originalSize){
            return NextResponse.json({ message: "All fields details are required" }, { status: 400 })
        }
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { 
                    resource_type:"video",
                    folder: "video-uploads",
                    transformation:[
                        {quality:"auto",fetch_format:"mp4"},
                    ] 
                }, 
                (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }).end(buffer);
        });
        const video=await prisma.video.create({
            data:{
                title,
                description,
                publicId:result.public_id,
                originalsize:originalSize,
                compressedsize:String(result.bytes),
                duration:result.duration || 0
            }
        })
        return NextResponse.json({ publicId: result.public_id }, { status: 200 });
    } catch (error) {
        console.log("Upload Image failed", error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}