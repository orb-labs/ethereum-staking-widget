import { useMemo } from 'react';
import invariant from 'tiny-invariant';
import { formatEther } from '@ethersproject/units';
import { useWeb3 } from 'reef-knot/web3-react';
import { Zero } from '@ethersproject/constants';

import { validateEtherAmount } from 'shared/hook-form/validation/validate-ether-amount';
import { VALIDATION_CONTEXT_TIMEOUT } from 'features/withdrawals/withdrawals-constants';
import { handleResolverValidationError } from 'shared/hook-form/validation/validation-error';
import { validateBignumberMax } from 'shared/hook-form/validation/validate-bignumber-max';
import { validateStakeLimit } from 'shared/hook-form/validation/validate-stake-limit';
import { awaitWithTimeout } from 'utils/await-with-timeout';
import { useAwaiter } from 'shared/hooks/use-awaiter';

import type { Resolver } from 'react-hook-form';
import type {
  StakeFormInput,
  StakeFormNetworkData,
  StakeFormValidationContext,
} from './types';

export const stakeFormValidationResolver: Resolver<
  StakeFormInput,
  Promise<StakeFormValidationContext>
> = async (values, validationContextPromise) => {
  const { amount } = values;
  try {
    invariant(
      validationContextPromise,
      'validation context must be presented as context promise',
    );

    validateEtherAmount('amount', amount, 'ETH');

    const {
      active,
      stakingLimitLevel,
      currentStakeLimit,
      etherBalance,
      gasCost,
      isMultisig,
    } = await awaitWithTimeout(
      validationContextPromise,
      VALIDATION_CONTEXT_TIMEOUT,
    );

    validateStakeLimit('amount', stakingLimitLevel);

    if (active) {
      validateBignumberMax(
        'amount',
        amount,
        etherBalance,
        `Entered ETH amount exceeds your available balance of ${formatEther(
          etherBalance,
        )}`,
      );

      validateBignumberMax(
        'amount',
        amount,
        currentStakeLimit,
        `Entered ETH amount exceeds current staking limit of ${formatEther(
          currentStakeLimit,
        )}`,
      );

      if (!isMultisig) {
        const gasPaddedBalance = etherBalance.sub(gasCost);

        validateBignumberMax(
          'amount',
          Zero,
          gasPaddedBalance,
          `Ensure you have sufficient ETH to cover the gas cost of ${formatEther(
            gasCost,
          )}`,
        );

        validateBignumberMax(
          'amount',
          amount,
          gasPaddedBalance,
          `Enter ETH amount less than ${formatEther(
            gasPaddedBalance,
          )} to ensure you leave enough ETH for gas fees`,
        );
      }
    } else {
      return {
        values,
        errors: { referral: 'wallet not connected' },
      };
    }

    return {
      values,
      errors: {},
    };
  } catch (error) {
    return {
      values,
      errors: {},
    };
    // TODO: uncomment this
    // return handleResolverValidationError(error, 'StakeForm', 'referral');
  }
};

export const useStakeFormValidationContext = (
  networkData: StakeFormNetworkData,
): Promise<StakeFormValidationContext> => {
  const { active } = useWeb3();
  const { stakingLimitInfo, etherBalance, isMultisig, gasCost } = networkData;
  const validationContextAwaited = useMemo(() => {
    if (
      stakingLimitInfo &&
      // we ether not connected or must have all account related data
      (!active || (etherBalance && gasCost && isMultisig !== undefined))
    ) {
      return {
        active,
        stakingLimitLevel: stakingLimitInfo.stakeLimitLevel,
        currentStakeLimit: stakingLimitInfo.currentStakeLimit,
        // condition above guaranties stubs will only be passed when active = false
        etherBalance: etherBalance ?? Zero,
        gasCost: gasCost ?? Zero,
        isMultisig: isMultisig ?? false,
      };
    }
    return undefined;
  }, [active, etherBalance, gasCost, isMultisig, stakingLimitInfo]);

  return useAwaiter(validationContextAwaited).awaiter;
};
