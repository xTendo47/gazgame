import { base, boundaries, react } from "@gazgame/config/eslint";

// ui: React-компоненты дизайн-системы. Не знают про Next.js, контент, движок и приложения.
export default [...base, ...react, boundaries("next", "content", "engine", "agents", "apps")];
