import { useMemo, useState } from "react";
import {
  faCheckCircle,
  faCircle,
  faFilter,
  faMagnifyingGlass,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  IconButton,
  Input,
  Tooltip
} from "@app/components/v2";
import { UserSecretType, userSecretTypeOptions } from "@app/hooks/api/userSecrets/enum";
import { UsePopUpState } from "@app/hooks/usePopUp";
import { debounce } from "@app/lib/fn/debounce";

type Props = {
  selectedTypeFilter: UserSecretType | null;
  setTypeFilter: (val: UserSecretType | null) => void;
  searchOnChange: (val: string) => void;
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
      secretValue?: { secretType: UserSecretType };
    }
  ) => void;
};

export const ActionBar = ({
  selectedTypeFilter,
  setTypeFilter,
  searchOnChange,
  handlePopUpOpen
}: Props) => {
  const [innerSearch, setInnerSearch] = useState("");
  const debouncedOnSearch = useMemo(() => debounce(searchOnChange, 1000), []);

  return (
    <div className="mb-4 flex justify-between">
      <div className="flex w-full flex-row items-center justify-start space-x-2">
        <div className="w-1/3">
          <Input
            className="bg-mineshaft-800 placeholder-mineshaft-50 duration-200 focus:bg-mineshaft-700/80"
            placeholder="Search by name"
            leftIcon={<FontAwesomeIcon icon={faMagnifyingGlass} />}
            value={innerSearch}
            onChange={(evt) => {
              setInnerSearch(evt.target.value);
              debouncedOnSearch(evt.target.value);
            }}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              ariaLabel="Secret Types"
              variant="plain"
              size="sm"
              className="flex h-10 w-11 items-center justify-center overflow-hidden border border-mineshaft-600 bg-mineshaft-800 p-0 hover:border-primary/60 hover:bg-primary/10"
            >
              <Tooltip content="Filter secret types" className="mb-2">
                <FontAwesomeIcon icon={faFilter} />
              </Tooltip>
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter Secret Type</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setTypeFilter(null)}
              icon={
                selectedTypeFilter === null ? (
                  <FontAwesomeIcon className="text-primary" icon={faCheckCircle} />
                ) : (
                  <FontAwesomeIcon className="text-mineshaft-400" icon={faCircle} />
                )
              }
              iconPos="left"
            >
              <div className="flex items-center">All</div>
            </DropdownMenuItem>
            {userSecretTypeOptions.map((opt) => {
              const { label, value } = opt;

              const isSelected = selectedTypeFilter === value;
              return (
                <DropdownMenuItem
                  onClick={() => setTypeFilter(value)}
                  key={value}
                  icon={
                    isSelected ? (
                      <FontAwesomeIcon className="text-primary" icon={faCheckCircle} />
                    ) : (
                      <FontAwesomeIcon className="text-mineshaft-400" icon={faCircle} />
                    )
                  }
                  iconPos="left"
                >
                  <div className="flex items-center">{label}</div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        colorSchema="primary"
        leftIcon={<FontAwesomeIcon icon={faPlus} />}
        onClick={() => {
          handlePopUpOpen("addOrUpdateUserSecret", {
            isEditMode: false,
            secretValue: { secretType: UserSecretType.WEB_LOGIN }
          });
        }}
      >
        Add Secret
      </Button>
    </div>
  );
};
