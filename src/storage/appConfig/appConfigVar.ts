import { makeVar } from '@apollo/client';
import AppConfig from './AppConfig';
import initialAppConfig from './initialAppConfig';

const appConfigVar = makeVar<AppConfig>(initialAppConfig);

export default appConfigVar;
