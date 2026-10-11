// Профиль → «Мои результаты»: пройденные тесты с датой и результатом.
// Пока прогресс хранится только на этом устройстве (ProgressStore в lib/progress.ts).
import type { Metadata } from "next";
import { isVisible } from "@gazgame/engine";
import { PageHeader, Screen } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { MyResults, type TestSummary } from "@/components/MyResults";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { getCatalog, visibility } from "@/lib/catalog";

export const metadata: Metadata = { title: "Мои результаты" };

export default function ProfilePage() {
  const tests: TestSummary[] = getCatalog()
    .tests.filter((t) => isVisible(t, visibility))
    .map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      emoji: t.emoji,
      results: t.results.map((r) => ({ id: r.id, title: r.title, emoji: r.emoji })),
    }));

  return (
    <Screen>
      <PageHeader
        back={<BackLink href="/">Меню</BackLink>}
        title="Мои результаты"
        subtitle="Тесты, которые ты прошёл. Хранятся только на этом устройстве."
        badge={<ProfileAvatar />}
      />
      <MyResults tests={tests} emptyHref="/solo" />
    </Screen>
  );
}
