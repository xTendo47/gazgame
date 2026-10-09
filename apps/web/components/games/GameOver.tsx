"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Game } from "@gazgame/content";
import { Button, buttonVariants } from "@gazgame/ui";
import { DeeperButton } from "../DeeperButton";

/** Общий финал игры: «Глубже 💎», «Ещё раз», «Связанное». */
export function GameOver({
  game,
  onRestart,
  related,
  children,
}: {
  game: Game;
  onRestart: () => void;
  related?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {children}
      <DeeperButton id={game.id} kind="game" source="game-over" />
      <Button variant="ghost" onClick={onRestart}>
        Сыграть ещё раз 🔄
      </Button>
      <Link href="/" className={buttonVariants({ variant: "outline", size: "md" })}>
        В меню
      </Link>
      {related}
    </div>
  );
}
