export interface Permission {
  module: string;
  actions: string[];
}

export interface DesignationResponse {
  id: string;
  adminId: string;
  name: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDesignationRequest {
  name: string;
  permissions: Permission[];
}

export interface UpdateDesignationRequest {
  name: string;
  permissions: Permission[];
}

export const PERMISSION_MODULES: Array<{ module: string; actions: string[] }> = [
  { module: "Employees", actions: ["Create", "View", "Edit", "Delete"] },
  { module: "Designations", actions: ["Create", "View", "Edit", "Delete"] },
  { module: "Societies", actions: ["View", "Edit", "Delete"] },
  { module: "Blocks", actions: ["Create", "View", "Edit", "Delete"] },
  { module: "Plots", actions: ["Create", "View", "Edit", "Delete"] },
  { module: "Agents", actions: ["Create", "View", "Edit", "Delete"] },
  { module: "Leads", actions: ["Create", "View", "Edit", "Delete"] },
  { module: "Clients", actions: ["Create", "View", "Edit", "Delete"] },
  { module: "Bookings", actions: ["Create", "View", "Edit"] },
  { module: "Installments", actions: ["Create", "View", "Edit"] },
  { module: "Payments", actions: ["Create", "View"] },
  { module: "Receipts", actions: ["View"] },
  { module: "Cheques", actions: ["View", "Edit"] },
  { module: "BankAccounts", actions: ["Create", "View", "Edit", "Delete"] },
  { module: "Documents", actions: ["Generate", "View"] },
  { module: "Reports", actions: ["View"] },
  { module: "Approvals", actions: ["Propose", "View", "Decide"] },
  { module: "Notifications", actions: ["Trigger"] },
];
