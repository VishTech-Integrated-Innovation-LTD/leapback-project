export declare function sendQuoteEmail(opts: {
    to: string;
    clientName: string;
    quoteNumber: string;
    pdfPath: string | null;
    grandTotal: number;
}): Promise<void>;
export declare function sendInvoiceEmail(opts: {
    to: string;
    clientName: string;
    invoiceNumber: string;
    pdfPath: string | null;
    grandTotal: number;
    dueDate?: string;
}): Promise<void>;
