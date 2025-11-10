import { motion } from "framer-motion"

const Error404 = () => {
    return (
        <div className="min-h-150 bg-linear-to-b flex items-center justify-center">
            <div className="text-center">
                <motion.h1
                    className="text-9xl font-bold text-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    404
                </motion.h1>

                <motion.p
                    className="text-2xl mt-4 text-black"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    ¡Ups! Página no encontrada
                </motion.p>

                <motion.a
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ transform: 'translateY(0)', opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    href="/"
                    className="inline-block mt-8 px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/80 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Volver al inicio
                </motion.a>
            </div>
        </div>
    )
}

export default Error404