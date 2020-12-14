import appConfigVar from './appConfigVar';

export default function saveAppConfig() {
  window.localStorage.setItem(
    'nuffshell.appConfig',
    JSON.stringify(appConfigVar())
  );
}
