import Rollbar from 'rollbar';

import config from './config';

// eslint-disable-next-line import/no-mutable-exports
let rollbar: Rollbar | undefined;
if (config.ROLLBAR_ACCESS_TOKEN) {
  rollbar = new Rollbar({
    accessToken: config.ROLLBAR_ACCESS_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

  rollbar.log('Rollbar is setup');
}

export default rollbar;
