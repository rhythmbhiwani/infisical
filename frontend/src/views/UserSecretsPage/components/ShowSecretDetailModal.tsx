import { faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { IconButton, Modal, ModalContent } from "@app/components/v2";
import { TUserSecret, UserSecretType, userSecretTypeOptions } from "@app/hooks/api/userSecrets";
import { UsePopUpState } from "@app/hooks/usePopUp";

import { DataField } from "./DataField";

type Props = {
  popUp: UsePopUpState<["showSecretData"]>;
  handlePopUpClose: (popUpName: keyof UsePopUpState<["showSecretData"]>) => void;
};

export const ShowSecretDetailModal = ({ popUp, handlePopUpClose }: Props) => {
  const secretData = popUp.showSecretData?.data?.secretValue as TUserSecret;

  if (!secretData) return null;

  return (
    <Modal
      isOpen={popUp?.showSecretData?.isOpen}
      onOpenChange={() => {
        handlePopUpClose("showSecretData");
      }}
    >
      <ModalContent
        title={userSecretTypeOptions.find((opt) => opt.value === secretData.secretType)?.label}
      >
        <DataField label="Name" value={secretData.name} />

        {secretData.secretType === UserSecretType.WEB_LOGIN && (
          <>
            <DataField
              label="Login URL"
              value={secretData.data.loginURL}
              buttonOverride={
                <IconButton
                  ariaLabel="Open Link"
                  colorSchema="secondary"
                  className="group relative ml-2"
                  onClick={() => {
                    if (secretData.data.loginURL) {
                      window.open(secretData.data.loginURL, "_blank");
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faExternalLink} />
                </IconButton>
              }
            />
            <DataField label="Username / Email" value={secretData.data.username} />
            <DataField label="Password" value={secretData.data.password} />
          </>
        )}

        {secretData.secretType === UserSecretType.CREDIT_CARD && (
          <>
            <DataField label="Card Number" value={secretData.data.cardNumber} />
            <DataField label="Card Expiry Date" value={secretData.data.cardExpiry} />
            <DataField label="Card CVV" value={secretData.data.cardCvv} />
          </>
        )}

        {secretData.secretType === UserSecretType.SECURE_NOTE && (
          <DataField label="Note" value={secretData.data.secureNote} />
        )}

        {secretData.secretType === UserSecretType.WIFI && (
          <DataField label="Wifi Password" value={secretData.data.wifiPassword} />
        )}
      </ModalContent>
    </Modal>
  );
};
