import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const CategoryDetail = () => {
    const { id } = useParams();
    const [category, setCategory] = useState(null);
    const [media, setMedia] = useState([]);
    const [file, setFile] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) {
            navigate("/login");
            return;
        }
        setCurrentUser(storedUser);
        fetchCategory();
        fetchMedia();
    }, [id]);

    const fetchCategory = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .eq("id", id)
            .single();

        if (error) console.error("❌ Error cargando categoría:", error);
        else {
            setCategory(data);
        }
        setLoading(false);
    };

    const fetchMedia = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("media")
            .select("*")
            .eq("category_id", id)
            .order("created_at", { ascending: false });

        if (error) console.error("❌ Error cargando media:", error);
        else {
            setMedia(data || []);
        }
        setLoading(false);
    };

    const uploadToR2 = async () => {
        if (currentUser?.role !== "admin") {
            toast.error("No tienes permisos para subir archivos");
            return;
        }

        if (!file) {
            toast.error("Selecciona un archivo antes de subir");
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percent);
                }
            };

            const uploadPromise = new Promise((resolve, reject) => {
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
                        else reject("Error al subir archivo al R2");
                    }
                };
            });

            xhr.open("POST", "/api/upload");
            xhr.send(formData);

            const result = await uploadPromise;

            const fileUrl = result.url;
            const fileType = file.type;
            const extension = file.name.split(".").pop().toLowerCase();

            const { error } = await supabase.from("media").insert({
                category_id: id,
                file_url: fileUrl,
                file_type: fileType,
                extension: extension,
            });

            if (error) throw error;

            toast.success("Archivo subido correctamente");
            setFile(null);
            fetchMedia();
        } catch (err) {
            console.error("❌ Error:", err);
            toast.error("Error al subir el archivo");
        }

        setLoading(false);
        setUploadProgress(0);
    };

    const deleteMedia = async (mid) => {
        setLoading(true);
        const { error } = await supabase.from("media").delete().eq("id", mid);
        if (!error) {
            toast.success("Archivo eliminado");
            fetchMedia();
        } else {
            console.error("❌ Error eliminando media:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (media.length > 0) {
            media.forEach((m) => {
                if (m.file_type.startsWith("image")) {
                    const img = new Image();
                    img.src = m.file_url;
                    img.onload = () => toast.success("Imagen cargada correctamente");
                    img.onerror = () => toast.error("Error cargando imagen");
                }
            });
        }
    }, [media]);

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="container">
                <button
                    onClick={() => navigate("/panel")}
                    className="bg-gray-700 text-white px-3 py-1 rounded mb-4 cursor-pointer"
                >
                    ← Volver al Panel
                </button>

                {category && (
                    <h1 className="text-2xl font-bold mb-4">{category.name}</h1>
                )}

                {/* Solo el admin puede subir archivos */}
                {currentUser?.role === "admin" && (
                    <div className="flex flex-col gap-2 mb-5 w-full">
                        <div className="flex gap-2">
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="border p-2 rounded flex-1 cursor-pointer"
                            />

                            <button
                                onClick={uploadToR2}
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 cursor-pointer flex items-center gap-2"
                            >
                                {loading && <Loader2 className="animate-spin" />}
                                {loading ? "Subiendo..." : "Subir"}
                            </button>
                        </div>

                        {loading && (
                            <div className="w-full h-3 bg-gray-300 rounded overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 transition-all"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        )}

                        {loading && (
                            <p className="text-sm font-medium text-gray-700 text-center">
                                {uploadProgress}% completado
                            </p>
                        )}
                    </div>
                )}

                {/* Mostrar archivos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {media.map((m) => (
                        <div
                            key={m.id}
                            className="bg-white p-2 rounded shadow relative overflow-hidden cursor-pointer"
                            onClick={() => setSelectedMedia(m)}
                        >
                            {m.file_type.startsWith("image") && (
                                <img src={m.file_url} className="w-full h-50 object-cover rounded" />
                            )}

                            {m.file_type.startsWith("video") && (
                                <video src={m.file_url} className="w-full h-50 object-cover rounded" muted />
                            )}

                            {m.file_type.startsWith("audio") && (
                                <audio src={m.file_url} controls className="w-full" />
                            )}

                            {!m.file_type.startsWith("image") &&
                                !m.file_type.startsWith("video") &&
                                !m.file_type.startsWith("audio") && (
                                    <div className="p-4 text-center text-sm bg-gray-200 rounded">
                                        <a href={m.file_url} target="_blank" className="underline">
                                            Descargar archivo ({m.extension})
                                        </a>
                                    </div>
                                )}

                            {currentUser?.role === "admin" && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteMedia(m.id);
                                    }}
                                    className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded cursor-pointer"
                                >
                                    X
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal de vista ampliada */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedMedia(null)}
                >
                    <div
                        className="relative bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Botón de cierre */}
                        <button
                            onClick={() => setSelectedMedia(null)}
                            className="absolute top-2 right-2 bg-gray-700 text-white rounded-full px-3 py-1 text-sm hover:bg-gray-900 cursor-pointer z-50"
                        >
                            ✕
                        </button>

                        {selectedMedia.file_type.startsWith("image") && (
                            <img src={selectedMedia.file_url} className="w-full h-auto max-h-[85vh] object-contain" />
                        )}

                        {selectedMedia.file_type.startsWith("video") && (
                            <video src={selectedMedia.file_url} controls autoPlay className="w-full h-auto max-h-[85vh] object-contain" />
                        )}

                        {selectedMedia.file_type.startsWith("audio") && (
                            <audio src={selectedMedia.file_url} controls className="w-full" />
                        )}

                        {!selectedMedia.file_type.startsWith("image") &&
                            !selectedMedia.file_type.startsWith("video") &&
                            !selectedMedia.file_type.startsWith("audio") && (
                                <div className="p-6 text-center">
                                    <p className="mb-3">Este archivo no se puede previsualizar.</p>
                                    <a href={selectedMedia.file_url} target="_blank" className="underline">
                                        Descargar archivo ({selectedMedia.extension})
                                    </a>
                                </div>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryDetail;