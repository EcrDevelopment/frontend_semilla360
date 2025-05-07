import React, { useState, useEffect } from "react";
import { Button, Checkbox, Form, Grid, Input, theme, Typography, Avatar, Spin } from "antd";
import { LockOutlined, UserOutlined,LoadingOutlined } from "@ant-design/icons";
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const { useToken } = theme;
const { useBreakpoint } = Grid;
const { Text, Title } = Typography;

const Login = () => {
    const { token } = useToken();
    const screens = useBreakpoint();
    const { login, checkAuth } = useAuth();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
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

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
          const result = await login(values.username, values.password);
          if (result.success) {
            navigate('/');
          } else {
            setError(result.message); // Mostrar el mensaje de error específico
          }
        } catch (error) {
          console.error('Error al iniciar sesión:', error);
          setError('Ocurrió un error inesperado. Intenta nuevamente más tarde.');
        } finally {
          setLoading(false);
        }
      };
      

    const styles = {
        container: {
            margin: "0 auto",
            padding: screens.md ? `${token.paddingXL}px` : `${token.sizeXXL}px ${token.padding}px`,
            width: "380px",
        },
        footer: {
            marginTop: token.marginLG,
            textAlign: "center",
            width: "100%",
        },
        forgotPassword: {
            float: "right",
        },
        header: {
            marginBottom: token.marginXL,
        },
        section: {
            alignItems: "center",
            backgroundColor: token.colorBgContainer,
            display: "flex",
            height: screens.sm ? "100vh" : "auto",
            padding: screens.md ? `${token.sizeXXL}px 0px` : "0px",
        },
        text: {
            color: token.colorTextSecondary,
        },
        title: {
            fontSize: screens.md ? token.fontSizeHeading2 : token.fontSizeHeading3,
        },
    };

    return (
        <section style={styles.section}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <Avatar src={"/Logo_Semilla.png"} size={60} shape="square" />
                    <Title style={styles.title}>Iniciar Sesión</Title>
                    <Text style={styles.text}>
                        Bienvenido, por favor ingresa tus datos de inicio de sesión.
                    </Text>
                </div>
                <Form
                    form={form}                    
                    initialValues={{
                        remember: true,
                    }}
                    onFinish={handleSubmit}
                    layout="vertical"
                    requiredMark="optional"
                >
                    <Form.Item
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: "Por favor ingresa tu nombre de usuario!",
                            },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Nombre de usuario"
                            value={credentials.username}
                            onChange={handleChange}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: "Por favor ingresa tu contraseña!",
                            },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            type="password"
                            placeholder="Contraseña"
                            value={credentials.password}
                            onChange={handleChange}
                        />
                    </Form.Item>
                    {error && (
                        <div className="text-red-500 my-3 text-xs">{error}</div>
                    )}
                    <Form.Item>
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox>Recordarme</Checkbox>
                        </Form.Item>
                        <Link to="/reset-password" className="hover:underline">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </Form.Item>
                    <Form.Item style={{ marginBottom: "0px" }}>
                        <Button
                            block
                            type="primary"
                            htmlType="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex justify-center items-center">
                                   <Spin indicator={<LoadingOutlined spin />} size="small" />
                                    Cargando...
                                </span>
                            ) : (
                                "Ingresar"
                            )}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </section>
    );
};

export default Login;
