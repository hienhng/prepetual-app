/** Whole-page context plus overlapping detail views keep dense photographed
 * text readable after the provider scales images to its vision resolution. */
export async function examImageReadingViews(imageUrl: string): Promise<string[]> {
  const data = /^data:image\/(?:jpeg|jpg|png);base64,(.+)$/u.exec(imageUrl);
  if (!data) return [imageUrl];
  const buffer = Buffer.from(data[1], "base64");
  if (buffer.length < 32) return [imageUrl];
  const { loadImage, createCanvas } = await import("@napi-rs/canvas");
  const image = await loadImage(buffer);
  if (image.height < 1_600 || image.height <= image.width) return [imageUrl];
  const cropHeight = Math.ceil(image.height * 0.56);
  const width = Math.min(image.width, 2_048);
  const height = Math.round(cropHeight * width / image.width);
  const views = [imageUrl];
  for (const top of [0, image.height - cropHeight]) {
    const canvas = createCanvas(width, height);
    canvas.getContext("2d").drawImage(image, 0, top, image.width, cropHeight, 0, 0, width, height);
    views.push(`data:image/jpeg;base64,${canvas.toBuffer("image/jpeg", 92).toString("base64")}`);
  }
  return views;
}
