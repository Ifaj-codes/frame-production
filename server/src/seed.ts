import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Frame Production database...");

  // 1. App Branding
  await prisma.appBranding.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      appName: "Frame Production",
      logoUrl: "/assets/logo.png",
      companySubtitle: "Video Editing & Production Agency",
      breakRulesJson: JSON.stringify({
        maxBreaksPerDay: 4,
        maxDailyMinutes: 60,
        notifyOverdueMinutes: 5
      }),
      monitoringConfig: JSON.stringify({
        idleThresholdMinutes: 5,
        screenshotIntervalMinutes: 10,
        screenshotsEnabled: true
      })
    }
  });

  // 2. Preset Break Types
  const breakTypes = [
    { name: "Breakfast", maxDurationMinutes: 20, dailyAllowanceMinutes: 20, requiresApproval: true },
    { name: "Lunch", maxDurationMinutes: 45, dailyAllowanceMinutes: 45, requiresApproval: true },
    { name: "Prayer", maxDurationMinutes: 15, dailyAllowanceMinutes: 30, requiresApproval: true },
    { name: "Personal break", maxDurationMinutes: 15, dailyAllowanceMinutes: 30, requiresApproval: true },
    { name: "Medical break", maxDurationMinutes: 30, dailyAllowanceMinutes: 60, requiresApproval: true },
    { name: "Custom break", maxDurationMinutes: 30, dailyAllowanceMinutes: 60, requiresApproval: true }
  ];

  for (const bt of breakTypes) {
    await prisma.breakType.upsert({
      where: { name: bt.name },
      update: bt,
      create: bt
    });
  }

  // 3. Hash Passwords
  const devHash = await bcrypt.hash("DevPass@2026", 10);
  const adminHash = await bcrypt.hash("AdminPass@2026", 10);
  const empHash = await bcrypt.hash("EmpPass@2026", 10);

  // 4. Create 1 Developer
  const developer = await prisma.user.upsert({
    where: { username: "developer" },
    update: {},
    create: {
      username: "developer",
      passwordHash: devHash,
      role: "DEVELOPER",
      fullName: "System Developer & Architect",
      jobTitle: "Lead Systems Architect",
      workstationId: "DEV-MAIN"
    }
  });

  // 5. Create 3 Administrators
  const admins = [
    { username: "admin_ops", fullName: "Tanvir Rahman", jobTitle: "Operations Director", workstationId: "WS-OPS-01" },
    { username: "admin_hr", fullName: "Farzana Yasmin", jobTitle: "HR & People Manager", workstationId: "WS-HR-01" },
    { username: "admin_lead", fullName: "Kamrul Hassan", jobTitle: "Post-Production Supervisor", workstationId: "WS-LEAD-01" }
  ];

  for (const adm of admins) {
    await prisma.user.upsert({
      where: { username: adm.username },
      update: {},
      create: {
        username: adm.username,
        passwordHash: adminHash,
        role: "ADMIN",
        fullName: adm.fullName,
        jobTitle: adm.jobTitle,
        workstationId: adm.workstationId
      }
    });
  }

  // 6. Create 17 Employees
  const employeeData = [
    { num: "01", name: "Sabbir Ahmed", title: "Senior Video Editor (Premiere/DaVinci)", ws: "WS-EDIT-01" },
    { num: "02", name: "Rifat Hossain", title: "Motion Graphics Artist (After Effects)", ws: "WS-EDIT-02" },
    { num: "03", name: "Anisur Rahman", title: "Colorist & Finishing Artist", ws: "WS-EDIT-03" },
    { num: "04", name: "Mehedi Hasan", title: "Lead Sound Designer & Audio Engineer", ws: "WS-AUDIO-01" },
    { num: "05", name: "Nafis Imtiaz", title: "3D VFX & Blender Specialist", ws: "WS-VFX-01" },
    { num: "06", name: "Tahmid Khan", title: "Short-Form / Reels Specialist", ws: "WS-EDIT-04" },
    { num: "07", name: "Mahmudul Haque", title: "Commercial Video Editor", ws: "WS-EDIT-05" },
    { num: "08", name: "Zubair Al-Mamun", title: "Documentary & Story Editor", ws: "WS-EDIT-06" },
    { num: "09", name: "Shakil Anwar", title: "YouTube & Creator Content Editor", ws: "WS-EDIT-07" },
    { num: "10", name: "Fahim Faysal", title: "Visual Effects Compositor", ws: "WS-VFX-02" },
    { num: "11", name: "Arif Chowdhury", title: "Junior Video Editor", ws: "WS-EDIT-08" },
    { num: "12", name: "Kazi Shahriar", title: "Junior Motion Designer", ws: "WS-EDIT-09" },
    { num: "13", name: "Nazmul Huda", title: "Video Assistant & Ingest Tech", ws: "WS-INGEST-01" },
    { num: "14", name: "Imran Hossain", title: "Assistant Colorist", ws: "WS-EDIT-10" },
    { num: "15", name: "Ashiqur Rahman", title: "Promo & Trailer Editor", ws: "WS-EDIT-11" },
    { num: "16", name: "Sharif Ahmed", title: "Subtitle & Localization Specialist", ws: "WS-EDIT-12" },
    { num: "17", name: "Nayeem Islam", title: "Archive & Media Asset Manager", ws: "WS-ARCHIVE-01" }
  ];

  for (const emp of employeeData) {
    const username = `emp_${emp.num}`;
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        passwordHash: empHash,
        role: "EMPLOYEE",
        fullName: emp.name,
        jobTitle: emp.title,
        workstationId: emp.ws
      }
    });

    // Seed default work schedule
    await prisma.workSchedule.create({
      data: {
        userId: user.id,
        daysOfWeek: "1,2,3,4,5,6",
        startTime: "09:00",
        endTime: "18:00",
        gracePeriodMinutes: 15,
        expectedHoursPerDay: 8.0
      }
    });
  }

  // Seed sample initial attendance for today so reports and dashboard immediately show live metrics
  const today = new Date().toISOString().split("T")[0];
  const allEmployees = await prisma.user.findMany({ where: { role: "EMPLOYEE" } });
  
  for (let i = 0; i < allEmployees.length; i++) {
    const emp = allEmployees[i];
    // First 12 present, 2 late, 1 on leave, 2 offline/yet to clock in
    if (i < 12) {
      const clockIn = new Date();
      clockIn.setHours(8, 50 + (i % 10), 0);
      await prisma.attendanceSession.create({
        data: {
          userId: emp.id,
          date: today,
          clockInTime: clockIn,
          status: "PRESENT",
          totalElapsedMinutes: 180,
          netWorkMinutes: 165
        }
      });
    } else if (i < 14) {
      const clockIn = new Date();
      clockIn.setHours(9, 25, 0); // Late arrival past grace period
      await prisma.attendanceSession.create({
        data: {
          userId: emp.id,
          date: today,
          clockInTime: clockIn,
          status: "LATE",
          totalElapsedMinutes: 150,
          netWorkMinutes: 140
        }
      });
    } else if (i === 14) {
      await prisma.leaveApplication.create({
        data: {
          userId: emp.id,
          leaveReason: "Medical appointment",
          startDate: today,
          endDate: today,
          description: "Routine health checkup scheduled at 11 AM",
          status: "APPROVED",
          decisionReason: "Approved by Operations Director",
          decidedBy: "admin_ops"
        }
      });
      await prisma.attendanceSession.create({
        data: {
          userId: emp.id,
          date: today,
          clockInTime: new Date(),
          clockOutTime: new Date(),
          status: "ON_LEAVE"
        }
      });
    }
  }

  console.log("Successfully seeded:");
  console.log("- 1 Developer (developer / DevPass@2026)");
  console.log("- 3 Administrators (admin_ops, admin_hr, admin_lead / AdminPass@2026)");
  console.log("- 17 Employees (emp_01 to emp_17 / EmpPass@2026)");
  console.log("- 6 Preset Break Types & Default Schedules");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
