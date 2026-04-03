import api from "../lib/axios";
import type { LoginPayload, LoginResponse } from "../types";


// ----------------------------------------------------------------------------------
// AUTH API
// All authentication-related API calls
// ----------------------------------------------------------------------------------


// POST /auth/login
export const loginApi = async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await api.post('/auth/login', payload);
    return res.data;
}