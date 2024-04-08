import { useCallback } from 'react';
import invariant from 'tiny-invariant';
import { useSDK } from '@lido-sdk/react';

import { useClientConfig } from 'providers/client-config';
import { CHAINS } from 'utils/chains';

import dynamics from './dynamics';

export const getBackendRPCPath = (chainId: string | number): string => {
  const BASE_URL = typeof window === 'undefined' ? '' : window.location.origin;
  //return `${BASE_URL}/api/rpc?chainId=${chainId}`;
  return 'CUSTOM_RPC_URL';
};

export const useGetRpcUrlByChainId = () => {
  const clientConfig = useClientConfig();

  return useCallback(
    (chainId: CHAINS) => {
      // Needs this condition 'cause in 'providers/web3.tsx' we add `wagmiChains.polygonMumbai` to supportedChains
      // so, here chainId = 80001 is arriving which to raises an invariant
      // chainId = 1 we need anytime!
      if (
        chainId !== CHAINS.Mainnet &&
        !clientConfig.supportedChainIds.includes(chainId)
      ) {
        // Has no effect on functionality. Just a fix.
        // Return empty string as stub
        // (see: 'providers/web3.tsx' --> jsonRpcBatchProvider --> getStaticRpcBatchProvider)
        return '';
      }

      if (dynamics.ipfsMode) {
        const rpc =
          clientConfig.savedClientConfig.rpcUrls[chainId] ||
          clientConfig.prefillUnsafeElRpcUrls[chainId]?.[0];

        invariant(rpc, '[useGetRpcUrlByChainId] RPC is required!');
        return rpc;
      } else {
        return (
          clientConfig.savedClientConfig.rpcUrls[chainId] ||
          getBackendRPCPath(chainId)
        );
      }
    },
    [clientConfig],
  );
};

export const useRpcUrl = () => {
  const { chainId } = useSDK();
  const getRpcUrlByChainId = useGetRpcUrlByChainId();
  return getRpcUrlByChainId(chainId as number);
};
