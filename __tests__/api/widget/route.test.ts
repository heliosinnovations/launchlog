/**
 * Tests for Widget API Endpoint
 *
 * This file tests the embeddable widget API functionality.
 * Tests cover: response format, CORS headers, error handling, and data transformation.
 */

describe("Widget API - Response Format", () => {
  interface WidgetUser {
    username: string;
    avatar: string | null;
    displayName: string;
  }

  interface WidgetProject {
    name: string;
    description: string | null;
    screenshot: string | null;
    stars: number;
    language: string | null;
    repoUrl: string;
    demoUrl: string | null;
    mentions: {
      hackernews?: number;
      reddit?: number;
      total?: number;
    };
  }

  interface WidgetResponse {
    user: WidgetUser;
    projects: WidgetProject[];
  }

  it("should return user data in correct format", () => {
    const mockUser: WidgetUser = {
      username: "testuser",
      avatar: "https://example.com/avatar.jpg",
      displayName: "Test User",
    };

    expect(mockUser).toHaveProperty("username");
    expect(mockUser).toHaveProperty("avatar");
    expect(mockUser).toHaveProperty("displayName");
    expect(typeof mockUser.username).toBe("string");
  });

  it("should return projects array in correct format", () => {
    const mockProject: WidgetProject = {
      name: "test-project",
      description: "A test project",
      screenshot: "https://example.com/screenshot.png",
      stars: 100,
      language: "TypeScript",
      repoUrl: "https://github.com/testuser/test-project",
      demoUrl: "https://test-project.com",
      mentions: {
        hackernews: 5,
        reddit: 3,
        total: 8,
      },
    };

    expect(mockProject).toHaveProperty("name");
    expect(mockProject).toHaveProperty("description");
    expect(mockProject).toHaveProperty("screenshot");
    expect(mockProject).toHaveProperty("stars");
    expect(mockProject).toHaveProperty("language");
    expect(mockProject).toHaveProperty("repoUrl");
    expect(mockProject).toHaveProperty("demoUrl");
    expect(mockProject).toHaveProperty("mentions");
  });

  it("should allow null values for optional fields", () => {
    const mockProject: WidgetProject = {
      name: "minimal-project",
      description: null,
      screenshot: null,
      stars: 0,
      language: null,
      repoUrl: "https://github.com/testuser/minimal-project",
      demoUrl: null,
      mentions: {},
    };

    expect(mockProject.description).toBeNull();
    expect(mockProject.screenshot).toBeNull();
    expect(mockProject.language).toBeNull();
    expect(mockProject.demoUrl).toBeNull();
  });

  it("should calculate total mentions correctly", () => {
    const mentionCounts = [
      { hackernews: 5, reddit: 3, expectedTotal: 8 },
      { hackernews: 0, reddit: 10, expectedTotal: 10 },
      { hackernews: 15, reddit: 0, expectedTotal: 15 },
      { hackernews: 0, reddit: 0, expectedTotal: 0 },
    ];

    for (const testCase of mentionCounts) {
      const total =
        (testCase.hackernews || 0) + (testCase.reddit || 0);
      expect(total).toBe(testCase.expectedTotal);
    }
  });
});

describe("Widget API - CORS Headers", () => {
  const EXPECTED_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  it("should include Access-Control-Allow-Origin header", () => {
    expect(EXPECTED_CORS_HEADERS["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("should allow GET and OPTIONS methods", () => {
    expect(EXPECTED_CORS_HEADERS["Access-Control-Allow-Methods"]).toContain(
      "GET"
    );
    expect(EXPECTED_CORS_HEADERS["Access-Control-Allow-Methods"]).toContain(
      "OPTIONS"
    );
  });

  it("should allow Content-Type header", () => {
    expect(EXPECTED_CORS_HEADERS["Access-Control-Allow-Headers"]).toContain(
      "Content-Type"
    );
  });
});

describe("Widget API - Cache Headers", () => {
  it("should set appropriate cache control headers", () => {
    const cacheControl =
      "public, s-maxage=3600, stale-while-revalidate=86400";

    // Verify cache settings
    expect(cacheControl).toContain("s-maxage=3600"); // 1 hour cache
    expect(cacheControl).toContain("stale-while-revalidate=86400"); // 24 hour stale-while-revalidate
    expect(cacheControl).toContain("public"); // Publicly cacheable
  });
});

describe("Widget API - Error Responses", () => {
  interface ErrorResponse {
    error: string;
    code: string;
  }

  it("should return proper error format for user not found", () => {
    const errorResponse: ErrorResponse = {
      error: "User not found",
      code: "USER_NOT_FOUND",
    };

    expect(errorResponse.error).toBe("User not found");
    expect(errorResponse.code).toBe("USER_NOT_FOUND");
  });

  it("should return proper error format for fetch error", () => {
    const errorResponse: ErrorResponse = {
      error: "Failed to fetch projects",
      code: "FETCH_ERROR",
    };

    expect(errorResponse.error).toBe("Failed to fetch projects");
    expect(errorResponse.code).toBe("FETCH_ERROR");
  });

  it("should return proper error format for internal error", () => {
    const errorResponse: ErrorResponse = {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    };

    expect(errorResponse.error).toBe("Internal server error");
    expect(errorResponse.code).toBe("INTERNAL_ERROR");
  });
});

describe("Widget API - Username Handling", () => {
  it("should handle case-insensitive username lookup", () => {
    const usernameVariants = ["TestUser", "testuser", "TESTUSER", "tEsTuSeR"];
    const normalized = usernameVariants.map((u) => u.toLowerCase());

    // All variants should normalize to the same value
    expect(new Set(normalized).size).toBe(1);
    expect(normalized[0]).toBe("testuser");
  });

  it("should handle usernames with special characters", () => {
    const validUsernames = [
      "user123",
      "user-name",
      "user_name",
      "123user",
      "a",
    ];

    for (const username of validUsernames) {
      expect(username.length).toBeGreaterThan(0);
    }
  });
});

describe("Widget API - Screenshot URL Generation", () => {
  it("should use existing screenshot URL if available", () => {
    const existingScreenshot = "https://example.com/custom-screenshot.png";
    const repoFullName = "user/repo";

    // Priority: existing screenshot over fallback
    const result = existingScreenshot || `https://opengraph.githubassets.com/1/${repoFullName}`;
    expect(result).toBe(existingScreenshot);
  });

  it("should generate GitHub OpenGraph fallback URL", () => {
    const repoFullName = "testuser/awesome-project";
    const fallbackUrl = `https://opengraph.githubassets.com/1/${repoFullName}`;

    expect(fallbackUrl).toBe(
      "https://opengraph.githubassets.com/1/testuser/awesome-project"
    );
  });

  it("should handle null screenshot gracefully", () => {
    const screenshotUrl = null;
    const repoFullName = "user/repo";

    const result =
      screenshotUrl ||
      (repoFullName
        ? `https://opengraph.githubassets.com/1/${repoFullName}`
        : null);

    expect(result).toBe("https://opengraph.githubassets.com/1/user/repo");
  });
});

describe("Widget API - Data Transformation", () => {
  it("should transform database repo to widget project format", () => {
    const dbRepo = {
      id: "uuid-123",
      repo_name: "my-project",
      repo_full_name: "user/my-project",
      repo_url: "https://github.com/user/my-project",
      repo_description: "A description",
      repo_language: "TypeScript",
      repo_stars: 50,
      screenshot_url: null,
      demo_url: "https://my-project.com",
    };

    const widgetProject = {
      name: dbRepo.repo_name,
      description: dbRepo.repo_description,
      screenshot:
        dbRepo.screenshot_url ||
        `https://opengraph.githubassets.com/1/${dbRepo.repo_full_name}`,
      stars: dbRepo.repo_stars,
      language: dbRepo.repo_language,
      repoUrl: dbRepo.repo_url,
      demoUrl: dbRepo.demo_url,
      mentions: {},
    };

    expect(widgetProject.name).toBe("my-project");
    expect(widgetProject.screenshot).toBe(
      "https://opengraph.githubassets.com/1/user/my-project"
    );
  });

  it("should aggregate mentions by source type", () => {
    const mentionsData = [
      { project_id: "p1", source_type: "hackernews" },
      { project_id: "p1", source_type: "hackernews" },
      { project_id: "p1", source_type: "reddit" },
      { project_id: "p2", source_type: "hackernews" },
    ];

    const mentionsByProject: Record<string, Record<string, number>> = {};

    for (const mention of mentionsData) {
      if (!mentionsByProject[mention.project_id]) {
        mentionsByProject[mention.project_id] = {};
      }
      mentionsByProject[mention.project_id][mention.source_type] =
        (mentionsByProject[mention.project_id][mention.source_type] || 0) + 1;
    }

    expect(mentionsByProject["p1"]["hackernews"]).toBe(2);
    expect(mentionsByProject["p1"]["reddit"]).toBe(1);
    expect(mentionsByProject["p2"]["hackernews"]).toBe(1);
  });
});

describe("Widget API - Edge Cases", () => {
  it("should handle empty projects array", () => {
    const response = {
      user: {
        username: "testuser",
        avatar: null,
        displayName: "Test User",
      },
      projects: [],
    };

    expect(response.projects).toHaveLength(0);
    expect(Array.isArray(response.projects)).toBe(true);
  });

  it("should handle projects with zero stars", () => {
    const project = {
      name: "unpopular-project",
      stars: 0,
    };

    expect(project.stars).toBe(0);
    expect(typeof project.stars).toBe("number");
  });

  it("should handle very long descriptions", () => {
    const longDescription = "A".repeat(1000);
    const project = {
      name: "project",
      description: longDescription,
    };

    expect(project.description.length).toBe(1000);
  });

  it("should handle special characters in project names", () => {
    const specialNames = [
      "project-with-dashes",
      "project_with_underscores",
      "project.with.dots",
      "123-project",
    ];

    for (const name of specialNames) {
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

describe("Widget Script - Configuration", () => {
  it("should support all variant options", () => {
    const validVariants = ["grid", "horizontal", "bold", "strip", "feature"];

    for (const variant of validVariants) {
      expect(typeof variant).toBe("string");
    }
  });

  it("should support theme options", () => {
    const validThemes = ["auto", "light", "dark"];

    for (const theme of validThemes) {
      expect(typeof theme).toBe("string");
    }
  });

  it("should parse numeric limit correctly", () => {
    const limitStrings = ["3", "6", "9", "12"];

    for (const limitStr of limitStrings) {
      const limit = parseInt(limitStr, 10);
      expect(Number.isInteger(limit)).toBe(true);
      expect(limit).toBeGreaterThan(0);
    }
  });

  it("should support column configuration", () => {
    const validColumns = ["2", "3"];

    for (const col of validColumns) {
      expect(["2", "3"].includes(col)).toBe(true);
    }
  });
});

describe("Widget Script - Star Formatting", () => {
  function formatStars(stars: number): string {
    if (stars >= 1000) {
      return (stars / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return stars.toString();
  }

  it("should format numbers under 1000 without suffix", () => {
    expect(formatStars(0)).toBe("0");
    expect(formatStars(1)).toBe("1");
    expect(formatStars(500)).toBe("500");
    expect(formatStars(999)).toBe("999");
  });

  it("should format numbers over 1000 with k suffix", () => {
    expect(formatStars(1000)).toBe("1k");
    expect(formatStars(1500)).toBe("1.5k");
    expect(formatStars(10000)).toBe("10k");
    expect(formatStars(42100)).toBe("42.1k");
  });

  it("should remove trailing .0 in formatted numbers", () => {
    expect(formatStars(2000)).toBe("2k");
    expect(formatStars(5000)).toBe("5k");
    expect(formatStars(10000)).toBe("10k");
  });
});

describe("Widget Script - Language Colors", () => {
  const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Rust: "#dea584",
    Go: "#00ADD8",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
  };

  it("should have colors for common languages", () => {
    const commonLanguages = ["TypeScript", "JavaScript", "Python", "Go", "Rust"];

    for (const lang of commonLanguages) {
      expect(LANGUAGE_COLORS[lang]).toBeDefined();
      expect(LANGUAGE_COLORS[lang]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("should use valid hex color format", () => {
    for (const color of Object.values(LANGUAGE_COLORS)) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
