import { useQuery } from "@apollo/client";
import appConfigVar from "./appConfigVar";
import GetAppConfig from "./GetAppConfig";
import saveAppConfig from "./saveAppConfig";
import AppConfig from "./AppConfig";

export default function useAppConfig() {
  const {
    data: { appConfig },
  } = useQuery(GetAppConfig) as { data: { appConfig: AppConfig } };

  return {
    isPaused: appConfig.isPaused,
    togglePause() {
      appConfigVar({ ...appConfig, isPaused: !appConfig.isPaused });
      saveAppConfig();
    },
  };
}
