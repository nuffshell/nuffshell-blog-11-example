import AppConfig from './AppConfig';

const initialAppConfig: AppConfig = JSON.parse(
  window.localStorage.getItem('nuffshell.appConfig')
) || {
  isPaused: false
};

export default initialAppConfig;
