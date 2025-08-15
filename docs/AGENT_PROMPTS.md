# Agent Prompts (Copy-Paste)

## Controller scaffold: user_list
Generate a TS/Express controller for OpenAPI operationId `user_list`:
- Enforce RBAC: TRUST_ADMIN|SCHOOL_ADMIN
- Read query: page, limit, role, search (validate with Zod)
- Call service.listUsers(trustId, {page,limit,role,search})
- Return { success:true, data } or { success:false, error }
- Emit AUDIT event on access

## Repository scaffold: users
Implement listUsers(trustId, {page,limit,role,search}):
- Indexed filters (role, is_active)
- JOIN primary_school for display label
- Return rows + total

## Validator scaffold
Create Zod schemas aligned with OpenAPI DTOs.
On ZodError → HTTP 400 with details array.

## Tests
Unit + integration:
- Happy path, pagination bounds, role denial, invalid query types
- SQL injection attempts rejected
