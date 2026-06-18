import { Request, Response, NextFunction } from 'express';
export declare const getAllQuotes: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getQuoteById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createQuote: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateQuote: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const submitQuote: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateQuoteStatus: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const downloadQuotePdf: (req: Request, res: Response, next: NextFunction) => Promise<void>;
