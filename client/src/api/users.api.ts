import api from '../lib/axios';
import type { User } from '../types';

// --------------------------------------------------------------------------
// USERS API
// --------------------------------------------------------------------------

// GET /users
export const getAllUsers = async (): Promise<{ users: User[]; count: number }> => {
  const res = await api.get('/users');
  return res.data;
};

// GET /users/:id
export const getUserById = async (id: string): Promise<{ user: User }> => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

// POST /auth/register — create a new staff member
export const registerUser = async (payload: {
  name:     string;
  email:    string;
  password: string;
}): Promise<{ user: User; message: string }> => {
  const res = await api.post('/auth/register', payload);
  return res.data;
};

// PUT /users/:id — update name, email, password, or isActive
export const updateUser = async (
  id:      string,
  payload: {
    name?:     string;
    email?:    string;
    password?: string;
    isActive?: boolean;
  }
): Promise<{ user: User; message: string }> => {
  const res = await api.put(`/users/${id}`, payload);
  return res.data;
};

// DELETE /users/:id
export const deleteUser = async (id: string): Promise<{ message: string }> => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};