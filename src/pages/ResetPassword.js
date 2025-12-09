// ResetPasswordRequest.js
import React, { useState } from "react";
import { Button, Form, Grid, Input, theme, Typography, Avatar, Spin } from "antd";
import { MailOutlined, LoadingOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import axiosInstance from "../axiosConfig";

const { useToken } = theme;
const { useBreakpoint } = Grid;
const { Text, Title } = Typography;

const ResetPasswordRequest = () => {
  const { token } = useToken();
  const screens = useBreakpoint();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (values) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await axiosInstance.post("/accounts/auth/password-reset/", {
        email: values.email,
      });
      setMessage(response.data.message);
    } catch (err) {
      setError(
        err.response?.data?.email ||
          "Error al enviar el correo de restablecimiento."
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      margin: "0 auto",
      padding: screens.md
        ? `${token.paddingXL}px`
        : `${token.sizeXXL}px ${token.padding}px`,
      width: "380px",
    },
    footer: {
      marginTop: token.marginLG,
      textAlign: "center",
      width: "100%",
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
          <Avatar src={"/Logo_Semilla_Icono.png"} size={60} shape="square" />
          <Title style={styles.title}>Recuperar contraseña</Title>
          <Text style={styles.text}>
            Ingresa tu correo y te enviaremos un enlace para restablecer tu
            contraseña.
          </Text>
        </div>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          requiredMark="optional"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Por favor ingresa tu correo!" },
              { type: "email", message: "El correo no es válido!" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Correo electrónico" />
          </Form.Item>

          {error && <div className="text-red-500 my-3 text-xs">{error}</div>}
          {message && (
            <div className="text-green-600 my-3 text-xs">{message}</div>
          )}

          <Form.Item style={{ marginBottom: "0px" }}>
            <Button block type="primary" htmlType="submit" disabled={loading}>
              {loading ? (
                <span className="flex justify-center items-center">
                  <Spin indicator={<LoadingOutlined spin />} size="small" />
                  Enviando...
                </span>
              ) : (
                "Enviar enlace"
              )}
            </Button>
          </Form.Item>
        </Form>

        <div style={styles.footer}>
          <Text style={styles.text}>
            ¿Ya recordaste tu contraseña?{" "}
            <Link to="/login" className="hover:underline">
              Inicia sesión
            </Link>
          </Text>
        </div>
      </div>
    </section>
  );
};

export default ResetPasswordRequest;
