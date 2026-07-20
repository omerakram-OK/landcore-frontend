import { useState } from "react";
import { Button, Drawer, Form, Input, Popconfirm, Select, Space, Table, Tag, Typography, message } from "antd";
import type { TableColumnsType } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEmployee,
  deactivateEmployee,
  listEmployees,
  updateEmployee,
} from "../../api/employees";
import { listDesignations } from "../../api/designations";
import type {
  CreateEmployeeRequest,
  EmployeeResponse,
  UpdateEmployeeRequest,
} from "../../types/employee";
import { getApiErrorMessage } from "../../utils/errors";

const EMPLOYEES_QUERY_KEY = ["employees"] as const;
const DESIGNATIONS_QUERY_KEY = ["designations"] as const;

export default function EmployeesListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeResponse | null>(null);
  const [createForm] = Form.useForm<CreateEmployeeRequest>();
  const [editForm] = Form.useForm<UpdateEmployeeRequest>();

  const { data, isLoading } = useQuery({
    queryKey: EMPLOYEES_QUERY_KEY,
    queryFn: listEmployees,
  });

  const { data: designations } = useQuery({
    queryKey: DESIGNATIONS_QUERY_KEY,
    queryFn: listDesignations,
  });

  const designationOptions = (designations ?? []).map((designation) => ({
    label: designation.name,
    value: designation.id,
  }));

  const invalidateEmployees = () =>
    queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (dto: CreateEmployeeRequest) => createEmployee(dto),
    onSuccess: () => {
      message.success("Employee created.");
      setCreateOpen(false);
      createForm.resetFields();
      void invalidateEmployees();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create employee.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateEmployeeRequest }) =>
      updateEmployee(id, dto),
    onSuccess: () => {
      message.success("Employee updated.");
      setEditingEmployee(null);
      void invalidateEmployees();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update employee.")),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateEmployee(id),
    onSuccess: () => {
      message.success("Employee deactivated.");
      void invalidateEmployees();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to deactivate employee.")),
  });

  const openEdit = (record: EmployeeResponse) => {
    setEditingEmployee(record);
    editForm.setFieldsValue({
      fullName: record.fullName,
      email: record.email,
      phone: record.phone,
      designationId: record.designationId,
    });
  };

  const columns: TableColumnsType<EmployeeResponse> = [
    { title: "Full Name", dataIndex: "fullName", key: "fullName" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Designation", dataIndex: "designationName", key: "designationName" },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Active" : "Deactivated"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
            Edit
          </Button>
          {record.isActive ? (
            <Popconfirm
              title="Deactivate this employee?"
              description="This blocks login for the employee going forward."
              onConfirm={() => deactivateMutation.mutate(record.id)}
            >
              <Button size="small" danger loading={deactivateMutation.isPending}>
                Deactivate
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Employees
        </Typography.Title>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Create Employee
        </Button>
      </div>

      <Table<EmployeeResponse> rowKey="id" loading={isLoading} dataSource={data} columns={columns} />

      <Drawer
        title="Create Employee"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={420}
      >
        <Form<CreateEmployeeRequest>
          form={createForm}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: "Full name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Must be a valid email" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true, message: "Phone is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="designationId"
            label="Designation"
            rules={[{ required: true, message: "Designation is required" }]}
          >
            <Select
              showSearch
              placeholder="Select a designation"
              options={designationOptions}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            name="initialPassword"
            label="Initial Password"
            rules={[{ required: true, message: "Initial password is required" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Employee"
        open={editingEmployee !== null}
        onClose={() => setEditingEmployee(null)}
        destroyOnHidden
        width={420}
      >
        <Form<UpdateEmployeeRequest>
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingEmployee) {
              updateMutation.mutate({ id: editingEmployee.id, dto: values });
            }
          }}
        >
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: "Full name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Must be a valid email" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true, message: "Phone is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="designationId"
            label="Designation"
            rules={[{ required: true, message: "Designation is required" }]}
          >
            <Select
              showSearch
              placeholder="Select a designation"
              options={designationOptions}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={updateMutation.isPending}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
