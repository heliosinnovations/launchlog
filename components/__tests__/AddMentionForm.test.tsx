import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddMentionForm from "../AddMentionForm";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const defaultProps = {
  projectId: "test-project-id",
  onCancel: jest.fn(),
  onSuccess: jest.fn(),
  existingUrls: [],
};

describe("AddMentionForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("Rendering", () => {
    it("renders the form with all elements", () => {
      render(<AddMentionForm {...defaultProps} />);

      // Header - use heading role for the h3
      expect(screen.getByRole("heading", { name: "Add Mention" })).toBeInTheDocument();
      expect(
        screen.getByText("Manually add a discussion link")
      ).toBeInTheDocument();

      // Platform selection
      expect(screen.getByText("Platform")).toBeInTheDocument();
      expect(screen.getByText("HackerNews")).toBeInTheDocument();
      expect(screen.getByText("Reddit")).toBeInTheDocument();

      // URL input
      expect(screen.getByLabelText(/URL/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/news\.ycombinator\.com/i)
      ).toBeInTheDocument();

      // Title input
      expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Auto-fetched from URL")
      ).toBeInTheDocument();

      // Buttons
      expect(
        screen.getByRole("button", { name: /Cancel/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Add Mention/i })
      ).toBeInTheDocument();
    });

    it("renders with HackerNews selected by default", () => {
      render(<AddMentionForm {...defaultProps} />);

      const hnRadio = screen.getByRole("radio", { name: /HackerNews/i });
      expect(hnRadio).toBeChecked();

      const redditRadio = screen.getByRole("radio", { name: /Reddit/i });
      expect(redditRadio).not.toBeChecked();
    });

    it("shows hint text for URL field", () => {
      render(<AddMentionForm {...defaultProps} />);

      expect(
        screen.getByText("Paste the full URL to the discussion")
      ).toBeInTheDocument();
    });
  });

  describe("Platform Selection", () => {
    it("allows switching between HackerNews and Reddit", async () => {
      const user = userEvent.setup();
      render(<AddMentionForm {...defaultProps} />);

      // Initially HackerNews is selected
      expect(screen.getByRole("radio", { name: /HackerNews/i })).toBeChecked();

      // Click Reddit
      await user.click(screen.getByText("Reddit"));
      expect(screen.getByRole("radio", { name: /Reddit/i })).toBeChecked();
      expect(
        screen.getByRole("radio", { name: /HackerNews/i })
      ).not.toBeChecked();

      // Click HackerNews again
      await user.click(screen.getByText("HackerNews"));
      expect(screen.getByRole("radio", { name: /HackerNews/i })).toBeChecked();
    });

    it("updates URL placeholder when platform changes", async () => {
      const user = userEvent.setup();
      render(<AddMentionForm {...defaultProps} />);

      // Default HN placeholder
      expect(
        screen.getByPlaceholderText(/news\.ycombinator\.com/i)
      ).toBeInTheDocument();

      // Switch to Reddit
      await user.click(screen.getByText("Reddit"));
      expect(
        screen.getByPlaceholderText(/reddit\.com\/r\/reactjs/i)
      ).toBeInTheDocument();
    });
  });

  describe("URL Validation", () => {
    it("shows error for empty URL on blur", async () => {
      const user = userEvent.setup();
      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.click(urlInput);
      await user.tab(); // Blur

      expect(screen.getByText("URL is required")).toBeInTheDocument();
    });

    it("shows error for invalid URL format", async () => {
      const user = userEvent.setup();
      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(urlInput, "not-a-valid-url");
      await user.tab(); // Blur

      expect(screen.getByText("Please enter a valid URL")).toBeInTheDocument();
    });

    it("shows error for URL that doesn't match HackerNews pattern", async () => {
      const user = userEvent.setup();
      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(urlInput, "https://google.com");
      await user.tab(); // Blur

      expect(
        screen.getByText("Please enter a valid HackerNews URL")
      ).toBeInTheDocument();
    });

    it("shows error for URL that doesn't match Reddit pattern when Reddit is selected", async () => {
      const user = userEvent.setup();
      render(<AddMentionForm {...defaultProps} />);

      // Switch to Reddit
      await user.click(screen.getByText("Reddit"));

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(urlInput, "https://google.com");
      await user.tab(); // Blur

      expect(
        screen.getByText("Please enter a valid Reddit URL")
      ).toBeInTheDocument();
    });

    it("accepts valid HackerNews URL", async () => {
      const user = userEvent.setup();
      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://news.ycombinator.com/item?id=12345678"
      );
      await user.tab(); // Blur

      expect(
        screen.queryByText(/Please enter a valid/i)
      ).not.toBeInTheDocument();
    });

    it("accepts valid Reddit URL", async () => {
      const user = userEvent.setup();
      render(<AddMentionForm {...defaultProps} />);

      // Switch to Reddit
      await user.click(screen.getByText("Reddit"));

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://www.reddit.com/r/reactjs/comments/abc123/my_post"
      );
      await user.tab(); // Blur

      expect(
        screen.queryByText(/Please enter a valid/i)
      ).not.toBeInTheDocument();
    });

    it("revalidates URL when platform changes", async () => {
      const user = userEvent.setup();
      render(<AddMentionForm {...defaultProps} />);

      // Enter valid HN URL
      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://news.ycombinator.com/item?id=12345678"
      );
      await user.tab(); // Blur

      // No error initially
      expect(
        screen.queryByText(/Please enter a valid/i)
      ).not.toBeInTheDocument();

      // Switch to Reddit - should show error now
      await user.click(screen.getByText("Reddit"));

      expect(
        screen.getByText("Please enter a valid Reddit URL")
      ).toBeInTheDocument();
    });
  });

  describe("Duplicate Detection", () => {
    it("shows error for duplicate URL on submit", async () => {
      const user = userEvent.setup();
      const existingUrls = ["https://news.ycombinator.com/item?id=12345678"];

      render(<AddMentionForm {...defaultProps} existingUrls={existingUrls} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://news.ycombinator.com/item?id=12345678"
      );

      const submitButton = screen.getByRole("button", { name: /Add Mention/i });
      await user.click(submitButton);

      expect(
        screen.getByText("This mention has already been added")
      ).toBeInTheDocument();
    });

    it("detects duplicates regardless of trailing slash", async () => {
      const user = userEvent.setup();
      const existingUrls = ["https://news.ycombinator.com/item?id=12345678/"];

      render(<AddMentionForm {...defaultProps} existingUrls={existingUrls} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://news.ycombinator.com/item?id=12345678"
      );

      const submitButton = screen.getByRole("button", { name: /Add Mention/i });
      await user.click(submitButton);

      expect(
        screen.getByText("This mention has already been added")
      ).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("disables submit button when URL is empty", () => {
      render(<AddMentionForm {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: /Add Mention/i });
      expect(submitButton).toBeDisabled();
    });

    it("enables submit button when valid URL is entered", async () => {
      const user = userEvent.setup();
      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://news.ycombinator.com/item?id=12345678"
      );

      const submitButton = screen.getByRole("button", { name: /Add Mention/i });
      expect(submitButton).not.toBeDisabled();
    });

    it("submits form with correct data for HackerNews", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "new-mention-id" }),
      });

      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://news.ycombinator.com/item?id=12345678"
      );

      const titleInput = screen.getByLabelText(/Title/i);
      await user.type(titleInput, "My Custom Title");

      const submitButton = screen.getByRole("button", { name: /Add Mention/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/projects/test-project-id/mentions/hackernews",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: "https://news.ycombinator.com/item?id=12345678",
              title: "My Custom Title",
            }),
          }
        );
      });
    });

    it("submits form with correct data for Reddit", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "new-mention-id" }),
      });

      render(<AddMentionForm {...defaultProps} />);

      // Switch to Reddit
      await user.click(screen.getByText("Reddit"));

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://www.reddit.com/r/reactjs/comments/abc123/my_post"
      );

      const submitButton = screen.getByRole("button", { name: /Add Mention/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/projects/test-project-id/mentions/reddit",
          expect.objectContaining({
            method: "POST",
          })
        );
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ id: "new-mention-id" }),
                }),
              100
            )
          )
      );

      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://news.ycombinator.com/item?id=12345678"
      );

      const submitButton = screen.getByRole("button", { name: /Add Mention/i });
      await user.click(submitButton);

      expect(screen.getByText("Adding...")).toBeInTheDocument();
    });

    it("shows success state after successful submission", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "new-mention-id" }),
      });

      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://news.ycombinator.com/item?id=12345678"
      );

      const submitButton = screen.getByRole("button", { name: /Add Mention/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Mention Added")).toBeInTheDocument();
        expect(screen.getByText("Added!")).toBeInTheDocument();
      });
    });

    it("calls onSuccess after successful submission", async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onSuccess = jest.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "new-mention-id" }),
      });

      render(<AddMentionForm {...defaultProps} onSuccess={onSuccess} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://news.ycombinator.com/item?id=12345678"
      );

      const submitButton = screen.getByRole("button", { name: /Add Mention/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Added!")).toBeInTheDocument();
      });

      // Fast-forward past success delay
      jest.advanceTimersByTime(1500);

      expect(onSuccess).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it("shows error message on API failure", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Server error occurred" }),
      });

      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://news.ycombinator.com/item?id=12345678"
      );

      const submitButton = screen.getByRole("button", { name: /Add Mention/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Server error occurred")).toBeInTheDocument();
      });
    });

    it("shows generic error message when API returns no error message", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error("JSON parse error")),
      });

      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://news.ycombinator.com/item?id=12345678"
      );

      const submitButton = screen.getByRole("button", { name: /Add Mention/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Failed to add mention")).toBeInTheDocument();
      });
    });
  });

  describe("Cancel Button", () => {
    it("calls onCancel when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();

      render(<AddMentionForm {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it("disables Cancel button during submission", async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ id: "new-mention-id" }),
                }),
              100
            )
          )
      );

      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://news.ycombinator.com/item?id=12345678"
      );

      const submitButton = screen.getByRole("button", { name: /Add Mention/i });
      await user.click(submitButton);

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe("Keyboard Navigation", () => {
    it("calls onCancel when Escape key is pressed", () => {
      const onCancel = jest.fn();

      render(<AddMentionForm {...defaultProps} onCancel={onCancel} />);

      // Focus the form
      const form = screen.getByRole("form");
      fireEvent.keyDown(form, { key: "Escape" });

      expect(onCancel).toHaveBeenCalled();
    });

    it("allows keyboard navigation to input fields", async () => {
      const user = userEvent.setup();
      render(<AddMentionForm {...defaultProps} />);

      // Focus the URL input directly
      const urlInput = screen.getByLabelText(/URL/i);
      urlInput.focus();
      expect(urlInput).toHaveFocus();

      // Tab to Title input
      await user.tab();
      expect(screen.getByLabelText(/Title/i)).toHaveFocus();

      // Tab to Cancel button
      await user.tab();
      expect(
        screen.getByRole("button", { name: /Cancel/i })
      ).toHaveFocus();

      // Note: Submit button is disabled by default (no URL), so it doesn't receive focus
      // This is expected behavior for accessibility
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      render(<AddMentionForm {...defaultProps} />);

      expect(
        screen.getByRole("form", { name: /Add mention form/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radiogroup", { name: /Select platform/i })
      ).toBeInTheDocument();
    });

    it("marks URL input as invalid when there is an error", async () => {
      const user = userEvent.setup();
      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(urlInput, "invalid");
      await user.tab();

      expect(urlInput).toHaveAttribute("aria-invalid", "true");
    });

    it("has error messages with proper role", async () => {
      const user = userEvent.setup();
      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.click(urlInput);
      await user.tab();

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("Title Field", () => {
    it("submits without title when not provided", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "new-mention-id" }),
      });

      render(<AddMentionForm {...defaultProps} />);

      const urlInput = screen.getByLabelText(/URL/i);
      await user.type(
        urlInput,
        "https://news.ycombinator.com/item?id=12345678"
      );

      // Don't fill title

      const submitButton = screen.getByRole("button", { name: /Add Mention/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              url: "https://news.ycombinator.com/item?id=12345678",
              title: undefined,
            }),
          })
        );
      });
    });
  });
});
