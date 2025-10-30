this is a good example of a failed attempt using the PRD approach. The resulted modifications did not successfully implement the overall feature described in `statement.md`

short of a thorough analysis the following points can be hinted at:

- the task list failed to "corner" the LLM into responding properly and "digging" into the problem, remaining at the (slop) surface
- the task list fails to adopt an approach based on refinement, instead focusing tasks on piecewise software artifacts, neglecting integration issues late into the process
- the tasks fail to be "feature-oriented", instead they each paint a corner of the picture without trying to follow the design.
- the task list fails to adopt a test-driven approach, where each task can be validated through testing at the end of running its sub-tasks. This is turn neglects to feed the LLM back with essential information to correct course.
- The task list fails to assign an "intent" to each task, blurring the tasks' purpose and means. Proper task "intents" could be: INTERFACE (only interfaces are modified, no behavior modification, task is not test-driven), TEST (the purpose of the task is to improve tests, no behavior modification, test is non-regression driven, as added tests must match existing behavior), FEATURE (the purpose is to add a new feature without altering the existing behavior, minimal test is added to take the new feature into account, task is test-driven by the new tests and by non-regression tests), REFACTOR (the purpose of the task is to alter the organisation of the code without altering the behavior, the task is non-regression-test driven), ALTER (the purpose of the task is to alter existing behavior, the task is test-driven and implies altering some tests and the behavior of the implementation without altering the implementation's organisation)


Hinted improvements on the task-generation generate-tasks.md

Key issue seems to be that, whenever the overall complexity of the feature exceeds the LLM's capacity to deal with it in one round, the LLM should suggest dividing the goal described in the PRD into many sub-goals, with 1 PRD per sub-goal. Failing to do so, the generated tasks fail to takle a problem that is sipmly too complex, and remain on the surface, barely scraping the surface of the described problem.

- instead of generating tasks based on software artefacts (code files, modules, namespaces, packages, etc.) generate tasks instead based on a succession of partial achievements successively nearing the goal to be reached. !!!!!!!!!!GIVE AN EXAMPLE!!!!!!!!!!
- categorise explicitly each task according to the categories above; if a task can not seem to belong to a category above, split it into separate tasks each properly categorized.
- tasks must be "feature-oriented": as much as possible, the overall goal must be split into partial features, each implemented in one task with one or more tests allowing to drive the process towards its successful implementation and non-regression
- one or more tasks in the end should check for overall integration or end-to-end non-regression and overall goal success
- each test-driven task must explicitly identify the test(s) it will use as guidance and how those tests are executed