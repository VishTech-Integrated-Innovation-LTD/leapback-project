import api from '../lib/axios';
import type { InventoryItem, CreateInventoryPayload, UpdateInventoryPayload } from '../types';


// --------------------------------------------------------------------------
// INVENTORY API
// --------------------------------------------------------------------------

// GET /inventory?search=solar&category=Solar&type=product
export const getAllInventory = async (params?: {
  search?:   string;
  category?: string;
  type?:     string;
}): Promise<{ items: InventoryItem[]; count: number }> => {
  const res = await api.get('/inventory', { params });
  return res.data;
};

// GET /inventory/:id
export const getInventoryById = async (
  id: string
): Promise<{ item: InventoryItem }> => {
  const res = await api.get(`/inventory/${id}`);
  return res.data;
};

// POST /inventory
export const createInventoryItem = async (
  payload: CreateInventoryPayload
): Promise<{ item: InventoryItem; message: string }> => {
  const res = await api.post('/inventory', payload);
  return res.data;
};

// PUT /inventory/:id
export const updateInventoryItem = async (
  id: string,
  payload: UpdateInventoryPayload
): Promise<{ item: InventoryItem; message: string }> => {
  const res = await api.put(`/inventory/${id}`, payload);
  return res.data;
};

// PATCH /inventory/:id/restock
export const restockInventoryItem = async (
  id: string,
  quantity: number
): Promise<{ item: InventoryItem; message: string }> => {
  const res = await api.patch(`/inventory/${id}/restock`, { quantity });
  return res.data;
};

// DELETE /inventory/:id
export const deleteInventoryItem = async (
  id: string
): Promise<{ message: string }> => {
  const res = await api.delete(`/inventory/${id}`);
  return res.data;
};