export async function readBody(request) {
  try {
    return { body: await request.json() };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { error: "Invalid JSON." };
  }
}
