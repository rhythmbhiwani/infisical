import { ReactNode } from "react";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { IconButton } from "@app/components/v2";
import { useTimedReset } from "@app/hooks";

type Props = {
  label: string;
  value?: string | null;
  buttonOverride?: ReactNode;
};

export const DataField = ({ label, buttonOverride, value }: Props) => {
  const [, isCopyingSecret, setCopyTextSecret] = useTimedReset<string>({
    initialState: "Copy to clipboard"
  });

  if (!value) return null;

  return (
    <div className="mb-2">
      <small className="opacity-60">{label}</small>
      <div className="mr-2 flex items-center justify-start rounded-md bg-white/[0.05] py-1 pl-2 pr-1 text-base text-gray-400">
        <p className="mr-4 flex-1 break-all">{value}</p>
        {buttonOverride ?? (
          <IconButton
            ariaLabel="copy icon"
            colorSchema="secondary"
            className="group relative ml-2"
            onClick={() => {
              navigator.clipboard.writeText(value);
              setCopyTextSecret("Copied");
            }}
          >
            <FontAwesomeIcon icon={isCopyingSecret ? faCheck : faCopy} />
          </IconButton>
        )}
      </div>
    </div>
  );
};
