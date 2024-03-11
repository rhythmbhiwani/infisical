import { Fragment, useState } from "react";
import { faCaretDown, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Combobox as HeadlessUICombobox, Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

export type ComboBoxProps = {
  value: string | number;
  onChange: any;
  onBlur?: any;
  options: {
    value: string | number;
    label: string;
    id: number | string;
  }[];
  isDisabled?: boolean;
  className?: string;
  dropdownContainerClassName?: string;
  dynamicWidth?: boolean;
};

function ComboBox({
  value = "",
  onChange,
  onBlur,
  options,
  isDisabled,
  className,
  dropdownContainerClassName,
  dynamicWidth
}: ComboBoxProps) {
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) => {
          return (
            option.label.toLowerCase().includes(query.toLowerCase()) ||
            option.value.toString().toLowerCase().includes(query.toLowerCase())
          );
        });

  const getNameFromValue = (val: string | number) => {
    const option = options.find((opt) => opt.value === val);
    return option ? option.label : "";
  };

  const adjustInputWidth = () => {
    const newWidth = (query.length || getNameFromValue(value).length) * 0.48; // Adjust the multiplier based on your font and styling
    return { width: `${newWidth}rem` };
  };

  return (
    <HeadlessUICombobox disabled={isDisabled} value={value} onChange={onChange}>
      {({ open }) => (
        <div className="relative">
          <div className="focus-visible:ring-offset-orange-300 relative w-full cursor-default overflow-hidden rounded-lg text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-offset-2 sm:text-sm">
            <HeadlessUICombobox.Button
              className={twMerge(
                "inset-y-0 right-0 flex w-full items-center bg-mineshaft-900 pr-4 text-bunker-200 focus-visible:ring",
                className
              )}
            >
              {open ? (
                <HeadlessUICombobox.Input
                  className={twMerge(
                    "min-w-[10rem] border-none bg-transparent py-2 pl-3 pr-5 text-sm leading-5 focus:ring-0 focus-visible:outline-none",
                    !dynamicWidth && "w-full"
                  )}
                  onKeyUp={(e) => e.preventDefault()}
                  onChange={(event) => setQuery(event.target.value)}
                  displayValue={(optionValue: string | number) => getNameFromValue(optionValue)}
                  placeholder="Search"
                  onBlur={onBlur}
                  style={dynamicWidth ? adjustInputWidth() : undefined}
                />
              ) : (
                <div
                  className={twMerge(
                    "border-none bg-transparent py-2 pl-3 pr-5 text-left text-sm leading-5 focus:ring-0 focus-visible:outline-none",
                    !dynamicWidth && "w-full"
                  )}
                >
                  {getNameFromValue(value)}
                </div>
              )}
              {!isDisabled && <FontAwesomeIcon icon={faCaretDown} size="sm" />}
            </HeadlessUICombobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <HeadlessUICombobox.Options
              className={twMerge(
                "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-mineshaft-900 py-1 text-base shadow-[10px_32px_97px_-17px_rgba(0,0,0,0.6)] shadow-primary-400/30 ring-1 ring-mineshaft-600 focus:outline-none sm:text-sm",
                dropdownContainerClassName
              )}
            >
              {filteredOptions.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-400">
                  Nothing found.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <HeadlessUICombobox.Option
                    key={option.id}
                    className={({ active }) =>
                      `relative cursor-pointer py-2 pl-10 pr-4 shadow-md ${
                        active ? "bg-mineshaft-500 text-bunker-200" : "text-bunker-200"
                      }`
                    }
                    value={option.value}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block ${selected ? "font-medium" : "font-normal"}`}>
                          {option.label}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-mineshaft-400">
                            <FontAwesomeIcon className="text-primary" icon={faCheck} />
                          </span>
                        ) : null}
                      </>
                    )}
                  </HeadlessUICombobox.Option>
                ))
              )}
            </HeadlessUICombobox.Options>
          </Transition>
        </div>
      )}
    </HeadlessUICombobox>
  );
}

export { ComboBox };
