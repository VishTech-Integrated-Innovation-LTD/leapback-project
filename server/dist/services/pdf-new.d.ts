export interface PDFLineItem {
    itemName: string;
    itemType: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}
export interface PDFData {
    type: 'quote' | 'invoice';
    refNumber: string;
    linkedRef?: string;
    client: {
        clientName: string;
        contactPerson?: string | null;
        email?: string | null;
        phone?: string | null;
    };
    items: PDFLineItem[];
    subtotal: number;
    vatRate: number | null;
    vatAmount: number | null;
    grandTotal: number;
    issueDate: string;
    dueDate?: string;
    status?: string;
}
export interface CompanyDetails {
    companyName: string;
    companyAddress: string | null;
    companyEmail: string | null;
    companyPhone: string | null;
    invoiceFooter: string | null;
    bankAccounts: Array<{
        id: string;
        bankName: string;
        accountNumber: string;
        accountName: string;
        isDefault: boolean;
        currency?: string;
        sortCode?: string;
    }>;
}
export declare function generatePDFBuffer(data: PDFData): Promise<Uint8Array>;
