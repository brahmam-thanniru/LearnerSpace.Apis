import Busboy from "busboy";
import sharp from "sharp";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import bucket from "../../Connect/firebaseAdmin";

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer | string;
    }
  }
}

export default class StorageUtils {
  static async storageHandler(req: Request, res: Response) {
    const busboy = Busboy({ headers: req.headers });

    const uploadedFiles: any[] = [];
    const fileWrites: Promise<void>[] = [];

    const companyName = (req.query.companyName as string) || "default-company";

    busboy.on("file", (_fieldname: any, file: any, info: any) => {
      const { filename, mimeType } = info;
      const safeMimeType = mimeType || "application/octet-stream";
      const isImage = safeMimeType.startsWith("image/");

      const folder = isImage ? "images" : "documents";
      const basePath = `${companyName}/${folder}`;
      const fileId = `${Date.now()}-${uuidv4()}`;

      const uploadPromise = new Promise<void>((resolve, reject) => {
        const chunks: Buffer[] = [];

        file.on("data", (chunk: any) => {
          chunks.push(chunk as Buffer);
        });

        file.on("end", async () => {
          try {
            let finalBuffer: Buffer = Buffer.concat(chunks);
            let contentType = safeMimeType;
            let extension = path.extname(filename);

            // 🔥 IMAGE OPTIMIZATION
            if (isImage) {
              finalBuffer = (await sharp(finalBuffer)
                .resize(1200, 1200, {
                  fit: "inside",
                  withoutEnlargement: true,
                })
                .webp({ quality: 75 })
                .toBuffer()) as Buffer;

              contentType = "image/webp";
              extension = ".webp";
            }

            const filePath = `${basePath}/${fileId}${extension}`;
            const fileRef = bucket.file(filePath);

            await fileRef.save(finalBuffer, {
              metadata: {
                contentType,
                cacheControl: "public, max-age=31536000, immutable", // 🚀 CACHE
                metadata: {
                  firebaseStorageDownloadTokens: uuidv4(),
                },
              },
            });

            const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${
              bucket.name
            }/o/${encodeURIComponent(filePath)}?alt=media`;

            // 🔹 THUMBNAIL
            let thumbnailUrl: string | null = null;

            if (isImage) {
              const thumbBuffer = (await sharp(finalBuffer)
                .resize(300)
                .webp({ quality: 60 })
                .toBuffer()) as Buffer;

              const thumbPath = `${basePath}/thumbnails/${fileId}.webp`;
              const thumbRef = bucket.file(thumbPath);

              await thumbRef.save(thumbBuffer, {
                metadata: {
                  contentType: "image/webp",
                  cacheControl: "public, max-age=31536000, immutable",
                  metadata: {
                    firebaseStorageDownloadTokens: uuidv4(),
                  },
                },
              });

              thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${
                bucket.name
              }/o/${encodeURIComponent(thumbPath)}?alt=media`;
            }

            uploadedFiles.push({
              filename,
              url: fileUrl,
              thumbnail: thumbnailUrl,
            });

            resolve();
          } catch (err) {
            console.error("❌ Upload error:", err);
            reject(err);
          }
        });

        file.on("error", reject);
      });

      fileWrites.push(uploadPromise);
    });

    busboy.on("close", async () => {
      try {
        await Promise.all(fileWrites);
        res.status(200).json({
          success: true,
          files: uploadedFiles,
        });
      } catch (err) {
        console.error("❌ Upload failed:", err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: "Upload failed",
          });
        }
      }
    });

    busboy.on("error", (err: any) => {
      console.error("❌ Busboy error:", err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Stream parsing error",
        });
      }
    });

    // 🔥 Cloud Functions / Local compatible
    if (req.rawBody) {
      busboy.end(req.rawBody);
    } else {
      req.pipe(busboy);
    }
  }
}
