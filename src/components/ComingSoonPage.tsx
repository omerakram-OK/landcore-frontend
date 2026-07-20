import { Typography } from "antd";

export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4}>{title}</Typography.Title>
      <Typography.Text type="secondary">This module's UI is being built out.</Typography.Text>
    </div>
  );
}
