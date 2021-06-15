import { ethers } from 'ethers';

export default {
  // Upload to IPFS
  uploadToIPFS: async (payload: any, logger: any, ipfsGateway: any, simulate: any) => {
    const enableLogs = 0;

    return new Promise(async (resolve, reject) => {
      if (
        simulate &&
        (typeof simulate == 'boolean' ||
          (simulate &&
            typeof simulate == 'object' &&
            simulate.hasOwnProperty('payloadMode') &&
            simulate.payloadMode == 'Simulated'))
      ) {
        logger.verbose('######## SIMULATED IPFS PAYLOAD ########');
        logger.simulate('\n%o\n', payload);
        logger.verbose('################################');
        resolve('[SimulatedIPFSHash]');

        // nothing to do in simulation
        return;
      }

      // Stringify it
      const jsonizedPayload = JSON.stringify(payload);

      const { create } = require('ipfs-http-client')
      const ipfsLocal = '/ip4/0.0.0.0/tcp/5001';
      const ipfsInfura = 'https://ipfs.infura.io:5001';

      let ipfsURL = ipfsGateway? ipfsGateway: (ipfsLocal? ipfsLocal: ipfsInfura);
      let ipfs: any;
      try{
        ipfs = create(ipfsURL);
      }
      catch (err){
        //eg: when url = abcd (invalid)
        if (enableLogs) logger.info(`[${new Date(Date.now())}]- Couldn't connect to ipfs url: %o | Error: %o `, ipfsURL, err);
        ipfsURL = ipfsInfura
        ipfs = create(ipfsURL);
        if (enableLogs) logger.info(`[${new Date(Date.now())}]-Switching to : %o `, ipfsURL);
      }

      const ipfsUpload= async() => {
        await ipfs
        .add(jsonizedPayload)
        .then(async (data: any) => {
          if (enableLogs) logger.info(`[${new Date(Date.now())}]-Success --> uploadToIPFS(): %o `, data);
          if (enableLogs) logger.info(`[${new Date(Date.now())}] - 🚀 CID: %o`, data.cid.toString())
          await ipfs.pin.add(data.cid)
          .then((pinCid: any) => {
            if (enableLogs) logger.info(`[${new Date(Date.now())}]- 🚀 pinCid: %o`, pinCid.toString())
            resolve(pinCid.toString());
          })
          .catch ((err: Error) => {
            if (enableLogs) logger.error(`[${new Date(Date.now())}]-!!!Error --> ipfs.pin.add(): %o`, err);
            reject(err);
          });
        })
        .catch (async (err: Error) => {
          //eg: when url = /ip4/0.0.0.0/tcp/5001 and local ipfs node is not running
          if (enableLogs) logger.info(`[${new Date(Date.now())}]- Couldn't connect to ipfs url: %o | ipfs.add() error: %o`, ipfsURL, err);
          if(ipfsURL !== ipfsInfura){
            ipfsURL = ipfsInfura
            ipfs = create(ipfsURL);
            if (enableLogs) logger.info(`[${new Date(Date.now())}]-Switching to : %o `, ipfsURL);
            await ipfsUpload()
            .then(cid =>{
              resolve(cid)
            })
            .catch(err => {
              if (enableLogs) logger.error(`[${new Date(Date.now())}]-!!!Error --> ipfsUpload(): %o`, err);
              reject(err)
            })
          }
          else{
            reject(err)
          }
        });
      }

      try{
        const cid = await ipfsUpload()
        resolve(cid)
      }
      catch(err){
        if (enableLogs) logger.error(`[${new Date(Date.now())}]-!!!Error --> ipfsUpload(): %o`, err);
        reject(err)
      }
    });
  },
  // Get Interactable Contracts
  getInteractableContracts: (network: any, apiKeys: any, walletPK: any, deployedContract: any, deployedContractABI: any) => {
    const enableLogs = 0;

    const provider = ethers.getDefaultProvider(network, {
      etherscan: apiKeys.etherscanAPI ? apiKeys.etherscanAPI : null,
      infura: apiKeys.infuraAPI
        ? { projectId: apiKeys.infuraAPI.projectID, projectSecret: apiKeys.infuraAPI.projectSecret }
        : null,
      alchemy: apiKeys.alchemyAPI ? apiKeys.alchemyAPI : null,
    });

    const contract = new ethers.Contract(deployedContract, deployedContractABI, provider);

    let contractWithSigner = null;

    if (walletPK) {
      const wallet = new ethers.Wallet(walletPK, provider);
      contractWithSigner = contract.connect(wallet);
    }

    return {
      provider: provider,
      contract: contract,
      signingContract: contractWithSigner,
    };
  },
  // Send Notification to EPNS Contract
  sendNotification: async (
    signingContract: any,
    recipientAddr: any,
    notificationType: any,
    notificationStorageType: any,
    notificationStoragePointer: any,
    waitForTx: any,
    logger: any,
    simulate: any,
  ) => {
    const enableLogs = 0;

    // SIMULATE OBJECT CHECK
    if (simulate && typeof simulate == 'object' && simulate.hasOwnProperty('txOverride')) {
      if (simulate.txOverride.hasOwnProperty('recipientAddr')) recipientAddr = simulate.txOverride.recipientAddr;
      if (simulate.txOverride.hasOwnProperty('notificationType'))
        notificationType = simulate.txOverride.notificationType;
      if (simulate.txOverride.hasOwnProperty('notificationStorageType'))
        notificationStorageType = simulate.txOverride.notificationStorageType;
    }

    return new Promise((resolve, reject) => {
      // Create Transaction
      const identity = notificationType + '+' + notificationStoragePointer;
      const identityBytes = ethers.utils.toUtf8Bytes(identity);

      // Ensure Backward Compatibility
      if (
        simulate &&
        (typeof simulate == 'boolean' ||
          (typeof simulate == 'object' && simulate.hasOwnProperty('txMode') && simulate.txMode == 'Simulated'))
      ) {
        // Log the notification out
        const txSimulated = {
          recipientAddr: recipientAddr,
          notificationType: notificationType,
          notificationStoragePointer: notificationStoragePointer,
          pushType: 1,
          hash: 'SimulatedTransaction!!!',
        };

        logger.debug('######## SIMULATED TRANSACTION ########');
        logger.debug('\n%o\n', txSimulated);
        logger.debug('################################');

        resolve(txSimulated);

        // nothing to do in simulation
        return;
      }

      const txPromise = signingContract.sendNotification(recipientAddr, identityBytes);

      txPromise
        .then(async function (tx: any) {
          if (enableLogs) logger.info('Transaction sent: %o', tx);

          if (waitForTx) {
            await tx.wait(waitForTx);
          }

          if (enableLogs) logger.info('Transaction mined: %o | Notification Sent', tx.hash);

          resolve(tx);
        })
        .catch((err: Error) => {
          if (enableLogs) logger.error('Unable to complete transaction, error: %o', err);

          reject(`Unable to complete transaction, error: ${err}`);
        });
    });
  },
  // Prepare Payload for Notification
  preparePayload: async (recipientAddr: any, payloadType: any, title: any, body: any, payloadTitle: any, payloadMsg: any, payloadCTA: any, payloadImg: any) => {
    const enableLogs = 0;

    return new Promise((resolve, reject) => {
      let ntitle = title.toString();
      let nbody = body.toString();

      let dtype = payloadType.toString();
      let dsecret = '';
      let dsub = payloadTitle ? payloadTitle.toString() : '';
      let dmsg = payloadMsg ? payloadMsg.toString() : '';
      let dcta = payloadCTA ? payloadCTA.toString() : '';
      let dimg = payloadImg ? payloadImg.toString() : '';

      const payload = {
        notification: {
          title: ntitle,
          body: nbody,
        },
        data: {
          type: dtype,
          secret: dsecret,
          asub: dsub,
          amsg: dmsg,
          acta: dcta,
          aimg: dimg,
        },
      };

      resolve(payload);
    });
  },
};