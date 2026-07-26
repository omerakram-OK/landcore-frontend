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
import { DeleteOutlined, MinusCircleOutlined, PlusOutlined, UploadOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, removeMyPhoto, updateMyProfile, uploadMyPhoto } from "../../api/clientPortal";
import { getApiErrorMessage } from "../../utils/errors";

const PROFILE_QUERY_KEY = ["client-portal", "profile"] as const;

interface ProfileFormValues {
  phones: string[];
  address: string;
  emergencyContact?: string;
}

export default function MyProfilePage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ProfileFormValues>();
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({ queryKey: PROFILE_QUERY_KEY, queryFn: getMyProfile });

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        phones: data.phones.length > 0 ? data.phones : [""],
        address: data.address,
        emergencyContact: data.emergencyContact || undefined,
      });
    }
  }, [data, form]);

  const invalidateProfile = () => queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });

  const updateMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateMyProfile({
        phones: values.phones.filter((phone) => phone.trim().length > 0),
        address: values.address,
        emergencyContact: values.emergencyContact || null,
      }),
    onSuccess: () => {
      message.success("Profile updated.");
      void invalidateProfile();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update profile.")),
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: (file: File) => uploadMyPhoto(file),
    onSuccess: () => {
      message.success("Profile picture updated.");
      setPhotoFile(null);
      void invalidateProfile();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to upload photo.")),
  });

  const removePhotoMutation = useMutation({
    mutationFn: removeMyPhoto,
    onSuccess: () => {
      message.success("Profile picture removed.");
      void invalidateProfile();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to remove photo.")),
  });

  return (
    <div style={{ maxWidth: 1100 }}>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        My Profile
      </Typography.Title>

      <Row gutter={24}>
        <Col xs={24} md={9} lg={8}>
          <Card title="Profile Picture" style={{ marginBottom: 16, height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 16 }}>
              {data?.photoDataUrl ? (
                <Avatar size={96} src={data.photoDataUrl} />
              ) : (
                <Avatar size={96} icon={<UserOutlined />} style={{ background: "#14B8A6" }} />
              )}
              <Typography.Text type="secondary">
                {isLoading ? "Loading..." : data?.photoDataUrl ? "Current picture" : "No picture set"}
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
              {data?.photoDataUrl ? (
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

              <Form.Item label="Email">
                <Input value={data?.email} disabled />
              </Form.Item>
              <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
                Contact your society office if your name, CNIC, or email needs to be corrected.
              </Typography.Paragraph>

              <Form.Item label="Phone Numbers" required>
                <Form.List name="phones" initialValue={[""]}>
                  {(fields, { add, remove }) => (
                    <Space direction="vertical" style={{ width: "100%" }}>
                      {fields.map((field) => (
                        <Space key={field.key} align="baseline" style={{ width: "100%" }}>
                          <Form.Item
                            {...field}
                            rules={[{ required: true, message: "Phone is required" }]}
                            style={{ marginBottom: 8, flex: 1 }}
                          >
                            <Input placeholder="Phone number" />
                          </Form.Item>
                          {fields.length > 1 ? <MinusCircleOutlined onClick={() => remove(field.name)} /> : null}
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                        Add Phone
                      </Button>
                    </Space>
                  )}
                </Form.List>
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={14}>
                  <Form.Item name="address" label="Address" rules={[{ required: true, message: "Address is required" }]}>
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={10}>
                  <Form.Item name="emergencyContact" label="Emergency Contact (optional)">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

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
