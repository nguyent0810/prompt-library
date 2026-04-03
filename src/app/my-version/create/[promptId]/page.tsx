import { notFound } from "next/navigation";
import { piratePrompts } from "@/data/pirate-prompts";
import { MyVersionCreateClient } from "@/components/pirate/variants/MyVersionCreateClient";

export default async function CreateMyVersionPage({
  params,
}: {
  params: Promise<{ promptId: string }>;
}) {
  const { promptId } = await params;
  const basePrompt = piratePrompts.find((p) => p.id === promptId);
  if (!basePrompt) notFound();
  return <MyVersionCreateClient basePrompt={basePrompt} />;
}

