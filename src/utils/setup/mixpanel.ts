import Mixpanel from "mixpanel";

const mixpanel = Mixpanel.init('095bdc0d5619f37e7f06d70a4eaafa35');
const dev = process.env.NODE_ENV === 'development';

export const reportError = (userId: string, err: any, errMessage?: string) => {
  if (dev) {
    console.log('error: ', err);
    return;
  }
  mixpanel.track('API ERROR', {
    'distint_id': userId,
    'error': err,
    'error message': errMessage
  });
}