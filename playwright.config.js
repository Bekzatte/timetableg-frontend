/* global process */
import { defineConfig, devices } from "@playwright/test";

const backendPort = 8010;
const frontendPort = 4173;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    viewport: { width: 1440, height: 1100 },
  },
  webServer: [
    {
      command: "/Library/Frameworks/Python.framework/Versions/3.12/bin/python3 ../backend/server.py",
      cwd: ".",
      url: `http://127.0.0.1:${backendPort}/api/health`,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      env: {
        DATABASE_URL: "",
        SQLITE_DB_FILE: "/tmp/timetable-playwright.sqlite",
        BACKEND_HOST: "127.0.0.1",
        PORT: String(backendPort),
        PYTHONPATH: "../backend/.venv/lib/python3.12/site-packages",
        ALLOWED_ORIGINS: `http://127.0.0.1:${frontendPort}`,
      },
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 4173",
      cwd: ".",
      url: `http://127.0.0.1:${frontendPort}`,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_URL: `http://127.0.0.1:${backendPort}/api`,
      },
    },
  ],
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 1440, height: 1100 },
      },
    },
  ],
});
