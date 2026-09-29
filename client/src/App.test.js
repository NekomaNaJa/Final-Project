import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders landing page", () => {
  render(<App />);
  const hero = screen.getAllByText(/Next-Gen Streaming Donations/i);
  expect(hero.length).toBeGreaterThan(0);
});
