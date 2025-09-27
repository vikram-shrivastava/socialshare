import { NextRequest,NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';


cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
    const {userId}=await auth()
    if(!userId){
        return NextResponse.json({message:"Unauthorized"},{status:401})
    }
    try {
        const formData=await request.formData();
        const file=formData.get("file");
        if(!file){
            return NextResponse.json({message:"File is required"},{status:400})
        }
        const bytes=await file.arrayBuffer();
        const buffer=Buffer.from(bytes);
        const result=await new Promise((resolve,reject)=>{
            cloudinary.uploader.upload_stream({folder:"next-cloudinary-uploads"},(error,result)=>{
                if(error){
                    reject(error);
                }else{
                    resolve(result);
                }
            }).end(buffer);
        });
        return NextResponse.json({publicId:result.public_id},{status:200});
    } catch (error) {
        console.log("Upload Image failed",error)
        return NextResponse.json({message:"Internal Server Error"},{status:500})
    }
}