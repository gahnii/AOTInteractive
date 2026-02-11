export async function onRequestPost({ request, env }) {
  const headers = { "Content-Type": "application/json; charset=utf-8" };

  try {
    if (!env || !env.AI) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Missing Workers AI binding.",
        fix: "Cloudflare Pages → Project → Settings → Bindings → Add Workers AI binding named AI, then redeploy."
      }), { status: 500, headers });
    }

    const { userText, state } = await request.json();

    const system = [
      `You are "Instructor Enzo", an Attack-on-Titan-style cadet evaluator.`,
      `Return STRICT JSON ONLY. No markdown. No extra text.`,
      `Schema: {"say":"","prompt":"","statePatch":{},"dead":false,"deathNote":""}`,
      `One action at a time. Realistic consequences. Death can happen at any time.`,
    ].join("\n");

    const model = "@cf/meta/llama-3.1-8b-instruct"; // safest default

    const result = await env.AI.run(model, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify({ userText, state }) }
      ],
      temperature: 0.75,
      max_tokens: 450
    });

    const text = result?.response ?? result?.output ?? "";

    // Ensure we always return valid JSON to your frontend
    let parsed;
    try { parsed = JSON.parse(text); }
    catch {
      parsed = {
        say: String(text || "…").slice(0, 800),
        prompt: "action",
        statePatch: {},
        dead: false,
        deathNote: ""
      };
    }

    return new Response(JSON.stringify({ ok: true, ...parsed }), { headers });

  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error: String(err?.message || err),
      tip: "If this says env.AI is undefined, your binding isn't set or not applied to Production."
    }), { status: 500, headers });
  }
}
