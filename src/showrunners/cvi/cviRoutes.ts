import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';

import middlewares from '../../api/middlewares';
import { celebrate, Joi } from 'celebrate';
import CviChannel from './cviChannel';


const route = Router();

export default (app: Router) => {
  app.use('/showrunners/cvi', route);

  route.post(
    '/liquidation',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger: any = Container.get('logger');
      Logger.debug('Calling /showrunners/poh ticker endpoint with body: %o', req.body);
      try {
        const cvi = Container.get(CviChannel);
        await cvi.checkForLiquidationRisks(req.body.simulate);
        return res.status(201).json({ success: true });
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  route.post(
    '/price_variations',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger: any = Container.get('logger');
      Logger.debug('Calling /showrunners/poh ticker endpoint with body: %o', req.body);
      try {
        const cvi = Container.get(CviChannel);
        await cvi.checkForPriceVariations(req.body.simulate);
        return res.status(201).json({ success: true });
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );
};
