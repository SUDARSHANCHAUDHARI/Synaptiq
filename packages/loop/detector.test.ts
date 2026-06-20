import { describe, it, expect } from "vitest";
import { detectLoop } from "./detector";

describe("detectLoop", () => {
  it("returns false for an empty history", () => {
    expect(detectLoop([], "anything goes here")).toBe(false);
  });

  it("returns false for empty current input", () => {
    expect(detectLoop(["some previous step"], "")).toBe(false);
  });

  it("detects an exact repeat", () => {
    expect(detectLoop(["fetch user data from api"], "fetch user data from api")).toBe(true);
  });

  it("detects a near-duplicate (Jaccard >= 0.85)", () => {
    // 5 of 6 unique tokens match — token sets are size 6 each, overlap=5,
    // similarity = 5/6 ≈ 0.833. So this should NOT trip the 0.85 threshold:
    expect(
      detectLoop(["fetch user data from api endpoint"], "fetch user info from api endpoint")
    ).toBe(false);
  });

  it("ignores casing and punctuation when comparing", () => {
    expect(detectLoop(["Fetch user data, from API."], "fetch user data from api")).toBe(true);
  });

  it("returns false for unrelated steps", () => {
    expect(
      detectLoop(["write the report and email it"], "calculate the monthly revenue numbers")
    ).toBe(false);
  });

  it("trips on the most recent matching entry in history", () => {
    expect(
      detectLoop(
        ["calculate revenue", "write report", "fetch user data from api"],
        "fetch user data from api"
      )
    ).toBe(true);
  });
});
