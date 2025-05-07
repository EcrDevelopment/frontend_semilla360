import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const { login, checkAuth } = useAuth();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const verifyAuth = async () => {
            const isAuth = await checkAuth();
            if (isAuth) {
                navigate('/');
            }
        };
        verifyAuth();
    }, [checkAuth, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials({ ...credentials, [name]: value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const success = await login(credentials.username, credentials.password);
            if (success) {
                navigate('/');
            } else {
                setError('Credenciales incorrectas. Por favor, intenta nuevamente.');
            }
        } catch (error) {
            console.error('Error al iniciar sesión', error);
            setError('Ocurrió un error: '+ error);
        } finally {
            setLoading(false);
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
                            <h1 className="text-2xl font-semibold text-center">Iniciar Sesión</h1>                            
                            <form onSubmit={handleSubmit}>
                                <div className="divide-y divide-gray-200">
                                    <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                        <div className="relative">
                                            <input
                                                type="input"
                                                name="username"
                                                id="username"
                                                placeholder="Nombre de usuario"
                                                value={credentials.username}
                                                onChange={handleChange}
                                                className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-rose-600"
                                                required
                                            /> 
                                            <label htmlFor="username" className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">Nombre de usuario</label>                                       
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                name="password"
                                                id="password"
                                                placeholder="Contraseña"
                                                value={credentials.password}
                                                onChange={handleChange}
                                                className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-rose-600"
                                                required
                                            />
                                            <label htmlFor="password" className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">Contraseña</label>                                      
                                        </div>
                                        <div className='w-full'>
                                            {error && <div className="text-red-500 my-3 text-xs">{error}</div>}
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
                                                    'Iniciar Sesión'
                                                )}
                                            </button>
                                        </div>
                                        <div className="mb-6 text-cyan-500 text-center">
                                            <Link to="/reset-password" className="hover:underline">¿Olvidaste tu contraseña?</Link>
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

export default Login;

