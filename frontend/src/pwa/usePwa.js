import { useSwUpdate } from './useSwUpdate';
import { initPush } from './usePush';

export function usePwa() {
  const { needRefresh, refresh, dismiss } = useSwUpdate();

  const init = () => {
    useSwUpdate().init();
    initPush();
  };

  return {
    needRefresh,
    refresh,
    dismiss,
    init,
  };
}