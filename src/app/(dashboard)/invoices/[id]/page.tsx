import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";

interface InvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  return <InvoiceDetail invoiceId={id} />;
}
