import { Service, Inject, Container } from 'typedi';
import config from '../config';
import { EventDispatcher, EventDispatcherInterface } from '../decorators/eventDispatcher';

import { BigNumber, ethers, logger, Wallet } from 'ethers';

const NETWORK_TO_MONITOR = config.web3RopstenNetwork;
const ETHER_TRANSFER_AMOUNT = String(config.etherTransferAmount);
const ETH_THRESHOLD = Number(config.ethThreshold);
const provider = ethers.getDefaultProvider(NETWORK_TO_MONITOR, {
      etherscan: (config.etherscanAPI ? config.etherscanAPI : null),
      infura: (config.infuraAPI ? {projectId: config.infuraAPI.projectID, projectSecret: config.infuraAPI.projectSecret} : null),
      alchemy: (config.alchemyAPI ? config.alchemyAPI : null),
});

const MAIN = new Wallet(config.ensDomainExpiryPrivateKey, provider)
const WALLLETS = {
  'ens':{
    wallet: new Wallet(config.ensDomainExpiryPrivateKey, provider)
  },
  'btcTicker':{
    wallet: new Wallet(config.btcTickerPrivateKey, provider)
  },
  'ethTicker':{
    wallet: new Wallet(config.ethTickerPrivateKey, provider)
  },
  'everest':{
    wallet: new Wallet(config.everestPrivateKey, provider)
  },
  'compound':{
    wallet: new Wallet(config.compComptrollerPrivateKey, provider)
  },
  'walletTracker':{
    wallet: new Wallet(config.walletTrackerPrivateKey, provider)
  },
  'gasStation':{
    wallet: new Wallet(config.ethGasStationPrivateKey, provider)
  },
}

@Service()
export default class WalletTrackerChannel {
  constructor(
    @Inject('logger') private logger,
    @Inject('cached') private cached,
    @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
  ) {
  }

  public async processWallets(simulate) {
    const cache = this.cached;
    const logger = this.logger;
    const TransferPromise = []

    for (const [name, value] of Object.entries(WALLLETS)) {
      logger.info(`checking balance for ${name} wallet..`); 
      const balance = ethers.utils.formatEther(await value.wallet.getBalance())
      logger.info(`balance for ${name} wallet is ${balance.toString()}: threshold is ${ETH_THRESHOLD}..`); 
      if (Number(balance.toString()) < ETH_THRESHOLD) {
        TransferPromise.push(this.transfertoWallet(simulate, name, value.wallet))
      }
    }
    logger.info(`done with all wallets..`); 
    return Promise.all(TransferPromise);
  }

  public async transfertoWallet(simulate, name, wallet): Promise<ethers.providers.TransactionReceipt> {
    const logger = this.logger;
    logger.info(`transferring from main wallet to ${name} wallet..`); 
    if (simulate) {
      logger.info(`
        {
          to: ${wallet.address},
          value: ${ethers.utils.parseEther(ETHER_TRANSFER_AMOUNT)}
        };
      `); 
    } else {
      let tx = {
        to: wallet.address,
        value: ethers.utils.parseEther(ETHER_TRANSFER_AMOUNT)
      };
      const transaction = await MAIN.sendTransaction(tx);
      return transaction.wait();
    }
  }
}