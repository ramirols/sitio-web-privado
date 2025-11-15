import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const config = {
    api: {
        bodyParser: false, // Necesario para streaming FormData
    },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    try {
        const formData = await new Promise((resolve, reject) => {
            const busboy = require("busboy")({ headers: req.headers });

            let fileData = null;

            busboy.on("file", (fieldname, file, info) => {
                const { filename, mimeType } = info;
                let chunks = [];

                file.on("data", (chunk) => chunks.push(chunk));
                file.on("end", () => {
                    fileData = {
                        buffer: Buffer.concat(chunks),
                        filename,
                        mimeType,
                    };
                });
            });

            busboy.on("finish", () => resolve(fileData));
            busboy.on("error", reject);

            req.pipe(busboy);
        });

        const s3 = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            },
        });

        const fileKey = `${Date.now()}_${formData.filename}`;

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileKey,
            Body: formData.buffer,
            ContentType: formData.mimeType,
        });

        await s3.send(command);

        const publicUrl = `https://pub-${process.env.R2_PUBLIC_ID}.r2.dev/${fileKey}`;

        return res.status(200).json({ url: publicUrl });
    } catch (err) {
        console.error("❌ Error:", err);
        return res.status(500).json({ error: "Error subiendo a R2" });
    }
}