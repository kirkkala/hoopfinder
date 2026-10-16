"use client";

import { ChevronDown, X } from "lucide-react";
import { useMemo } from "react";
import Select, {
  type ClassNamesConfig,
  type ClearIndicatorProps,
  components,
  createFilter,
  type DropdownIndicatorProps,
  type GroupBase,
} from "react-select";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { CourtIndexGroup } from "@/lib/court-index";

type CityOption = {
  value: string;
  label: string;
  count: number;
};

/** Court sections start here. Clearing the search scrolls this back under the header. */
export const COURT_LIST_ID = "court-list";
/** Set on the document from the search bar height, so city names can stick beneath it. */
export const CITY_SEARCH_HEIGHT = "--city-search-height";

const filterCity = createFilter<CityOption>({
  ignoreAccents: true,
  ignoreCase: true,
  matchFrom: "any",
  trim: true,
});

const classNames: ClassNamesConfig<CityOption, false, GroupBase<CityOption>> = {
  container: () => "relative",
  control: ({ isFocused }) =>
    `min-h-12 rounded-2xl border bg-asphalt px-1 ${
      isFocused ? "border-gold/50 ring-2 ring-gold/60" : "border-white/25"
    }`,
  valueContainer: () => "px-2",
  placeholder: () => "text-base text-white/55 sm:text-sm",
  singleValue: () => "text-base text-white sm:text-sm",
  input: () => "text-base text-white sm:text-sm",
  indicatorsContainer: () => "text-white/55",
  clearIndicator: () =>
    "rounded-full p-1.5 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60",
  dropdownIndicator: () => "px-2",
  menu: () =>
    "absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-white/15 bg-panel shadow-lg",
  menuList: () => "max-h-72 overflow-y-auto py-1",
  option: ({ isFocused, isSelected }) =>
    `cursor-pointer px-3 py-2 text-base sm:text-sm ${isSelected ? "text-gold" : "text-white"} ${
      isFocused ? "bg-white/10" : ""
    }`,
  noOptionsMessage: () => "px-3 py-2 text-sm text-ink-muted",
};

function CityClearIndicator(props: ClearIndicatorProps<CityOption, false>) {
  const copy = useCopy();
  const { "aria-hidden": _hidden, ...innerProps } = props.innerProps;
  return (
    <components.ClearIndicator
      {...props}
      innerProps={{
        ...innerProps,
        "aria-label": copy.citySearchClear,
        role: "button",
        tabIndex: 0,
        onKeyDown: (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          props.clearValue();
        },
      }}
    >
      <X className="size-4" aria-hidden />
    </components.ClearIndicator>
  );
}

function scrollToListTop() {
  document.getElementById(COURT_LIST_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

function DropdownIndicator(props: DropdownIndicatorProps<CityOption, false>) {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDown className="size-4" aria-hidden />
    </components.DropdownIndicator>
  );
}

export function CitySelect({ groups }: { groups: CourtIndexGroup[] }) {
  const copy = useCopy();
  const options = useMemo(
    () =>
      groups.map((group) => ({
        value: group.anchor,
        label: group.city ?? copy.cityUnknown,
        count: group.courts.length,
      })),
    [groups, copy.cityUnknown],
  );

  return (
    <div>
      <label htmlFor="court-city" className="mb-2 block text-sm font-medium text-ink-muted">
        {copy.allCourtsCities}
      </label>
      <Select
        unstyled
        instanceId="court-city"
        inputId="court-city"
        aria-label={copy.allCourtsCities}
        placeholder={copy.citySearchPlaceholder}
        options={options}
        filterOption={filterCity}
        classNames={classNames}
        components={{
          ClearIndicator: CityClearIndicator,
          DropdownIndicator,
          IndicatorSeparator: () => null,
        }}
        formatOptionLabel={(option) => (
          <span className="flex items-baseline justify-between gap-3">
            <span>{option.label}</span>
            <span className="text-ink-muted">{option.count}</span>
          </span>
        )}
        noOptionsMessage={() => copy.citySearchEmpty}
        isClearable
        isSearchable
        blurInputOnSelect
        menuShouldScrollIntoView={false}
        onChange={(option) => {
          if (!option) {
            scrollToListTop();
            return;
          }
          document.getElementById(option.value)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          history.replaceState(null, "", `#${option.value}`);
        }}
      />
    </div>
  );
}
