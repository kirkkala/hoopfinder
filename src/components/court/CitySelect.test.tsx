import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import type { CourtIndexEntry, CourtIndexGroup } from "@/lib/court-index";
import { CitySelect, COURT_LIST_ID } from "./CitySelect";

const copy = getCopy();

function entry(name: string, href: string): CourtIndexEntry {
  return {
    href,
    name,
    nameFi: name,
    status: "active",
    address: null,
    neighborhood: null,
    city: null,
    amenities: { lighting: null, freeUse: null },
  };
}

const groups: CourtIndexGroup[] = [
  {
    city: "Halikko",
    anchor: "halikko",
    pageHref: null,
    courts: [entry("Halikko", "/koripallokentat/halikko/l1")],
  },
  {
    city: "Helsinki",
    anchor: "helsinki",
    pageHref: null,
    courts: [entry("Kallio", "/koripallokentat/helsinki/l2")],
  },
  {
    city: "Järvenpää",
    anchor: "jarvenpaa",
    pageHref: null,
    courts: [entry("Järvenpää", "/koripallokentat/jarvenpaa/l3")],
  },
];

afterEach(cleanup);

test("filters cities as you type, including without Finnish accents", () => {
  render(<CitySelect groups={groups} />);

  const input = screen.getByRole("combobox", { name: copy.allCourtsCities });
  fireEvent.change(input, { target: { value: "hali" } });

  expect(screen.getByRole("option", { name: /Halikko/ })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: /Helsinki/ })).not.toBeInTheDocument();

  fireEvent.change(input, { target: { value: "jar" } });
  expect(screen.getByRole("option", { name: /Järvenpää/ })).toBeInTheDocument();
});

test("clearing the chosen city scrolls back to the top of the list", () => {
  const list = document.createElement("div");
  list.id = COURT_LIST_ID;
  const scrollIntoView = vi.fn();
  list.scrollIntoView = scrollIntoView;
  document.body.append(list);

  render(<CitySelect groups={groups} />);
  fireEvent.change(screen.getByRole("combobox", { name: copy.allCourtsCities }), {
    target: { value: "hali" },
  });
  fireEvent.click(screen.getByRole("option", { name: /Halikko/ }));
  fireEvent.mouseDown(screen.getByRole("button", { name: copy.citySearchClear }));

  expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  list.remove();
});

test("pressing enter on the clear control scrolls back to the top of the list", () => {
  const list = document.createElement("div");
  list.id = COURT_LIST_ID;
  const scrollIntoView = vi.fn();
  list.scrollIntoView = scrollIntoView;
  document.body.append(list);

  render(<CitySelect groups={groups} />);
  fireEvent.change(screen.getByRole("combobox", { name: copy.allCourtsCities }), {
    target: { value: "hali" },
  });
  fireEvent.click(screen.getByRole("option", { name: /Halikko/ }));
  fireEvent.keyDown(screen.getByRole("button", { name: copy.citySearchClear }), { key: "Enter" });

  expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  list.remove();
});
