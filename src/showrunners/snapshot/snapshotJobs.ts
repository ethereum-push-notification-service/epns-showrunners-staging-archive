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

import SnapshotChannel from "./snapshotChannel"

export default () => {
    const startTime = new Date(new Date().setHours(0, 0, 0, 0));

    const threeHourRule = new schedule.RecurrenceRule();
    threeHourRule.hour = new schedule.Range(0, 23, 3);
    threeHourRule.minute = 0;
    threeHourRule.second = 0;

    const dailyRule = new schedule.RecurrenceRule();
    dailyRule.hour = 0;
    dailyRule.minute = 0;
    dailyRule.second = 0;
    dailyRule.dayOfWeek = new schedule.Range(0, 6);

    //Snapshot send proposal
    // logger.info('-- 🛵 Scheduling Showrunner - Snapshot Governance Channel [on 3hr ]');
    // schedule.scheduleJob({ start: startTime, rule: threeHourRule }, async function () {
    //     const snapshot = Container.get(SnapshotChannel);
    //     const taskName = 'Snapshot proposal event checks and sendMessageToContract()';
    //     try {
    //         await snapshot.sendMessageToContract(false);
    //         logger.info(`🐣 Cron Task Completed -- ${taskName}`);
    //     }
    //     catch (err) {
    //         logger.error(`❌ Cron Task Failed -- ${taskName}`);
    //         logger.error(`Error Object: %o`, err);
    //     }
    // })

    // //Snapshot save delegates
    // logger.info('-- 🛵 Scheduling Showrunner - Snapshot Governance Channel [on 6 Hours]');
    // schedule.scheduleJob({ start: startTime, rule: dailyRule }, async function () {
    //     const snapshot = Container.get(SnapshotChannel);
    //     const taskName = 'Snapshot checking new delegates';
    //     try {
    //         await snapshot.fetchDelegateAndSaveToDB();
    //         logger.info(`🐣 Cron Task Completed -- ${taskName}`);
    //     }
    //     catch (err) {
    //         logger.error(`❌ Cron Task Failed -- ${taskName}`);
    //         logger.error(`Error Object: %o`, err);
    //     }
    // })
}