import { Request, Response, NextFunction } from 'express';
export declare const createClient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllClients: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getClientById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateClient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteClient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
