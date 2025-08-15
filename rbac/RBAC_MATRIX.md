# RBAC Matrix

| Role          | Modules/Tags                               | Actions                                 | Scope        |
|---------------|--------------------------------------------|------------------------------------------|--------------|
| SYSTEM_ADMIN  | DATA, SETUP, AUTH, USER, REPT              | read/list/create/update/delete/export    | Global       |
| TRUST_ADMIN   | SETUP, USER, STUD, FEES, ATTD, REPT, COMM, DASH | read/list/create/update/delete/export | Trust-wide   |
| SCHOOL_ADMIN  | USER, STUD, FEES, ATTD, REPT, COMM, DASH   | read/list/create/update/delete/export    | School-level |
| TEACHER       | ATTD, STUD                                 | read/list/create/update                  | Assigned cls |
| ACCOUNTANT    | FEES, REPT                                 | read/list/create/update/export           | School-level |
| PARENT        | STUD, COMM                                 | read/list                                | Own wards    |
| STUDENT       | COMM                                       | read/list                                | Self         |
