import type { ThemeConfig } from "antd";

export const BRAND_NAVY = "#0B1F3A";
export const BRAND_NAVY_DARK = "#081729";
export const BRAND_TEAL = "#14B8A6";
export const BRAND_TEAL_DARK = "#0F9488";

export const THEME_CONFIG: ThemeConfig = {
  token: {
    colorPrimary: BRAND_TEAL,
    colorInfo: BRAND_TEAL,
    colorLink: BRAND_TEAL_DARK,
    borderRadius: 8,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    colorBgLayout: "#F4F6F9",
  },
  components: {
    Layout: {
      siderBg: BRAND_NAVY,
      headerBg: "#FFFFFF",
      bodyBg: "#F4F6F9",
    },
    Menu: {
      darkItemBg: BRAND_NAVY,
      darkSubMenuItemBg: BRAND_NAVY_DARK,
      darkItemSelectedBg: BRAND_TEAL,
      darkItemSelectedColor: "#FFFFFF",
      darkItemHoverBg: "rgba(255, 255, 255, 0.06)",
      darkItemColor: "rgba(255, 255, 255, 0.75)",
    },
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      fontWeight: 500,
    },
    Card: {
      borderRadiusLG: 12,
    },
    Table: {
      borderRadius: 8,
      headerBg: "#F4F6F9",
    },
    Statistic: {
      titleFontSize: 13,
    },
  },
};
