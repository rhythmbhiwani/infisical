import React, { useState } from "react";
import Head from "next/head";

import { createNotification } from "@app/components/notifications";
import { DeleteActionModal } from "@app/components/v2";
import { usePopUp } from "@app/hooks";
import { useDeleteUserSecret, UserSecretType } from "@app/hooks/api/userSecrets";

import { ActionBar } from "./ActionBar";
import { AddUserSecretModal } from "./AddUserSecretModal";
import { ShowSecretDetailModal } from "./ShowSecretDetailModal";
import { UserSecretsTable } from "./UserSecretsTable";

type DeleteModalData = { name: string; id: string };

export const UserSecretsSection = () => {
  const [search, setSearch] = useState("");
  const [filterSecretType, setFilterSecretType] = useState<UserSecretType | null>(null);

  const deleteuserSecret = useDeleteUserSecret();

  const { popUp, handlePopUpToggle, handlePopUpClose, handlePopUpOpen } = usePopUp([
    "addOrUpdateUserSecret",
    "deleteUserSecretConfirmation",
    "showSecretData"
  ] as const);

  const onDeleteApproved = async () => {
    try {
      deleteuserSecret.mutateAsync({
        id: (popUp?.deleteUserSecretConfirmation?.data as DeleteModalData)?.id
      });
      createNotification({
        text: "Successfully deleted the secret",
        type: "success"
      });

      handlePopUpClose("deleteUserSecretConfirmation");
    } catch (err) {
      console.error(err);
      createNotification({
        text: "Failed to delete shared secret",
        type: "error"
      });
    }
  };
  return (
    <>
      <Head>
        <title>User Secrets</title>
        <link rel="icon" href="/infisical.ico" />
        <meta property="og:image" content="/images/message.png" />
      </Head>

      <div className="mb-6 rounded-lg">
        <ActionBar
          selectedTypeFilter={filterSecretType}
          setTypeFilter={setFilterSecretType}
          searchOnChange={setSearch}
          handlePopUpOpen={handlePopUpOpen}
        />
        <UserSecretsTable
          selectedTypeFilter={filterSecretType}
          search={search}
          handlePopUpOpen={handlePopUpOpen}
        />
      </div>

      <AddUserSecretModal popUp={popUp} handlePopUpClose={handlePopUpClose} />
      <ShowSecretDetailModal popUp={popUp} handlePopUpClose={handlePopUpClose} />
      <DeleteActionModal
        isOpen={popUp.deleteUserSecretConfirmation.isOpen}
        title={`Delete ${
          (popUp?.deleteUserSecretConfirmation?.data as DeleteModalData)?.name || " "
        }?`}
        onChange={(isOpen) => handlePopUpToggle("deleteUserSecretConfirmation", isOpen)}
        deleteKey={(popUp?.deleteUserSecretConfirmation?.data as DeleteModalData)?.name}
        onClose={() => handlePopUpClose("deleteUserSecretConfirmation")}
        onDeleteApproved={onDeleteApproved}
      />
    </>
  );
};
