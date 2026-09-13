RAW INSTRUCTIONS: This file contains the original, human-authored requirements and clarifications for reference only. It is not intended for direct agent execution or implementation. Agent work must use the structured requirements in [agent-ready-requirements.md](agent-ready-requirements.md).

# Business Requirements
- Users can authenticate
- Users can carry out actions
- Actions are
  - View submission
  - Create submission
  - Delete submission
- Submission can be for
  - Service A
  - Service B
- Each Submission has data
  - Title (free text)
  - Data (free text)
  - Category (enum [open, protected, confidential])
- Action access is based on 
  - user attributes
  - permission policies
- User attributes are
  - company: company
  - serviceARoles: list [create, delete]
  - serviceBRoles: list [create, delete]
  - category: enum [open, protected, confidential]
- Resultant permissions
  - action view submission for any submission across any service with submission category field matching user attribute category
  - action create or delete for any service if the user has that role for the service

# Application Requirements
- submissions web app
  - on all pages
    - login action / button (available if user has not logged in)
      - redirects to identities app
    - logout action / button (available if user has logged in)
  - on home page
    - service action / button for each service the user can use (either because they have a create or delete service role, or because they have the appropriate view category)
  - on service page (depending on permission policies / attributes)
    - left panel with list of all submissions for the service (showing the title field for each in the list)
    - eye icon next to each showing whether the user can view the submission (they can view only if they have the matching user attribute for category)
    - if submission title is selected on left panel, then:
      - if they have view permission (based on category attribute match), the right panel shows the submission fields (non editable)
      - if they have delete permission (based on service role delete), a delete button should also be displayed
    - if the user has the create role for the service, a create action / button is available
      - if this action is taken
        - left panel stays
        - right panel shows title, data and category fields
        - category field is a radio with confidential as default
        - left panel shows new submission selected with title (read only) empty to start but automatically populated with title field as it is typed in the right panel 
    - home page action / button
- identities app 
  - stores identities
  - authenticates users
  - calls account management app for custom claims
- account management app
  - stores users
  - stores user attributes
  - stores permission policies
  - provides custom claims API
  - API takes user id, gets attributes, resolves permissions and returns as custom claims

# Platform Requirements
- submission web app
  - AWS
  - Lambda for NextJS web app
  - Dynamodb for submissions data
- identities app
  - Entra External ID
- account management app
  - Lambda for NodeJs claims API
  - Dynamodb for user attributes
  - Amazon Verified Permissions for permission policies

# Dev practices
- Github single repo
- Terraform for IaC
- Unit tests with 80% measured code coverage
- UI tests for happy path web app only

# Increments Plan
- Break down all the work into small testable increments
- Keep a plan of all of the increments including which are done
- I will then request the next increment to be implemented
- Once an increment is complete, the plan should be reviewed and updated

# Increment Implementation
- For each 
  - Create a git branch
  - Create the unit test (test fails)
  - Create the code
  - Adjust code (or fix unit test) until unit tests pass
  - Create the UI test
  - Create/update the terraform for the change (if needed)
  - Create a PR in GitHub and push terraform and code
    - PR pipeline
      - Deploy the terraform (branch specific infra)
      - Deploy the code to the branch infra
      - Run the unit tests
      - Run the UI test against the branch specific infra
  - Review test report
  - Adjust code (or fix unit test or fix UI test)
  - Commit code and test changes to PR
    - PR pipeline runs again
  - Continue making changes, pushing and running PR pipeline until all tests are passing
  - HUMAN STEP - I will review the PR
  - Fix update based on PR comments
  - Make sure all tests are running again

# Clarifications
1 - service A and service B are separate business domains in the same app, submissions are scoped to one service
2 - user can have multiple roles per service, delete is tied to permission on a service not submission category (submission category is for protecting the data not the title)
3 - the list of submissions will include all submissions for the service if you have delete, or only the submissions you have matching category if you have create or no role. Category applies across services: - if you have open you can only view submissions in any service that have open category; if you have protected you can view submissions in any service that have open or protected category; if you have confidential you can view all submission in all services.
4 - category applies to the submission not the service.  As long as you have create for a service, you have create a submission in there.  You can even create a submission and give it a category you do not have (e.g you have open but can still create a submission and select protected category) which mean once you have created it you cannot view it.  A user can delete a submission they cannot view, they can see all the submission titles listed in the left panel and can delete them, but they cannot view the field in the right panel.
5 - standard token claims, assuming this will support a fexible user attribute and permissions policy approach provided by Amazon verified permissions
6 - title, data and category are in every create.  Choose a sensible max length (single line for title, multiline for data).  Title must be non blank before submitting / saving
7 - eye icon is a visual indicator only.  User sees a service on home page if they have create or delete access or they have view access on any of the submissions because they have a matching attribute (open sees open, protected sees open and protected, confidential sees all).  If a service has no submissions, the list panel should still be displayed
8 - unauthenticated (just login button), unauthorised (logout button only), permission policy missing (logout button).  custom claims AI fails (logout button only).  In each case the reason should be displayed on the home page
9 - There is a pr/branch environments spun up for each increment plus one production environment.  On PR create, the environment is spun up for the branch.  On commit to existing PR branch the pipeline is rerun.  On PR merge, the pr branch is merged to main, the main branch is redeployed to the production environment, the pr/branch environment is deleted along with it's branch.  PR branch is therefore needed for each change increment
10 - Done for a change increment is 1) unit tests pass, 2) Code deployed to PR/branch environment, 3) UI tests pass against that environment, 4) PR manually approved by me, 5) pr/branch merged to main, 6) main redeployed to production environment