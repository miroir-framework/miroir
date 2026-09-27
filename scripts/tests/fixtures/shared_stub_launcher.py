"""#318 fixture: a shared-suites launcher without vitest.

Writes a vitest-like JSON report in which every suite passed, then exits with `--exit N`
(default 0), standing in for a launch that fails after its tests (teardown, reporting).
"""

import json
import sys

argv = sys.argv[1:]
suites = argv[argv.index("--suites") + 1].split(",")
exit_code = int(argv[argv.index("--exit") + 1]) if "--exit" in argv else 0
output = next(a.split("=", 1)[1] for a in argv if a.startswith("--outputFile.json="))
report = {
    "testResults": [
        {
            "name": "stub.suites",
            "status": "passed",
            "startTime": 0,
            "endTime": 1,
            "assertionResults": [
                {"ancestorTitles": [s], "title": "t", "status": "passed", "duration": 1} for s in suites
            ],
        }
    ]
}
with open(output, "w", encoding="utf-8") as fh:
    json.dump(report, fh)
sys.exit(exit_code)
