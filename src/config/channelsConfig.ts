import LoggerInstance from '../loaders/logger';
import fs from 'fs';

import { checkValidityPrivKey } from '../helpers/cryptoHelper';
const utils = require('../helpers/utilsHelper');

const channelWallets = function loadShowrunnersWallets() {
    LoggerInstance.info(`    -- Checking and Loading Dynamic Channel Keys...`);
    const channelFolderPath = `${__dirname}/../showrunners/`
    const directories = utils.getDirectories(channelFolderPath)

    let channelKeys = {}
    let keys = {}

    for (const channel of directories) {
      const absPath = `${channelFolderPath}${channel}/${channel}Keys.json`
      const relativePath = `../showrunners/${channel}/${channel}Keys.json`

      if (fs.existsSync(absPath)) {
        const object = require(absPath)
        let count = 1;

        channelKeys[`${channel}`] = {};

        for (const [key, value] of Object.entries(object)) {
          const result = checkValidityPrivKey(value);
          if (result) {
            channelKeys[`${channel}`][`wallet${count}`] = value;
            count++;
          }
          else {
            LoggerInstance.info(`         ⚠️  ${key} -> ${value} is invalid private key, skipped`)
          }
        }

        if (Object.keys(channelKeys[`${channel}`]).length) {
          LoggerInstance.info(`     ✔️  ${channel} Loaded ${Object.keys(channelKeys[`${channel}`]).length} Wallet(s)!`)
        }
        else {
          LoggerInstance.info(`     ❌  ${channel} has no wallets attached to them... aborting! Check ${channel}Keys.json!!!`)
          process.exit(1)
        }
      }
      else {
        LoggerInstance.info(`     ❌  ${channel}Keys.json does not exists. aborting! Create ${channel}Keys.json and add one wallet to it!!!`)
        process.exit(1)
      }
    }

    return channelKeys;
};

export default channelWallets;
