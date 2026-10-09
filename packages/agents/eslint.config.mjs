import { base, boundaries } from "@gazgame/config/eslint";

// agents: зависит от content и engine, без React. Вызовы моделей — только в apps/api.
export default [...base, boundaries("react", "next", "ui", "apps")];
