// Do Scheduling
// https://github.com/node-schedule/node-schedule
// *    *    *    *    *    *
// ┬    ┬    ┬    ┬    ┬    ┬
// │    │    │    │    │    │
// │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
// │    │    │    │    └───── month (1 - 12)
// │    │    │    └────────── day of month (1 - 31)
// │    │    └─────────────── hour (0 - 23)
// │    └──────────────────── minute (0 - 59)
// └───────────────────────── second (0 - 59, OPTIONAL)
// Execute a cron job every 5 Minutes = */5 * * * *
// Starts from seconds = * * * * * *

import config from '../../config';
import logger from '../../loaders/logger';

import { Container } from 'typedi';
import schedule from 'node-schedule';

import EthTickerChannel from './ethTickerChannel';

export default () => {
  const startTime = new Date(new Date().setHours(0, 0, 0, 0));

  const sixHourRule = new schedule.RecurrenceRule();
  sixHourRule.hour = new schedule.Range(0, 23, 6);
  sixHourRule.minute = 0;
  sixHourRule.second = 0;

  // 1 ETH TICKER CHANNEL
  logger.info(`     🛵 Scheduling Showrunner - ETH Ticker Channel [on 6 Hours] [${new Date(Date.now())}]`);
  schedule.scheduleJob({ start: startTime, rule: sixHourRule }, async function () {
    const ethTicker = Container.get(EthTickerChannel);
    const taskName = 'ETH Ticker Fetch and sendMessageToContract()';

    try {
      await ethTicker.sendMessageToContract(true);
      logger.info(`[${new Date(Date.now())}] 🐣 Cron Task Completed -- ${taskName}`);
    }
    catch (err) {
      logger.error(`[${new Date(Date.now())}] ❌ Cron Task Failed -- ${taskName}`);
      logger.error(`[${new Date(Date.now())}] Error Object: %o`, err);
    }
  });
};
