-- Fix audit_log RLS policy to allow INSERT operations by authenticated users
-- This allows the audit trigger to work properly when users create/update/delete records

-- Add policy to allow authenticated users to insert audit log entries
-- This is needed for the audit trigger to work
CREATE POLICY "Allow audit trigger to insert records" ON "public"."audit_log" 
FOR INSERT 
TO "authenticated"
WITH CHECK (true);

-- Also ensure service_role can manage audit logs (for functions and triggers)  
CREATE POLICY "Allow service role to manage audit log" ON "public"."audit_log" 
FOR ALL 
TO "service_role"
USING (true)
WITH CHECK (true);