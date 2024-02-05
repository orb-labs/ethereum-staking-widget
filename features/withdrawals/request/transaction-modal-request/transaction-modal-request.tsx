import { useMemo } from 'react';

import { TransactionModal } from 'shared/transaction-modal/transaction-modal';
import {
  TxStagePending,
  TxStageSign,
  TxStagePermit,
  TxStageFail,
  TxStageBunker,
  TxStageSuccessMultisig,
} from 'shared/transaction-modal/tx-stages-basic';
import {
  useTransactionModal,
  TX_STAGE,
  TX_OPERATION,
} from 'shared/transaction-modal';

import { getTokenDisplayName } from 'utils/getTokenDisplayName';
import { TxRequestStageSuccess } from './tx-stage-request-success';
import { FormatToken } from 'shared/formatters';

export const TransactionModalRequest = () => {
  const modalState = useTransactionModal();
  const content = useMemo(() => {
    const {
      dispatchModalState,
      onRetry,
      amount: requestAmount,
      token,
      txHash,
      errorText,
      dialog,
      txStage,
      txOperation,
    } = modalState;

    const tokenName = token ? getTokenDisplayName(token) : '';

    const amountEl = requestAmount && (
      <FormatToken amount={requestAmount} symbol={tokenName} trimEllipsis />
    );

    // if more dialogs are added convert to switch on dialog type
    if (dialog)
      return (
        <TxStageBunker
          onClick={() => dialog.onOk}
          onClose={
            dialog.onClose
              ? () => {
                  dispatchModalState({ type: 'close_modal' });
                  dialog.onClose?.();
                }
              : undefined
          }
        />
      );

    const approvingTitle = <>You are now approving {amountEl}</>;
    const approvingSingDescription = <>Approving for {amountEl}</>;

    const withdrawalTitle = <>You are requesting withdrawal for {amountEl}</>;
    const withdrawalSingDescription = <>Requesting withdrawal for {amountEl}</>;

    const renderSign = () => {
      switch (txOperation) {
        case TX_OPERATION.APPROVE:
          return (
            <TxStageSign
              title={approvingTitle}
              description={approvingSingDescription}
            />
          );
        case TX_OPERATION.CONTRACT:
          return (
            <TxStageSign
              title={withdrawalTitle}
              description={withdrawalSingDescription}
            />
          );
        case TX_OPERATION.PERMIT:
          return <TxStagePermit />;
        default:
          return null;
      }
    };

    const renderBlock = () => {
      switch (txOperation) {
        case TX_OPERATION.APPROVE:
          return <TxStagePending txHash={txHash} title={approvingTitle} />;
        case TX_OPERATION.CONTRACT:
          return <TxStagePending txHash={txHash} title={withdrawalTitle} />;
        default:
          return null;
      }
    };

    switch (txStage) {
      case TX_STAGE.SIGN:
        return renderSign();
      case TX_STAGE.BLOCK:
        return renderBlock();
      case TX_STAGE.SUCCESS:
        return (
          <TxRequestStageSuccess
            txHash={txHash}
            tokenName={tokenName}
            amount={amountEl}
          />
        );
      case TX_STAGE.SUCCESS_MULTISIG:
        return <TxStageSuccessMultisig />;
      case TX_STAGE.FAIL:
        return (
          <TxStageFail
            failedText={errorText}
            onClickRetry={onRetry ?? undefined}
          />
        );
      default:
        return null;
    }
  }, [modalState]);

  return (
    <TransactionModal
      open={modalState.isModalOpen}
      onClose={() => modalState.dispatchModalState({ type: 'close_modal' })}
      txStage={modalState.txStage}
    >
      {content}
    </TransactionModal>
  );
};