// ============================================================
// Central permission definitions for all three roles.
// Import usePermissions() in any component to gate actions.
// Added canViewInventory (all roles — everyone can browse the catalogue)
// ============================================================

export type UserRole = 'chief_admin' | 'admin' | 'staff';

export interface Permissions {
  // Quotes
  canApproveQuote:  boolean;
  canRejectQuote:   boolean;
  canEditQuote:     boolean;   // chief_admin only
  canDeleteQuote:   boolean;   // chief_admin only

  // Invoices / Finance
  canViewInvoices:    boolean;
  canMarkInvoicePaid: boolean;

  // Clients
  canDeleteClient:  boolean;
  canExportClients: boolean;

  // Inventory
  canViewInventory:   boolean;   // all roles — everyone can browse
  canAddInventory:    boolean;   
  canEditInventory:   boolean;   // price / details — admin+
  canDeleteInventory: boolean;
  canExportInventory: boolean;
  canUpdateStock:     boolean;   // qty only — staff can do this

  // Settings / Staff
  canViewSettings:  boolean;
  canManageUsers:   boolean;
  
  // General
  canExport:        boolean;
}

export const getPermissions = (role: UserRole): Permissions => {
  switch (role) {
    case 'chief_admin':
      return {
        canApproveQuote:    true,
        canRejectQuote:     true,
        canEditQuote:       true,
        canDeleteQuote:     true,
        canViewInvoices:    true,
        canMarkInvoicePaid: true,
        canDeleteClient:    true,
        canExportClients:   true,
        canViewInventory:   true,
        canAddInventory:    true,   
        canEditInventory:   true,
        canDeleteInventory: true,
        canExportInventory: true,
        canUpdateStock:     true,
        canViewSettings:    true,
        canManageUsers:     true,
        canExport:          true,
      };

    case 'admin':
      return {
        canApproveQuote:    true,
        canRejectQuote:     true,
        canEditQuote:       false,
        canDeleteQuote:     false,
        canViewInvoices:    true,
        canMarkInvoicePaid: true,
        canDeleteClient:    true,
        canExportClients:   true,
        canViewInventory:   true,
        canAddInventory:    true,
        canEditInventory:   true,
        canDeleteInventory: true,
        canExportInventory: true,
        canUpdateStock:     true,
        canViewSettings:    true,
        canManageUsers:     false,
        canExport:          true,
      };

    case 'staff':
    default:
      return {
        canApproveQuote:    false,
        canRejectQuote:     false,
        canEditQuote:       false,
        canDeleteQuote:     false,
        canViewInvoices:    false,
        canMarkInvoicePaid: false,
        canDeleteClient:    false,
        canExportClients:   false,
        canViewInventory:   true,   // staff can view inventory
        canAddInventory:    false,
        canEditInventory:   false,
        canDeleteInventory: false,
        canExportInventory: false,
        canUpdateStock:     true,
        canViewSettings:    false,
        canManageUsers:     false,
        canExport:          false,
      };
  }
};

