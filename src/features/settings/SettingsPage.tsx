import { useState } from "react";
import { Alert, Avatar, Button, Card, Popconfirm, Space, Typography, Upload, message } from "antd";
import type { UploadFile } from "antd";
import { BuildOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBranding, removeLogo, uploadLogo } from "../../api/branding";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/errors";

const BRANDING_QUERY_KEY = ["branding"] as const;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { claims } = useAuth();
  const isAdmin = claims?.role === "Admin";
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: BRANDING_QUERY_KEY,
    queryFn: getBranding,
  });

  const invalidateBranding = () => queryClient.invalidateQueries({ queryKey: BRANDING_QUERY_KEY });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadLogo(file),
    onSuccess: () => {
      message.success("Logo updated — every Employee will now see it in their sidebar too.");
      setLogoFile(null);
      void invalidateBranding();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to upload the logo.")),
  });

  const removeMutation = useMutation({
    mutationFn: removeLogo,
    onSuccess: () => {
      message.success("Logo removed — the default Landcore branding will show instead.");
      void invalidateBranding();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to remove the logo.")),
  });

  if (!isAdmin) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Admin access required"
        description="Only an Admin can manage the society logo shown across the panel."
      />
    );
  }

  return (
    <div>
      <Typography.Title level={4}>Settings</Typography.Title>

      <Card title="Society Logo" style={{ maxWidth: 560 }}>
        <Typography.Paragraph type="secondary">
          Upload your society's logo to replace the default Landcore branding shown in the sidebar.
          Every Employee in your account will see the same logo. PNG, JPEG, WEBP, or SVG, up to 1 MB
          — a square or wide image around 200&times;60px works best.
        </Typography.Paragraph>

        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
          {data?.logoDataUrl ? (
            <img
              src={data.logoDataUrl}
              alt="Current logo"
              style={{ maxHeight: 64, maxWidth: 240, objectFit: "contain", background: "#F4F6F9", padding: 8, borderRadius: 8 }}
            />
          ) : (
            <Avatar shape="square" size={64} icon={<BuildOutlined />} style={{ background: "#0B1F3A" }} />
          )}
          <Typography.Text type="secondary">
            {isLoading ? "Loading current logo..." : data?.logoDataUrl ? "Current logo" : "No logo set — showing default Landcore branding"}
          </Typography.Text>
        </div>

        <Upload.Dragger
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          maxCount={1}
          fileList={
            logoFile
              ? [{ uid: "logo-file", name: logoFile.name, status: "done" } as UploadFile]
              : []
          }
          beforeUpload={(file) => {
            setLogoFile(file);
            return false;
          }}
          onRemove={() => setLogoFile(null)}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag a logo image here</p>
        </Upload.Dragger>

        <Space style={{ marginTop: 16 }}>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            disabled={!logoFile}
            loading={uploadMutation.isPending}
            onClick={() => {
              if (logoFile) {
                uploadMutation.mutate(logoFile);
              }
            }}
          >
            Upload Logo
          </Button>
          {data?.logoDataUrl ? (
            <Popconfirm title="Remove the current logo?" onConfirm={() => removeMutation.mutate()}>
              <Button danger icon={<DeleteOutlined />} loading={removeMutation.isPending}>
                Remove Logo
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      </Card>
    </div>
  );
}
