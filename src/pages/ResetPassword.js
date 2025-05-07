// ResetPasswordRequest.js
import React, { useState } from 'react';
import axiosInstance from '../axiosConfig';
import { Link } from 'react-router-dom'

const ResetPasswordRequest = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axiosInstance.post('/accounts/auth/password-reset/', { email });
            setEmail('');
            setMessage(response.data.message);
            setError('');
        } catch (err) {
            setError(err.response?.data?.email || "Error al enviar el correo de restablecimiento.");
            setMessage('');
        }finally {
            setLoading(false); // Desactiva el estado de cargador
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-sky-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl">
                </div>
                <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                    <div className="max-w-md mx-auto">
                        <div>
                            <h1 className="text-2xl font-semibold text-centeer">Recuperar contraseña</h1>
                            <form onSubmit={handleSubmit}>
                                <div className="divide-y divide-gray-200">
                                    <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                        <div className="relative">
                                            <input
                                                type="email"
                                                placeholder="Correo electrónico"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                name="email"
                                                id="email"
                                                required
                                                className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:borer-rose-600"
                                            />
                                            <label htmlFor="email" className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">Correo electrónico</label>
                                        </div >
                                        <div className='w-full'>
                                            {error && <p className='text-red-500 text-sm'>{error}</p>} {/* Muestra el mensaje de error si existe */}
                                            {message && <p className='text-green-500'>{message}</p>}
                                        </div>
                                        <div className="w-full m-auto p-3 flex flex-row justify-center">
                                            <button
                                                type="submit"
                                                className={`bg-cyan-500 hover:bg-cyan-700 text-white p-2 rounded-md font-semibold ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={loading} // Deshabilita el botón si está cargando
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
                                                    'Enviar'
                                                )}
                                            </button>

                                        </div>
                                        <div className="mb-6 text-cyan-500 text-center">
                                            <Link to="/login" className="hover:underline">¿Deseas Logearte?</Link>
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

export default ResetPasswordRequest;
