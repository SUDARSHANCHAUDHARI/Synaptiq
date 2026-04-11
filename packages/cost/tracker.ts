type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
};

export function calcCost(usage: Usage) {
  return (
    (usage.prompt_tokens || 0) * 0.000001 +
    (usage.completion_tokens || 0) * 0.000002
  );
}
