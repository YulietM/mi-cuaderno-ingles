import { put, get } from '@vercel/blob';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyUser(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const idToken = authHeader.slice(7).trim();
  if (!idToken || !GOOGLE_CLIENT_ID) return null;
  try {
    const ticket = await oauthClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    return ticket.getPayload();
  } catch (err) {
    return null;
  }
}

function mergeByKey(localList, cloudList, keyFn, pickBetter) {
  const map = new Map();
  (cloudList || []).forEach(item => map.set(keyFn(item), item));
  (localList || []).forEach(item => {
    const key = keyFn(item);
    const existing = map.get(key);
    map.set(key, existing ? pickBetter(existing, item) : item);
  });
  return Array.from(map.values());
}

function mergeProgress(local, cloud) {
  const vocab = mergeByKey(
    local.vocab, cloud.vocab,
    v => (v.en || '').toLowerCase(),
    (a) => a
  );
  const repaso = mergeByKey(
    local.repaso, cloud.repaso,
    r => (r.en || '').toLowerCase(),
    (a, b) => (((a.misses || 0) + (a.hits || 0)) >= ((b.misses || 0) + (b.hits || 0)) ? a : b)
  );
  return {
    vocab,
    bestScore: Math.max(local.bestScore || 0, cloud.bestScore || 0),
    repaso,
    updatedAt: Date.now()
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' }
  });
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405);
    }

    const profile = await verifyUser(request.headers.get('authorization'));
    if (!profile || !profile.sub) {
      return json({ error: 'unauthorized' }, 401);
    }

    let local;
    try {
      local = await request.json();
    } catch (err) {
      local = {};
    }
    if (!local || typeof local !== 'object') local = {};

    const pathname = `progress/${profile.sub}.json`;

    let cloud = { vocab: [], bestScore: 0, repaso: [] };
    try {
      const result = await get(pathname, { access: 'private' });
      if (result && result.statusCode === 200 && result.stream) {
        const text = await new Response(result.stream).text();
        cloud = JSON.parse(text);
      }
    } catch (err) {
      // no cloud data yet, or transient error — proceed with local only
    }

    const merged = mergeProgress(local, cloud);

    try {
      await put(pathname, JSON.stringify(merged), {
        access: 'private',
        contentType: 'application/json',
        allowOverwrite: true
      });
    } catch (err) {
      return json({ error: 'storage_failed' }, 500);
    }

    return json(merged, 200);
  }
};
