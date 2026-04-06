import api from '../lib/axios';
import type { Quote, CreateQuotePayload, UpdateQuotePayload } from '../types';


// --------------------------------------------------------------------------
// QUOTES API
// --------------------------------------------------------------------------

// GET /quotes?status=pending&search=nexus
export const getAllQuotes = async (params?: {
  status?: string;
  search?: string;
}): Promise<{ quotes: Quote[]; count: number }> => {
  const res = await api.get('/quotes', { params });
  return res.data;
};

// GET /quotes/:id
export const getQuoteById = async (id: string): Promise<{ quote: Quote }> => {
  const res = await api.get(`/quotes/${id}`);
  return res.data;
};

// POST /quotes
export const createQuote = async (
  payload: CreateQuotePayload
): Promise<{ quote: Quote; message: string }> => {
  const res = await api.post('/quotes', payload);
  return res.data;
};

// PUT /quotes/:id
export const updateQuote = async (
  id: string,
  payload: UpdateQuotePayload
): Promise<{ quote: Quote; message: string }> => {
  const res = await api.put(`/quotes/${id}`, payload);
  return res.data;
};

// PATCH /quotes/:id/submit
export const submitQuote = async (
  id: string
): Promise<{ quote: Quote; message: string }> => {
  const res = await api.patch(`/quotes/${id}/submit`);
  return res.data;
};

// PATCH /quotes/:id/status
export const updateQuoteStatus = async (
  id: string,
  status: 'approved' | 'rejected' | 'cancelled'
): Promise<{ quote: Quote; message: string }> => {
  const res = await api.patch(`/quotes/${id}/status`, { status });
  return res.data;
};