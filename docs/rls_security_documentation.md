# **Row Level Security (RLS) Documentation**

## **1. Introduction**

This document provides comprehensive documentation for the Row Level Security (RLS) implementation in the geometric maturity tracking application. RLS policies control data access at the row level, ensuring users can only access data they are authorized to see based on their roles and project assignments.

## **2. Security Architecture Overview**

### **2.1. Multi-Tenant Security Model**
The application implements a sophisticated multi-tenant security model using:
- **Role-Based Access Control (RBAC)** via `user_roles` and `user_role_assignments`
- **Project-Based Access Control** via `user_project_assignments`
- **Hierarchical Permissions** with role precedence
- **Function-Based Security Helpers** for complex authorization logic

### **2.2. Security Functions**
Two core security functions power the RLS system:
- `has_role(role_name)` - Checks if current user has specific role
- `is_assigned_to_project(project_id)` - Verifies project access permissions

### **2.3. Role Hierarchy**
```
Super User (Global Admin)
├── Full system access
├── User management
└── All project access

Supplier Quality (Operational Manager)
├── Project management
├── Data management
└── All project access

Engineering (Technical User)
├── Technical data access
└── All project access

External User (Limited Access)
├── Assigned projects only
└── Limited operations
```

---

## **3. RLS Policies by Table**

### **3.1. Core Data Tables**

#### **3.1.1. Projects Table**
```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
```

**Policies:**

##### **Read Access**
```sql
CREATE POLICY "Allow read access to assigned projects" 
ON projects FOR SELECT 
USING (is_assigned_to_project(id));
```
- **Logic:** Users can read projects they're assigned to
- **Function:** Uses `is_assigned_to_project()` for verification
- **Scope:** All authenticated users

##### **Management Access**
```sql
CREATE POLICY "Allow full management for project managers" 
ON projects 
USING (has_role('Supplier Quality') OR has_role('Super User')) 
WITH CHECK (has_role('Supplier Quality') OR has_role('Super User'));
```
- **Operations:** INSERT, UPDATE, DELETE
- **Roles:** Supplier Quality, Super User
- **Scope:** Full project lifecycle management

---

#### **3.1.2. Parent Components Table**
```sql
ALTER TABLE parent_components ENABLE ROW LEVEL SECURITY;
```

**Policies:**

##### **Read Access**
```sql
CREATE POLICY "Allow read access based on project assignment" 
ON parent_components FOR SELECT 
USING (is_assigned_to_project(project_id));
```
- **Logic:** Access based on parent project assignment
- **Inheritance:** Inherits project-level permissions

##### **Full Management**
```sql
CREATE POLICY "Allow full access for project setup roles" 
ON parent_components 
USING (has_role('Supplier Quality') OR has_role('Super User'));
```
- **Operations:** All operations
- **Roles:** Supplier Quality, Super User

##### **Limited Updates for External Users**
```sql
CREATE POLICY "Allow external users to update planned dates" 
ON parent_components FOR UPDATE 
USING (has_role('External User') AND is_assigned_to_project(project_id));
```
- **Operations:** UPDATE only
- **Fields:** Typically planned dates
- **Condition:** Must be assigned to project

---

#### **3.1.3. Cavity Evaluations Table**
```sql
ALTER TABLE cavity_evaluations ENABLE ROW LEVEL SECURITY;
```

**Policies:**

##### **Read Access**
```sql
CREATE POLICY "Allow read access based on project" 
ON cavity_evaluations FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM parent_components pc
    WHERE pc.id = cavity_evaluations.parent_component_id 
    AND is_assigned_to_project(pc.project_id)
));
```
- **Logic:** Access via parent component's project assignment
- **Performance:** Optimized with EXISTS clause

##### **Insert Access**
```sql
CREATE POLICY "Allow insertion for operational roles" 
ON cavity_evaluations FOR INSERT 
WITH CHECK (
    has_role('Supplier Quality') OR 
    (has_role('External User') AND EXISTS (
        SELECT 1 FROM parent_components pc
        WHERE pc.id = cavity_evaluations.parent_component_id 
        AND is_assigned_to_project(pc.project_id)
    ))
);
```
- **Logic:** SQ can insert anywhere, External Users only in assigned projects

##### **Update Access**
```sql
CREATE POLICY "Allow updates for operational roles" 
ON cavity_evaluations FOR UPDATE 
USING (
    has_role('Supplier Quality') OR 
    has_role('Super User') OR 
    (has_role('External User') AND EXISTS (
        SELECT 1 FROM parent_components pc
        WHERE pc.id = cavity_evaluations.parent_component_id 
        AND is_assigned_to_project(pc.project_id)
    ))
);
```

##### **Delete Access**
```sql
CREATE POLICY "Allow deletion for management roles" 
ON cavity_evaluations FOR DELETE 
USING (has_role('Supplier Quality') OR has_role('Super User'));
```
- **Logic:** Only management roles can delete evaluations

---

#### **3.1.4. SPC Values Table**
```sql
ALTER TABLE spc_values ENABLE ROW LEVEL SECURITY;
```

**Policy:**

##### **Inherited Access**
```sql
CREATE POLICY "Allow all actions based on parent evaluation" 
ON spc_values 
USING (EXISTS (
    SELECT 1 FROM cavity_evaluations ce
    WHERE ce.id = spc_values.cavity_evaluation_id
));
```
- **Logic:** Inherits permissions from parent cavity evaluation
- **Simplification:** Single policy covers all operations
- **Chain:** spc_values → cavity_evaluations → parent_components → projects

---

#### **3.1.5. Action Plans Table**
```sql
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
```

**Policies:**

##### **Read Access**
```sql
CREATE POLICY "Allow read access on action_plans" 
ON action_plans FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM parent_components pc
    WHERE pc.id = action_plans.parent_component_id 
    AND is_assigned_to_project(pc.project_id)
));
```

##### **Create Access**
```sql
CREATE POLICY "Allow creation of action_plans" 
ON action_plans FOR INSERT 
WITH CHECK (
    has_role('Supplier Quality') OR 
    (has_role('External User') AND EXISTS (
        SELECT 1 FROM parent_components pc
        WHERE pc.id = action_plans.parent_component_id 
        AND is_assigned_to_project(pc.project_id)
    ))
);
```

##### **Update Access**
```sql
CREATE POLICY "Allow updates on action_plans" 
ON action_plans FOR UPDATE 
USING (
    has_role('Supplier Quality') OR 
    has_role('Super User') OR 
    (has_role('External User') AND EXISTS (
        SELECT 1 FROM parent_components pc
        WHERE pc.id = action_plans.parent_component_id 
        AND is_assigned_to_project(pc.project_id)
    ))
);
```

##### **Delete Access**
```sql
CREATE POLICY "Allow deletion of action_plans" 
ON action_plans FOR DELETE 
USING (has_role('Supplier Quality') OR has_role('Super User'));
```

---

### **3.2. Master Data Tables**

#### **3.2.1. Drawings Table**
```sql
CREATE POLICY "Allow authenticated read on drawings" 
ON drawings FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow management of drawings by SQ and Super User" 
ON drawings 
USING (has_role('Supplier Quality') OR has_role('Super User'));
```
- **Read:** All authenticated users
- **Manage:** Supplier Quality, Super User only

#### **3.2.2. Molds Table**
```sql
CREATE POLICY "Allow authenticated read on molds" 
ON molds FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow management of molds by SQ and Super User" 
ON molds 
USING (has_role('Supplier Quality') OR has_role('Super User'));
```

#### **3.2.3. Component Classifications**
```sql
CREATE POLICY "Allow authenticated read on component_classifications" 
ON component_classifications FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow management of component_classifications by Super User" 
ON component_classifications 
USING (has_role('Super User'));
```

#### **3.2.4. Action Types**
```sql
CREATE POLICY "Allow authenticated read on action_types" 
ON action_types FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow management of action_types by Super User" 
ON action_types 
USING (has_role('Super User'));
```

#### **3.2.5. Mold Locations**
```sql
CREATE POLICY "Allow authenticated read on mold_locations" 
ON mold_locations FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow management of mold_locations by Super User" 
ON mold_locations 
USING (has_role('Super User'));
```

#### **3.2.6. Milestone Definitions**
```sql
CREATE POLICY "Allow read access on milestone_definitions" 
ON milestone_definitions FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow management of milestone_definitions by Super User" 
ON milestone_definitions 
USING (has_role('Super User'));
```

#### **3.2.7. OTOP Target Rules**
```sql
CREATE POLICY "Allow read access on otop_target_rules" 
ON otop_target_rules FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow management of otop_target_rules by Super User" 
ON otop_target_rules 
USING (has_role('Super User'));
```

---

### **3.3. Project Management Tables**

#### **3.3.1. Project Milestone Instances**
```sql
CREATE POLICY "Allow read access on project_milestone_instances" 
ON project_milestone_instances FOR SELECT 
USING (is_assigned_to_project(project_id));

CREATE POLICY "Allow management of project_milestone_instances" 
ON project_milestone_instances 
USING (has_role('Supplier Quality') OR has_role('Super User'));
```

---

### **3.4. User Management Tables**

#### **3.4.1. Users Table**
```sql
CREATE POLICY "Allow users to manage their own profile" 
ON users 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

CREATE POLICY "Allow Super Users to manage all user data" 
ON users 
USING (has_role('Super User')) 
WITH CHECK (has_role('Super User'));
```
- **Self-Management:** Users can update their own profiles
- **Admin Management:** Super Users can manage all users

#### **3.4.2. User Roles Table**
```sql
CREATE POLICY "Allow authenticated users to read roles" 
ON user_roles FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow Super Users to manage roles definitions" 
ON user_roles 
USING (has_role('Super User')) 
WITH CHECK (has_role('Super User'));
```

#### **3.4.3. User Role Assignments**
```sql
CREATE POLICY "Users can view their own role assignments" 
ON user_role_assignments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Super Users can view all role assignments" 
ON user_role_assignments FOR SELECT 
USING (has_role('Super User'));

CREATE POLICY "Super Users can manage role assignments" 
ON user_role_assignments 
USING (has_role('Super User')) 
WITH CHECK (has_role('Super User'));
```

#### **3.4.4. User Project Assignments**
```sql
CREATE POLICY "Users can view their own project assignments" 
ON user_project_assignments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "SQ and Super Users can manage project assignments" 
ON user_project_assignments 
USING (has_role('Supplier Quality') OR has_role('Super User')) 
WITH CHECK (has_role('Supplier Quality') OR has_role('Super User'));
```

---

### **3.5. System Tables**

#### **3.5.1. Notifications**
```sql
CREATE POLICY "Users can access their own notifications" 
ON notifications 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());
```
- **Strict Isolation:** Users only see their own notifications

#### **3.5.2. Audit Log**
```sql
CREATE POLICY "Allow Super Users to read audit log" 
ON audit_log FOR SELECT 
USING (has_role('Super User'));
```
- **Admin Only:** Only Super Users can access audit trails

#### **3.5.3. Audit Log Archive**
```sql
CREATE POLICY "Allow Super Users to read audit log archive" 
ON audit_log_archive FOR SELECT 
USING (has_role('Super User'));
```

---

## **4. Security Patterns**

### **4.1. Access Control Patterns**

#### **Pattern 1: Direct Role Check**
```sql
USING (has_role('Super User'))
```
- **Use Case:** Administrative functions
- **Examples:** User management, system configuration

#### **Pattern 2: Project-Based Access**
```sql
USING (is_assigned_to_project(project_id))
```
- **Use Case:** Project-scoped data
- **Examples:** Projects, milestones

#### **Pattern 3: Hierarchical Access**
```sql
USING (EXISTS (
    SELECT 1 FROM parent_table pt
    WHERE pt.id = current_table.parent_id 
    AND is_assigned_to_project(pt.project_id)
))
```
- **Use Case:** Child entities inheriting parent permissions
- **Examples:** Cavity evaluations, SPC values, action plans

#### **Pattern 4: Combined Role and Project Check**
```sql
USING (
    has_role('Supplier Quality') OR 
    (has_role('External User') AND is_assigned_to_project(project_id))
)
```
- **Use Case:** Operations with role-based exceptions
- **Examples:** Data entry, updates

#### **Pattern 5: Self-Management**
```sql
USING (user_id = auth.uid())
```
- **Use Case:** User-specific data
- **Examples:** Notifications, profile data

### **4.2. Performance Optimization Patterns**

#### **Efficient EXISTS Clauses**
```sql
-- Optimized with proper indexing
EXISTS (
    SELECT 1 FROM parent_components pc
    WHERE pc.id = cavity_evaluations.parent_component_id 
    AND is_assigned_to_project(pc.project_id)
)
```

#### **Function Caching**
- `has_role()` and `is_assigned_to_project()` use `STABLE` functions
- Results cached within transaction scope
- Reduces repeated database lookups

---

## **5. Security Implementation Details**

### **5.1. Authentication Integration**
- **Supabase Auth:** `auth.uid()` for current user identification
- **Role Detection:** `auth.role()` for authentication status
- **Session Management:** Automatic session validation

### **5.2. Authorization Flow**
```
1. User Authentication (Supabase Auth)
   ↓
2. Role Assignment Check (user_role_assignments)
   ↓
3. Project Assignment Check (user_project_assignments)
   ↓
4. RLS Policy Evaluation
   ↓
5. Data Access Granted/Denied
```

### **5.3. Security Functions Details**

#### **has_role() Function Security**
- `SECURITY DEFINER` for elevated access to role tables
- Input validation and sanitization
- Graceful failure on authentication errors
- Performance optimized with proper indexing

#### **is_assigned_to_project() Function Security**
- Hierarchical role checking (SU, SQ, Engineering bypass assignments)
- Project-specific assignment validation for External Users
- Efficient query patterns with early returns

---

## **6. Data Access Matrix**

### **6.1. Role-Based Access Summary**

| Table | Super User | Supplier Quality | Engineering | External User |
|-------|------------|-----------------|-------------|---------------|
| **projects** | Full | Full | Read (All) | Read (Assigned) |
| **parent_components** | Full | Full | Read (All) | Read/Update (Assigned) |
| **cavity_evaluations** | Full | Full | Read (All) | Read/Write (Assigned) |
| **spc_values** | Full | Full | Read (All) | Read/Write (Assigned) |
| **action_plans** | Full | Full | Read (All) | Read/Write (Assigned) |
| **drawings** | Full | Full | Read | Read |
| **molds** | Full | Full | Read | Read |
| **users** | Full | Read | Read | Self Only |
| **user_roles** | Full | Read | Read | Read |
| **notifications** | Admin | Admin | Self Only | Self Only |
| **audit_log** | Read | None | None | None |

### **6.2. Operation-Specific Permissions**

#### **External User Limitations**
- **Projects:** Read-only access to assigned projects
- **Components:** Can update planned dates only
- **Evaluations:** Full CRUD on assigned projects
- **Action Plans:** Can create and update, cannot delete
- **Master Data:** Read-only access

#### **Management Role Privileges**
- **Supplier Quality:** Full project management, no user administration
- **Super User:** Complete system administration including user management

---

## **7. Security Best Practices**

### **7.1. RLS Policy Design**
1. **Principle of Least Privilege:** Users get minimum required access
2. **Defense in Depth:** Multiple layers of security checks
3. **Performance Awareness:** Efficient policy queries with proper indexing
4. **Audit Trail:** All data access logged via audit triggers

### **7.2. Policy Maintenance**
1. **Regular Review:** Periodic policy auditing
2. **Testing:** Comprehensive security testing with different user roles
3. **Documentation:** Keep policies documented and updated
4. **Monitoring:** Track policy performance and access patterns

### **7.3. Common Pitfalls to Avoid**
1. **Overly Complex Policies:** Keep policies simple and testable
2. **Performance Issues:** Avoid N+1 queries in policy conditions
3. **Privilege Escalation:** Careful with `SECURITY DEFINER` functions
4. **Missing Policies:** Ensure all tables have appropriate RLS policies

---

## **8. Testing and Validation**

### **8.1. Security Test Cases**

#### **Role-Based Testing**
```sql
-- Test as Super User
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims = '{"sub": "uuid-super-user"}';

-- Verify full access to all tables
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM users;
```

#### **Project Assignment Testing**
```sql
-- Test as External User with specific project assignment
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims = '{"sub": "uuid-external-user"}';

-- Should only see assigned projects
SELECT COUNT(*) FROM projects; -- Expected: limited count
```

### **8.2. Policy Validation Queries**

#### **Check Policy Coverage**
```sql
-- Verify all tables have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
```

#### **Audit Policy Performance**
```sql
-- Check policy execution plans
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM cavity_evaluations 
WHERE parent_component_id = 123;
```

---

## **9. Troubleshooting**

### **9.1. Common Issues**

#### **Access Denied Errors**
1. **Check Authentication:** Verify `auth.uid()` returns valid UUID
2. **Verify Role Assignments:** Check `user_role_assignments` table
3. **Confirm Project Access:** Validate `user_project_assignments`
4. **Policy Logic:** Review policy conditions for edge cases

#### **Performance Issues**
1. **Index Coverage:** Ensure proper indexes on filtered columns
2. **Function Performance:** Monitor `has_role()` and `is_assigned_to_project()` execution
3. **Policy Complexity:** Simplify overly complex policy conditions

### **9.2. Debugging Techniques**

#### **Enable RLS Logging**
```sql
SET log_statement = 'all';
SET log_min_duration_statement = 0;
```

#### **Test Policy Isolation**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable after testing
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

---

## **10. Maintenance and Evolution**

### **10.1. Adding New Tables**
When adding new tables to the system:
1. **Enable RLS:** `ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;`
2. **Create Policies:** Follow established patterns
3. **Test Thoroughly:** Verify with all user roles
4. **Update Documentation:** Keep this document current

### **10.2. Modifying Existing Policies**
1. **Backup Current Policies:** Document existing policy definitions
2. **Test in Development:** Thoroughly test changes
3. **Gradual Rollout:** Consider phased deployment for critical changes
4. **Monitor Impact:** Track performance and access patterns post-deployment

### **10.3. Security Auditing**
Regular security audits should include:
1. **Policy Review:** Ensure policies match business requirements
2. **Access Pattern Analysis:** Review audit logs for unusual patterns
3. **Role Assignment Audit:** Verify appropriate role assignments
4. **Performance Assessment:** Monitor policy performance impact

This comprehensive RLS documentation provides complete coverage of the security model, ensuring proper data access control while maintaining system performance and usability.