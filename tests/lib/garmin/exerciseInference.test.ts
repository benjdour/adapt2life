import { describe, expect, it } from "vitest";

import { inferPrimarySportFromMarkdown } from "@/lib/garmin/exerciseInference";

describe("inferPrimarySportFromMarkdown", () => {
  it("détecte un plan de natation via l’emoji", () => {
    const markdown = "## 🏊‍♂️ Entraînement : Swim Base\nContenu…";
    expect(inferPrimarySportFromMarkdown(markdown)).toBe("LAP_SWIMMING");
  });

  it("détecte un plan de natation via des mots-clés crawl", () => {
    const markdown = "Séance spéciale crawl technique avec palmes en piscine.";
    expect(inferPrimarySportFromMarkdown(markdown)).toBe("LAP_SWIMMING");
  });

  it("identifie un plan vélo avec un mot-clé", () => {
    const markdown = "## 🚴 Session gravel\nSéance vélo gravel endu.";
    expect(inferPrimarySportFromMarkdown(markdown)).toBe("CYCLING");
  });

  it("retourne null lorsqu’aucun indice n’est trouvé", () => {
    expect(inferPrimarySportFromMarkdown("Séance générique sans sport.")).toBeNull();
  });
});
