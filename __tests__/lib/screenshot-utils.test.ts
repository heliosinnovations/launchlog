import {
  extractDemoUrl,
  getGitHubPreview,
  fetchRepoHomepage,
} from "@/lib/screenshot-utils"

describe("Screenshot Utils", () => {
  describe("extractDemoUrl", () => {
    it("should return null for empty or invalid input", () => {
      expect(extractDemoUrl("")).toBeNull()
      expect(extractDemoUrl(null as unknown as string)).toBeNull()
      expect(extractDemoUrl(undefined as unknown as string)).toBeNull()
    })

    it("should extract Vercel deployment URLs", () => {
      const readme = "Check out the demo at https://my-app.vercel.app"
      expect(extractDemoUrl(readme)).toBe("https://my-app.vercel.app")
    })

    it("should extract Netlify deployment URLs", () => {
      const readme = "Live demo: https://my-project.netlify.app/"
      expect(extractDemoUrl(readme)).toBe("https://my-project.netlify.app/")
    })

    it("should extract Heroku deployment URLs", () => {
      const readme = "Try it: https://my-app-name.herokuapp.com"
      expect(extractDemoUrl(readme)).toBe("https://my-app-name.herokuapp.com")
    })

    it("should extract Railway deployment URLs", () => {
      const readme = "Demo available at https://myapp.railway.app"
      expect(extractDemoUrl(readme)).toBe("https://myapp.railway.app")
    })

    it("should extract Render deployment URLs", () => {
      const readme = "See https://my-service.onrender.com for live demo"
      expect(extractDemoUrl(readme)).toBe("https://my-service.onrender.com")
    })

    it("should extract GitHub Pages URLs", () => {
      const readme = "Visit https://username.github.io/project-name for the demo"
      expect(extractDemoUrl(readme)).toBe("https://username.github.io/project-name")
    })

    it("should extract markdown link with demo text", () => {
      const readme = "Check out the [demo](https://example-demo.vercel.app) here"
      expect(extractDemoUrl(readme)).toBe("https://example-demo.vercel.app")
    })

    it("should extract live demo markdown links", () => {
      const readme = "[Live Demo](https://my-live-app.netlify.app)"
      expect(extractDemoUrl(readme)).toBe("https://my-live-app.netlify.app")
    })

    it("should extract live site markdown links", () => {
      const readme = "Visit the [live site](https://production-app.vercel.app)"
      expect(extractDemoUrl(readme)).toBe("https://production-app.vercel.app")
    })

    it("should extract URLs with 'Demo:' prefix", () => {
      const readme = "Demo: https://cool-demo.vercel.app"
      expect(extractDemoUrl(readme)).toBe("https://cool-demo.vercel.app")
    })

    it("should extract URLs with 'Live:' prefix", () => {
      const readme = "Live: https://live-app.netlify.app"
      expect(extractDemoUrl(readme)).toBe("https://live-app.netlify.app")
    })

    it("should exclude GitHub URLs", () => {
      const readme = "Check https://github.com/user/repo for the source"
      expect(extractDemoUrl(readme)).toBeNull()
    })

    it("should exclude NPM URLs", () => {
      const readme = "Available at https://npmjs.com/package/my-package"
      expect(extractDemoUrl(readme)).toBeNull()
    })

    it("should exclude badge URLs (shields.io)", () => {
      const readme = "[![Build](https://shields.io/badge/build-passing)](https://shields.io)"
      expect(extractDemoUrl(readme)).toBeNull()
    })

    it("should exclude CI/CD URLs", () => {
      const readmes = [
        "https://travis-ci.org/user/repo",
        "https://circleci.com/gh/user/repo",
        "https://codecov.io/gh/user/repo",
      ]

      for (const readme of readmes) {
        expect(extractDemoUrl(readme)).toBeNull()
      }
    })

    it("should prefer deployment platform URLs over generic URLs", () => {
      const readme = `
        # My Project

        Check out https://my-app.vercel.app for the demo.
        Also see https://random-site.com/demo for more info.
      `
      expect(extractDemoUrl(readme)).toBe("https://my-app.vercel.app")
    })

    it("should handle README with multiple demo URLs and return first valid one", () => {
      const readme = `
        [Demo](https://first-demo.vercel.app)

        Alternative: https://second-demo.netlify.app
      `
      const result = extractDemoUrl(readme)
      // Should return the first valid URL found (the markdown link)
      expect(result).toBe("https://first-demo.vercel.app")
    })

    it("should handle complex README with mixed content", () => {
      const readme = `
        # Awesome Project

        [![Build Status](https://travis-ci.org/user/repo.svg)](https://travis-ci.org/user/repo)
        [![npm](https://img.shields.io/npm/v/package.svg)](https://npmjs.com/package/package)

        ## Installation

        \`\`\`bash
        npm install package
        \`\`\`

        ## Demo

        Check out the [live demo](https://awesome-project.vercel.app)!

        ## License

        MIT
      `
      expect(extractDemoUrl(readme)).toBe("https://awesome-project.vercel.app")
    })
  })

  describe("getGitHubPreview", () => {
    it("should generate correct GitHub OpenGraph URL", () => {
      const url = getGitHubPreview("octocat/Hello-World")
      expect(url).toBe("https://opengraph.githubassets.com/1/octocat/Hello-World")
    })

    it("should handle various repo names", () => {
      expect(getGitHubPreview("user/repo")).toBe(
        "https://opengraph.githubassets.com/1/user/repo"
      )
      expect(getGitHubPreview("org-name/project-name")).toBe(
        "https://opengraph.githubassets.com/1/org-name/project-name"
      )
    })

    it("should throw for invalid input", () => {
      expect(() => getGitHubPreview("")).toThrow("Invalid repository name")
      expect(() => getGitHubPreview(null as unknown as string)).toThrow(
        "Invalid repository name"
      )
      expect(() => getGitHubPreview(undefined as unknown as string)).toThrow(
        "Invalid repository name"
      )
    })
  })

  describe("fetchRepoHomepage", () => {
    const originalFetch = global.fetch

    afterEach(() => {
      global.fetch = originalFetch
    })

    it("should return null for empty repo name", async () => {
      expect(await fetchRepoHomepage("")).toBeNull()
      expect(await fetchRepoHomepage(null as unknown as string)).toBeNull()
      expect(await fetchRepoHomepage(undefined as unknown as string)).toBeNull()
    })

    it("should return homepage URL when present", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            homepage: "https://skylineivy-react.netlify.app",
          }),
      })

      const result = await fetchRepoHomepage("Avi-Aravindh/skylineivy-react")
      expect(result).toBe("https://skylineivy-react.netlify.app")
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/Avi-Aravindh/skylineivy-react",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/vnd.github+json",
            "User-Agent": "LaunchLog/1.0",
          }),
        })
      )
    })

    it("should return null when homepage is not set", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            homepage: "",
          }),
      })

      const result = await fetchRepoHomepage("user/repo-without-homepage")
      expect(result).toBeNull()
    })

    it("should return null when homepage is null", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            homepage: null,
          }),
      })

      const result = await fetchRepoHomepage("user/repo-null-homepage")
      expect(result).toBeNull()
    })

    it("should return null when API request fails", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })

      const result = await fetchRepoHomepage("nonexistent/repo")
      expect(result).toBeNull()
    })

    it("should return null when fetch throws error", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"))

      const result = await fetchRepoHomepage("user/repo")
      expect(result).toBeNull()
    })

    it("should include Authorization header when token provided", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            homepage: "https://example.com",
          }),
      })

      await fetchRepoHomepage("user/repo", "test-github-token")
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/user/repo",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-github-token",
          }),
        })
      )
    })
  })
})
