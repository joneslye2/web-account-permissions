# Increment Plan for Agentic Delivery

## 1. Purpose of this plan
This plan breaks the work into small, testable, independently deployable increments. Each increment follows the same execution loop so an agent can implement one increment at a time with minimal ambiguity and a predictable review process.

The plan complements the requirements in [agent-ready-requirements.md](agent-ready-requirements.md). It is designed to support:
- one branch per increment
- one failing unit test before code implementation
- small scope for each PR
- branch deployment validation
- UI verification on the deployed branch environment
- merge-to-main production deployment only after approval

---

## 2. Operating model for each increment
Each increment must follow this order:
1. Create increment branch
2. Define the exact scope and acceptance criteria
3. Write the failing unit test for the increment
4. Implement the minimal code required
5. Run unit tests and fix failures
6. Add/update the UI happy-path test
7. Update Terraform if the increment changes infrastructure
8. Push branch and open PR
9. Run branch pipeline
10. Validate deployment to branch environment
11. Run UI tests against the branch environment
12. Review test output and fix issues
13. Commit and push updates
14. Repeat until green
15. Human approves PR
16. Merge to main
17. Redeploy main to production
18. Delete branch environment and branch

This should be treated as the default delivery pattern for every increment.

---

## 3. Increment strategy
The proposed order is intentionally designed to build the app in dependency-safe layers:

1. Baseline auth and shell
2. Home page visibility and service routing
3. Submission list and category-based view gating
4. Create submission flow
5. Delete submission flow
6. Error-state handling and production hardening
7. Final integration and polish

This keeps each increment small enough for a single agent loop while still delivering a working product incrementally.

---

## 4. Increment details

### Increment 1: Auth shell and home page baseline
Status: In Progress

Objective:
Establish the authenticated user flow and the application shell before business logic is added.

Scope:
- login button when unauthenticated
- logout button when authenticated
- home page shell renders
- service cards or navigation placeholders
- status message area for auth and auth-related errors
- signed-in / signed-out layout states

Acceptance criteria:
- An unauthenticated user sees only login and the unsupported/denied status area where relevant.
- An authenticated user sees logout and the app shell.
- A user with no service access still sees a clear home page status, not a blank screen.

Test focus:
- unit tests for auth state computation
- UI happy-path test for login/logout render paths

Terraform impact:
- likely none or minimal if shared app infra already exists

Definition of done:
- unit tests pass
- UI happy path passes
- app deploys to branch env
- PR ready for review

---

### Increment 2: Service visibility and category-aware routing
Objective:
Implement the rules that determine which services are visible to a user.

Scope:
- home page service visibility logic
- user view eligibility based on category
- create/delete role gating for service visibility
- route to service pages

Acceptance criteria:
- A user with create or delete rights on a service sees that service on home.
- A user with category open sees only services containing visible open submissions.
- A user with category protected sees services containing open or protected visible submissions.
- A user with category confidential sees all services containing any submissions.
- A service with no submissions is still shown if the user is otherwise eligible.

Test focus:
- permission resolution unit tests
- service filtering tests
- basic UI route behaviour tests

Terraform impact:
- likely no app schema changes; only if route config or environment variables are added

Definition of done:
- permission rules are verified in unit tests
- home page service list matches rules
- UI test passes against deployed branch environment

---

### Increment 3: Submission list and view permission behaviour
Objective:
Display the service-level list and enforce what data is viewable.

Scope:
- left panel list of submissions for the selected service
- title display only for each submission
- view-permission check at submission level
- eye indicator display
- right panel access denied state when user lacks view permission
- visible details only for view-eligible submissions

Acceptance criteria:
- A user with delete access sees all titles for the service.
- A user without delete access sees only titles for submissions they are allowed to view.
- A user with no view rights sees a non-data denied state instead of the submission content.
- The eye indicator is informational only and does not bypass the data access rules.

Test focus:
- list filtering logic tests
- permission check tests for view access
- UI tests for visible vs hidden details

Terraform impact:
- no functional infra changes expected unless storage schema changes are needed

Definition of done:
- list logic and visibility rules are passing
- app shows hidden data correctly
- UI testing passes

---

### Increment 4: Create submission flow
Objective:
Allow eligible users to create a submission in a service and ensure the UI reflects the draft state correctly.

Scope:
- create button shown when user has create permission
- create form with title, data, category
- default category = confidential
- title field validation
- temporary left-panel draft label updates while typing
- save action persists the new submission
- created submission appears in the service list

Acceptance criteria:
- A user with create permission for Service A can create a submission for Service A.
- Title cannot be blank when saving.
- Max lengths are enforced per the validation rules.
- Category can be selected as open, protected, or confidential.
- The form updates left-panel title while typing.
- The new submission is created with the correct service and category.

Test focus:
- validation unit tests
- form behavior unit tests
- UI happy-path create flow test

Terraform impact:
- likely only if DynamoDB table structure or Lambda configuration changes are required

Definition of done:
- create submission path passes all unit tests
- UI test for create flow passes in branch environment
- save and list refresh behave correctly

---

### Increment 5: Delete submission flow
Objective:
Implement delete logic and ensure it works even when the user cannot view the submission details.

Scope:
- delete button when user has delete permission
- delete operation for a selected submission
- removal from the list after successful delete
- delete action available even if the user cannot view the content

Acceptance criteria:
- A user with delete permission sees the delete action.
- A delete action is available for hidden or unreadable submissions if service-level delete permission exists.
- A user without delete permission cannot delete.
- After delete, the submission no longer appears in the service list.

Test focus:
- authorization unit tests for delete permission
- deletion flow UI test
- negative path for unauthorized delete attempt

Terraform impact:
- minimal; only if delete endpoint or DynamoDB table access needs change

Definition of done:
- delete flow passes unit tests
- UI tests pass for delete success and denial cases
- branch deployment remains green

---

### Increment 6: Error and auth failure handling
Objective:
Handle degraded states cleanly and explain them to the user.

Scope:
- unauthenticated state
- unauthorized user state
- missing permission policy state
- custom claims API failure state
- user-facing message rendering on home page
- logout-only experience for blocked states

Acceptance criteria:
- Unauthenticated users see login and a relevant message.
- Unauthorized users see logout and no application content.
- Missing permission policy triggers a visible message and logout-only layout.
- Custom claims API failure shows the user-facing failure reason.

Test focus:
- permission fallback unit tests
- home page render tests for each failure state

Terraform impact:
- mostly config and environment variable changes, if needed

Definition of done:
- all auth and error states are covered by tests
- branch environment deploy passes
- UI tests for at least the happy path and the failure state pass

---

### Increment 7: Final integration, hardening, and release readiness
Objective:
Verify that the application is stable across the full user journey and ready for production deployment.

Scope:
- full end-to-end permission and submission flow validation
- production readiness review
- final Terraform validation
- final test suite review and cleanup
- branch merge and production redeploy sequence

Acceptance criteria:
- All increment branches are merged successfully to main in sequence.
- Production deployment is successful.
- Branch environment is cleaned up after merge.
- Test coverage remains above threshold.

Test focus:
- regression tests across all features
- coverage and pipeline verification

Terraform impact:
- final infrastructure verification and drift check

Definition of done:
- all required tests pass
- production deployment succeeds
- PR is approved and merged
- branch environment is removed

---

## 5. Suggested increment metadata template
Each increment should be recorded in a consistent template so the agent can execute it without extra clarification.

Recommended fields:
- Increment ID
- Title
- Objective
- Dependencies
- Scope
- Out of scope
- Acceptance criteria
- Test-first requirement
- Terraform impact
- Branch name
- Definition of done
- Rollback notes

Example:
- Increment ID: INC-04
- Title: Create submission flow
- Objective: Allow create-permitted users to create a new submission with validation
- Dependencies: INC-02, INC-03
- Scope: create button, form, validation, draft title preview, persistence
- Out of scope: delete, edit, multi-service linking
- Acceptance criteria: list, validation, save, route behaviour
- Test-first requirement: failing unit test before implementation
- Terraform impact: none unless storage schema changes
- Branch name: feature/inc-04-create-submission
- Definition of done: tests pass, UI test passes, branch deployed, PR approved

---

## 6. Recommended backlog state model
Track each increment with these states:
- proposed
- planned
- test-writing
- in-progress
- unit-tests-passing
- ui-tests-passing
- ready-for-review
- approved
- merged
- production-deployed
- closed

This gives the agent a clear workflow without requiring manual interpretation.

---

## 7. Best practice for agentic execution
The most agent-friendly version of this plan is one where each increment is:
- small enough to complete in one branch cycle
- strictly scoped to one capability
- measurable by obvious tests
- independent of unrelated features
- rich in acceptance criteria
- paired with branch deployment validation

This reduces context switching, shortens review cycles, and makes progress easy to track.

---

## 8. Recommended first increment
The best first increment is:
- Increment 1: Auth shell and home page baseline

Reason:
- it establishes the app entry point
- it gives the agent a stable foundation
- it enables immediate testing of login/logout and home page rendering
- it creates a reviewable first PR with low complexity

After that, the natural sequence is:
- service visibility
- submission list and category gating
- create flow
- delete flow
- error handling
- final hardening

---

## 9. Final recommendation
Use this as the canonical pattern for every increment:
- small scope
- failing unit test first
- minimal implementation
- branch deployment
- UI validation
- human approval
- merge and production deploy

This pattern best supports an agentic workflow because it is repeatable, auditable, and easy to reason about.
