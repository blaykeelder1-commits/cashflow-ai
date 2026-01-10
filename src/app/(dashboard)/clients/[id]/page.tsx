import { ClientProfile } from "@/components/clients/ClientProfile";

interface ClientPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params;
  return <ClientProfile clientId={id} />;
}
