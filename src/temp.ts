import log from 'logLevel';
import { Logger } from 'twilio-video';
function foo() {
  const logger = log.getLogger('foo');
  newFunction(logger);
}

function newFunction(logger: log.Logger) {
  {
    logger.info('foo');
  }
}
