// ResetPasswordConfirm.js
import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import axiosInstance from "../axiosConfig";
import {
  Button,
  Form,
  Grid,
  Input,
  theme,
  Typography,
  Avatar,
  Spin,
} from "antd";
import { LockOutlined, LoadingOutlined } from "@ant-design/icons";

const { useToken } = theme;
const { useBreakpoint } = Grid;
const { Text, Title } = Typography;

const ResetPasswordConfirm = () => {
  const { token } = useToken();
  const screens = useBreakpoint();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState([]);
  const [message, setMessage] = useState("");

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const resetToken = query.get("token");
  const userId = query.get("user");

  const handleSubmit = async (values) => {
    setLoading(true);
    setError([]);
    setMessage("");

    if (values.password !== values.confirmPassword) {
      setError(["Las contraseñas no coinciden."]);
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post(
        "/accounts/auth/password-reset-confirm/",
        {
          token: resetToken,
          user_id: userId,
          new_password: values.password,
        }
      );

      setMessage(response.data.message);
      form.resetFields();
    } catch (err) {
      console.error("Error en la solicitud:", err);
      const errors = err.response?.data || {};
      let errorMessages = [];

      if (errors.non_field_errors) {
        errorMessages = errors.non_field_errors;
      } else {
        for (const key in errors) {
          if (Array.isArray(errors[key])) {
            errorMessages = errorMessages.concat(
              errors[key].map((msg) => `${key}: ${msg}`)
            );
          } else {
            errorMessages.push(`${key}: ${errors[key]}`);
          }
        }
      }

      if (errorMessages.length === 0) {
        errorMessages.push("Ha ocurrido un error inesperado.");
      }

      setError(errorMessages);
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
          <Avatar src={"/logo_icono.png"} size={60} shape="square" />
          <Title style={styles.title}>Restablecer contraseña</Title>
          <Text style={styles.text}>
            Ingresa tu nueva contraseña para tu cuenta.
          </Text>
        </div>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          requiredMark="optional"
        >
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Por favor ingresa tu nueva contraseña!" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nueva contraseña"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: "Por favor confirma tu contraseña!" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirmar contraseña"
            />
          </Form.Item>

          {message && (
            <div className="text-green-600 my-3 text-xs">{message}</div>
          )}
          {error.length > 0 &&
            error.map((errMsg, index) => (
              <div key={index} className="text-red-500 my-1 text-xs">
                {errMsg}
              </div>
            ))}

          <Form.Item style={{ marginBottom: "0px" }}>
            <Button block type="primary" htmlType="submit" disabled={loading}>
              {loading ? (
                <span className="flex justify-center items-center">
                  <Spin indicator={<LoadingOutlined spin />} size="small" />
                  Guardando...
                </span>
              ) : (
                "Restablecer contraseña"
              )}
            </Button>
          </Form.Item>
        </Form>

        <div style={styles.footer}>
          <Text style={styles.text}>
            ¿Deseas volver?{" "}
            <Link to="/login" className="hover:underline">
              Inicia sesión
            </Link>
          </Text>
        </div>
      </div>
    </section>
  );
};

export default ResetPasswordConfirm;
