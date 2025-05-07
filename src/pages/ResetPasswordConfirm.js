// ResetPasswordConfirm.js
import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, Link } from 'react-router-dom';

const ResetPasswordConfirm = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState([]);
    const [loading, setLoading] = useState(false);

    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const token = query.get('token');
    const userId = query.get('user');
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (password !== confirmPassword) {
            setError(['Las contraseñas no coinciden.']);
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/accounts/auth/password-reset-confirm/', {
                token,
                user_id: userId,
                new_password: password,
            });
            setMessage(response.data.message);
            setPassword('');
            setConfirmPassword('');
            setError([]);
        }catch (err) {
            setMessage('');
            console.error('Error en la solicitud:', err); // Mostrar el error en la consola
        
            const errors = err.response?.data || {}; // Si no hay respuesta, usa un objeto vacío
            let errorMessages = [];
        
            // Verifica si hay un error de tipo non_field_errors
            if (errors.non_field_errors) {
                errorMessages = errors.non_field_errors; // Solo usa el mensaje de non_field_errors
            } else {
                // Manejo de errores de campos específicos
                for (const key in errors) {
                    if (Array.isArray(errors[key])) {
                        errorMessages = errorMessages.concat(errors[key].map(msg => `${key}: ${msg}`));
                    } else {
                        errorMessages.push(`${key}: ${errors[key]}`);
                    }
                }
            }
        
            if (errorMessages.length === 0) {
                errorMessages.push('Ha ocurrido un error inesperado.'); // Mensaje genérico si no hay otros errores
            }
        
            setError(errorMessages); // Asegúrate de que `errorMessages` sea siempre un array
        }finally {
            setLoading(false); // Desactiva el estado de cargador
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-sky-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
                <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                    <div className="max-w-md mx-auto">
                        <div>
                            <h1 className="text-2xl font-semibold text-center">Restablecer Contraseña</h1>
                            <form onSubmit={handleSubmit}>
                                <div className="divide-y divide-gray-200">
                                    <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                        <div className="relative">
                                            <input
                                                type="password"
                                                placeholder="Nueva contraseña"
                                                id="password1"
                                                name="password1"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-rose-600"
                                            />
                                            <label htmlFor="password1" className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">Nueva contraseña</label>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                placeholder="Confirmar contraseña"
                                                id="password2"
                                                name="password2"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-rose-600"
                                            />
                                            <label htmlFor="password2" className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">Confirmar contraseña</label>
                                        </div>
                                        <div className='w-full'>
                                            {message && <p className='text-green-500 text-sm'>{message}</p>}
                                            {(error || []).map((errMsg, index) => (
                                                <p className='text-red-500 text-sm' key={index}>{errMsg}</p>
                                            ))}
                                        </div>
                                        <div className="w-full m-auto p-3 flex flex-row justify-center">
                                            <button
                                                type="submit"
                                                className={`bg-cyan-500 hover:bg-cyan-700 text-white p-2 rounded-md font-semibold ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <span className="flex justify-center items-center">
                                                        <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                        </svg>
                                                        Cargando...
                                                    </span>
                                                ) : (
                                                    'Restablecer Contraseña'
                                                )}
                                            </button>
                                        </div>
                                        <div className="mb-6 text-cyan-500 text-center">
                                            <Link to="/login" className="hover:underline">¿Deseas volver?</Link>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordConfirm;
