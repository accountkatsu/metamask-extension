import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { EditGasModes } from '../../../../../../../../shared/constants/gas';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { currentConfirmationSelector } from '../../../../../../../selectors';
import EditGasPopover from '../../../../edit-gas-popover';
import { useSupportsEIP1559 } from '../../hooks/useSupportsEIP1559';
import { GasFeesDetails } from '../gas-fees-details/gas-fees-details';

const LegacyTransactionGasModal = ({
  closeCustomizeGasPopover,
  transactionMeta,
}: {
  closeCustomizeGasPopover: () => void;
  transactionMeta: TransactionMeta;
}) => {
  return (
    <EditGasPopover
      onClose={closeCustomizeGasPopover}
      mode={EditGasModes.modifyInPlace}
      transaction={transactionMeta}
    />
  );
};

export const GasFeesSection = () => {
  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const [showCustomizeGasPopover, setShowCustomizeGasPopover] = useState(false);
  const closeCustomizeGasPopover = useCallback(
    () => setShowCustomizeGasPopover(false),
    [setShowCustomizeGasPopover],
  );

  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      <GasFeesDetails setShowCustomizeGasPopover={setShowCustomizeGasPopover} />
      {!supportsEIP1559 && showCustomizeGasPopover && (
        <LegacyTransactionGasModal
          closeCustomizeGasPopover={closeCustomizeGasPopover}
          transactionMeta={transactionMeta}
        />
      )}
    </ConfirmInfoSection>
  );
};
