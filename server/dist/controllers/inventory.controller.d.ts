import { Request, Response, NextFunction } from 'express';
export declare const createInventoryItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllInventory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getInventoryById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateInventoryItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteInventoryItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const restockInventoryItem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
