import { memo } from 'react';

import { Block } from '@lidofinance/lido-ui';
import { L2Banner } from 'shared/l2-banner';
import { WrapFormStats } from './wrap-stats';
import { WrapFormTxModal } from './wrap-form-tx-modal';
import { WrapFormProvider } from '../wrap-form-context/wrap-form-context';
import { TransactionModalProvider } from 'features/withdrawals/contexts/transaction-modal-context';
import { FormControlled } from './controls/form-controlled';
import { TokenInput } from './controls/token-input';
import { AmountInput } from './controls/amount-input';
import { SubmitButton } from './controls/submit-button';
import { ErrorMessageInputGroup } from './controls/error-message-input-group';

import { MATOMO_CLICK_EVENTS } from 'config';

export const WrapForm: React.FC = memo(() => {
  return (
    <TransactionModalProvider>
      <WrapFormProvider>
        <Block>
          <FormControlled>
            <ErrorMessageInputGroup>
              <TokenInput />
              <AmountInput />
            </ErrorMessageInputGroup>
            <SubmitButton />
            <L2Banner matomoEvent={MATOMO_CLICK_EVENTS.l2BannerWrap} />
          </FormControlled>
          <WrapFormStats />
          <WrapFormTxModal />
        </Block>
      </WrapFormProvider>
    </TransactionModalProvider>
  );
});
