import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  Popconfirm,
  Row,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import type { UploadFile } from "antd";
import { DeleteOutlined, UploadOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyAgentProfile, removeMyAgentPhoto, updateMyAgentProfile, uploadMyAgentPhoto } from "../../api/agentPortal";
import { getApiErrorMessage } from "../../utils/errors";

const PROFILE_QUERY_KEY = ["agent-portal", "profile"] as const;

interface ProfileFormValues {
  phone: string;
  address: string;
}

export default function MyProfilePage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ProfileFormValues>();
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({ queryKey: PROFILE_QUERY_KEY, queryFn: getMyAgentProfile });

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        phone: data.phone,
        address: data.address,
      });
    }
  }, [data, form]);

  const invalidateProfile = () => queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });

  const updateMutation = useMutation({
    mutationFn: (values: ProfileFormValues) => updateMyAgentProfile(values),
    onSuccess: () => {
      message.success("Profile updated.");
      void invalidateProfile();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update profile.")),
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: (file: File) => uploadMyAgentPhoto(file),
    onSuccess: () => {
      message.success("Profile picture updated.");
      setPhotoFile(null);
      void invalidateProfile();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to upload photo.")),
  });

  const removePhotoMutation = useMutation({
    mutationFn: removeMyAgentPhoto,
    onSuccess: () => {
      message.success("Profile picture removed.");
      void invalidateProfile();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to remove photo.")),
  });

  const commissionLabel = data
    ? data.commissionType === "Percentage"
      ? `${data.commissionValue}%`
      : `PKR ${data.commissionValue.toLocaleString()}`
    : "—";

  return (
    <div style={{ maxWidth: 1100 }}>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        My Profile
      </Typography.Title>

      <Row gutter={24}>
        <Col xs={24} md={9} lg={8}>
          <Card title="Profile Picture" style={{ marginBottom: 16, height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 16 }}>
              {data?.photoUrl ? (
                <Avatar size={96} src={data.photoUrl} />
              ) : (
                <Avatar size={96} icon={<UserOutlined />} style={{ background: "#14B8A6" }} />
              )}
              <Typography.Text type="secondary">
                {isLoading ? "Loading..." : data?.photoUrl ? "Current picture" : "No picture set"}
              </Typography.Text>
            </div>

            <Upload.Dragger
              accept="image/png,image/jpeg,image/webp"
              maxCount={1}
              fileList={photoFile ? [{ uid: "photo-file", name: photoFile.name, status: "done" } as UploadFile] : []}
              beforeUpload={(file) => {
                setPhotoFile(file);
                return false;
              }}
              onRemove={() => setPhotoFile(null)}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag a photo here</p>
            </Upload.Dragger>

            <Space style={{ marginTop: 16 }} wrap>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                disabled={!photoFile}
                loading={uploadPhotoMutation.isPending}
                onClick={() => {
                  if (photoFile) {
                    uploadPhotoMutation.mutate(photoFile);
                  }
                }}
              >
                Upload Picture
              </Button>
              {data?.photoUrl ? (
                <Popconfirm title="Remove your profile picture?" onConfirm={() => removePhotoMutation.mutate()}>
                  <Button danger icon={<DeleteOutlined />} loading={removePhotoMutation.isPending}>
                    Remove
                  </Button>
                </Popconfirm>
              ) : null}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={15} lg={16}>
          <Card title="Personal Details">
            <Form form={form} layout="vertical" onFinish={(values) => updateMutation.mutate(values)} disabled={isLoading}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Full Name">
                    <Input value={data?.fullName} disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="CNIC">
                    <Input value={data?.cnic} disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Email">
                    <Input value={data?.email} disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Commission Rate">
                    <Input value={commissionLabel} disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
                Contact your society office if your name, CNIC, email, or commission rate needs to be corrected.
              </Typography.Paragraph>

              <Form.Item name="phone" label="Phone" rules={[{ required: true, message: "Phone is required" }]}>
                <Input />
              </Form.Item>

              <Form.Item name="address" label="Address" rules={[{ required: true, message: "Address is required" }]}>
                <Input.TextArea rows={2} />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
