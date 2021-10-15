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
import { RabbitHoleChannel } from './rabbitholeChannel';


export default () => {
  const startTime = new Date(new Date().setHours(0, 0, 0, 0));

  const dailyRule = new schedule.RecurrenceRule();
  dailyRule.hour = 0;
  dailyRule.minute = 0;
  dailyRule.second = 0;
  dailyRule.dayOfWeek = new schedule.Range(0, 6);

  logger.info(`[${new Date(Date.now())}] -- 🛵 Scheduling Showrunner - Rabbit Hole Channel [on 2.5 Minutes]`);

  // 1.11 YAM-GOVERNANCE CHANNEL
  schedule.scheduleJob({ start: startTime, rule: dailyRule }, async function() {
    const rabbitholeChannel = Container.get(RabbitHoleChannel);
    const taskName = 'Yam Governance event checks and sendMessageToContract()';

    try {
     

      logger.info(`[${new Date(Date.now())}] 🐣 Cron Task Completed -- ${taskName}`);
    } catch (err) {
      logger.error(`[${new Date(Date.now())}] ❌ Cron Task Failed -- ${taskName}`);

      logger.error(`[${new Date(Date.now())}] Error Object: %o`, err);
    }
  });
};
