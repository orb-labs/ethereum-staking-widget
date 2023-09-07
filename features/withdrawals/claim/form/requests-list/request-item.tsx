import { forwardRef } from 'react';
import { useWeb3 } from 'reef-knot/web3-react';
import { useFormState, useWatch } from 'react-hook-form';

import { Checkbox, External } from '@lidofinance/lido-ui';
import { FormatToken } from 'shared/formatters';

import { RequestStatus } from './request-item-status';
import { useClaimFormData, ClaimFormInputType } from '../../claim-form-context';

import { getNFTUrl } from 'utils';
import { RequestStyled, LinkStyled } from './styles';

type RequestItemProps = {
  token_id: string;
  name: `requests.${number}.checked`;
  index: number;
} & React.ComponentProps<'input'>;

export const RequestItem = forwardRef<HTMLInputElement, RequestItemProps>(
  ({ token_id, name, disabled, index, ...props }, ref) => {
    const { chainId } = useWeb3();
    const { isSubmitting } = useFormState();
    const { canSelectMore } = useClaimFormData();
    const { checked, status } = useWatch<
      ClaimFormInputType,
      `requests.${number}`
    >({
      name: `requests.${index}`,
    });

    const isDisabled =
      disabled ||
      !status.isFinalized ||
      (!canSelectMore && !checked) ||
      isSubmitting;

    const isClaimable = 'claimableEth' in status;

    const amountValue = isClaimable
      ? status.claimableEth
      : status.amountOfStETH;
    const symbol = isClaimable ? 'ETH' : 'stETH';

    const label = (
      <FormatToken showAmountTip amount={amountValue} symbol={symbol} />
    );

    return (
      <RequestStyled $disabled={isDisabled}>
        <Checkbox
          {...props}
          // TODO: Update Checkbox props in lido-ui
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          label={label}
          disabled={isDisabled}
          name={name}
          ref={ref}
        />
        <RequestStatus status={status.isFinalized ? 'ready' : 'pending'} />
        <LinkStyled href={getNFTUrl(token_id, chainId)}>
          <External />
        </LinkStyled>
      </RequestStyled>
    );
  },
);