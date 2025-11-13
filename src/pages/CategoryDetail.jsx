import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

const CategoryDetail = () => {
    const { id } = useParams();
    const [category, setCategory] = useState(null);
    const [media, setMedia] = useState([]);
    const [file, setFile] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

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
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .eq("id", id)
            .single();

        if (error) console.error(error);
        else setCategory(data);
    };

    const fetchMedia = async () => {
        const { data, error } = await supabase
            .from("media")
            .select("*")
            .eq("category_id", id)
            .order("created_at", { ascending: false });

        if (error) console.error(error);
        else setMedia(data || []);
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

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(import.meta.env.VITE_R2_UPLOAD_URL, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Error al subir archivo al R2");

            const result = await res.json();
            const fileUrl = result.url;
            const fileType = file.type.startsWith("image") ? "image" : "video";

            const { error } = await supabase.from("media").insert({
                category_id: id,
                file_url: fileUrl,
                file_type: fileType,
            });

            if (error) throw error;

            toast.success("Archivo subido correctamente");
            setFile(null);
            fetchMedia();
        } catch (err) {
            console.error(err);
            toast.error("Error al subir el archivo");
        }
    };

    const deleteMedia = async (mid) => {
        const { error } = await supabase.from("media").delete().eq("id", mid);
        if (!error) {
            toast.success("Archivo eliminado");
            fetchMedia();
        }
    };

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
                    <div className="flex gap-2 mb-5">
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="border p-2 rounded flex-1 cursor-pointer"
                        />
                        <button
                            onClick={uploadToR2}
                            className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 cursor-pointer"
                        >
                            Subir
                        </button>
                    </div>
                )}

                {/* Mostrar archivos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {media.map((m) => (
                        <div
                            key={m.id}
                            className="bg-white p-2 rounded shadow relative overflow-hidden"
                        >
                            {m.file_type === "image" ? (
                                <img
                                    src={m.file_url}
                                    alt="media"
                                    className="w-full h-32 object-cover rounded"
                                />
                            ) : (
                                <video
                                    src={m.file_url}
                                    controls
                                    className="w-full h-32 object-cover rounded"
                                />
                            )}

                            {/* Solo el admin puede eliminar */}
                            {currentUser?.role === "admin" && (
                                <button
                                    onClick={() => deleteMedia(m.id)}
                                    className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded cursor-pointer"
                                >
                                    X
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CategoryDetail;