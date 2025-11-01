export async function readJsonOrText(res) {
  const text = await res.text().catch(() => "");
  try {
    const obj = text ? JSON.parse(text) : undefined;
    return { obj, text };
  } catch {
    return { obj: undefined, text };
  }
}
