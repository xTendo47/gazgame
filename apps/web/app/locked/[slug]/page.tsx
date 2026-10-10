// Платный тест под замком: /locked/<slug> — описание, «Что узнаешь», оговорка и «Открыть по подписке 💎».
// Вопросов у таких тестов нет: кнопка считается как «Глубже 💎» и ведёт туда же.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { findLockedTest } from "@gazgame/engine";
import { Badge, PageHeader, Screen } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { DeeperButton } from "@/components/DeeperButton";
import { getCatalog } from "@/lib/catalog";
import { getSection } from "@/lib/sections";

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
  const section = getSection(test.sections[0] ?? "solo");

  return (
    <Screen>
      <PageHeader
        back={<BackLink href={`/${section?.id ?? ""}`}>{section?.title ?? "Меню"}</BackLink>}
        title={test.title}
        emoji={test.emoji}
        subtitle={test.description}
        badge={
          <span className="flex flex-wrap gap-2">
            <Badge tone="premium">
              <Lock aria-hidden="true" size={12} /> {test.locked.text}
            </Badge>
            <Badge>Тест</Badge>
          </span>
        }
      />

      <section aria-labelledby="learn-title" className="diamond-glow flex flex-col gap-3 rounded-card bg-surface p-5">
        <h2 id="learn-title" className="font-display text-xl font-bold">
          Что узнаешь
        </h2>
        <ul className="flex flex-col gap-2.5">
          {test.learn.map((item) => (
            <li key={item} className="flex gap-3 leading-relaxed">
              <span aria-hidden="true" className="text-[#60D6FF]">
                ◆
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {test.disclaimer && <p className="px-1 text-center text-sm text-muted">{test.disclaimer}</p>}

      <DeeperButton id={test.id} kind="test" source="locked-test" label="Открыть по подписке 💎" />
    </Screen>
  );
}
