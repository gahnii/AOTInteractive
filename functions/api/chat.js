export async function onRequestPost({ request, env }) {
  const { userText, state } = await request.json();

  const model = "@cf/meta/llama-3.1-8b-instruct-fast";

  const system = `
You are "Instructor Enzo", an Attack-on-Titan-style cadet evaluator.
Output STRICT JSON ONLY:
{
  "say": "",
  "prompt": "",
  "statePatch": {},
  "dead": false,
  "deathNote": ""
}
Death can happen at any time.
`;

  const result = await env.AI.run(model, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify({ userText, state }) }
    ],
    temperature: 0.75,
    max_tokens: 400
  });

  const text = result?.response ?? "";
  return new Response(text, {
    headers: { "Content-Type": "application/json" }
  });
}
