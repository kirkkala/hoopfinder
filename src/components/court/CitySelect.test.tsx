import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import { CitySelect, cityMatchesQuery } from "./CitySelect";

const copy = getCopy();

afterEach(cleanup);

test("matches a city with or without Finnish accents", () => {
  expect(cityMatchesQuery("Halikko", "hali")).toBe(true);
  expect(cityMatchesQuery("Helsinki", "hali")).toBe(false);
  expect(cityMatchesQuery("Järvenpää", "jar")).toBe(true);
  expect(cityMatchesQuery("Helsinki", "   ")).toBe(true);
});

test("the clear button empties the city search", () => {
  const onQueryChange = vi.fn();
  render(<CitySelect query="hali" onQueryChange={onQueryChange} />);

  fireEvent.click(screen.getByRole("button", { name: copy.citySearchClear }));

  expect(onQueryChange).toHaveBeenCalledWith("");
});

test("typing in the city search reports the text", () => {
  const onQueryChange = vi.fn();
  render(<CitySelect query="" onQueryChange={onQueryChange} />);

  fireEvent.change(screen.getByRole("searchbox", { name: copy.allCourtsCities }), {
    target: { value: "hel" },
  });

  expect(onQueryChange).toHaveBeenCalledWith("hel");
  expect(screen.queryByRole("button", { name: copy.citySearchClear })).not.toBeInTheDocument();
});
