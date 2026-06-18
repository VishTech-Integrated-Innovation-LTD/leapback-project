// --------------------------------------------------------------------------------
// AUTH
// --------------------------------------------------------------------------------
export interface User {
  id:          string;
  name:        string;
  email:       string;
  userType:    'admin';
  isActive:    boolean;
  lastLoginAt: string | null;
  createdAt?:  string;
  updatedAt?:  string;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token:   string;
  user:    User;
}

// --------------------------------------------------------------------------------
// CLIENT
// --------------------------------------------------------------------------------
export interface Client {
  id:            string;
  sn?:           number;
  clientName:    string;
  contactPerson: string | null;
  email:         string;
  phone:         string | null;
  address:       string | null;
  createdAt?:    string;
  updatedAt?:    string;
}

export interface CreateClientPayload {
  clientName:     string;
  email:          string;
  contactPerson?: string;
  phone?:         string;
  address?:       string;
}

export type UpdateClientPayload = Partial<CreateClientPayload>
// export interface UpdateClientPayload extends Partial<CreateClientPayload> {}

// --------------------------------------------------------------------------------
// INVENTORY
// --------------------------------------------------------------------------------
export type InventoryType       = 'product' | 'service';
export type AvailabilityStatus  = 'available' | 'busy' | 'unavailable';

export interface InventoryItem {
  id:                 string;
  sn?:                number;
  name:               string;
  itemCode:           string | null;
  type:               InventoryType;
  category:           string | null;
  unitPrice:          number;
  stockQty:           number | null;
  lowStockThreshold:  number;
  availabilityStatus: AvailabilityStatus | null;
  isActive:           boolean;
  createdAt?:         string;
  updatedAt?:         string;
}

export interface CreateInventoryPayload {
  name:                string;
  type:                InventoryType;
  unitPrice:           number;
  itemCode?:           string;
  category?:           string;
  stockQty?:           number;
  lowStockThreshold?:  number;
  availabilityStatus?: AvailabilityStatus;
}

export interface UpdateInventoryPayload extends Partial<CreateInventoryPayload> {
  isActive?: boolean;
}

// --------------------------------------------------------------------------------
// QUOTE
// --------------------------------------------------------------------------------
export type QuoteStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface QuoteLineItem {
  id?:         string;
  inventoryId?: string | null;
  itemName:    string;
  itemType:    InventoryType;
  quantity:    number;
  unitPrice:   number;
  lineTotal:   number;
}

export interface Quote {
  id:          string;
  sn?:         number;
  quoteNumber: string;
  clientId:    string;
  createdBy:   string;
  status:      QuoteStatus;
  vatRate:     number | null;
  subtotal:    number;
  vatAmount:   number | null;
  grandTotal:  number;
  notes:       string | null;
  pdfPath:     string | null;
  sentAt:      string | null;
  approvedAt:  string | null;
  createdAt?:  string;
  updatedAt?:  string;

  // Populated via JOIN on GET requests
  client?:     Pick<Client, 'id' | 'clientName' | 'email'>;
  creator?:    Pick<User, 'id' | 'name'>;
  items?:      QuoteLineItem[];
}

export interface CreateQuotePayload {
  clientId: string;
  items:    Omit<QuoteLineItem, 'id' | 'lineTotal'>[];
  notes?:   string;
  vatRate?: number;
  submit?:  boolean;   // true = submit immediately, false = save as draft
}

export interface UpdateQuotePayload {
  items?:   Omit<QuoteLineItem, 'id' | 'lineTotal'>[];
  notes?:   string;
  vatRate?: number;
}

// --------------------------------------------------------------------------------
// INVOICE
// --------------------------------------------------------------------------------
export type InvoiceStatus = 'sent' | 'paid' | 'cancelled';

export interface InvoiceLineItem {
  id:        string;
  invoiceId: string;
  itemName:  string;
  itemType:  InventoryType;
  quantity:  number;
  unitPrice: number;
  lineTotal: number;
}

export interface Invoice {
  id:            string;
  sn?:           number;
  invoiceNumber: string;
  quoteId:       string;
  clientId:      string;
  createdBy:     string;
  status:        InvoiceStatus;
  vatRate:       number | null;
  subtotal:      number;
  vatAmount:     number | null;
  grandTotal:    number;
  pdfPath:       string | null;
  dueDate:       string | null;
  paidAt:        string | null;
  sentAt:        string | null;
  createdAt?:    string;
  updatedAt?:    string;

  // Populated via JOIN on GET requests
  client?:  Pick<Client, 'id' | 'clientName' | 'email'>;
  quote?:   Pick<Quote, 'id' | 'quoteNumber'>;
  creator?: Pick<User, 'id' | 'name'>;
  items?:   InvoiceLineItem[];
}

// --------------------------------------------------------------------------------
// API RESPONSE WRAPPERS
// These match the shape your Express controllers return
// --------------------------------------------------------------------------------// ─────────────────────────────────────────────────────────────────────────────
export interface ApiListResponse<T> {
  message: string;
  count:   number;
  data:    T[];
}

export interface ApiSingleResponse<T> {
  message: string;
  data:    T;
}

// --------------------------------------------------------------------------------
// DASHBOARD
// --------------------------------------------------------------------------------
export interface DashboardStats {
  totalSales:    number;
  quotes: {
    pending:  number;
    approved: number;
    rejected: number;
    total:    number;
  };
  totalClients:  number;
  lowStockAlerts: Array<{
    id:                string;
    name:              string;
    stockQty:          number;
    lowStockThreshold: number;
  }>;
  recentQuotes: Array<{
    id:          string;
    quoteNumber: string;
    clientName:  string;
    grandTotal:  number;
    status:      QuoteStatus;
    createdAt:   string;
  }>;
  monthlyRevenue: Array<{
    month:   string;
    revenue: number;
  }>;
}


// --------------------------------------------------------------------------------
// SETTINGS
// --------------------------------------------------------------------------------
export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  currency?: string;
  sortCode?: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  companyAddress: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  invoiceFooter: string | null;
  defaultVatRate: number;
  logoUrl: string | null;
  taxId: string | null;
  website: string | null;
  bankAccounts: BankAccount[];
}