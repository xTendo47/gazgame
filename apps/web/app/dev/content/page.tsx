// Только для разработки: /dev/content — витрина всего контента из packages/content/data.
// Добавил или поправил JSON — сохраняешь файл, и страница сама обновляется:
// видно, прошёл ли файл проверку, в каком поле ошибка и не битые ли ссылки в related.
// В продакшене страницы нет (404).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ContentItem, FileReport } from "@gazgame/content";
import { inspectContentDir } from "@gazgame/content/node";
import { itemPath } from "@gazgame/engine";
import { Badge, buttonVariants, cn } from "@gazgame/ui";
import { BackLink } from "@/components/BackLink";
import { getSection } from "@/lib/sections";

export const metadata: Metadata = { title: "Контент (dev)", robots: { index: false } };

export default async function DevContentPage() {
  await connection();
  if (process.env.NODE_ENV !== "development") notFound();

  let report;
  try {
    report = inspectContentDir();
  } catch (error) {
    return (
      <Main>
        <ErrorBox title="Не удалось прочитать папку с контентом" lines={[(error as Error).message]} />
      </Main>
    );
  }

  const broken = report.files.filter((f) => f.issues.length > 0);
  const tests = report.files.filter((f) => f.kind === "test");
  const games = report.files.filter((f) => f.kind === "game");

  return (
    <Main>
      <BackLink href="/">Меню</BackLink>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-black">Контент 🧪</h1>
        <p className="text-muted">
          Все тесты и игры из <code className="text-cream">packages/content/data</code>. Сохрани JSON — страница обновится
          сама.
        </p>
        <p className={cn("text-lg font-bold", broken.length ? "text-red-400" : "text-lime")} role="status">
          {broken.length
            ? `❌ С ошибками: ${broken.length} из ${report.files.length} файлов`
            : `✅ Всё в порядке: ${report.files.length} файлов`}
        </p>
      </header>

      <Group title={`Тесты (${tests.length})`} files={tests} />
      <Group title={`Игры (${games.length})`} files={games} />
    </Main>
  );
}

function Main({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-12">{children}</main>;
}

function Group({ title, files }: { title: string; files: FileReport[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {files.length === 0 && <p className="text-muted">Пока пусто.</p>}
      {files.map((file) => (
        <FileCard key={file.path} file={file} />
      ))}
    </section>
  );
}

/** Поле из исходного JSON — чтобы показать хоть что-то, если файл не прошёл схему. */
function rawField(data: unknown, key: string): unknown {
  return data && typeof data === "object" ? (data as Record<string, unknown>)[key] : undefined;
}

function rawText(data: unknown, key: string): string | undefined {
  const value = rawField(data, key);
  return typeof value === "string" ? value : undefined;
}

function rawStrings(data: unknown, key: string): string[] {
  const value = rawField(data, key);
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function countLabel(item: ContentItem): string {
  if (item.kind === "test") return `${item.questions.length} вопр. · ${item.results.length} результ.`;
  if (item.mechanic === "mafia") return `${item.roles.length} ролей · ${item.mechanic}`;
  if (item.mechanic === "spy") {
    const words = item.decks.reduce((sum, d) => sum + d.cards.length, 0);
    return `${words} карт в ${item.decks.length} наборах · ${item.mechanic}`;
  }
  const cards = item.decks.reduce((sum, d) => sum + d.cards.length, 0);
  return `${cards} карт. в ${item.decks.length} колод. · ${item.mechanic}`;
}

function FileCard({ file }: { file: FileReport }) {
  const { item, data } = file;
  const ok = file.issues.length === 0;
  const title = item?.title ?? rawText(data, "title") ?? "(без названия)";
  const emoji = item?.emoji ?? rawText(data, "emoji") ?? "📄";
  const sections = item?.sections ?? rawStrings(data, "sections");
  const related = item?.related ?? rawStrings(data, "related");
  const href = item ? itemPath(item) : undefined;

  return (
    <article
      className={cn("flex flex-col gap-3 rounded-card border bg-surface p-4", ok ? "border-line" : "border-red-500")}
      aria-label={title}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-3xl leading-none">
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold leading-tight">{title}</h3>
          <p className="break-all text-xs text-muted">{file.path}</p>
        </div>
        <span className={cn("text-sm font-bold", ok ? "text-lime" : "text-red-400")}>{ok ? "✅ ок" : "❌ ошибка"}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <Badge key={s}>{getSection(s)?.title ?? s}</Badge>
        ))}
        {item && (
          <>
            <Badge tone={item.tier === "free" ? "neutral" : "premium"}>tier: {item.tier}</Badge>
            <Badge>{item.ageRating}</Badge>
            <Badge tone={item.status === "draft" ? "draft" : "neutral"}>{item.status}</Badge>
            <Badge>{countLabel(item)}</Badge>
            <Badge>id: {item.id}</Badge>
          </>
        )}
      </div>

      {related.length > 0 && (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Связанное:</span>
          {related.map((id) => {
            const isBroken = file.brokenRelated.includes(id);
            return (
              <span
                key={id}
                className={cn(
                  "rounded-full px-2 py-0.5 font-semibold",
                  isBroken ? "bg-red-500/20 text-red-300 line-through" : "bg-surface-2",
                )}
                title={isBroken ? "Такого id нет" : undefined}
              >
                {id}
                {isBroken && <span className="sr-only"> — битая ссылка</span>}
              </span>
            );
          })}
        </p>
      )}

      {!ok && (
        <ul className="flex flex-col gap-1 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
          {file.issues.map((issue, i) => (
            <li key={i}>
              <code className="font-bold text-red-200">{issue.field}</code>: {issue.message}
            </li>
          ))}
        </ul>
      )}

      {href ? (
        <Link href={href} className={buttonVariants({ variant: "ghost", size: "md", className: "self-start" })}>
          Открыть →
        </Link>
      ) : (
        <p className="text-sm text-muted">Открыть нельзя, пока файл не пройдёт проверку.</p>
      )}
    </article>
  );
}

function ErrorBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-card border border-red-500 bg-red-500/10 p-4 text-red-300">
      <h1 className="font-bold">{title}</h1>
      {lines.map((line) => (
        <pre key={line} className="mt-2 whitespace-pre-wrap text-sm">
          {line}
        </pre>
      ))}
    </div>
  );
}
