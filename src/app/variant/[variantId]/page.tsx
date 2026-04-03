import { VariantDetailClient } from "@/components/pirate/variants/VariantDetailClient";

export default async function VariantDetailPage({
  params,
}: {
  params: Promise<{ variantId: string }>;
}) {
  const { variantId } = await params;
  return <VariantDetailClient variantId={variantId} />;
}

