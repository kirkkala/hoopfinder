import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { CourtIndexGroup } from "@/lib/court-index";
import { CitySelect, COURT_LIST_ID } from "./CitySelect";

const groups: CourtIndexGroup[] = [
  {
    city: "Halikko",
    anchor: "halikko",
    courts: [{ href: "/courts/lipas/1", nameFi: "Halikko", name: "Halikko" }],
  },
  {
    city: "Helsinki",
    anchor: "helsinki",
    courts: [{ href: "/courts/lipas/2", nameFi: "Kallio", name: "Kallio" }],
  },
  {
    city: "Järvenpää",
    anchor: "jarvenpaa",
    courts: [{ href: "/courts/lipas/3", nameFi: "Järvenpää", name: "Järvenpää" }],
  },
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
