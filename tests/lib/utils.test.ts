import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn helper", () => {
  it("concatène des classes arbitraires", () => {
    expect(cn("flex", "items-center", "gap-4")).toBe("flex items-center gap-4");
  });

  it("fait prévaloir la dernière classe Tailwind en conflit", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-left", { "text-right": true })).toBe("text-right");
  });

  it("ignore les valeurs falsy", () => {
    expect(cn("grid", undefined, null, false && "hidden", "gap-6")).toBe("grid gap-6");
  });
});
