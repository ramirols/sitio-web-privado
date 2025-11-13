import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const config = {
    runtime: "edge", // ✅ Necesario para Vercel Edge Functions
};

export default async function handler(req) {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Método no permitido" }), {
            status: 405,
        });
    }

    try {
        // 🧾 1. Leer el archivo del FormData
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return new Response(JSON.stringify({ error: "No se envió ningún archivo" }), {
                status: 400,
            });
        }

        // ⚙️ 2. Configurar cliente de Cloudflare R2
        const s3 = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            },
        });

        // 🧩 3. Generar un nombre único para el archivo
        const fileKey = `${Date.now()}_${file.name}`;

        // 🧠 4. Convertir el archivo a buffer
        const arrayBuffer = await file.arrayBuffer();

        // 🚀 5. Subir el archivo al bucket (sin prefijo "media/")
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME, // ejemplo: "media"
            Key: fileKey, // ✅ sin "media/"
            Body: Buffer.from(arrayBuffer),
            ContentType: file.type,
        });

        await s3.send(command);

        // 🌍 6. Generar URL pública (r2.dev)
        const publicBase = "https://pub-08efed47231c42f0a395fada7f0cdf5c.r2.dev"; // ⚠️ pon aquí tu URL pública real
        const fileUrl = `${publicBase}/${fileKey}`;

        ("✅ Archivo subido correctamente:", fileUrl);

        // 📤 7. Responder al frontend
        return new Response(JSON.stringify({ url: fileUrl }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("❌ Error al subir archivo:", err);
        return new Response(JSON.stringify({ error: "Error al subir archivo al R2" }), {
            status: 500,
        });
    }
}