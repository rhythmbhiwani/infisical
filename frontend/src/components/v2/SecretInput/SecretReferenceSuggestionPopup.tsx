import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { groupBy } from "@app/lib/fn/array";

import { IconButton } from "../IconButton";
import { Tab, TabList, TabPanel, Tabs } from "../Tabs";
import { useSecretReferenceSuggestionPopupStore } from "./SecretReferenceSuggestionPopup.store";

enum TabSections {
  ENVS = "envs",
  SECRETS = "secrets"
}

export const SecretReferenceSuggestionPopup = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(TabSections.ENVS);
  const showSuggestions = useSecretReferenceSuggestionPopupStore((state) => state.showSuggestions);
  const setShowSuggestions = useSecretReferenceSuggestionPopupStore(
    (state) => state.setShowSuggestions
  );
  const suggestions = useSecretReferenceSuggestionPopupStore((state) => state.suggestions);
  const environments = useSecretReferenceSuggestionPopupStore((state) => state.environments);
  const handleSuggestionSelect = useSecretReferenceSuggestionPopupStore(
    (state) => state.selectHandler
  );

  console.log("showSuggestions", showSuggestions);
  console.log("suggestions", suggestions);

  const groupedSuggestions = useMemo(() => {
    return groupBy(suggestions, (s) => s.env);
  }, [suggestions]);

  console.log("groupedSuggestions", groupedSuggestions);
  useEffect(() => {
    if (environments.length === 0) {
      setSelectedTab(TabSections.SECRETS);
    }
  }, [environments]);

  useEffect(() => {
    setShowSuggestions(false);
  }, [router.asPath]);

  if (!showSuggestions || (suggestions.length === 0 && environments.length === 0)) return null;

  return (
    <div className="fixed bottom-10 right-10 z-50 flex h-80 w-60 flex-col rounded-xl bg-mineshaft-700 text-bunker-200">
      <div className="flex flex-row items-center justify-between rounded-t-xl border-b-2 border-primary/20 bg-mineshaft-700 py-2 px-4 text-left text-bunker-200">
        <h4 className="flex-1 font-bold">Suggestions</h4>
        <IconButton
          ariaLabel="close"
          size="xs"
          className="bg-mineshaft-700"
          onClick={() => setShowSuggestions(false)}
        >
          <FontAwesomeIcon className="text-bunker-200" icon={faTimes} />
        </IconButton>
      </div>
      <div className="thin-scrollbar h-full overflow-auto">
        <Tabs
          value={selectedTab}
          onValueChange={(val) => setSelectedTab(val as TabSections)}
          className="px-2"
        >
          <TabList>
            <div className="flex w-full flex-row border-b border-mineshaft-600">
              {environments.length > 0 && <Tab value={TabSections.ENVS}>Envs</Tab>}
              <Tab value={TabSections.SECRETS}>Secrets</Tab>
            </div>
          </TabList>
          {environments.length > 0 && (
            <TabPanel value={TabSections.ENVS}>
              {environments.map((env) => (
                <button
                  type="button"
                  key={env}
                  className="my-0.5 w-full rounded-lg px-1 py-2 hover:bg-primary/20 hover:text-mineshaft-200"
                  onClick={() => handleSuggestionSelect(`${env}.`)}
                >
                  {env}
                </button>
              ))}
            </TabPanel>
          )}
          <TabPanel value={TabSections.SECRETS}>
            {Object.entries(groupedSuggestions).map(([key, options]) => (
              <div key={key}>
                <div className="flex w-full items-center justify-center text-center">
                  <span className="rounded-lg bg-primary px-2 py-0.5 text-sm font-semibold text-mineshaft-700">
                    {key}
                  </span>
                </div>
                {options.map((option) => (
                  <button
                    type="button"
                    className="my-0.5 w-full rounded-lg px-1 py-2 hover:bg-primary/20 hover:text-mineshaft-200"
                    key={option.id}
                    onClick={() => handleSuggestionSelect(option.key)}
                  >
                    {option.key}
                  </button>
                ))}
              </div>
            ))}
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
};
