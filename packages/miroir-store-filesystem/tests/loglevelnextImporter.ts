import log from 'loglevelnext';
import { LoggerFactoryInterface } from 'miroir-core';

export const loglevelnext: LoggerFactoryInterface = log as any as LoggerFactoryInterface;