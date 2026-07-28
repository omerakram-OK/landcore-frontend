import { useMemo, useState } from "react";
import { Avatar, Badge, Dropdown, Layout, Menu, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import {
  ApartmentOutlined,
  BankOutlined,
  BuildOutlined,
  ContainerOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileDoneOutlined,
  IdcardOutlined,
  LogoutOutlined,
  ScheduleOutlined,
  SettingOutlined,
  ShopOutlined,
  SolutionOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useMarketplaceChatHub } from "../hooks/useMarketplaceChatHub";
import { getBranding } from "../api/branding";

const { Header, Sider, Content } = Layout;

function buildNavItems(isAdmin: boolean, marketplaceUnread: number): MenuProps["items"] {
  const items: MenuProps["items"] = [
    { key: "/", icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
    { key: "/employees", icon: <TeamOutlined />, label: <Link to="/employees">Employees</Link> },
    { key: "/designations", icon: <IdcardOutlined />, label: <Link to="/designations">Designations</Link> },
    { key: "/societies", icon: <BuildOutlined />, label: <Link to="/societies">Societies</Link> },
    { key: "/blocks", icon: <ApartmentOutlined />, label: <Link to="/blocks">Blocks</Link> },
    { key: "/plots", icon: <ContainerOutlined />, label: <Link to="/plots">Plots</Link> },
    { key: "/resale-plots", icon: <ContainerOutlined />, label: <Link to="/resale-plots">Resale Plots</Link> },
    { key: "/agents", icon: <UsergroupAddOutlined />, label: <Link to="/agents">Agents</Link> },
    { key: "/leads", icon: <SolutionOutlined />, label: <Link to="/leads">Leads</Link> },
    { key: "/clients", icon: <UserOutlined />, label: <Link to="/clients">Clients</Link> },
    { key: "/bookings", icon: <ScheduleOutlined />, label: <Link to="/bookings">Bookings</Link> },
    { key: "/payments", icon: <DollarOutlined />, label: <Link to="/payments">Payments</Link> },
    { key: "/bank-accounts", icon: <BankOutlined />, label: <Link to="/bank-accounts">Bank Accounts</Link> },
    {
      key: "/marketplace",
      icon: <ShopOutlined />,
      label: (
        <Link to="/marketplace" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span>Marketplace</span>
          {marketplaceUnread > 0 ? <Badge count={marketplaceUnread} size="small" /> : null}
        </Link>
      ),
    },
    { key: "/approvals", icon: <FileDoneOutlined />, label: <Link to="/approvals">Approvals</Link> },
    { key: "/documents", icon: <ContainerOutlined />, label: <Link to="/documents">Documents</Link> },
    { key: "/reports", icon: <FileDoneOutlined />, label: <Link to="/reports">Reports</Link> },
  ];

  if (isAdmin) {
    items.push({ key: "/settings", icon: <SettingOutlined />, label: <Link to="/settings">Settings</Link> });
  }

  return items;
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { claims, logout } = useAuth();
  const { unreadTotal } = useMarketplaceChatHub();
  const isAdmin = claims?.role === "Admin";

  const navItems = useMemo(() => buildNavItems(isAdmin, unreadTotal), [isAdmin, unreadTotal]);

  const { data: branding } = useQuery({ queryKey: ["branding"], queryFn: getBranding });

  const selectedKey = useMemo(() => {
    const match = navItems?.find(
      (item) => item && "key" in item && typeof item.key === "string" && item.key !== "/" && location.pathname.startsWith(item.key),
    );
    return match && "key" in match ? String(match.key) : "/";
  }, [location.pathname, navItems]);

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
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={228}>
        <div
          style={{
            height: 56,
            margin: "16px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10,
          }}
        >
          {branding?.logoDataUrl ? (
            <img
              src={branding.logoDataUrl}
              alt="Society logo"
              style={{ maxHeight: 40, maxWidth: collapsed ? 32 : 160, objectFit: "contain" }}
            />
          ) : (
            <Typography.Text
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: collapsed ? 16 : 20,
                letterSpacing: 0.3,
              }}
            >
              {collapsed ? "LC" : "Landcore"}
            </Typography.Text>
          )}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={navItems} />
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
              <Typography.Text>{claims?.email ?? claims?.role}</Typography.Text>
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
