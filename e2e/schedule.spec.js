import { expect, test } from "@playwright/test";

const BACKEND_URL = "http://127.0.0.1:8010/api";

async function getAdminToken(request) {
  const response = await request.post(`${BACKEND_URL}/auth/login`, {
    data: {
      email: "admin@kazatu.edu.kz",
      password: "admin123",
      role: "admin",
    },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.token;
}

async function clearAndSeedScheduleData(request) {
  const token = await getAdminToken(request);
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const clearResponse = await request.post(`${BACKEND_URL}/admin/clear-all`, {
    headers,
  });
  expect(clearResponse.ok()).toBeTruthy();

  const teacherResponse = await request.post(`${BACKEND_URL}/teachers`, {
    headers,
    data: {
      name: "Aruzhan Saparova",
      email: "aruzhan.saparova@kazatu.edu.kz",
      phone: "+77770000000",
      department: "CS",
      weekly_hours_limit: 20,
      teaching_languages: ["ru", "kk"],
    },
  });
  expect(teacherResponse.ok()).toBeTruthy();
  const teacher = await teacherResponse.json();

  const courseResponse = await request.post(`${BACKEND_URL}/disciplines`, {
    headers,
    data: {
      name: "Algorithms",
      code: "CS201",
      year: 2,
      semester: 1,
      department: "CS",
      instructor_id: teacher.id,
      instructor_name: teacher.name,
      programme: "Software Engineering",
      requires_computers: 0,
    },
  });
  expect(courseResponse.ok()).toBeTruthy();
  const course = await courseResponse.json();

  const roomResponse = await request.post(`${BACKEND_URL}/rooms`, {
    headers,
    data: {
      number: "401",
      capacity: 40,
      building: "Main",
      type: "lecture",
      equipment: "Projector",
      department: "CS",
      available: 1,
      computer_count: 0,
    },
  });
  expect(roomResponse.ok()).toBeTruthy();

  const groupResponse = await request.post(`${BACKEND_URL}/groups`, {
    headers,
    data: {
      name: "SE-24-01",
      student_count: 24,
      has_subgroups: 0,
      language: "ru",
      study_course: 2,
    },
  });
  expect(groupResponse.ok()).toBeTruthy();
  const group = await groupResponse.json();

  const sectionResponse = await request.post(`${BACKEND_URL}/sections`, {
    headers,
    data: {
      course_id: course.id,
      course_name: course.name,
      group_id: group.id,
      group_name: group.name,
      classes_count: 2,
      lesson_type: "lecture",
    },
  });
  expect(sectionResponse.ok()).toBeTruthy();

  return headers;
}

async function generateScheduleViaApi(request, headers) {
  const createResponse = await request.post(`${BACKEND_URL}/schedules/generate`, {
    headers,
    data: {
      semester: 1,
      year: 2026,
      algorithm: "optimizer",
    },
  });
  expect(createResponse.ok()).toBeTruthy();
  const job = await createResponse.json();

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const statusResponse = await request.get(
      `${BACKEND_URL}/schedules/generate/${job.jobId}`,
      { headers },
    );
    expect(statusResponse.ok()).toBeTruthy();
    const payload = await statusResponse.json();
    if (payload.status === "completed") {
      return payload;
    }
    if (payload.status === "failed") {
      throw new Error(`Schedule generation failed: ${payload.errorCode}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw new Error(`Schedule generation job ${job.jobId} did not complete`);
}

async function loginAsAdmin(page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /^админ$|^admin$/i }).click();
  await page.locator('input[type="email"]').fill("admin@kazatu.edu.kz");
  await page.locator('input[type="password"]').fill("admin123");
  await page.getByRole("button", { name: /^войти$|^login$|^кіру$/i }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("login page renders stable UI", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByTestId("login-card")).toBeVisible();
  await expect(page.getByTestId("login-card")).toHaveScreenshot("login-card-ru.png");
});

test("admin can generate a real schedule through the UI", async ({ page, request }) => {
  await clearAndSeedScheduleData(request);
  await loginAsAdmin(page);

  await page.goto("/schedule");
  const toolbar = page.getByTestId("schedule-toolbar");
  await expect(toolbar).toBeVisible();

  await toolbar
    .getByRole("button", {
      name: /создать расписание|сгенерировать новое расписание|generate schedule|generate new schedule|кесте құру|жаңа кесте құру/i,
    })
    .click();

  await page.locator('input[name="year"]').fill("2026");
  await page
    .getByRole("button", {
      name: /^создать расписание$|^сгенерировать новое расписание$|^generate schedule$|^generate new schedule$|^кесте құру$|^жаңа кесте құру$/i,
    })
    .last()
    .click();

  await expect(page.getByText("Algorithms").first()).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText("SE-24-01").first()).toBeVisible();
  await expect(page.getByText("Aruzhan Saparova").first()).toBeVisible();
});

test("schedule toolbar stays stable across ru kk en", async ({ page, request }) => {
  const headers = await clearAndSeedScheduleData(request);
  await generateScheduleViaApi(request, headers);
  await loginAsAdmin(page);

  await page.goto("/schedule");
  const toolbar = page.getByTestId("schedule-toolbar");
  await expect(toolbar).toBeVisible();

  const languageCases = [
    { switcher: "РУС" },
    { switcher: "ҚАЗ" },
    { switcher: "ENG" },
  ];

  for (const languageCase of languageCases) {
    await page
      .getByRole("navigation")
      .getByRole("button", { name: languageCase.switcher })
      .click();
    await expect(toolbar).toBeVisible();
    await expect(
      page.getByRole("navigation").getByRole("button", {
        name: languageCase.switcher,
      }),
    ).toBeVisible();
  }
});
