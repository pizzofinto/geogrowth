'use client';

import { useState, useCallback } from 'react';
// import { useTranslations } from 'next-intl'; // Unused for now
import { RefreshCw, Settings, Database, AlertTriangle, Clock, TrendingUp, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActionPlanAlerts } from '@/hooks/useActionPlanAlerts';
import { ActionPlanAlerts } from '@/components/dashboard/ActionPlanAlerts';
import { ActionPlanAlertCard } from '@/components/dashboard/ActionPlanAlertCard';
import { useAuth } from '@/contexts/AuthContext';
// import { format } from 'date-fns';
// import { it, enUS } from 'date-fns/locale';
// import { useLocale } from 'next-intl';

export default function TestActionPlansPage() {
  // const t = useTranslations('common'); // Unused for now
  // const locale = useLocale();
  const { user, roles } = useAuth();
  
  // ✅ FIXED: useMemo per il locale
  // const dateLocale = useMemo(() => locale === 'it' ? it : enUS, [locale]);

  // Tab state management
  const [activeTab, setActiveTab] = useState('hook');

  // Configurazione test con controlli
  const [config, setConfig] = useState({
    dueSoonDays: 7,
    overdueMaxDays: 90,
    highPriorityThreshold: 3,
    highPriorityMaxDays: 30,
  });

  const { data, isLoading, error, refetch, config: activeConfig } = useActionPlanAlerts(config);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ FIXED: useCallback per prevenire infinite loop
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // ✅ FIXED: useCallback per handler stabile
  const handleConfigChange = useCallback((key: string, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  // ✅ FIXED: useCallback per handler stabile
  const handleViewAllActionPlans = useCallback(() => {
    console.log('🔗 Navigate to action plans page (test)');
  }, []);

  // Handler for config button click
  const handleConfigClick = useCallback(() => {
    setActiveTab('hook'); // Switch to hook tab where config controls are
  }, []);

  // ✅ FIXED: useCallback per handler stabile
  const handleViewDetails = useCallback((actionPlanId: number) => {
    console.log('👁️ View action plan details:', actionPlanId);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧪 Action Plans Hook &amp; UI Test</h1>
          <p className="text-muted-foreground mt-2">
            Test completo dell&apos;hook useActionPlanAlerts e componenti UI
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs per organizzare i test */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hook">Hook Test</TabsTrigger>
          <TabsTrigger value="components">UI Components</TabsTrigger>
          <TabsTrigger value="integration">Integration Test</TabsTrigger>
        </TabsList>

        {/* Tab 1: Hook Test */}
        <TabsContent value="hook" className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                User Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">User ID</Label>
                  <p className="text-sm text-muted-foreground">{user?.id || 'Not authenticated'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">User Email</Label>
                  <p className="text-sm text-muted-foreground">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">User Roles</Label>
                  <div className="flex gap-1 mt-1">
                    {roles.length > 0 ? (
                      roles.map(role => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No roles</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Authentication Status</Label>
                  <Badge variant={user ? "default" : "destructive"}>
                    {user ? 'Authenticated' : 'Not Authenticated'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Hook Configuration
              </CardTitle>
              <CardDescription>
                Modifica i parametri temporali per testare diversi scenari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label htmlFor="dueSoonDays">Due Soon Days</Label>
                  <Input
                    id="dueSoonDays"
                    type="number"
                    min="1"
                    max="365"
                    value={config.dueSoonDays}
                    onChange={(e) => handleConfigChange('dueSoonDays', parseInt(e.target.value) || 7)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Giorni nel futuro per &quot;Due Soon&quot;
                  </p>
                </div>
                <div>
                  <Label htmlFor="overdueMaxDays">Overdue Max Days</Label>
                  <Input
                    id="overdueMaxDays"
                    type="number"
                    min="1"
                    max="365"
                    value={config.overdueMaxDays}
                    onChange={(e) => handleConfigChange('overdueMaxDays', parseInt(e.target.value) || 90)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Giorni nel passato per &quot;Overdue&quot;
                  </p>
                </div>
                <div>
                  <Label htmlFor="highPriorityThreshold">High Priority Threshold</Label>
                  <Input
                    id="highPriorityThreshold"
                    type="number"
                    min="1"
                    max="10"
                    value={config.highPriorityThreshold}
                    onChange={(e) => handleConfigChange('highPriorityThreshold', parseInt(e.target.value) || 3)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Priorità massima per &quot;High Priority&quot;
                  </p>
                </div>
                <div>
                  <Label htmlFor="highPriorityMaxDays">High Priority Max Days</Label>
                  <Input
                    id="highPriorityMaxDays"
                    type="number"
                    min="1"
                    max="365"
                    value={config.highPriorityMaxDays}
                    onChange={(e) => handleConfigChange('highPriorityMaxDays', parseInt(e.target.value) || 30)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Giorni massimi nel futuro per high priority
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Active Configuration</h4>
                <pre className="text-xs bg-background p-2 rounded border">
                  {JSON.stringify(activeConfig, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Hook State Display */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Loading & Error States */}
            <Card>
              <CardHeader>
                <CardTitle>Hook State</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Loading State</Label>
                    <Badge variant={isLoading ? "default" : "secondary"}>
                      {isLoading ? 'Loading...' : 'Loaded'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Error State</Label>
                    <Badge variant={error ? "destructive" : "secondary"}>
                      {error ? 'Error' : 'No Error'}
                    </Badge>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center justify-between">
                    <Label>Data Available</Label>
                    <Badge variant={data ? "default" : "secondary"}>
                      {data ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Summary Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : data ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Total Action Plans
                      </Label>
                      <Badge variant="outline">{data.totalCount}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Overdue
                      </Label>
                      <Badge variant="destructive">{data.overdueCount}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-orange-600">
                        <Clock className="h-4 w-4" />
                        Due Soon
                      </Label>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {data.dueSoonCount}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-blue-600">
                        <TrendingUp className="h-4 w-4" />
                        High Priority
                      </Label>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {data.highPriorityCount}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: UI Components Test */}
        <TabsContent value="components" className="space-y-6">
          {/* Single Card Test */}
          {data && data.totalCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  ActionPlanAlertCard Test
                </CardTitle>
                <CardDescription>
                  Test del singolo componente card con diversi tipi di alert
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Overdue Card */}
                  {data.overdue[0] && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-destructive">Overdue Example</h4>
                      <ActionPlanAlertCard
                        actionPlan={data.overdue[0]}
                        alertType="overdue"
                        onViewDetails={handleViewDetails}
                      />
                    </div>
                  )}

                  {/* Due Soon Card */}
                  {data.dueSoon[0] && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-orange-600">Due Soon Example</h4>
                      <ActionPlanAlertCard
                        actionPlan={data.dueSoon[0]}
                        alertType="dueSoon"
                        onViewDetails={handleViewDetails}
                      />
                    </div>
                  )}

                  {/* High Priority Card */}
                  {data.highPriority[0] && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-blue-600">High Priority Example</h4>
                      <ActionPlanAlertCard
                        actionPlan={data.highPriority[0]}
                        alertType="highPriority"
                        onViewDetails={handleViewDetails}
                      />
                    </div>
                  )}
                </div>

                {data.totalCount === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No action plans available for card testing
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Full Component Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                ActionPlanAlerts Component Test
              </CardTitle>
              <CardDescription>
                Test del componente completo come apparirà nella dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActionPlanAlerts 
                config={config}
                onViewAllActionPlans={handleViewAllActionPlans}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Integration Test */}
        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Integration Preview</CardTitle>
              <CardDescription>
                Anteprima di come apparirà il componente integrato nella dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simula il layout dashboard */}
              <div className="space-y-6">
                {/* Header simulato */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Dashboard Simulation</h2>
                </div>

                {/* KPI Cards simulati */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Active Projects</p>
                          <p className="text-2xl font-bold">12</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Components</p>
                          <p className="text-2xl font-bold">248</p>
                        </div>
                        <Database className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Compliance</p>
                          <p className="text-2xl font-bold">87%</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Layout principale */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Action Plan Alerts - 2 colonne */}
                  <div className="lg:col-span-2">
                    <ActionPlanAlerts 
                      config={config}
                      onViewAllActionPlans={handleViewAllActionPlans}
                      onConfigClick={handleConfigClick}
                    />
                  </div>

                  {/* Recent Projects simulato - 1 colonna */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Project {i}</p>
                              <p className="text-xs text-muted-foreground">Active</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Raw Data Display (for debugging) */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Data (Debug)</CardTitle>
            <CardDescription>
              JSON completo dei dati restituiti dall&apos;hook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}