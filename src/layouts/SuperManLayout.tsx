import { useMemo, useState } from "react";
import { Avatar, Dropdown, Layout, Menu, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import {
  BankOutlined,
  CrownOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const { Header, Sider, Content } = Layout;

const NAV_ITEMS: MenuProps["items"] = [
  { key: "/superman", icon: <DashboardOutlined />, label: <Link to="/superman">Dashboard</Link> },
  { key: "/superman/admins", icon: <BankOutlined />, label: <Link to="/superman/admins">Admins</Link> },
  {
    key: "/superman/subscriptions",
    icon: <FileDoneOutlined />,
    label: <Link to="/superman/subscriptions">Subscriptions</Link>,
  },
  { key: "/superman/reports", icon: <FileDoneOutlined />, label: <Link to="/superman/reports">Reports</Link> },
];

export default function SuperManLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { claims, logout } = useAuth();

  const selectedKey = useMemo(() => {
    const sorted = [...(NAV_ITEMS ?? [])]
      .filter((item): item is NonNullable<(typeof NAV_ITEMS)[number]> => Boolean(item))
      .sort((a, b) => String(b.key).length - String(a.key).length);
    const match = sorted.find((item) => location.pathname.startsWith(String(item.key)));
    return match ? String(match.key) : "/superman";
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
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" width={228}>
        <div
          style={{
            height: 56,
            margin: "16px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10,
            color: "#fff",
            fontWeight: 700,
            fontSize: collapsed ? 18 : 18,
            letterSpacing: 0.3,
          }}
        >
          <CrownOutlined style={{ color: "#14B8A6" }} />
          {collapsed ? null : "Landcore Platform"}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={NAV_ITEMS} />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 20px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            boxShadow: "0 1px 2px rgba(11, 31, 58, 0.06)",
          }}
        >
          <Dropdown menu={{ items: userMenu, onClick: onUserMenuClick }} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <Avatar icon={<UserOutlined />} style={{ background: "#14B8A6" }} />
              <Typography.Text>{claims?.email ?? "SuperMan"}</Typography.Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 20 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
