// Платный тест под замком по старому адресу /locked/<slug>: раздел (вкладка с этим тестом), поверх — шторка с превью.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findLockedTest } from "@gazgame/engine";
import { SectionPage } from "@/components/sections/SectionPage";
import { getCatalog } from "@/lib/catalog";

type Props = PageProps<"/locked/[slug]">;

export const dynamicParams = false;

export function generateStaticParams() {
  return (getCatalog().lockedTests ?? []).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const test = findLockedTest(getCatalog(), (await params).slug);
  return test ? { title: test.title, description: test.description } : {};
}

export default async function LockedTestPage({ params }: Props) {
  const test = findLockedTest(getCatalog(), (await params).slug);
  if (!test) notFound();
  return <SectionPage sectionId={test.sections[0] ?? "solo"} openLocked={test.slug} />;
}
