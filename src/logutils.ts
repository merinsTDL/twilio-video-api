import { Log } from 'twilio-video';
import { createSelection } from './components/createSelection';
import { log } from './components/log';

export function getCurrentLoggerLevelAsString(logger: Log.Logger): string {
  const currentLevel = logger.getLevel();
  console.log('logger currentLevel = ', currentLevel);
  const levelNumToString = new Map<number, string>();
  levelNumToString.set(logger.levels.TRACE, 'TRACE');
  levelNumToString.set(logger.levels.DEBUG, 'DEBUG');
  levelNumToString.set(logger.levels.INFO, 'INFO');
  levelNumToString.set(logger.levels.WARN, 'WARN');
  levelNumToString.set(logger.levels.ERROR, 'ERROR');
  levelNumToString.set(logger.levels.SILENT, 'SILENT');
  const currentLevelStr = levelNumToString.get(currentLevel) as string;
  return currentLevelStr;
}

export function logLevelSelector({ logger, container } : { logger: Log.Logger, container: HTMLElement }) {
  const options  = Object.keys(logger.levels);
  const currentLevel = getCurrentLoggerLevelAsString(logger);
  const logLevelSelect = createSelection({
    container,
    options,
    title: 'logLevel',
    onChange: () => {
      log(`setting logLevel: ${logLevelSelect.getValue()}`);
      logger.setLevel(logLevelSelect.getValue() as Log.LogLevelDesc);
    }
  });

  logLevelSelect.setValue(currentLevel);
  return logLevelSelect;
}
