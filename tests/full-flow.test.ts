import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:8000";
const prisma = new PrismaClient();

type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    phone: string;
    role: "BENEFICIARY" | "OFFICER";
    profileComplete: boolean;
  };
};

type SchemeListItem = {
  id: string;
  title: string;
  schemeType: string;
  amount: number;
  state: string;
};

type Application = {
  id: string;
  status: string;
  user: {
    name: string;
    phone: string;
    bankAccount: string | null;
    ifsc: string | null;
  };
};

type PaymentResponse = {
  message: string;
  transactionId: string;
  status: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(
  path: string,
  options: RequestInit & { expectedStatus?: number } = {},
): Promise<T> {
  const expectedStatus = options.expectedStatus ?? 200;
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  assert.equal(
    response.status,
    expectedStatus,
    `${options.method || "GET"} ${path} returned ${response.status}: ${text}`,
  );

  return data as T;
}

async function isServerHealthy(): Promise<boolean> {
  try {
    const health = await request<{ status: string }>("/health");
    return health.status === "UP";
  } catch {
    return false;
  }
}

async function waitForServer(): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt++) {
    if (await isServerHealthy()) return;
    await sleep(1000);
  }

  throw new Error(`Server did not become healthy at ${BASE_URL}`);
}

async function waitForApplications(
  schemeId: string,
  officerToken: string,
): Promise<Application[]> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const applications = await request<Application[]>(
      `/api/officer/schemes/${schemeId}/applications`,
      {
        headers: { Authorization: `Bearer ${officerToken}` },
      },
    );

    if (applications.length > 0) return applications;
    await sleep(1000);
  }

  throw new Error("Eligibility worker did not create applications for the new scheme");
}

function run(command: string, args: string[]): void {
  execFileSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

function startProcess(command: string, args: string[]): ChildProcess {
  return spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
}

function stopProcess(child: ChildProcess): void {
  if (!child.pid) return;

  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });
      return;
    } catch {
      // Fall back to the normal Node kill below.
    }
  }

  child.kill();
}

async function main() {
  const startedProcesses: ChildProcess[] = [];

  try {
    run("npx", ["prisma", "db", "push", "--skip-generate"]);
    run("npm", ["run", "seed"]);

    if (!(await isServerHealthy())) {
      startedProcesses.push(startProcess("npm", ["run", "dev"]));
    }

    startedProcesses.push(startProcess("npx", ["tsx", "src/workers/eligibilityWorker.ts"]));
    startedProcesses.push(startProcess("npx", ["tsx", "src/workers/notificationWorker.ts"]));
    await waitForServer();

    const health = await request<{ status: string }>("/health");
    assert.equal(health.status, "UP");

    const officerLogin = await request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone: "9999999999", password: "123456" }),
    });
    assert.equal(officerLogin.user.role, "OFFICER");

    const beneficiaryLogin = await request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone: "9000000001", password: "123456" }),
    });
    assert.equal(beneficiaryLogin.user.role, "BENEFICIARY");
    assert.equal(beneficiaryLogin.user.profileComplete, true);

    const beneficiaryHeaders = {
      Authorization: `Bearer ${beneficiaryLogin.token}`,
    };
    const officerHeaders = {
      Authorization: `Bearer ${officerLogin.token}`,
    };

    const profile = await request<{ name: string; state: string; income: number }>(
      "/api/beneficiary/profile",
      { headers: beneficiaryHeaders },
    );
    assert.equal(profile.name, "Rohan Kumar");
    assert.equal(profile.state, "Uttar Pradesh");
    assert.equal(profile.income, 45000);

    const schemes = await request<SchemeListItem[]>("/api/schemes", {
      headers: beneficiaryHeaders,
    });
    assert.equal(schemes.length, 3);
    assert.ok(schemes.some((scheme) => scheme.title === "UP Student Scholarship"));

    const schemeTitle = `Full Flow Test Youth Grant ${Date.now()}`;
    const createdScheme = await request<{ message: string; schemeId: string }>(
      "/api/officer/schemes",
      {
        method: "POST",
        headers: officerHeaders,
        expectedStatus: 201,
        body: JSON.stringify({
          title: schemeTitle,
          description: "Created by the full-flow integration test.",
          schemeType: "employment",
          amount: 15000,
          state: "Uttar Pradesh",
          district: "All",
          baseCriteria: {
            incomeLimit: 70000,
            minAge: 18,
            maxAge: 35,
          },
        }),
      },
    );

    assert.ok(createdScheme.schemeId);

    const applications = await waitForApplications(createdScheme.schemeId, officerLogin.token);
    assert.equal(applications.length, 2);
    assert.deepEqual(
      applications.map((application) => application.user.phone).sort(),
      ["9000000001", "9000000004"],
    );

    const notifications = await prisma.notification.findMany({
      where: {
        message: {
          contains: schemeTitle,
        },
      },
      include: {
        user: {
          select: {
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    assert.equal(notifications.length, 2);
    assert.deepEqual(
      notifications.map((notification) => notification.user.phone).sort(),
      ["9000000001", "9000000004"],
    );

    const housing = schemes.find((scheme) => scheme.title === "National Housing Assistance");
    assert.ok(housing, "Expected seeded National Housing Assistance scheme");

    const housingApplications = await request<Application[]>(
      `/api/officer/schemes/${housing.id}/applications`,
      { headers: officerHeaders },
    );
    const payableApplication = housingApplications.find(
      (application) => application.status === "APPROVED",
    );
    assert.ok(payableApplication, "Expected one approved seeded housing application");

    let payment: PaymentResponse | undefined;

    for (let attempt = 0; attempt < 8 && !payment; attempt++) {
      try {
        payment = await request<PaymentResponse>("/api/officer/payment/initiate", {
          method: "POST",
          headers: officerHeaders,
          body: JSON.stringify({ applicationId: payableApplication.id }),
        });
      } catch (error) {
        if (attempt === 7) throw error;
        await sleep(300);
      }
    }

    assert.equal(payment?.status, "PAID");
    assert.ok(payment?.transactionId.startsWith("TXN_"));

    process.stdout.write("\nFull backend flow passed.\n");
    process.stdout.write("- Health endpoint is UP\n");
    process.stdout.write("- Officer login works\n");
    process.stdout.write("- Beneficiary login and profile work\n");
    process.stdout.write("- Seeded schemes are available\n");
    process.stdout.write("- Officer can create a scheme\n");
    process.stdout.write("- Worker processed scheme matching\n");
    process.stdout.write(
      `- Eligibility matched users: ${applications
        .map((application) => application.user.phone)
        .sort()
        .join(", ")}\n`,
    );
    process.stdout.write(
      `- Notifications were created for: ${notifications
        .map((notification) => notification.user.phone)
        .sort()
        .join(", ")}\n`,
    );
    process.stdout.write("- Payment simulation completed\n");
  } finally {
    await prisma.$disconnect();

    for (const child of startedProcesses.reverse()) {
      stopProcess(child);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
