import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const AdminPanel = () => {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState("");
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [modal, setModal] = useState({ show: false, type: "", userId: null, role: "" });
    const navigate = useNavigate();

    // 👇 NUEVO: separar categoría para crear usuarios
    const [newUserCategory, setNewUserCategory] = useState("");
    const [newUser, setNewUser] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("user");

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) {
            navigate("/login");
            return;
        }
        setCurrentUser(storedUser);
        fetchCategories();
        if (storedUser.role === "admin") fetchUsers();
    }, []);

    // --- Categorías ---
    const fetchCategories = async () => {
        const { data } = await supabase.from("categories").select("*");
        setCategories(data || []);
    };

    const addCategory = async (e) => {
        e.preventDefault();
        if (currentUser?.role !== "admin") {
            toast.error("No tienes permisos para añadir categorías");
            return;
        }
        if (!newCategory.trim()) return;

        const { error } = await supabase.from("categories").insert({ name: newCategory });
        if (!error) {
            toast.success("Categoría creada");
            setNewCategory("");
            fetchCategories();
        }
    };

    const deleteCategory = async (id) => {
        if (currentUser?.role !== "admin") {
            toast.error("No tienes permisos para eliminar categorías");
            return;
        }
        setModal({ show: true, type: "deleteCategory", userId: id });
    };

    // --- Usuarios ---
    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from("users")
            .select(`
        id,
        name,
        username,
        role,
        category_id,
        categories ( name )
      `)
            .order("id", { ascending: true });

        if (!error) setUsers(data);
    };

    const addUser = async (e) => {
        e.preventDefault();

        if (currentUser?.role !== "admin") {
            toast.error("No tienes permisos para añadir usuarios");
            return;
        }

        if (!newUser.trim() || !newPassword.trim()) {
            toast.error("Completa todos los campos");
            return;
        }

        const { error } = await supabase.from("users").insert([
            {
                name: newUser,
                username: newUser,
                password: newPassword,
                role: newRole,
                category_id: newUserCategory ? parseInt(newUserCategory) : null,
            },
        ]);

        if (error) {
            toast.error("Error al crear el usuario");
        } else {
            toast.success("Usuario creado con éxito");
            setNewUser("");
            setNewPassword("");
            setNewRole("user");
            setNewUserCategory("");
            fetchUsers();
        }
    };

    const handleCategoryChange = async (userId, newCategoryId) => {
        if (currentUser?.role !== "admin") {
            toast.error("No tienes permisos para cambiar la categoría");
            return;
        }

        const { error } = await supabase
            .from("users")
            .update({
                category_id: newCategoryId ? parseInt(newCategoryId) : null,
            })
            .eq("id", userId);

        if (error) {
            toast.error("Error al actualizar la categoría");
        } else {
            toast.success("Categoría actualizada");
            fetchUsers();
        }
    };

    const confirmAction = async () => {
        const { type, userId, role } = modal;

        if (type === "deleteUser") {
            const { error } = await supabase.from("users").delete().eq("id", userId);
            if (!error) {
                toast.success("Usuario eliminado");
                fetchUsers();
            }
        }

        if (type === "changeRole") {
            const { error } = await supabase.from("users").update({ role }).eq("id", userId);
            if (!error) {
                toast.success("Rol actualizado correctamente");
                fetchUsers();
            }
        }

        if (type === "deleteCategory") {
            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", userId);

            if (error) {
                toast.error("No se pudo eliminar la categoría");
                return;
            }

            toast.success("Categoría eliminada");
            fetchCategories();
        }

        setModal({ show: false, type: "", userId: null });
    };

    const filteredUsers = users.filter(
        (u) =>
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="max-w-5xl mx-auto p-6">
                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-4 text-gray-800">Categorías</h2>

                    {/* Si el usuario es admin, puede agregar */}
                    {currentUser?.role === "admin" && (
                        <form onSubmit={addCategory} className="flex gap-2 mb-4">
                            <input
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                className="flex-1 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Nueva categoría"
                            />
                            <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer">
                                Añadir
                            </button>
                        </form>
                    )}

                    {/* FILTRO DE CATEGORÍAS SEGÚN ROL */}
                    <ul className="space-y-2">
                        {(() => {
                            if (currentUser?.role === "admin") {
                                // Admin → ver todas las categorías
                                return categories.map((cat) => (
                                    <li
                                        key={cat.id}
                                        className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
                                    >
                                        <span className="font-medium text-gray-700">{cat.name}</span>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => navigate(`/panel/categoria/${cat.id}`)}
                                                className="text-blue-600 hover:underline cursor-pointer"
                                            >
                                                Ver
                                            </button>
                                            <button
                                                onClick={() => deleteCategory(cat.id)}
                                                className="text-red-500 hover:underline cursor-pointer"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </li>
                                ));
                            } else {
                                // Usuario → ver solo su categoría asignada
                                const userCategory = categories.find(
                                    (cat) => cat.id === currentUser?.category_id
                                );
                                if (userCategory) {
                                    return (
                                        <li className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                                            <span className="font-medium text-gray-700">
                                                {userCategory.name}
                                            </span>
                                            <button
                                                onClick={() => navigate(`/panel/categoria/${userCategory.id}`)}
                                                className="text-blue-600 hover:underline cursor-pointer"
                                            >
                                                Ver
                                            </button>
                                        </li>
                                    );
                                } else {
                                    return (
                                        <li className="bg-gray-100 p-4 rounded-lg shadow text-gray-600 text-center italic">
                                            Sin seleccionar categoría
                                        </li>
                                    );
                                }
                            }
                        })()}
                    </ul>
                </section>

                {/* USUARIOS (SOLO ADMIN) */}
                {currentUser?.role === "admin" && (
                    <section className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-2xl font-bold mb-2 text-gray-800">Gestión de Usuarios</h2>
                        <p className="text-sm text-gray-500 mb-4">Visible solo para administradores</p>

                        {/* BUSCADOR */}
                        <div className="flex justify-between mb-4">
                            <input
                                type="text"
                                placeholder="Buscar usuario..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* AÑADIR USUARIO */}
                        <form onSubmit={addUser} className="flex gap-2 mb-4 flex-wrap">
                            <input
                                value={newUser}
                                onChange={(e) => setNewUser(e.target.value)}
                                className="flex-1 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Nuevo usuario"
                            />

                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="flex-1 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Contraseña"
                            />

                            <select
                                value={newUserCategory}
                                onChange={(e) => setNewUserCategory(e.target.value)}
                                className="flex-1 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="">Seleccionar categoría</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                className="flex-1 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="user">Usuario</option>
                                <option value="admin">Administrador</option>
                            </select>

                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                            >
                                Añadir
                            </button>
                        </form>

                        {/* TABLA DE USUARIOS */}
                        <div className="overflow-x-auto">
                            <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-3 font-semibold text-gray-600">ID</th>
                                        <th className="p-3 font-semibold text-gray-600">Usuario</th>
                                        <th className="p-3 font-semibold text-gray-600">Rol</th>
                                        <th className="p-3 font-semibold text-gray-600">Categoría</th>
                                        <th className="p-3 font-semibold text-gray-600 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="border-t hover:bg-gray-50 transition-colors">
                                            <td className="p-3">{u.id}</td>
                                            <td className="p-3">{u.username}</td>

                                            {/* Rol */}
                                            <td className="p-3">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) =>
                                                        setModal({
                                                            show: true,
                                                            type: "changeRole",
                                                            userId: u.id,
                                                            role: e.target.value,
                                                        })
                                                    }
                                                    className="border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer"
                                                >
                                                    <option value="user">Usuario</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                            </td>

                                            {/* Categoría */}
                                            <td className="p-3">
                                                <select
                                                    value={u.category_id || ""}
                                                    onChange={(e) => handleCategoryChange(u.id, e.target.value)}
                                                    className="border border-gray-300 p-1 rounded-lg cursor-pointer"
                                                >
                                                    <option value="">Sin seleccionar categoría</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            {/* Acciones */}
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={() =>
                                                        setModal({ show: true, type: "deleteUser", userId: u.id })
                                                    }
                                                    className="text-red-500 hover:underline cursor-pointer"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>

            {/* MODAL DE CONFIRMACIÓN */}
            {modal.show && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800">
                            {modal.type === "deleteUser" && "¿Eliminar usuario?"}
                            {modal.type === "deleteCategory" && "¿Eliminar categoría?"}
                            {modal.type === "changeRole" && "¿Confirmar cambio de rol?"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-5">
                            {modal.type === "changeRole"
                                ? `El rol será cambiado a "${modal.role}".`
                                : "Esta acción no se puede deshacer."}
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setModal({ show: false, type: "", userId: null })}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAction}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition cursor-pointer"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;