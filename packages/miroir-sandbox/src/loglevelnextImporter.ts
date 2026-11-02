import log from 'loglevelnext';
import { LoggerFactoryInterface } from '@miroir-framework/core';

export const loglevelnext: LoggerFactoryInterface = log as any as LoggerFactoryInterface;
