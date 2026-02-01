import sharp from "sharp";
import type { IllustrationRegion } from "./openai";

export interface CroppedIllustration {
  id: string;
  description: string;
  type: string;
  imageDataUrl: string;
}

export async function cropIllustrations(
  imageBuffer: Buffer,
  mimeType: string,
  illustrations: IllustrationRegion[]
): Promise<CroppedIllustration[]> {
  if (illustrations.length === 0) {
    return [];
  }

  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width === 0 || height === 0) {
      console.warn("Could not determine image dimensions");
      return [];
    }

    const croppedImages: CroppedIllustration[] = [];
    const padding = 10;

    for (const ill of illustrations) {
      try {
        let left = Math.floor((ill.boundingBox.x / 100) * width);
        let top = Math.floor((ill.boundingBox.y / 100) * height);
        let cropWidth = Math.floor((ill.boundingBox.width / 100) * width);
        let cropHeight = Math.floor((ill.boundingBox.height / 100) * height);

        left = Math.max(0, left - padding);
        top = Math.max(0, top - padding);
        cropWidth = Math.min(width - left, cropWidth + padding * 2);
        cropHeight = Math.min(height - top, cropHeight + padding * 2);

        if (cropWidth < 20 || cropHeight < 20) {
          console.warn(`Skipping too small crop: ${cropWidth}x${cropHeight}`);
          continue;
        }

        const croppedBuffer = await sharp(imageBuffer)
          .extract({ left, top, width: cropWidth, height: cropHeight })
          .png({ quality: 85 })
          .toBuffer();

        const base64 = croppedBuffer.toString("base64");
        const dataUrl = `data:image/png;base64,${base64}`;

        croppedImages.push({
          id: ill.id,
          description: ill.description,
          type: ill.type,
          imageDataUrl: dataUrl,
        });

        console.log(`Cropped illustration ${ill.id}: ${cropWidth}x${cropHeight} - ${ill.description.substring(0, 50)}...`);
      } catch (cropError) {
        console.warn(`Failed to crop illustration ${ill.id}:`, cropError);
      }
    }

    return croppedImages;
  } catch (error) {
    console.error("Error cropping illustrations:", error);
    return [];
  }
}

export async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    console.error("Error getting image dimensions:", error);
    return { width: 0, height: 0 };
  }
}
