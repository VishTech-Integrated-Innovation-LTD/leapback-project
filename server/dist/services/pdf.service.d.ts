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
export declare function generatePDF(data: PDFData): Promise<string>;
