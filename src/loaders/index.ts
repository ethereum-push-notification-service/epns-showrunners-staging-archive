import expressLoader from './express';
import dependencyInjectorLoader from './dependencyInjector';
import fs from 'fs';

import config from '../config';

import logger from './logger';

import mongooseLoader from './mongoose';
import jobsLoader from './jobs';
import dbLoader from './db';
import dbListenerLoader from './dbListener';
const utils = require('../helpers/utilsHelper');

//We have to import at least all the events once so they can be triggered
import './events';

export default async ({ expressApp }) => {
  logger.info('✌️   Injecting dependencies loaders');

  //require db models from all channel folders
  function loadDBModels(){
    logger.info(`    -- Checking DB Models...`);
    const channelFolderPath = `${__dirname}/../showrunners/`
    const directories = utils.getDirectories(channelFolderPath)
    let channelModels = []

    for (const channel of directories) {
      const absPath = `${channelFolderPath}${channel}/${channel}Model.ts`
      const relativePath = `../showrunners/${channel}/${channel}Model.ts`

      if (fs.existsSync(absPath)) {
        const object = require(absPath).default
        channelModels.push({
          name: `${channel}Model`,
          model: object
        })
        logger.info(`     ✔️  ${relativePath} Found!`)
      }
      else {
        logger.info(`     ❌  ${relativePath} Not Found... skipped`)
      }
    }
    return channelModels;
  } 
  const models = loadDBModels()

  // It returns the agenda instance because it's needed in the subsequent loaders
  await dependencyInjectorLoader({ models });
  logger.info('✔️   Dependency Injector loaded');

  const mongoConnection = await mongooseLoader();
  logger.info('✔️   Mongoose Loaded and connected!');

  const pool = await dbLoader();
  logger.info('✔️   Database connected!');
  logger.info('✌️   Loading DB Events listener');
  await dbListenerLoader({ pool, logger });
  logger.info('✔️   DB Listener loaded!');

  logger.info('✌️   Loading jobs');
  await jobsLoader({ logger });
  logger.info('✔️   Jobs loaded');

  await expressLoader({ app: expressApp });
  logger.info('✔️   Express loaded');
};
