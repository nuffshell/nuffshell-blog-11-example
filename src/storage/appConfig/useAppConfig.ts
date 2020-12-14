import { useQuery } from '@apollo/client';
import appConfigVar from './appConfigVar';
import GetAppConfig from './GetAppConfig';
import saveAppConfig from './saveAppConfig';

export default function useAppConfig() {
  const {
    data: { appConfig }
  } = useQuery(GetAppConfig);

  return {
    isPaused: appConfig.isPaused,
    togglePause() {
      appConfigVar({ ...appConfig, isPaused: !appConfig.isPaused });
      saveAppConfig();
    }
  };
}
