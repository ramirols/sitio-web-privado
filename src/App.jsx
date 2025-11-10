import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Inicio from './pages/Inicio'
import Login from './auth/Login'
import Error404 from './error404/Error484'

import { Toaster } from 'react-hot-toast'

import './App.css'

function App() {
  return (
    <>
      <Router>
        <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 5000 }} />
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />

          <Route path="*" element={<Error404 />} />
        </Routes>
      </Router>
    </>
  )
}

export default App