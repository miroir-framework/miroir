import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

globalThis.__miroirTestTiming?.phase("fixture.moduleInit", 5);

describe("timed", () => {
  beforeAll(async () => sleep(150));
  afterAll(async () => sleep(50));
  beforeEach(async () => sleep(200));
  afterEach(async () => sleep(30));

  test("sleeps 100 ms", async () => {
    await sleep(100);
    expect(true).toBe(true);
  });
});
