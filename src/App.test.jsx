import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App.jsx";

describe("Little Lemon navigation and menu", () => {
  it("shows the home page initially", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /little lemon/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
  });
  it("shows menu items and category filters when Menu is clicked", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("heading", { name: "Our Menu" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Greek Salad" })).toBeInTheDocument();
  });
  it("adds an item to the basket", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Add one Greek Salad" }));
    expect(screen.getByRole("button", { name: /open basket, 1 items/i })).toBeInTheDocument();
  });
});