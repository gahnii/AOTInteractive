export async function onRequestPost({ request, env }) {
  const H = { "Content-Type": "application/json; charset=utf-8" };
  try {
    if (!env?.AI) return new Response(JSON.stringify({ say:"INSTRUCTOR ENZO: (system offline)", prompt:"action", statePatch:{}, dead:false, deathNote:"" }), { status: 500, headers: H });

    const { userText, state } = await request.json();

    const sys = `
You are Instructor Enzo in an Attack-on-Titan cadet evaluation simulation.
The USER is the cadet. You address them as "Cadet <name>".
Tone: blunt, military, tense. Short lines.

Return STRICT JSON ONLY with EXACT keys:
{"say":"","prompt":"action","statePatch":{},"dead":false,"deathNote":""}

Rules:
- "say" must ALWAYS start with: "INSTRUCTOR ENZO: "
- "say" should be 1–6 lines max.
- NEVER include JSON keys in "say". Never mention "state".
- If userText is "__BEGIN_PHASE_2__", begin the first scene immediately.
- One action at a time. If user gives multiple actions, pick the first and increase hesitation by 1.
- Death can happen any time. If dead=true, include deathNote like: "STATUS: DECEASED • Cause: ____"
`;

    const model = "@cf/meta/llama-3.1-8b-instruct";

    const result = await env.AI.run(model, {
      messages: [
        { role: "system", content: sys },
        { role: "user", content: JSON.stringify({ userText, name: state?.name || "Cadet", phase: state?.phase || 2 }) }
      ],
      temperature: 0.75,
      max_tokens: 350
    });

    const text = result?.response ?? result?.output ?? "{}";

    // guarantee valid JSON back to frontend
    let j;
    try { j = JSON.parse(text); }
    catch { j = { say: "INSTRUCTOR ENZO: …", prompt:"action", statePatch:{}, dead:false, deathNote:"" }; }

    // force shape & strip garbage
    j = {
      say: String(j.say ?? "INSTRUCTOR ENZO: …"),
      prompt: String(j.prompt ?? "action"),
      statePatch: (j.statePatch && typeof j.statePatch === "object") ? j.statePatch : {},
      dead: !!j.dead,
      deathNote: String(j.deathNote ?? "")
    };

    // enforce prefix
    if (!j.say.startsWith("INSTRUCTOR ENZO: ")) j.say = "INSTRUCTOR ENZO: " + j.say;

    return new Response(JSON.stringify(j), { headers: H });
  } catch (e) {
    return new Response(JSON.stringify({ say:"INSTRUCTOR ENZO: (error)", prompt:"action", statePatch:{}, dead:false, deathNote:String(e?.message||e) }), { status: 500, headers: H });
  }
}
