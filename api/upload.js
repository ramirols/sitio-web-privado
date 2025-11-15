import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import busboyInit from "busboy";

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    try {
        console.log("📥 Recibiendo archivo...");

        const formData = await new Promise((resolve, reject) => {
            const busboy = busboyInit({ headers: req.headers });
            let fileData = null;

            busboy.on("file", (fieldname, file, info) => {
                console.log("📦 Leyendo archivo con Busboy:", info);

                const { filename, mimeType } = info;
                let chunks = [];

                file.on("data", (chunk) => {
                    console.log("📥 Chunk recibido:", chunk.length);
                    chunks.push(chunk);
                });

                file.on("end", () => {
                    console.log("📤 Archivo recibido completo");
                    fileData = {
                        buffer: Buffer.concat(chunks),
                        filename,
                        mimeType,
                    };
                });
            });

            busboy.on("finish", () => {
                console.log("🏁 Busboy terminó");
                resolve(fileData);
            });

            busboy.on("error", (error) => {
                console.error("❌ Error en Busboy:", error);
                reject(error);
            });

            req.pipe(busboy);
        });

        if (!formData) {
            console.error("❌ Busboy no recibió archivo");
            return res.status(400).json({ error: "No se recibió archivo desde el frontend" });
        }

        console.log("📄 Archivo listo para subir:", formData.filename, formData.mimeType);

        const s3 = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            },
        });

        const fileKey = `${Date.now()}_${formData.filename}`;

        console.log("🚀 Subiendo a R2:", fileKey);

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileKey,
            Body: formData.buffer,
            ContentType: formData.mimeType,
        });

        await s3.send(command);

        console.log("✅ Subido correctamente a R2");

        const publicUrl = `https://pub-${process.env.R2_PUBLIC_ID}.r2.dev/${fileKey}`;

        return res.status(200).json({ url: publicUrl });

    } catch (err) {
        console.error("❌ Error subiendo a R2 (stack):", err?.stack || err);
        console.error("❌ Error subiendo a R2 (completo):", JSON.stringify(err, null, 2));

        return res.status(500).json({
            error: "Error subiendo a R2",
            details: err?.message || err.toString(),
        });
    }
}