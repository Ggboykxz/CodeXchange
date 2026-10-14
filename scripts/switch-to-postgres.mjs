import fs from "node:fs";
const p = "prisma/schema.prisma";
const contenu = fs.readFileSync(p, "utf8");
fs.writeFileSync(p, contenu.replace('provider = "sqlite"', 'provider = "postgresql"'), "utf8");
