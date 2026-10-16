import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { CourtIndexEntry, CourtIndexGroup } from "@/lib/court-index";
import { CitySelect, COURT_LIST_ID } from "./CitySelect";

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
  { city: "Halikko", anchor: "halikko", courts: [entry("Halikko", "/courts/lipas/1")] },
  { city: "Helsinki", anchor: "helsinki", courts: [entry("Kallio", "/courts/lipas/2")] },
  { city: "Järvenpää", anchor: "jarvenpaa", courts: [entry("Järvenpää", "/courts/lipas/3")] },
];

afterEach(cleanup);

test("filters cities as you type, including without Finnish accents", () => {
  render(<CitySelect groups={groups} />);

  const input = screen.getByRole("combobox", { name: "Kaupungit" });
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
  fireEvent.change(screen.getByRole("combobox", { name: "Kaupungit" }), {
    target: { value: "hali" },
  });
  fireEvent.click(screen.getByRole("option", { name: /Halikko/ }));
  fireEvent.mouseDown(screen.getByRole("button", { name: "Tyhjennä" }));

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
  fireEvent.change(screen.getByRole("combobox", { name: "Kaupungit" }), {
    target: { value: "hali" },
  });
  fireEvent.click(screen.getByRole("option", { name: /Halikko/ }));
  fireEvent.keyDown(screen.getByRole("button", { name: "Tyhjennä" }), { key: "Enter" });

  expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  list.remove();
});
