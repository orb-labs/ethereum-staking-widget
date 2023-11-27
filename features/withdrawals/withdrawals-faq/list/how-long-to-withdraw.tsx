import { FC } from 'react';
import { Accordion } from '@lidofinance/lido-ui';
import Link from 'next/link';
import { LocalLink } from 'shared/components/local-link';
import { WITHDRAWAL_PERIOD_PATH } from 'features/withdrawals/withdrawals-constants';
import { WITHDRAWALS_CLAIM_PATH, WITHDRAWALS_REQUEST_PATH } from 'config/urls';
import { NoBr } from '../styles';

export const HowLongToWithdraw: FC = () => {
  return (
    <Accordion summary="How long does it take to withdraw?">
      <p>
        Under normal circumstances, the stETH/wstETH withdrawal period can take
        anywhere between <NoBr>1-5 days</NoBr>. After that, you can claim your
        ETH using the&nbsp;
        <LocalLink href={WITHDRAWALS_CLAIM_PATH}>Claim&nbsp;tab</LocalLink>. On{' '}
        <LocalLink href={WITHDRAWALS_REQUEST_PATH}>Request&nbsp;tab</LocalLink>{' '}
        interface, you can see the current estimation of the withdrawal waiting
        time for new requests. The withdrawal request time depends on the
        requested amount, the overall amount of stETH in the queue, and{' '}
        <Link href={WITHDRAWAL_PERIOD_PATH}>other&nbsp;factors</Link>.
      </p>
    </Accordion>
  );
};