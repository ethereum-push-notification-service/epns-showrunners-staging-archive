import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import YamGovernanceChannel from '../../../showrunners-sdk/yamGovernanceChannel';
import middlewares from '../../middlewares';
import { celebrate, Joi } from 'celebrate';

const route = Router();

export default (app: Router) => {
  app.use('/showrunners-sdk/yamgovernance', route);

  // to add an incoming feed
  route.post(
    '/send_message',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger = Container.get('logger');
      Logger.debug('Calling /showrunners-sdk/yamgovernance ticker endpoint with body: %o', req.body )
      try {
        const yamGovernance = Container.get(YamGovernanceChannel);
        const response = await yamGovernance.sendMessageToContract(req.body.simulate);

        return res.status(201).json(response);
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  route.post(
    '/check_new_proposal',
    celebrate({
      body: Joi.object({
        web3network: Joi.string().required(),
        fromBlock: Joi.number().required(),
        toBlock: Joi.number(),
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger = Container.get('logger');
      Logger.debug('Calling /showrunners-sdk/yamgovernance ticker endpoint with body: %o', req.body )
      try {
        const yamGovernance = Container.get(YamGovernanceChannel);
        const response = await yamGovernance.getNewproposals(req.body.web3network, null, req.body.fromBlock, req.body.toBlock, req.body.simulate);

        return res.status(201).json(response);
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );
};
