import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MentionsModal, { Mention } from "../MentionsModal";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Sample mock data
const mockHNMentions: Mention[] = [
  {
    id: "hn-1",
    source_type: "hackernews",
    source_url: "https://news.ycombinator.com/item?id=12345",
    title: "React Query v5 released with major TypeScript improvements",
    score: 423,
    comment_count: 156,
    author: "developer123",
    published_at: "2026-02-21T10:00:00Z",
  },
  {
    id: "hn-2",
    source_type: "hackernews",
    source_url: "https://news.ycombinator.com/item?id=12346",
    title: "Show HN: I built a data fetching library comparison tool",
    score: 89,
    comment_count: 34,
    author: "showhn_builder",
    published_at: "2026-02-16T10:00:00Z",
  },
];

const mockRedditMentions: Mention[] = [
  {
    id: "reddit-1",
    source_type: "reddit",
    source_url: "https://www.reddit.com/r/reactjs/comments/abc123/why_i_switched",
    title: "Why I switched from SWR to React Query - a comparison",
    score: 1200,
    comment_count: 89,
    author: "react_developer",
    published_at: "2026-02-18T10:00:00Z",
  },
  {
    id: "reddit-2",
    source_type: "reddit",
    source_url: "https://www.reddit.com/r/webdev/comments/def456/best_practices",
    title: "Best practices for managing server state in React apps?",
    score: 567,
    comment_count: 123,
    author: "webdev_user",
    published_at: "2026-02-09T10:00:00Z",
  },
];

function setupFetchMock(hnMentions: Mention[] = mockHNMentions, redditMentions: Mention[] = mockRedditMentions) {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes("/mentions/hackernews")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ mentions: hnMentions, total: hnMentions.length }),
      });
    }
    if (url.includes("/mentions/reddit")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ mentions: redditMentions, total: redditMentions.length }),
      });
    }
    return Promise.reject(new Error("Unknown URL"));
  });
}

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  projectId: "test-project-id",
  projectName: "react-query",
};

describe("MentionsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetchMock();
  });

  describe("Rendering", () => {
    it("renders nothing when isOpen is false", () => {
      const { container } = render(
        <MentionsModal {...defaultProps} isOpen={false} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("renders modal when isOpen is true", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("displays project name in header", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("react-query")).toBeInTheDocument();
      });
    });

    it("displays platform badges with counts", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("2 HN")).toBeInTheDocument();
        expect(screen.getByText("2 Reddit")).toBeInTheDocument();
      });
    });

    it("displays loading state initially", () => {
      render(<MentionsModal {...defaultProps} />);

      expect(screen.getByText("Loading mentions...")).toBeInTheDocument();
    });
  });

  describe("Filter functionality", () => {
    it("shows all mentions by default", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("React Query v5 released with major TypeScript improvements")).toBeInTheDocument();
        expect(screen.getByText("Why I switched from SWR to React Query - a comparison")).toBeInTheDocument();
      });
    });

    it("filters to show only HackerNews mentions", async () => {
      const user = userEvent.setup();
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("React Query v5 released with major TypeScript improvements")).toBeInTheDocument();
      });

      // Click HackerNews filter
      const hnFilterButton = screen.getByRole("button", { name: /hackernews/i });
      await user.click(hnFilterButton);

      // HN mentions should be visible
      expect(screen.getByText("React Query v5 released with major TypeScript improvements")).toBeInTheDocument();

      // Reddit mentions should not be visible
      expect(screen.queryByText("Why I switched from SWR to React Query - a comparison")).not.toBeInTheDocument();
    });

    it("filters to show only Reddit mentions", async () => {
      const user = userEvent.setup();
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("React Query v5 released with major TypeScript improvements")).toBeInTheDocument();
      });

      // Click Reddit filter
      const redditFilterButton = screen.getByRole("button", { name: /reddit/i });
      await user.click(redditFilterButton);

      // Reddit mentions should be visible
      expect(screen.getByText("Why I switched from SWR to React Query - a comparison")).toBeInTheDocument();

      // HN mentions should not be visible
      expect(screen.queryByText("React Query v5 released with major TypeScript improvements")).not.toBeInTheDocument();
    });

    it("shows all mentions when 'All' filter is clicked", async () => {
      const user = userEvent.setup();
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("React Query v5 released with major TypeScript improvements")).toBeInTheDocument();
      });

      // Click HackerNews filter first
      const hnFilterButton = screen.getByRole("button", { name: /hackernews/i });
      await user.click(hnFilterButton);

      // Then click All filter
      const allFilterButton = screen.getByRole("button", { name: /^all$/i });
      await user.click(allFilterButton);

      // All mentions should be visible
      expect(screen.getByText("React Query v5 released with major TypeScript improvements")).toBeInTheDocument();
      expect(screen.getByText("Why I switched from SWR to React Query - a comparison")).toBeInTheDocument();
    });
  });

  describe("Sort functionality", () => {
    it("sorts by most recent by default", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        const rows = screen.getAllByRole("row");
        // First data row (after header) should be the most recent
        expect(rows[1]).toHaveTextContent("React Query v5 released");
      });
    });

    it("sorts by highest score when selected", async () => {
      const user = userEvent.setup();
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("React Query v5 released with major TypeScript improvements")).toBeInTheDocument();
      });

      // Change sort to highest score
      const sortSelect = screen.getByRole("combobox");
      await user.selectOptions(sortSelect, "score");

      await waitFor(() => {
        const rows = screen.getAllByRole("row");
        // First data row should be Reddit mention with 1200 score
        expect(rows[1]).toHaveTextContent("Why I switched from SWR");
      });
    });

    it("sorts by most comments when selected", async () => {
      const user = userEvent.setup();
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("React Query v5 released with major TypeScript improvements")).toBeInTheDocument();
      });

      // Change sort to most comments
      const sortSelect = screen.getByRole("combobox");
      await user.selectOptions(sortSelect, "comments");

      await waitFor(() => {
        const rows = screen.getAllByRole("row");
        // First data row should be HN mention with 156 comments
        expect(rows[1]).toHaveTextContent("React Query v5 released");
      });
    });
  });

  describe("Close functionality", () => {
    it("calls onClose when close button is clicked", async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      render(<MentionsModal {...defaultProps} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: /close modal/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when backdrop is clicked", async () => {
      const onClose = jest.fn();
      render(<MentionsModal {...defaultProps} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Click on backdrop (the outer dialog element)
      const backdrop = screen.getByRole("dialog");
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when Escape key is pressed", async () => {
      const onClose = jest.fn();
      render(<MentionsModal {...defaultProps} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Empty state", () => {
    it("shows empty state when no mentions found", async () => {
      setupFetchMock([], []);
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("No mentions found yet")).toBeInTheDocument();
        expect(screen.getByText("We'll keep scanning for discussions about your project.")).toBeInTheDocument();
      });
    });
  });

  describe("Error state", () => {
    it("shows error message when fetch fails", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load mentions")).toBeInTheDocument();
      });
    });
  });

  describe("Table content", () => {
    it("displays mention titles as links", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        // Find by text content first, then check it's a link
        const titleText = screen.getByText(/React Query v5 released with major TypeScript improvements/i);
        expect(titleText).toBeInTheDocument();
        // The text should be inside a link
        const titleLink = titleText.closest("a");
        expect(titleLink).toHaveAttribute("href", "https://news.ycombinator.com/item?id=12345");
        expect(titleLink).toHaveAttribute("target", "_blank");
      });
    });

    it("displays formatted scores", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("423")).toBeInTheDocument();
        expect(screen.getByText("1.2k")).toBeInTheDocument();
      });
    });

    it("displays comment counts", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("156")).toBeInTheDocument();
        // 89 appears in two places (score in HN mention #2, comments in Reddit mention #1)
        // Just verify it appears at least once
        expect(screen.getAllByText("89").length).toBeGreaterThanOrEqual(1);
      });
    });

    it("displays formatted dates", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Feb 21, 2026")).toBeInTheDocument();
        expect(screen.getByText("Feb 18, 2026")).toBeInTheDocument();
      });
    });

    it("displays external link buttons", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        const externalLinks = screen.getAllByRole("link", { name: /open.*in new tab/i });
        expect(externalLinks.length).toBe(4); // 2 HN + 2 Reddit
      });
    });

    it("extracts subreddit from Reddit URLs", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("r/reactjs")).toBeInTheDocument();
        expect(screen.getByText("r/webdev")).toBeInTheDocument();
      });
    });
  });

  describe("Pagination", () => {
    it("does not show pagination for small lists", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText(/page/i)).not.toBeInTheDocument();
      });
    });

    it("shows pagination for lists with 20+ items", async () => {
      // Create 25 HN mentions
      const manyMentions: Mention[] = Array.from({ length: 25 }, (_, i) => ({
        id: `hn-${i}`,
        source_type: "hackernews" as const,
        source_url: `https://news.ycombinator.com/item?id=${12345 + i}`,
        title: `Mention ${i + 1}`,
        score: 100 + i,
        comment_count: 10 + i,
        author: `author${i}`,
        published_at: `2026-02-${String(21 - (i % 21)).padStart(2, "0")}T10:00:00Z`,
      }));

      setupFetchMock(manyMentions, []);
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
        expect(screen.getByText(/showing 1 to 20 of 25/i)).toBeInTheDocument();
      });
    });

    it("navigates between pages", async () => {
      const user = userEvent.setup();

      // Create 25 HN mentions
      const manyMentions: Mention[] = Array.from({ length: 25 }, (_, i) => ({
        id: `hn-${i}`,
        source_type: "hackernews" as const,
        source_url: `https://news.ycombinator.com/item?id=${12345 + i}`,
        title: `Mention ${i + 1}`,
        score: 100 + i,
        comment_count: 10 + i,
        author: `author${i}`,
        published_at: `2026-02-${String(21 - (i % 21)).padStart(2, "0")}T10:00:00Z`,
      }));

      setupFetchMock(manyMentions, []);
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
      });

      // Click Next
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
      expect(screen.getByText(/showing 21 to 25 of 25/i)).toBeInTheDocument();

      // Click Previous
      const prevButton = screen.getByRole("button", { name: /previous/i });
      await user.click(prevButton);

      expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper dialog role and aria attributes", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAttribute("aria-modal", "true");
        expect(dialog).toHaveAttribute("aria-labelledby", "mentions-modal-title");
      });
    });

    it("close button has accessible label", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /close modal/i })).toBeInTheDocument();
      });
    });

    it("external links have accessible labels", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        const externalLinks = screen.getAllByRole("link", { name: /open.*in new tab/i });
        expect(externalLinks.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Mobile responsiveness", () => {
    it("table container has horizontal scroll", async () => {
      render(<MentionsModal {...defaultProps} />);

      await waitFor(() => {
        const tableContainer = screen.getByRole("table").closest(".overflow-x-auto");
        expect(tableContainer).toHaveClass("overflow-x-auto");
      });
    });
  });
});
