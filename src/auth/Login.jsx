import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import toast from "react-hot-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const schema = z.object({
      username: z.string().min(1, "El usuario es obligatorio"),
      password: z.string().min(1, "La contraseña es obligatoria"),
    });

    try {
      schema.parse({ username, password });
    } catch (err) {
      toast.error(err.errors[0].message);
      return;
    }

    // Normalizamos el nombre de usuario a minúsculas
    const normalizedUsername = username.trim().toLowerCase();

    // Buscamos el usuario en la base de datos, también en minúsculas
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .ilike("username", normalizedUsername) // 👈 case-insensitive search
      .eq("password", password)
      .single();

    if (error || !data) {
      setUsernameError("Usuario o contraseña incorrectos");
      toast.error("Usuario o contraseña incorrectos");
      return;
    }

    // Guardar datos en localStorage
    localStorage.setItem("user", JSON.stringify(data));
    toast.success(`Bienvenido, ${data.name}`);

    // Redirigir según el rol
    if (data.role === "admin") {
      navigate("/panel");
    } else {
      navigate("/panel");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-2xl shadow-md w-80"
      >
        <h2 className="text-2xl font-semibold text-center mb-4">
          Iniciar sesión
        </h2>

        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {usernameError && (
          <p className="text-red-500 text-sm mt-2">{usernameError}</p>
        )}

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {passwordError && (
          <p className="text-red-500 text-sm mt-2">{passwordError}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
};

export default Login;