# User and Project Management Branch

## Overview

This branch (`user-and-project`) implements a comprehensive user authentication, role-based access control, and project management system. This is a **structural foundation** for the Continuity Manager application, not a cosmetic change.

## Key Features Implemented

### 1. **User Authentication & Session Management**

#### Database Schema
- **users table**: Stores user accounts with email, name, password_hash, and role
- **user_sessions table**: Manages active sessions with tokens and expiration
- Roles: `superadmin` and `manager`

#### Frontend Components
- **Login Page** (`login.html`): Clean, professional login interface with:
  - Email/password authentication
  - Development mode quick-login buttons (for testing)
  - Session persistence via localStorage
  - Redirect to requested page after login

#### Services
- **authService.js**: Complete authentication service with:
  - Login/logout functionality
  - Session management (24-hour sessions)
  - Role checking (isSuperAdmin(), isManager())
  - Session validation
  - Protected route enforcement

---

### 2. **Role-Based Access Control**

#### Superadmin
- Can view **all projects** across all managers
- Can create and manage users
- Can assign projects to managers
- Can delete any project
- Access to User Management interface

#### Manager
- Can only view **their own projects**
- Can create new projects (automatically assigned to them)
- Can delete their own projects
- Cannot access User Management

#### Implementation
- **Server-side filtering**: Projects are filtered by role in the database queries (not just UI)
- **Permission checks**: All deletion and modification operations verify user permissions
- **projectService.js**: Handles role-based project queries

---

### 3. **Project Navigation Enhancement**

#### New UI Component
- **Three-toggle navigation** (Cast | Timeline | Calendar)
- **Circular Projects button** next to the three-toggle
  - Same visual style (base-100 background, shadow)
  - Returns user to Projects overview
  - Consistent with DaisyUI design system

#### Updated Files
- `navigation.js`: New createNavigation() function
- `timeline.html`, `Cast.html`, `calendar.html`: All use new navigation component
- Top-right corner placement with flex layout

---

### 4. **Project Deletion with Safety**

#### Typed Confirmation Modal
- User must type **exact project name** or the word **"DELETE"**
- Cannot proceed until confirmation text matches
- Clear warning about permanent deletion

#### Backend Safety
- **delete_project_cascade()**: Database function that:
  - Deletes project and ALL related data
  - Returns deletion summary (scene count, Cast Member count, etc.)
  - Ensures no orphaned records
- **can_delete_project()**: Permission verification function
  - Checks user role
  - Verifies project ownership
  - Prevents unauthorized deletion

#### UI Implementation
- Delete button in project list
- Modal with explicit warnings
- Loading states during deletion
- Success notification after deletion

---

### 5. **User Management Interface (Superadmin Only)**

#### Features
- **users.html**: Dedicated user management page
- User table showing:
  - Name, email, role, status
  - Project count (for managers)
  - Last login time
- **Create User** modal with:
  - Name, email, password fields
  - Role selection (superadmin/manager)
  - Input validation
- **Delete User** functionality (cannot delete yourself)

#### Service Layer
- **userService.js**: Complete user CRUD operations
  - getAllUsers() - superadmin only
  - createUser() - with role validation
  - updateUser() - with permission checks
  - deleteUser() - with self-protection
  - getManagers() - for project assignment

---

## Technical Architecture

### Database Migrations

Created 3 new migrations:

1. **20251223000001_add_users_and_roles.sql**
   - Creates users and user_sessions tables
   - Adds manager_id to projects table
   - Sets up indexes for performance
   - Implements RLS policies

2. **20251223000002_add_project_deletion.sql**
   - Creates delete_project_cascade() function
   - Creates can_delete_project() permission checker
   - Adds soft_delete column (for future use)

3. **20251223000003_add_test_users.sql**
   - Creates test superadmin: `admin@continuity.local`
   - Creates test manager: `manager@continuity.local`
   - Creates sample project for manager

### Service Layer

**New Services:**
- `authService.js`: Authentication, session, role checks
- `userService.js`: User CRUD operations
- `projectService.js`: Enhanced project operations with role filtering

**Service Pattern:**
- Singleton instances exported
- Consistent error handling
- Permission checking in every operation
- Clear separation of concerns

### Data Flow

```
UI Component
    ↓
authService (check permissions)
    ↓
projectService / userService (business logic)
    ↓
Supabase Client (database operations)
    ↓
Database (RLS policies + stored functions)
```

---

## Security Considerations

### Current Implementation (Development)
⚠️ **NOT FOR PRODUCTION:**
- Passwords stored as plain text (no bcrypt)
- Sessions stored in localStorage (no httpOnly cookies)
- Simple token generation (no JWT)
- All RLS policies allow public access during testing

### Production Requirements
✅ **Before deployment:**
- [ ] Implement bcrypt password hashing
- [ ] Use httpOnly cookies for session tokens
- [ ] Implement proper JWT with refresh tokens
- [ ] Restrict RLS policies to authenticated users
- [ ] Add rate limiting on login attempts
- [ ] Implement password reset flow
- [ ] Add 2FA for superadmin accounts
- [ ] Use environment variables for secrets

---

## Testing

### Test Accounts

**Superadmin:**
- Email: `admin@continuity.local`
- Password: Any (development mode)
- Can see all projects
- Can manage users

**Manager:**
- Email: `manager@continuity.local`
- Password: Any (development mode)
- Can only see own projects
- Cannot manage users

### Quick Testing Steps

1. **Login as Superadmin:**
   - Go to login page
   - Click "Login as Superadmin" (dev button)
   - Should see all projects
   - Can access User Management

2. **Login as Manager:**
   - Logout
   - Click "Login as Manager"
   - Should see only manager's projects
   - No User Management option

3. **Test Project Deletion:**
   - Create a test project
   - Click delete button
   - Type project name in confirmation
   - Verify project is deleted

4. **Test User Creation:**
   - Login as superadmin
   - Go to User Management
   - Create new manager
   - Verify appears in user list

---

## File Structure

```
frontend/
  ├── login.html                    # Login page
  ├── users.html                    # User management (superadmin)
  ├── index.html                    # Redirect to projects/login
  ├── projects.html                 # Enhanced with auth & delete
  ├── timeline.html                 # Updated navigation
  ├── Cast.html                   # Updated navigation
  ├── calendar.html                 # Updated navigation
  └── js/
      ├── projects.js               # Enhanced with role filtering
      ├── components/
      │   └── navigation.js         # New navigation component
      └── services/
          ├── authService.js        # NEW: Authentication
          ├── userService.js        # NEW: User management
          └── projectService.js     # NEW: Enhanced projects

supabase/
  └── migrations/
      ├── 20251223000001_add_users_and_roles.sql
      ├── 20251223000002_add_project_deletion.sql
      └── 20251223000003_add_test_users.sql
```

---

## Future Enhancements

### Immediate Next Steps
1. Implement proper password hashing (bcrypt)
2. Add email verification flow
3. Implement password reset
4. Add project assignment UI for superadmin
5. Add audit logging for sensitive operations

### Long-term Improvements
1. Multi-manager projects (team collaboration)
2. Granular permissions (viewer, editor, admin per project)
3. Project templates
4. Activity feed per project
5. Export/import project data
6. Real-time collaboration (WebSockets)

---

## Design Decisions

### Why Session-based Auth?
- Simpler for MVP
- Easier to invalidate sessions
- No JWT complexity for now
- Can migrate to JWT later

### Why Server-side Filtering?
- Security: Never trust client filtering
- Performance: Database does the heavy lifting
- Scalability: Works with millions of projects
- Correctness: Single source of truth

### Why Typed Confirmation?
- Prevents accidental deletion
- Industry standard (GitHub, AWS, etc.)
- Better UX than simple confirm()
- Clear user intent

### Why Separate projectService?
- Separation of concerns
- Reusable across components
- Easier testing
- Consistent error handling

---

## Known Issues & Limitations

1. **No password complexity requirements** - Add in production
2. **No rate limiting** - Add before public deployment
3. **Sessions don't expire automatically** - Add background cleanup
4. **No password reset flow** - Requires email integration
5. **Plaintext passwords** - CRITICAL: Must fix before production

---

## Migration from Previous Version

### Breaking Changes
- Projects now require authentication to access
- Projects without manager_id are only visible to superadmin
- Direct URL access to timeline/Cast/calendar requires login

### Migration Steps
1. Run database migrations in order (001 → 002 → 003)
2. Create superadmin account
3. Assign existing projects to managers (or leave for superadmin)
4. Update any bookmarked URLs to include authentication

---

## Deployment Checklist

- [ ] Run all migrations on production database
- [ ] Create production superadmin account
- [ ] Update environment variables (Supabase keys)
- [ ] Enable RLS policies
- [ ] Implement password hashing
- [ ] Test all authentication flows
- [ ] Verify role-based access works
- [ ] Test project deletion cascade
- [ ] Backup database before deployment

---

## Support & Documentation

For questions or issues with this implementation:
1. Check this README
2. Review the database migration files
3. Inspect the service layer code
4. Check browser console for errors
5. Verify Supabase configuration

---

**Branch:** `user-and-project`  
**Created:** December 23, 2025  
**Status:** ✅ Complete and ready for testing  
**Next Steps:** Test thoroughly, then merge to main branch
