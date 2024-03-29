import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';

import { celebrate, Joi } from 'celebrate';

import Bzx from "./bzxChannel"
import middlewares from '../../api/middlewares';
import { handleResponse } from '../../helpers/utilsHelper';

const route = Router();

export default (app: Router) => {
    app.use('/showrunners-sdk/bzx', route);

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
            Logger.debug('Calling /showrunners-sdk/bzx/send_message ticker endpoint with body: %o', req.body )
            try{
                const bzx = Container.get(Bzx);
                const response = await bzx.sendMessageToContract(req.body.simulate);

                return res.status(201).json(response);
            } catch (e) {
                Logger.error('🔥 error: %o', e);
                return next(e);
            }
        }
    )

    // to get token price
    route.post(
        '/get_price',
        celebrate({
            body: Joi.object({
              simulate: [Joi.bool(), Joi.object()],
            }),
        }),
        middlewares.onlyLocalhost,
        async (req: Request, res: Response, next: NextFunction) => {
            const Logger = Container.get('logger');
            Logger.debug('Calling /showrunners-sdk/bzx/get_price ticker endpoint with body: %o', req.body )
            try{
                const bzx = Container.get(Bzx);
                const response = await bzx.getPrice(null, req.body.simulate);

                return res.status(201).json(response);
            } catch (e) {
                Logger.error('🔥 error: %o', e);
                return next(e);
            }
        }
    )
}