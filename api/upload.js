import AWS from "aws-sdk";
import multer from "multer";
import { promisify } from "util";
import stream from "stream";

// Configuración del almacenamiento en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });
const uploadMiddleware = upload.single("file");

// Convertir callback en promesa
const runMiddleware = promisify(uploadMiddleware);

export const config = {
    api: {
        bodyParser: false, // Desactivamos bodyParser para manejar FormData manualmente
    },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    try {
        // Esperamos el archivo desde el FormData
        await runMiddleware(req, res);

        const file = req.file;
        if (!file) return res.status(400).json({ error: "No se envió ningún archivo" });

        // Configurar cliente S3 (R2)
        const s3 = new AWS.S3({
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            region: "auto",
            signatureVersion: "v4",
        });

        const fileKey = `${Date.now()}_${file.originalname}`;

        // Subir archivo a R2
        await s3.putObject({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: "public-read",
        }).promise();

        const fileUrl = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${fileKey}`;


        res.status(200).json({ url: fileUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al subir el archivo" });
    }
}