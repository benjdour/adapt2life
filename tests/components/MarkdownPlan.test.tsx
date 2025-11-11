import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { MarkdownPlan } from "@/components/MarkdownPlan";

describe("<MarkdownPlan />", () => {
  it("renders headings, paragraphs and inline formatting", () => {
    const content = [
      "## 🚴 Séance Test",
      "",
      "Durée totale : **45 min** avec un bloc `tempo`.",
      "",
      "### Objectif",
      "Valider la mise en route sans se griller.",
    ].join("\n");

    render(<MarkdownPlan content={content} />);

    expect(screen.getByRole("heading", { name: /🚴 Séance Test/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Objectif/i })).toBeInTheDocument();
    expect(screen.getByText("45 min", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("tempo", { selector: "code" })).toHaveClass("text-xs");
    expect(screen.getByText(/mise en route/i)).toBeInTheDocument();
  });

  it("supports unordered lists and fenced code blocks", () => {
    const content = [
      "- 5 min échauffement",
      "- 3 x 4 min tempo",
      "",
      "```",
      "console.log('fin bloc');",
      "```",
    ].join("\n");

    render(<MarkdownPlan content={content} />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);
    expect(listItems[0].textContent).toMatch(/échauffement/);
    expect(screen.getByText("console.log('fin bloc');", { selector: "code" })).toBeInTheDocument();
  });
});
