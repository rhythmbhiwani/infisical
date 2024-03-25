/* eslint-disable react/no-danger */
import {
  ChangeEvent,
  forwardRef,
  TextareaHTMLAttributes,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import { useRouter } from "next/router";
import { twMerge } from "tailwind-merge";

import { useWorkspace } from "@app/context";
import { useToggle } from "@app/hooks";
import { useGetFoldersByEnv, useGetProjectSecretsAllEnv, useGetUserWsKey } from "@app/hooks/api";

import { useSecretReferenceSuggestionPopupStore } from "./SecretReferenceSuggestionPopup.store";

const REGEX = /(\${([^}]+)})/g;
const replaceContentWithDot = (str: string) => {
  let finalStr = "";
  for (let i = 0; i < str.length; i += 1) {
    const char = str.at(i);
    finalStr += char === "\n" ? "\n" : "*";
  }
  return finalStr;
};

const syntaxHighlight = (content?: string | null, isVisible?: boolean) => {
  if (content === "") return "EMPTY";
  if (!content) return "EMPTY";
  if (!isVisible) return replaceContentWithDot(content);

  let skipNext = false;
  const formatedContent = content.split(REGEX).flatMap((el, i) => {
    const isInterpolationSyntax = el.startsWith("${") && el.endsWith("}");
    if (isInterpolationSyntax) {
      skipNext = true;
      return (
        <span className="ph-no-capture text-yellow" key={`secret-value-${i + 1}`}>
          &#36;&#123;<span className="ph-no-capture text-yellow-200/80">{el.slice(2, -1)}</span>
          &#125;
        </span>
      );
    }
    if (skipNext) {
      skipNext = false;
      return [];
    }
    return el;
  });

  // akhilmhdh: Dont remove this br. I am still clueless how this works but weirdly enough
  // when break is added a line break works properly
  return formatedContent.concat(<br />);
};

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value?: string | null;
  isVisible?: boolean;
  isReadOnly?: boolean;
  isDisabled?: boolean;
  containerClassName?: string;
  currentEnvironment?: string;
};

const commonClassName = "font-mono text-sm caret-white border-none outline-none w-full break-all";

export const SecretInput = forwardRef<HTMLTextAreaElement, Props>(
  (
    {
      value,
      isVisible,
      containerClassName,
      currentEnvironment,
      onBlur,
      isDisabled,
      isReadOnly,
      onFocus,
      onChange,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    const router = useRouter();
    const { currentWorkspace } = useWorkspace();
    const userAvailableEnvs = currentWorkspace?.environments || [];
    const workspaceId = currentWorkspace?.id as string;
    const { data: latestFileKey } = useGetUserWsKey(workspaceId);

    const [isSecretFocused, setIsSecretFocused] = useToggle();
    const [cursorPosition, setCursorPosition] = useState<null | number>(null);
    const initialSecretPath =
      typeof router.query.secretPath === "string" ? router.query.secretPath : "/";
    const [secretPath] = useState(initialSecretPath);

    const { data: secrets } = useGetProjectSecretsAllEnv({
      workspaceId,
      envs: userAvailableEnvs.map(({ slug }) => slug),
      secretPath,
      decryptFileKey: latestFileKey!
    });

    const { folderNames } = useGetFoldersByEnv({
      environments: userAvailableEnvs.map(({ slug }) => slug),
      projectId: workspaceId,
      path: secretPath
    });

    console.log("folderNames", folderNames);

    const setShowSuggestions = useSecretReferenceSuggestionPopupStore(
      (state) => state.setShowSuggestions
    );
    const setSuggestions = useSecretReferenceSuggestionPopupStore((state) => state.setSuggestions);
    const setEnvironments = useSecretReferenceSuggestionPopupStore(
      (state) => state.setEnvironments
    );
    const setSelectHandler = useSecretReferenceSuggestionPopupStore(
      (state) => state.setSelectHandler
    );

    // Function to filter suggestions based on input
    const filterSuggestions = (variableName: string) => {
      // Sample suggestions, you can replace this with your actual suggestions logic
      const filteredSuggestions = secrets
        .filter((s) => s.isSuccess)
        .map((s) => Object.values(s.data || {}))
        .flat()
        .filter((option) => option.env === currentEnvironment)
        .filter((option) =>
          variableName.trim() ? option.key.toLowerCase().includes(variableName.toLowerCase()) : true
        );
      console.log("filteredSuggestions", filteredSuggestions);
      setSuggestions(filteredSuggestions);
      setEnvironments(
        userAvailableEnvs
          .map((env) => env.slug)
          .filter((option) =>
            variableName.trim() ? option.toLowerCase().includes(variableName.toLowerCase()) : true
          )
      );
    };

    // Function to handle suggestion selection
    setSelectHandler((option: string) => {
      if (cursorPosition !== null && onChange) {
        // Find the nearest opening bracket before the cursor position
        const openingBracketIndex = value?.lastIndexOf("${", cursorPosition) ?? -1;

        // Find the nearest closing bracket after the cursor position
        const closingBracketIndex = value?.indexOf("}", cursorPosition) ?? -1;

        // Check if both opening and closing brackets are found
        if (
          openingBracketIndex !== -1 &&
          closingBracketIndex !== -1 &&
          openingBracketIndex < closingBracketIndex
        ) {
          // Insert the selected option between the brackets
          const newValue = `${value?.substring(
            0,
            openingBracketIndex + 2
          )}${option}${value?.substring(closingBracketIndex)}`;

          console.log("newValue", newValue);
          const syntheticEvent = {
            target: {
              value: newValue
            }
          } as ChangeEvent<HTMLTextAreaElement>;

          // Update the input value with the new value
          onChange(syntheticEvent);
        }

        setShowSuggestions(false);
        setIsSecretFocused.on();

        const newCursorPosition = openingBracketIndex + 2 + option.length;

        console.log("newCursorPosition", newCursorPosition);
        innerRef?.current?.focus();
        setTimeout(() => {
          // Set the selection range for the textarea
          innerRef?.current?.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);
      }
    });

    // Function to handle input value changes
    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      console.log("\n\n\n\n\n\n\n\n");
      const { value: newValue, selectionStart } = e.target;
      console.log("selectionStart", selectionStart);
      setCursorPosition(selectionStart);
      if (onChange) onChange(e);

      // Detect if "${" is typed and show suggestions
      // Find the nearest opening bracket before the cursor position
      const openingBracketIndex = newValue.lastIndexOf("${", selectionStart);

      // Find the nearest closing bracket after the cursor position
      const closingBracketIndex = newValue.indexOf("}", selectionStart - 1);

      // Check if both opening and closing brackets are found
      console.log("openingBracketIndex", openingBracketIndex);
      console.log("closingBracketIndex", newValue, selectionStart, closingBracketIndex);
      if (
        openingBracketIndex !== -1 &&
        closingBracketIndex !== -1 &&
        openingBracketIndex < closingBracketIndex
      ) {
        // Extract the content between the brackets
        const contentBetweenBrackets = newValue.substring(
          openingBracketIndex + 2,
          closingBracketIndex
        );
        console.log("Content between brackets:", contentBetweenBrackets);
        setShowSuggestions(true);
        filterSuggestions(contentBetweenBrackets);
        setTimeout(() => {
          // Set the selection range for the textarea
          innerRef?.current?.setSelectionRange(closingBracketIndex, closingBracketIndex);
        }, 0);
      } else {
        setShowSuggestions(false);
        setCursorPosition(null);
      }
    };

    return (
      <div
        className={twMerge(
          "relative w-full overflow-auto rounded-md no-scrollbar",
          containerClassName
        )}
        style={{ maxHeight: `${21 * 7}px` }}
      >
        <div className="relative overflow-hidden">
          <pre aria-hidden className="m-0">
            <code className={`inline-block w-full  ${commonClassName}`}>
              <span style={{ whiteSpace: "break-spaces" }}>
                {syntaxHighlight(value, isVisible || isSecretFocused)}
              </span>
            </code>
          </pre>
          <textarea
            style={{ whiteSpace: "break-spaces" }}
            aria-label="secret value"
            ref={innerRef}
            className={`absolute inset-0 block h-full resize-none overflow-hidden bg-red-500 bg-transparent text-transparent no-scrollbar focus:border-0 ${commonClassName}`}
            onFocus={() => setIsSecretFocused.on()}
            disabled={isDisabled}
            spellCheck={false}
            onBlur={(evt) => {
              onBlur?.(evt);
              setIsSecretFocused.off();
            }}
            value={value}
            {...props}
            onChange={handleInputChange}
            readOnly={isReadOnly}
          />
        </div>
      </div>
    );
  }
);

SecretInput.displayName = "SecretInput";
