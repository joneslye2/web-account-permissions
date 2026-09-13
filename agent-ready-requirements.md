# Agent-Ready Requirements

## 1. Purpose
This application allows authenticated users to view, create, and delete submissions for two business domains: Service A and Service B. Submissions are scoped to a single service, and access is determined by both user attributes and permission policies.

The goal is to provide a secure, role-based submission browser with a shared web app UI and centralized claim-based authorization.

---

## 2. Scope
In scope:
- User authentication
- Submission list and detail views
- Submission creation
- Submission deletion
- Permission evaluation using user attributes and verified permissions policy
- Home page service visibility
- Error messaging for auth and authorization failures
- Terraform, tests, and branch-based deployment workflow

Out of scope:
- Multi-service submission linking
- Editing existing submissions
- Anonymous access
- Additional application domains beyond Service A and Service B

---

## 3. Users, Roles, and Attributes

### 3.1 User attributes
Each user has the following attributes:
- company: string
- serviceARoles: array of strings, allowed values: [create, delete]
- serviceBRoles: array of strings, allowed values: [create, delete]
- category: enum [open, protected, confidential]

### 3.2 Role interpretation
- A role is evaluated per service.
- A user may hold multiple roles in the same service.
- Delete permission is service-scoped and is not derived from the submission category.
- Create permission is service-scoped and allows a user to create submissions in that service regardless of their category attribute.

### 3.3 Category interpretation
The category field is assigned to each submission and controls whether a user may view that submission.

Category visibility model:
- open: user may view only submissions with category = open
- protected: user may view submissions with category = open or protected
- confidential: user may view all categories across all services

This is evaluated across all services and is not scoped per service.

---

## 4. Business Domain Model

### 4.1 Services
The application supports exactly two services:
- Service A
- Service B

Each submission belongs to one service only.

### 4.2 Submission model
Submission fields:
- id: string
- service: enum [Service A, Service B]
- title: string
- data: string
- category: enum [open, protected, confidential]
- createdBy: string
- createdAt: timestamp

### 4.3 Data validation
- title must be non-empty before save
- title maximum length: 120 characters
- data maximum length: 5000 characters
- title input must be a single-line text field
- data input must be a multi-line text area
- category is always required on create
- default category on create is confidential

---

## 5. Authorization Rules

### 5.1 Permission evaluation
Permissions are resolved by the account management app and returned as standard token claims.

Permissions are derived from:
- user attributes
- service roles
- permission policies stored in Amazon Verified Permissions

### 5.2 Effective permissions
A user may:
- View submission if their category attribute allows viewing the submission category
- Create submission in a service if they hold the create role for that service
- Delete submission in a service if they hold the delete role for that service

### 5.3 Important business rules
1. View permissions are based on category compatibility, not service role.
2. Delete permissions are based on service role, not submission category.
3. A user can have create rights for a service but still be unable to view a submission they created if the submission category is higher than their allowed category.
4. A user may delete a submission they cannot view.
5. A user may create a submission in a service they can create in, even if the submission category is higher than their own category attribute.
6. A user can see all submission titles in the left panel of a service if they have service delete rights, or if they have view access to at least one submission in the service, but they cannot view the data for submissions they do not have permission to read.

### 5.4 User access examples
- A user with category open may view only open submissions in any service.
- A user with category protected may view open and protected submissions in any service.
- A user with category confidential may view all submissions in all services.
- A user can create in Service A if serviceARoles includes create.
- A user can delete in Service B if serviceBRoles includes delete.

---

## 6. Functional Requirements

### 6.1 Authentication
The web app shall render a login action when the user is unauthenticated.

When the user clicks login:
- redirect to the identities app
- after successful authentication, return to the web app

If the user is authenticated, the UI shall render a logout action.

### 6.2 Home page
The home page shall:
- list each service for which the user is allowed to act, or for which they have matching view permission on at least one submission
- show Service A and Service B as distinct service entries
- display a service even if it has no submissions
- show a reason message when the user is unauthenticated, unauthorized, missing permission policy data, or if custom claims retrieval fails

A service is visible if any of the following are true:
- user has create permission for the service
- user has delete permission for the service
- user has view permission on at least one submission in that service based on category matching

### 6.3 Service page
For each service page:
- show a left panel containing all submissions for the service
- show title text for each submission in the left panel
- show a visual eye indicator next to each submission title
- eye icon is informational only; it does not enable or disable access by itself

When a submission is selected from the left panel:
- if the user has view permission for that submission, the right panel shows the submission fields in read-only mode
- if the user has delete permission for the service, show a delete button
- if the user lacks view permission, the right panel must not display the submission data; it must instead show an access-denied state or a message indicating the submission is hidden from the user

### 6.4 Create submission flow
If the user has create permission for the selected service:
- show a create action/button on the service page
- when selected, keep the left panel visible
- open a create form in the right panel
- fields: title, data, category
- category default is confidential
- title field updates the left panel’s temporary “new submission” label as the user types
- title must be populated and non-empty before save is allowed
- save creates a new submission with the selected service and chosen category

### 6.5 Delete submission flow
If the user has delete permission for the service:
- show a delete action/button next to a submission when it is selected and available for deletion
- deleting a submission removes it from the service submission list
- a user can delete a submission they cannot view

### 6.6 Error and access states
The application shall show explicit state messaging for:
- unauthenticated user: login required
- unauthorized user: logout button only, no access to app features
- permission policy missing: user is signed in but authorization data is incomplete
- custom claims API failure: user is signed in but claims cannot be resolved

In all of the above cases, the reason must be displayed on the home page.

---

## 7. Identity and Authorization Architecture

### 7.1 Identities app
- Stores identities
- Authenticates users
- Redirects to the app after successful sign-in

### 7.2 Account management app
- Stores users
- Stores user attributes
- Stores permission policies
- Exposes a custom claims API

### 7.3 Custom claims API contract
Request:
- user id

Response:
- user attributes
- resolved permissions
- standard token claims format

Behavior:
- API resolves user attributes and policy-based permissions
- API returns the effective claims for the authenticated user
- If the policy or claim resolution fails, the app must degrade gracefully and show the appropriate home-page message

Assumption:
- Token claims will be standard JWT-style claims and support a flexible user attribute / permission model using Amazon Verified Permissions.

---

## 8. Platform Requirements

### 8.1 Submission web app
- AWS-hosted
- Next.js application running on AWS Lambda
- DynamoDB stores submission data

### 8.2 Identities app
- Microsoft Entra External ID

### 8.3 Account management app
- Node.js Lambda for claims API
- DynamoDB stores user attribute data
- Amazon Verified Permissions stores permission policies

---

## 9. Dev Practices and Quality Gates

### 9.1 Repository and IaC
- GitHub single repository
- Terraform for infrastructure as code

### 9.1.1 Resource tagging
- All resources created by Terraform must include a standard tag set: `Project`, `Environment`, `Owner`, `ManagedBy`, and `Increment`. These tags aid billing, discovery, and lifecycle management.

### 9.2 Testing requirements
- Unit tests with minimum 80% code coverage
- UI tests for happy path only
- Every increment must include failing test-first implementation for unit tests before code is considered done

### 9.3 Enforcement
Implementation is not considered complete until:
- unit tests pass
- UI tests pass against the relevant environment
- deployment succeeds to the PR/branch environment
- code is reviewed and approved by the human requester
- merge to main succeeds
- production deployment succeeds

---

## 10. Increment Workflow

### 10.1 Principle
All work is delivered in small, testable increments.

### 10.2 Increment plan requirements
For each increment:
- maintain a plan of all increments including status
- create a git branch for the increment
- write the unit test first so it fails before implementation
- implement the smallest required code change
- update/fix code or tests until tests pass
- add or update UI test for the increment
- update Terraform if required
- create a PR and push code and Terraform
- run the branch-specific PR pipeline
- review the pipeline report
- fix failures and push updates until green
- request manual approval
- merge to main
- redeploy main to production
- delete the branch-specific environment

### 10.3 Branch environment model
- One PR/branch environment exists per increment
- One production environment exists for main
- PR creation triggers branch environment creation
- New commits to the PR branch rerun the pipeline
- Merge to main triggers production redeploy
- Branch environment is removed after merge

---

## 11. Definition of Done for an Increment
A change increment is complete only when all of the following are true:
1. Unit tests pass
2. Code is deployed to the PR/branch environment
3. UI tests pass against that environment
4. PR is manually approved by the requester
5. PR is merged to main
6. Main is redeployed to the production environment
7. Branch-specific environment is deleted

---

## 12. User Stories

### 12.1 Authentication and access
- As a user, I can log in and see the app.
- As an unauthenticated user, I can see the login button and a clear sign-in message.
- As an authenticated user, I can log out.
- As a user without required permissions, I can see the app but not the unauthorized areas.

### 12.2 Home page visibility
- As a user, I can see a service on the home page if I have create or delete rights, or if my category allows me to view at least one submission in that service.
- As a user, I can see a service even when it has no submissions.

### 12.3 Submission viewing
- As a user with matching category, I can view submissions in any service whose category is allowed by my category.
- As a user without matching category, I am not shown the submission contents.

### 12.4 Submission creation
- As a user with create rights in a service, I can create a new submission in that service.
- As a user creating a submission, I can enter title, data, and category.
- As a user, I cannot save a submission without a non-empty title.
- As a user, I can see the temporary title update in the left panel while I type.

### 12.5 Submission deletion
- As a user with delete rights in a service, I can delete a selected submission.
- As a user without view rights, I can still delete a submission in the service if I have delete permission.

### 12.6 Error handling
- As a user, I see a clear reason when authentication fails or authorization data is missing.
- As a user, I see a clear reason when the claims API fails.

---

## 13. Acceptance Criteria Summary

### 13.1 Service visibility
Given a user with create or delete rights on Service A,
When they open the home page,
Then Service A is visible.

Given a user with category open,
When they open the home page,
Then they see only services that contain at least one open submission they can view.

### 13.2 Submission visibility
Given a user with category protected,
When they open a service with open and protected submissions,
Then they can view both open and protected submissions but not confidential submissions.

Given a user with category confidential,
When they open any service,
Then they can view all submission entries and details for that service.

### 13.3 Create permission
Given a user with create for Service B,
When they open the Service B page,
Then they can create a new submission in Service B.

Given they create a protected submission while holding only open category,
When the submission is saved,
Then the user can see the submission title but cannot view its fields.

### 13.4 Delete permission
Given a user with delete for Service A,
When they select a submission in Service A,
Then a delete control is shown.

Given a user without view access but with delete access,
When they select the submission,
Then they can still delete it, but cannot read its content.

---

## 14. Implementation Guidance for Agents
To ensure consistent implementation and avoid ambiguity:
- treat category as a submission-level security label
- treat service roles as service-level authorization controls
- evaluate home page visibility using both service roles and view eligibility
- treat the eye icon as a UI hint only
- ensure graceful degradation for auth and claims failures
- implement branch-based release flow as part of the delivery pipeline, not the app behavior

---

## 15. Suggested Next Step
The next implementation should begin with the smallest end-to-end increment that proves the core authorization model:
1. authentication and home page visibility
2. submission list and category-based viewing
3. submission create flow
4. submission delete flow
5. error-state handling
6. PR/branch deployment verification

This sequence makes the code, tests, and infrastructure change set manageable and reviewable.
