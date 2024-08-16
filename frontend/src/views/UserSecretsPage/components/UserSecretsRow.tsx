import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format } from "date-fns";

import { Button, IconButton, Td, Tr } from "@app/components/v2";
import { TUserSecret, userSecretTypeOptions } from "@app/hooks/api/userSecrets";
import { UsePopUpState } from "@app/hooks/usePopUp";

export const UserSecretsRow = ({
  row,
  handlePopUpOpen
}: {
  row: TUserSecret;
  handlePopUpOpen: (
    popUpName: keyof UsePopUpState<
      ["showSecretData", "addOrUpdateUserSecret", "deleteUserSecretConfirmation"]
    >,
    popUpData: {
      keyName?: string;
      value?: string;
      name?: string;
      id?: string;
      isEditMode?: boolean;
      secretValue?: TUserSecret;
    }
  ) => void;
}) => {
  return (
    <Tr key={row.id}>
      <Td>{row.name ? `${row.name}` : "-"}</Td>
      <Td>{`${format(new Date(row.createdAt), "yyyy-MM-dd - HH:mm a")}`}</Td>
      <Td>{`${userSecretTypeOptions.find((opt) => opt.value === row.secretType)?.label}`}</Td>
      <Td>
        <Button
          variant="outline_bg"
          onClick={() => {
            handlePopUpOpen("showSecretData", {
              secretValue: row
            });
          }}
        >
          View Details
        </Button>
      </Td>

      <Td>
        <div className="flex flex-row items-center justify-center space-x-1">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handlePopUpOpen("addOrUpdateUserSecret", {
                id: row.id,
                isEditMode: true,
                secretValue: row
              });
            }}
            variant="plain"
            ariaLabel="edit"
          >
            <FontAwesomeIcon icon={faEdit} />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handlePopUpOpen("deleteUserSecretConfirmation", {
                name: row.name,
                id: row.id
              });
            }}
            variant="plain"
            ariaLabel="delete"
          >
            <FontAwesomeIcon icon={faTrash} />
          </IconButton>
        </div>
      </Td>
    </Tr>
  );
};
