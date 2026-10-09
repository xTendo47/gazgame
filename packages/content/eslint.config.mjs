import { base, boundaries } from "@gazgame/config/eslint";

// content: ни от чего не зависит — только данные и схемы.
export default [...base, boundaries("react", "next", "engine", "ui", "agents", "apps")];
