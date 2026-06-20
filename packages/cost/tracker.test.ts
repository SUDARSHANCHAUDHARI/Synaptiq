import { describe, it, expect } from "vitest";
import { calcCost } from "./tracker";

describe("calcCost", () => {
  it("returns 0 for an empty usage object", () => {
    expect(calcCost({})).toBe(0);
  });

  it("treats missing token fields as 0", () => {
    expect(calcCost({ prompt_tokens: 1000 })).toBeCloseTo(0.001, 10);
    expect(calcCost({ completion_tokens: 1000 })).toBeCloseTo(0.002, 10);
  });

  it("charges 2x for completion tokens vs prompt tokens", () => {
    expect(calcCost({ prompt_tokens: 1000, completion_tokens: 1000 })).toBeCloseTo(0.003, 10);
  });

  it("scales linearly with token count", () => {
    const a = calcCost({ prompt_tokens: 500, completion_tokens: 500 });
    const b = calcCost({ prompt_tokens: 1000, completion_tokens: 1000 });
    expect(b / a).toBeCloseTo(2, 10);
  });
});
