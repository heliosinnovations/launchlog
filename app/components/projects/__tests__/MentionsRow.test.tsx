import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MentionsRow } from '../MentionsRow';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('MentionsRow', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Loading State', () => {
    it('displays loading state while fetching mentions', () => {
      // Mock fetch to never resolve during this test
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<MentionsRow projectId="test-123" />);

      expect(screen.getByRole('status', { name: 'Loading mentions' })).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error state when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<MentionsRow projectId="test-123" />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.getByText('Unable to load')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays "No mentions found" when counts are zero', async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ mentions: [], total: 0 }),
        });
      });

      render(<MentionsRow projectId="test-123" />);

      await waitFor(() => {
        expect(screen.getByText('No mentions found')).toBeInTheDocument();
      });
    });
  });

  describe('With Mentions', () => {
    it('displays HackerNews mention count', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('hackernews')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ mentions: [], total: 5 }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ mentions: [], total: 0 }),
        });
      });

      render(<MentionsRow projectId="test-123" />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
      expect(screen.getByLabelText('5 HackerNews mentions')).toBeInTheDocument();
    });

    it('displays Reddit mention count', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('reddit')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ mentions: [], total: 3 }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ mentions: [], total: 0 }),
        });
      });

      render(<MentionsRow projectId="test-123" />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
      expect(screen.getByLabelText('3 Reddit mentions')).toBeInTheDocument();
    });

    it('displays both HackerNews and Reddit counts', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('hackernews')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ mentions: [], total: 5 }),
          });
        }
        if (url.includes('reddit')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ mentions: [], total: 3 }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ mentions: [], total: 0 }),
        });
      });

      render(<MentionsRow projectId="test-123" />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });
  });

  describe('View All Button', () => {
    it('shows "View all" button when onViewAll is provided', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ mentions: [], total: 5 }),
        })
      );

      const mockOnViewAll = jest.fn();
      render(<MentionsRow projectId="test-123" onViewAll={mockOnViewAll} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'View all mentions' })).toBeInTheDocument();
      });
    });

    it('calls onViewAll when "View all" is clicked', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ mentions: [], total: 5 }),
        })
      );

      const mockOnViewAll = jest.fn();
      const user = userEvent.setup();
      render(<MentionsRow projectId="test-123" onViewAll={mockOnViewAll} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'View all mentions' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'View all mentions' }));

      expect(mockOnViewAll).toHaveBeenCalledTimes(1);
    });

    it('does not show "View all" button when onViewAll is not provided', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('hackernews')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ mentions: [], total: 5 }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ mentions: [], total: 0 }),
        });
      });

      render(<MentionsRow projectId="test-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText('5 HackerNews mentions')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: 'View all mentions' })).not.toBeInTheDocument();
    });
  });

  describe('API Endpoints', () => {
    it('fetches from correct API endpoints', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ mentions: [], total: 0 }),
        })
      );

      render(<MentionsRow projectId="my-project-id" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/projects/my-project-id/mentions/hackernews');
        expect(mockFetch).toHaveBeenCalledWith('/api/projects/my-project-id/mentions/reddit');
      });
    });

    it('handles partial API failures gracefully', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('hackernews')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ mentions: [], total: 5 }),
          });
        }
        // Reddit API fails
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      });

      render(<MentionsRow projectId="test-123" />);

      // Should still show HN count even if Reddit fails
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for loading state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<MentionsRow projectId="test-123" />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading mentions');
    });

    it('has proper ARIA labels for mention counts', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('hackernews')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ mentions: [], total: 7 }),
          });
        }
        if (url.includes('reddit')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ mentions: [], total: 12 }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ mentions: [], total: 0 }),
        });
      });

      render(<MentionsRow projectId="test-123" />);

      await waitFor(() => {
        expect(screen.getByLabelText('7 HackerNews mentions')).toBeInTheDocument();
        expect(screen.getByLabelText('12 Reddit mentions')).toBeInTheDocument();
      });
    });

    it('has proper ARIA role for error state', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<MentionsRow projectId="test-123" />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
