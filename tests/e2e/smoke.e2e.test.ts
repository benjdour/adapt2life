import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { JSDOM } from "jsdom";

import { baseUrl, startServer, stopServer } from "./server";

const fetchHtml = async (path: string) => {
  const response = await fetch(`${baseUrl}${path}`);
  expect(response.status, `Expected ${path} to return 200`).toBe(200);
  const html = await response.text();
  return new JSDOM(html);
};

describe.sequential("Public site smoke tests", () => {
  beforeAll(async () => {
    await startServer();
  }, 120_000);

  afterAll(async () => {
    await stopServer();
  });

  test("homepage exposes hero heading and lang attribute", async () => {
    const dom = await fetchHtml("/");
    const heading = dom.window.document.querySelector("h1");
    expect(heading?.textContent ?? "").toMatch(/qui s’adapte à ta vie/i);
    const html = dom.window.document.documentElement;
    expect(html.lang).toBe("fr");
  });

  test("smart coach pillar page renders server-side metadata", async () => {
    const dom = await fetchHtml("/features/smart-coach");
    const title = dom.window.document.querySelector("title");
    expect(title?.textContent ?? "").toMatch(/smart coach/i);
    const description = dom.window.document.querySelector("meta[name='description']");
    expect(description?.getAttribute("content") ?? "").toMatch(/adapt2life/i);
  });

  test("contact page includes canonical link", async () => {
    const dom = await fetchHtml("/contact");
    const canonical = dom.window.document.querySelector("link[rel='canonical']");
    expect(canonical?.getAttribute("href")).toBe("https://adapt2life.app/contact");
  });
});
