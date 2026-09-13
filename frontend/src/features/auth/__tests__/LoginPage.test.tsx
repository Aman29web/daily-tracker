import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../LoginPage";
import { authApi } from "../../../api/endpoints/auth";

vi.mock("../../../api/endpoints/auth", () => ({
  authApi: { login: vi.fn() },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.mocked(authApi.login).mockReset();
  });

  it("shows validation errors and never calls the API when the form is empty", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it("submits valid credentials to the API", async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      user: { id: "1", name: "Alex Morgan", email: "alex@example.com", timezone: "UTC", avatarColor: "#000", createdAt: "" },
      accessToken: "token",
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText("Email"), "alex@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Passw0rd!");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(authApi.login).toHaveBeenCalledWith({ email: "alex@example.com", password: "Passw0rd!" });
  });
});
