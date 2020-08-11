import { getWebsite, getSession, createSession } from 'lib/db';
import { getClientInfo } from 'lib/request';
import { uuid, isValidId, parseToken } from 'lib/crypto';

export async function verifySession(req) {
  const { payload } = req.body;

  if (!payload) {
    throw new Error('Invalid request');
  }

  const { website: website_uuid, hostname, screen, language, session } = payload;

  const token = await parseToken(session);

  if (!token || !isValidId(website_uuid) || token.website_uuid !== website_uuid) {
    const { userAgent, browser, os, ip, country, device } = await getClientInfo(req, payload);

    if (website_uuid) {
      const website = await getWebsite({ website_uuid });

      if (website) {
        const { website_id } = website;
        const session_uuid = uuid(website_id, hostname, ip, userAgent, os);

        let session = await getSession({ session_uuid });

        if (!session) {
          session = await createSession(website_id, {
            session_uuid,
            hostname,
            browser,
            os,
            screen,
            language,
            country,
            device,
          });
        }

        const { session_id } = session;

        return {
          website_id,
          website_uuid,
          session_id,
          session_uuid,
        };
      } else {
        throw new Error(`Invalid website: ${website_uuid}`);
      }
    }
  }

  return token;
}