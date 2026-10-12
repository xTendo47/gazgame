// Раздел: /pairs, /company, /solo. Один формат на все разделы — components/sections/SectionPage.tsx.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionPage as SectionLayoutPage } from "@/components/sections/SectionPage";
import { getSection, SECTIONS } from "@/lib/sections";

export const dynamicParams = false;

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/[section]">): Promise<Metadata> {
  const section = getSection((await params).section);
  return { title: section?.title };
}

export default async function SectionPage({ params }: PageProps<"/[section]">) {
  const section = getSection((await params).section);
  if (!section) notFound();
  return <SectionLayoutPage sectionId={section.id} />;
}
