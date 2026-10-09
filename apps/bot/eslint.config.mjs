import { base, boundaries } from "@gazgame/config/eslint";

// bot: только content и engine. React, Next.js, UI и ИИ-агенты запрещены.
export default [...base, boundaries("react", "next", "ui", "agents", "apps")];
