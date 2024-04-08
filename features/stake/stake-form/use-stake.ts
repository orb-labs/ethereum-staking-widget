import { useSDK, useSTETHContractWeb3 } from '@lido-sdk/react';
import { BigNumber } from 'ethers';
import { useCallback, useMemo } from 'react';
import { useWeb3 } from 'reef-knot/web3-react';
import invariant from 'tiny-invariant';
import { useTransaction } from '@orbykit/react';

import { enableQaHelpers, runWithTransactionLogger } from 'utils';
import { getErrorMessage } from 'utils/getErrorMessage';
import { isContract } from 'utils/isContract';
import { TX_OPERATION, useTransactionModal } from 'shared/transaction-modal';
import { MockLimitReachedError, getAddress, applyGasLimitRatio } from './utils';
import { getFeeData } from 'utils/getFeeData';

import { useCurrentStaticRpcProvider } from 'shared/hooks/use-current-static-rpc-provider';
import { STAKE_FALLBACK_REFERRAL_ADDRESS } from 'config';
import { FungibleToken, FungibleTokenAmount } from '@orbykit/core';
import { SendTransactionResult } from '@wagmi/core';

type StakeArguments = {
  amount: BigNumber | null;
  referral: string | null;
};

type StakeOptions = {
  onConfirm?: () => Promise<void> | void;
  onSubmissionCompletion: (isSuccessful: boolean) => void;
};

export const useStake = ({
  onConfirm,
  onSubmissionCompletion,
}: StakeOptions) => {
  const stethContractWeb3 = useSTETHContractWeb3();
  const { account, chainId } = useWeb3();
  const { staticRpcProvider } = useCurrentStaticRpcProvider();
  const { providerWeb3, providerRpc } = useSDK();
  const { dispatchModalState } = useTransactionModal();
  const { previewTransaction, updateTransactionDetails, status } =
    useTransaction();
  const nativeETH = useMemo(() => {
    if (!chainId) return undefined;

    return new FungibleToken(
      chainId,
      '0x',
      18,
      'ETH',
      'Ethereum',
      undefined,
      true,
    );
  }, []);

  const onConfirmCallback = useCallback(
    async (
      isSuccessful: boolean,
      transaction?: SendTransactionResult,
      error?: string,
    ) => {
      if (isSuccessful) {
        dispatchModalState({ type: 'block', txHash: transaction?.hash });
        await runWithTransactionLogger('Wrap block confirmation', () =>
          transaction!.wait(),
        );

        dispatchModalState({ type: 'success' });
      } else {
        dispatchModalState({ type: 'error', errorText: error });
      }

      await onConfirm?.();

      onSubmissionCompletion?.(isSuccessful);
    },
    [],
  );

  return useCallback(
    async ({ amount, referral }: StakeArguments): Promise<boolean> => {
      try {
        invariant(amount, 'amount is null');
        invariant(chainId, 'chainId is not defined');
        invariant(account, 'account is not defined');
        invariant(providerWeb3, 'providerWeb3 not defined');
        invariant(stethContractWeb3, 'steth is not defined');

        if (
          enableQaHelpers &&
          window.localStorage.getItem('mockLimitReached') === 'true'
        ) {
          throw new MockLimitReachedError('Stake limit reached');
        }

        const [isMultisig, referralAddress] = await Promise.all([
          isContract(account, providerRpc),
          referral
            ? getAddress(referral, providerRpc)
            : STAKE_FALLBACK_REFERRAL_ADDRESS,
        ]);

        const callback = async () => {
          if (isMultisig) {
            const tx = await stethContractWeb3.populateTransaction.submit(
              referralAddress,
              {
                value: amount,
              },
            );
            return providerWeb3.getSigner().sendUncheckedTransaction(tx);
          } else {
            if (!nativeETH) {
              throw new Error('Native ETH not defined');
            }

            const { maxFeePerGas, maxPriorityFeePerGas } =
              await getFeeData(staticRpcProvider);
            const overrides = {
              value: amount,
              maxPriorityFeePerGas,
              maxFeePerGas,
            };

            // estimateGas errors if there not enough ETH in the account. Given we know the
            // gas consumption for the deposit function we ca hardcode it here without calling the contract
            const gasLimit = applyGasLimitRatio(BigNumber.from(100_000));
            const tx = await stethContractWeb3.populateTransaction.submit(
              referralAddress,
              {
                ...overrides,
                gasLimit,
              },
            );

            updateTransactionDetails(
              {
                ...tx,
                gasLimit: String(tx.gasLimit),
                gasPrice: String(tx.gasPrice),
                value: String(tx.value),
                maxFeePerGas: String(tx.maxFeePerGas),
                maxPriorityFeePerGas: String(tx.maxPriorityFeePerGas),
                enableCcipRead: tx.ccipReadEnabled,
                chainId: BigInt(chainId),
                destinationName: 'LIDO',
              },
              onConfirmCallback,
            );

            previewTransaction();
          }
        };

        await runWithTransactionLogger('Stake signing', callback);

        if (isMultisig) {
          dispatchModalState({ type: 'success_multisig' });
          return true;
        }

        return true;
      } catch (error) {
        console.warn(error);
        dispatchModalState({
          type: 'error',
          errorText: getErrorMessage(error),
        });
        return false;
      }
    },
    [
      account,
      chainId,
      dispatchModalState,
      onConfirm,
      providerRpc,
      providerWeb3,
      stethContractWeb3,
      staticRpcProvider,
    ],
  );
};
