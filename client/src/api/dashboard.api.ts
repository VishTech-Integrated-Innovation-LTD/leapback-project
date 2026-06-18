import api from "../lib/axios";
import type { Quote, Client, InventoryItem, Invoice } from '../types';


// --------------------------------------------------------------------------
// DASHBOARD API
// No dedicated dashboard endpoint exists - data is assembled from existing
// endpoints and computed on the frontend
// --------------------------------------------------------------------------

export interface DashboardData {
  totalSales:    number;
  quotes: {
    pending:   number;
    approved:  number;
    rejected:  number;
    // cancelled:     number;
    // draft:     number;
    total:     number;
  };
  totalClients:  number;
  lowStockAlerts: InventoryItem[];
  recentQuotes:  Quote[];
}


export interface LowStockAlert {
  id: string;
  name: string;
  stockQty: number;
  lowStockThreshold: number;
}


export interface RevenuePoint {
  month: string;
  revenue: number
}


export interface QuoteStatusPoint {
  status: string;
  count: number;
  fill: string;
}



export const getDashboardData = async (): Promise<DashboardData> => {
  // Fire all requests in parallel - faster than sequential calls
  const [quotesRes, clientsRes, inventoryRes, invoicesRes] = await Promise.all([
    api.get('/quotes'),
    api.get('/clients'),
    api.get('/inventory'),
    api.get('/invoices?status=paid'),
  ]);

  const quotes:    Quote[]         = quotesRes.data.quotes    ?? [];
  const clients:   Client[]        = clientsRes.data.clients  ?? [];
  const inventory: InventoryItem[] = inventoryRes.data.items  ?? [];
  const invoices:  Invoice[]       = invoicesRes.data.invoices ?? [];

  // Total sales - sum of all paid invoice grand totals
  const totalSales = invoices.reduce(
    (sum, inv) => sum + Number(inv.grandTotal), 0
  );

  // Quote counts by status
  const quoteCounts = {
    pending:  quotes.filter((q) => q.status === 'pending').length,
    approved: quotes.filter((q) => q.status === 'approved').length,
    rejected: quotes.filter((q) => q.status === 'rejected').length,
    total:    quotes.length,
  };

  // Low stock - products where stockQty is at or below lowStockThreshold
  const lowStockAlerts = inventory.filter(
    (item) =>
      item.type === 'product' &&
      item.stockQty !== null &&
      item.stockQty <= item.lowStockThreshold
  );

  // Recent quotes - latest 5 sorted by createdAt
  const recentQuotes = [...quotes]
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 5);

  return {
    totalSales,
    quotes:        quoteCounts,
    totalClients:  clients.length,
    lowStockAlerts,
    recentQuotes,
  };
};






