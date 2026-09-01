import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the main landing page", () => {
  render(<App />);
  const heading = screen.getByRole("heading", { name: /Legend/i });
  expect(heading).toBeInTheDocument();
});
