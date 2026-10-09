import { base, boundaries } from "@gazgame/config/eslint";

// engine: зависит только от content. Никакого React, DOM и Next.js.
export default [...base, boundaries("react", "next", "ui", "agents", "apps")];
