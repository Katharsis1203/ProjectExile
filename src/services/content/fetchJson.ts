export async function fetchJson(path: string): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(path);
  } catch (cause) {
    throw new Error(`Could not fetch content from ${path}.`, { cause });
  }

  if (!response.ok) {
    throw new Error(
      `Could not fetch content from ${path} (${response.status} ${response.statusText}).`,
    );
  }

  try {
    return await response.json();
  } catch (cause) {
    throw new Error(`Content at ${path} is not valid JSON.`, { cause });
  }
}
