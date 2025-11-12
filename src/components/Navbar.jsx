import { div } from "framer-motion/client";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <div className="bg-blue-600 p-3">
            <nav className="container text-white flex justify-between items-center">
                <h1 className="font-semibold">Panel de administración</h1>
                <button
                    onClick={logout}
                    className="bg-white text-blue-600 px-3 py-1 rounded-md font-medium cursor-pointer"
                >
                    Cerrar sesión
                </button>
            </nav>
        </div>
    );
}

export default Navbar;