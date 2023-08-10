import authHandler from '@/utils/authHandler';
import runMiddleware from '@/utils/setup/middleware';
import { handleBlobUpload, type HandleBlobUploadBody } from '@vercel/blob';
import type { NextApiResponse, NextApiRequest } from 'next';
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await runMiddleware(req, res);
  const body = (req.body) as HandleBlobUploadBody;
 
  try {
    const jsonResponse = await handleBlobUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Generate a client token for the browser to upload the file
        let userData;
        try {
          userData = await authHandler(req);
        } catch (e: any) {
          console.log('there is an error: ', e);
          throw new Error('Could not get user data');
        }
        if (!userData) throw new Error('Invalid Auth');
        // ⚠️ Authenticate users before reaching this point.
        // Otherwise, you're allowing anonymous uploads.
        // const { user, userCanUpload } = await auth(req, pathname);
        // if (!userCanUpload) {
        //   throw new Error('not authenticated or bad pathname');
        // }
 
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif'],
          metadata: JSON.stringify({
            // optional, sent to your server on upload completion
            userId: userData.userId,

          }),
        };
      },
      onUploadCompleted: async ({ blob, metadata }) => {
        // Get notified of browser upload completion
        // ⚠️ This will not work on `localhost` websites,
        // Use ngrok or similar to get the full upload flow
        console.log('blob upload completed', blob, metadata, body);
 
        try {
          // Run any logic after the file upload completed
          // const { userId } = JSON.parse(metadata);
          // await db.update({ avatar: blob.url, userId });
        } catch (error) {
          throw new Error('Could not update user');
        }
      },
    });
 
    return res.status(200).json(jsonResponse);
  } catch (error) {
    // The webhook will retry 5 times waiting for a 200
    return res.status(400).json({ error: (error as Error).message });
  }
}