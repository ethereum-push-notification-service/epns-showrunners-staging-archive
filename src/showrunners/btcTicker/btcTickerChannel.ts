// @name: BTC Tracker Channel
// @version: 1.0
// @recent_changes: BTC Price Tracker


import { Service, Inject } from 'typedi';
import config from '../../config';

import showrunnersHelper from '../../helpers/showrunnersHelper';

import { ethers, logger } from 'ethers';
import epnsHelper, {InfuraSettings, NetWorkSettings, EPNSSettings} from '@epnsproject/backend-sdk-staging'



const bent = require('bent'); // Download library

const infuraSettings: InfuraSettings = {
  projectID: config.infuraAPI.projectID,
  projectSecret: config.infuraAPI.projectSecret
}
const settings: NetWorkSettings = {
  alchemy: config.alchemyAPI,
  infura: infuraSettings,
  etherscan: config.etherscanAPI
}
const epnsSettings: EPNSSettings = {
  network: config.web3RopstenNetwork,
  contractAddress: config.deployedContract,
  contractABI: config.deployedContractABI
}

const NETWORK_TO_MONIOR = config.web3MainnetNetwork;
const btcTickerSettings = require('./btcTickerSettings.json')
@Service()
export default class BtcTickerChannel {
  constructor(
    @Inject('logger') private logger,
  ) {}

  // To form and write to smart contract
  public async sendMessageToContract(simulate) {
    const logger = this.logger;

    var path = require('path');
    const dirname = path.basename(__dirname);
    const wallets = config.showrunnerWallets[`${dirname}`];

    const currentWalletInfo = await showrunnersHelper.getValidWallet(dirname, wallets);
    const walletKeyID = `wallet${currentWalletInfo.currentWalletID}`;
    const walletKey = wallets[walletKeyID];

    const sdk = new epnsHelper(NETWORK_TO_MONIOR, walletKey, settings, epnsSettings);

    this.getNewPrice(logger)
      .then(async (payload:any) => {
        const channelAddress = ethers.utils.computeAddress(walletKey);

        const tx = await sdk.sendNotification(channelAddress, payload.notifTitle, payload.notifMsg, payload.title, payload.msg, payload.type, simulate);
        logger.info(`[${new Date(Date.now())}]-[BTC Ticker]-Transaction: %o`, tx);
      })
      .catch(err => {
        logger.error(`[${new Date(Date.now())}]-[BTC Ticker]- Errored on CMC API... skipped with error: %o`, err)
      });
  }

  public async getNewPrice(logger) {
    logger.debug(`[${new Date(Date.now())}]-[BTC Ticker]-Getting price of btc... `);

    return await new Promise((resolve, reject) => {
      const getJSON = bent('json');

      const cmcroute = 'v1/cryptocurrency/quotes/latest';
      const pollURL = `${btcTickerSettings.cmcEndpoint}${cmcroute}?symbol=BTC&CMC_PRO_API_KEY=${btcTickerSettings.cmcAPIKey}`;

      getJSON(pollURL)
        .then(async (response) => {
          if (response.status.error_code) {
            reject(`[${new Date(Date.now())}]-[BTC Ticker]-CMC Error: ${response.status}`);
          }

          logger.info(`[${new Date(Date.now())}]-[BTC Ticker]-CMC Response: %o`, response);

          // Get data
          const data = response.data["BTC"];

          // construct Title and Message from data
          const price = data.quote.USD.price;
          const formattedPrice = Number(Number(price).toFixed(2)).toLocaleString();

          const hourChange = Number(data.quote.USD.percent_change_1h).toFixed(2);
          const dayChange = Number(data.quote.USD.percent_change_24h).toFixed(2);
          const weekChange = Number(data.quote.USD.percent_change_7d).toFixed(2);

          const title = "BTC at $" + formattedPrice;
          const message = `\nHourly Movement: ${hourChange}%\nDaily Movement: ${dayChange}%\nWeekly Movement: ${weekChange}%`;

          const payloadTitle = `BTC Price Movement`;
          const payloadMsg = `BTC at [d:$${formattedPrice}]\n\nHourly Movement: ${hourChange >= 0 ? "[s:" + hourChange + "%]" : "[t:" + hourChange + "%]"}\nDaily Movement: ${dayChange >= 0 ? "[s:" + dayChange + "%]" : "[t:" + dayChange + "%]"}\nWeekly Movement: ${weekChange >= 0 ? "[s:" + weekChange + "%]" : "[t:" + weekChange + "%]"}[timestamp: ${Math.floor(new Date() / 1000)}]`;

          const payload = {
            type: 1,                                                                  // Type of Notification
            notifTitle: title,                                                              // Title of Notification
            notifMsg: message,                                                            // Message of Notification
            title: payloadTitle,                                                       // Internal Title
            msg: payloadMsg,                                                         // Internal Message
          };

          resolve(payload);
        })
        .catch(err => reject(`Unable to reach CMC API, error: ${err}`));
    });
  }
}
