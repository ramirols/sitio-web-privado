// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// const Inicio = () => {
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const storedUser = JSON.parse(localStorage.getItem("user"));
//     if (!storedUser) {
//       navigate("/login");
//     } else {
//       setUser(storedUser);
//     }
//   }, [navigate]);

//   const handleLogout = () => {
//     localStorage.removeItem("user");
//     navigate("/login");
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center">
//       {user && (
//         <>
//           <h1 className="text-3xl font-bold mb-4">
//             Bienvenido, {user.name}
//           </h1>
//           <button
//             onClick={() => navigate("/panel")}
//             className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mb-3 cursor-pointer"
//           >
//             Ir al Panel de Administración
//           </button>
//           <button
//             onClick={handleLogout}
//             className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 cursor-pointer"
//           >
//             Cerrar sesión
//           </button>
//         </>
//       )}
//     </div>
//   );
// };

// export default Inicio;