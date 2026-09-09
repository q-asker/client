#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const doctor_1 = require("../scripts/doctor");
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: i18n-doctor [options]

Check whether your project is aligned with i18nexus core v4.

Options:
  -h, --help       Show this help message

Examples:
  npx i18n-doctor

What it checks:
  - i18nexus core dependency version
  - installed i18nexus package exports
  - i18nexus.config.json compatibility
  - tsconfig moduleResolution for i18nexus/server
  - locales directory and fallback namespace
  - generated locales/index.ts entrypoint
  - generated TypeScript declaration file
  - missing/empty translation values
`);
    process.exit(0);
}
try {
    const report = (0, doctor_1.runDoctor)(process.cwd());
    (0, doctor_1.printDoctorReport)(report);
    process.exit(report.ok ? 0 : 1);
}
catch (error) {
    console.error("❌ i18n-doctor failed:", error);
    process.exit(1);
}
