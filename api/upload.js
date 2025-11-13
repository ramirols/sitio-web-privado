import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const config = {
    runtime: "edge", // Usa el runtime Edge que sí soporta Vite
};

export default async function handler(req) {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Método no permitido" }), {
            status: 405,
        });
    }

    try {
        // Lee el body como FormData
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return new Response(JSON.stringify({ error: "No se envió ningún archivo" }), {
                status: 400,
            });
        }

        // Prepara el cliente S3 (R2)
        const s3 = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            },
        });

        // Genera un nombre único
        const fileKey = `${Date.now()}_${file.name}`;

        // Convierte el contenido a un ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Sube a R2
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileKey,
            Body: Buffer.from(arrayBuffer),
            ContentType: file.type,
        });

        await s3.send(command);

        // Genera la URL pública (ajústala según tu configuración R2)
        const fileUrl = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${fileKey}`;

        return new Response(JSON.stringify({ url: fileUrl }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Error al subir archivo:", err);
        return new Response(JSON.stringify({ error: "Error al subir archivo al R2" }), {
            status: 500,
        });
    }
}