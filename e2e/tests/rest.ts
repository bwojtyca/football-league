import { APIRequestContext } from '@playwright/test';

/**
 * The emulator's REST API. By default as a visitor of the app (an anonymous account, as the app
 * signs everyone in), so `firestore.rules` decides every write as for them; with `owner`
 * (emulator only) the rules are skipped, as for an admin.
 */
export const DOCUMENTS =
  'http://127.0.0.1:8080/v1/projects/demo-football-league/databases/(default)/documents';

export const OWNER = { Authorization: 'Bearer owner' };

let anonymous: Promise<Record<string, string>> | undefined;

/** An anonymous account's credentials from the Auth emulator, made once per worker. */
export function visitor(request: APIRequestContext): Promise<Record<string, string>> {
  anonymous ??= request
    .post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key', {
      data: { returnSecureToken: true },
    })
    .then(async (response) => ({ Authorization: `Bearer ${(await response.json()).idToken}` }));
  return anonymous;
}

/** The given headers, or a visitor's when they bring no credentials. */
async function withAccount(
  request: APIRequestContext,
  headers: Record<string, string>,
): Promise<Record<string, string>> {
  return 'Authorization' in headers ? headers : { ...(await visitor(request)), ...headers };
}

export type Value = string | number | boolean | Value[] | { [key: string]: Value };

function encode(value: Value): object {
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    return { integerValue: String(value) };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encode) } };
  }
  return { mapValue: { fields: fields(value) } };
}

export function fields(data: Record<string, Value>): Record<string, object> {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encode(value)]));
}

/** Creates a document; returns the HTTP status (403 when refused). */
export async function create(
  request: APIRequestContext,
  path: string,
  data: Record<string, Value>,
  headers: Record<string, string> = {},
): Promise<number> {
  const slash = path.lastIndexOf('/');
  const response = await request.post(
    `${DOCUMENTS}/${path.slice(0, slash)}?documentId=${path.slice(slash + 1)}`,
    { data: { fields: fields(data) }, headers: await withAccount(request, headers) },
  );
  return response.status();
}

/** Updates the given fields of a document; returns the HTTP status (403 when refused). */
export async function update(
  request: APIRequestContext,
  path: string,
  data: Record<string, Value>,
  headers: Record<string, string> = {},
): Promise<number> {
  const mask = Object.keys(data)
    .map((key) => `updateMask.fieldPaths=${key}`)
    .join('&');
  const response = await request.patch(`${DOCUMENTS}/${path}?${mask}`, {
    data: { fields: fields(data) },
    headers: await withAccount(request, headers),
  });
  return response.status();
}

/** A document's fields as the API returns them (typed values), or `null`. */
export async function read(
  request: APIRequestContext,
  path: string,
): Promise<Record<string, Record<string, unknown>> | null> {
  const response = await request.get(`${DOCUMENTS}/${path}`);
  return response.ok() ? ((await response.json()).fields ?? {}) : null;
}
