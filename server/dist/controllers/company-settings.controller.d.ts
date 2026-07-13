import { Request, Response, NextFunction } from 'express';
export declare const getCompanySettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateCompanySettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const addBankAccount: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateBankAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteBankAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const setDefaultBankAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const _default: {
    getCompanySettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateCompanySettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    addBankAccount: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    updateBankAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteBankAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    setDefaultBankAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
