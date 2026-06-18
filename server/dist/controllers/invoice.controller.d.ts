import { Request, Response, NextFunction } from 'express';
export declare const getAllInvoice: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getInvoiceById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const generateInvoice: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateInvoiceStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const downloadInvoicePdf: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const resendInvoiceEmail: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const generateInvoiceForQuote: (quoteId: any, createdBy: string) => Promise<void>;
