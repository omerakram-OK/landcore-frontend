import { useMemo, useState } from "react";
import { Avatar, Dropdown, Layout, Menu, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import {
  ApartmentOutlined,
  BankOutlined,
  ContainerOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileDoneOutlined,
  IdcardOutlined,
  LogoutOutlined,
  BuildOutlined,
  ScheduleOutlined,
  SolutionOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const { Header, Sider, Content } = Layout;

const NAV_ITEMS: MenuProps["items"] = [
  { key: "/", icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
  { key: "/employees", icon: <TeamOutlined />, label: <Link to="/employees">Employees</Link> },
  { key: "/designations", icon: <IdcardOutlined />, label: <Link to="/designations">Designations</Link> },
  { key: "/societies", icon: <BuildOutlined />, label: <Link to="/societies">Societies</Link> },
  { key: "/blocks", icon: <ApartmentOutlined />, label: <Link to="/blocks">Blocks</Link> },
  { key: "/plots", icon: <ContainerOutlined />, label: <Link to="/plots">Plots</Link> },
  { key: "/agents", icon: <UsergroupAddOutlined />, label: <Link to="/agents">Agents</Link> },
  { key: "/leads", icon: <SolutionOutlined />, label: <Link to="/leads">Leads</Link> },
  { key: "/clients", icon: <UserOutlined />, label: <Link to="/clients">Clients</Link> },
  { key: "/bookings", icon: <ScheduleOutlined />, label: <Link to="/bookings">Bookings</Link> },
  { key: "/payments", icon: <DollarOutlined />, label: <Link to="/payments">Payments</Link> },
  { key: "/bank-accounts", icon: <BankOutlined />, label: <Link to="/bank-accounts">Bank Accounts</Link> },
  { key: "/approvals", icon: <FileDoneOutlined />, label: <Link to="/approvals">Approvals</Link> },
  { key: "/documents", icon: <ContainerOutlined />, label: <Link to="/documents">Documents</Link> },
  { key: "/reports", icon: <FileDoneOutlined />, label: <Link to="/reports">Reports</Link> },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { claims, logout } = useAuth();

  const selectedKey = useMemo(() => {
    const match = NAV_ITEMS?.find(
      (item) => item && "key" in item && typeof item.key === "string" && item.key !== "/" && location.pathname.startsWith(item.key),
    );
    return match && "key" in match ? String(match.key) : "/";
  }, [location.pathname]);

  const userMenu: MenuProps["items"] = [
    { key: "logout", icon: <LogoutOutlined />, label: "Log out" },
  ];

  const onUserMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 48,
            margin: 12,
            color: "#fff",
            fontWeight: 600,
            fontSize: collapsed ? 16 : 20,
            textAlign: "center",
          }}
        >
          {collapsed ? "LC" : "Landcore"}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={NAV_ITEMS} />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: "0 16px", display: "flex", justifyContent: "flex-end" }}>
          <Dropdown menu={{ items: userMenu, onClick: onUserMenuClick }} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <Avatar icon={<UserOutlined />} />
              <Typography.Text>{claims?.email ?? claims?.role}</Typography.Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
