import { useState } from "react";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: Location } | null)?.from;

  const onFinish = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const claims = await login(values.email, values.password);
      const fallback = claims.role === "SuperMan" ? "/superman" : "/";
      navigate(from?.pathname ?? fallback, { replace: true });
    } catch {
      message.error("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f2f5",
      }}
    >
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ textAlign: "center", marginBottom: 4 }}>
          Landcore
        </Typography.Title>
        <Typography.Text
          type="secondary"
          style={{ display: "block", textAlign: "center", marginBottom: 24 }}
        >
          Sign in to your account
        </Typography.Text>
        <Form<LoginFormValues> layout="vertical" onFinish={onFinish} disabled={submitting}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Email is required" }]}
          >
            <Input prefix={<UserOutlined />} autoComplete="username" placeholder="you@example.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
