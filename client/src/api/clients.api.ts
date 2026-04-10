import api from '../lib/axios';
import type { Client, CreateClientPayload, Invoice, Quote, UpdateClientPayload } from '../types';


// --------------------------------------------------------------------------
// CLIENT STATS
// Returned alongside client detail — matches the backend response shape
// --------------------------------------------------------------------------
export interface ClientStats {
  totalQuotes: number;
  totalInvoices: number;
  totalSpend: number;
}

export interface ClientDetailResponse {
  client: Client;
  quotes: Quote[];
  invoices: Invoice[];
  stats: ClientStats;
  message: string;
}


// --------------------------------------------------------------------------
// CLIENTS API
// --------------------------------------------------------------------------

// GET /clients?search=nexus
export const getAllClients = async (params?: {
  search?: string;
}): Promise<{ clients: Client[]; count: number }> => {
  const res = await api.get('/clients', { params });
  return res.data;
};

// GET /clients/:id
export const getClientById = async (
  id: string
): Promise<ClientDetailResponse> => {
  const res = await api.get(`/clients/${id}`);
  return res.data;
};

// POST /clients
export const createClient = async (
  payload: CreateClientPayload
): Promise<{ client: Client; message: string }> => {
  const res = await api.post('/clients', payload);
  return res.data;
};

// PUT /clients/:id
export const updateClient = async (
  id: string,
  payload: UpdateClientPayload
): Promise<{ client: Client; message: string }> => {
  const res = await api.put(`/clients/${id}`, payload);
  return res.data;
};

// DELETE /clients/:id
export const deleteClient = async (
  id: string
): Promise<{ message: string }> => {
  const res = await api.delete(`/clients/${id}`);
  return res.data;
};