# 📅 ProjectTimeline Components Documentation

## Overview

The ProjectTimeline component system provides a complete, reusable timeline visualization solution for displaying project milestones and progress. The system consists of three main components working together to create a flexible and user-friendly timeline experience.

## Architecture

### Component Hierarchy
```
ProjectTimeline (Container)
├── ProjectTimelineCard (Individual Projects)
│   └── ProjectTimelineItem (Timeline Visualization)
```

## Components

### 1. ProjectTimeline
**File**: `src/components/dashboard/ProjectTimeline.tsx`

Main container component that manages the overall timeline display, controls, and data coordination.

#### Features
- **View Mode Controls**: Grid/List toggle with persistence
- **Project Limit Selector**: Configurable display limits (3, 5, 8, 10, 15)
- **Refresh Functionality**: Manual data refresh with loading states
- **Multi-Tab Coordination**: Cross-tab synchronization using localStorage
- **Loading & Error States**: Comprehensive state management
- **Responsive Design**: Adaptive layouts for all screen sizes

#### Props
```typescript
interface ProjectTimelineProps {
  projects: ProjectWithTimeline[];
  loading?: boolean;
  error?: string | null;
  className?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  showControls?: boolean;
  onConfigClick?: () => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
}
```

#### Key Technical Features
- **SSR Safe**: Proper hydration handling with localStorage
- **Multi-Tab Safe**: Prevents concurrent operations across browser tabs
- **Operation Locking**: Uses refs and localStorage to prevent race conditions
- **Memoized Calculations**: Optimized performance with stable dependencies

### 2. ProjectTimelineCard
**File**: `src/components/dashboard/ProjectTimelineCard.tsx`

Individual project card component with hybrid layout support for both grid and list views.

#### Features
- **Hybrid Layout System**: Different layouts for grid vs list view
- **Status Badges**: Visual project status indicators
- **Progress Calculations**: Dynamic progress bars with percentage display
- **Milestone Statistics**: Summary of milestone completion rates
- **Responsive Metrics**: Adaptive information display based on screen size
- **Click Navigation**: Project navigation with access tracking

#### View Modes

##### Grid View
- Full card layout with detailed information
- Milestone labels and dates visible
- Complete project statistics
- Large progress indicators

##### List View  
- Compact horizontal layout
- Status badge + project name + timeline
- Small progress indicator
- Consistent with other dashboard components

#### Props
```typescript
interface ProjectTimelineCardProps {
  project: ProjectWithTimeline;
  viewMode: 'grid' | 'list';
  className?: string;
  onProjectClick?: (projectId: string | number) => void;
}
```

### 3. ProjectTimelineItem
**File**: `src/components/dashboard/ProjectTimelineItem.tsx`

Core timeline visualization component that renders the actual timeline with milestones.

#### Features
- **Milestone Markers**: Color-coded circular markers for each milestone
- **Today Marker**: Distinctive black diamond shape
- **Progress Bar**: Visual progress indication up to current date
- **Milestone Labels**: Names, dates, and countdown information
- **Tooltips**: Detailed information on hover
- **Responsive Design**: Adaptive sizing and layout

#### Visual System

##### Milestone Colors
- 🟢 **Green** (`bg-green-500`): Completed milestones
- 🔵 **Blue** (`bg-blue-500`): In Progress milestones
- 🔴 **Red** (`bg-red-500`): Overdue milestones
- 🟠 **Orange** (`bg-orange-500`): Delayed milestones
- 🔘 **Gray** (`bg-gray-400`): Cancelled milestones
- ⚪ **Transparent** (`bg-transparent border-gray-400`): Planned milestones

##### Today Marker
- **Shape**: Diamond (rotated square)
- **Color**: Black (white in dark mode)
- **Size**: 2.5 x 2.5 (10px x 10px)
- **Purpose**: Clearly distinguish from circular milestones

#### Layout Modes

##### Compact Mode (`compact={true}`)
- Height: 32px (no labels) or 96px (with labels)
- Horizontal progress bar layout
- Used in both grid and list views
- Milestone summary icons when labels hidden

##### Full Mode (`compact={false}`)
- Height: 80px
- SVG-based timeline with full styling
- Enhanced visual effects
- Complete milestone information display

#### Props
```typescript
interface ProjectTimelineItemProps {
  milestones: Milestone[];
  startDate: string;
  endDate: string;
  className?: string;
  showToday?: boolean;
  compact?: boolean;
  showLabels?: boolean;
}
```

## Data Types

### ProjectWithTimeline
```typescript
interface ProjectWithTimeline {
  project_id: string | number;
  project_name: string;
  project_start_date: string;
  project_end_date: string;
  milestones: Milestone[];
}
```

### Milestone
```typescript
interface Milestone {
  milestone_name: string;
  milestone_target_date: string;
  milestone_status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed' | 'Skipped' | 'Cancelled';
}
```

## Usage Examples

### Basic Implementation
```tsx
import { ProjectTimeline } from '@/components/dashboard/ProjectTimeline';

function Dashboard() {
  const [projects, setProjects] = useState<ProjectWithTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  
  return (
    <ProjectTimeline
      projects={projects}
      loading={loading}
      onRefresh={() => fetchProjects()}
      showControls={true}
      limit={5}
    />
  );
}
```

### Individual Project Card
```tsx
import { ProjectTimelineCard } from '@/components/dashboard/ProjectTimelineCard';

function ProjectList() {
  return (
    <div className="space-y-4">
      {projects.map(project => (
        <ProjectTimelineCard
          key={project.project_id}
          project={project}
          viewMode="grid"
          onProjectClick={(id) => router.push(`/projects/${id}`)}
        />
      ))}
    </div>
  );
}
```

### Standalone Timeline
```tsx
import { ProjectTimelineItem } from '@/components/dashboard/ProjectTimelineItem';

function MilestoneTimeline({ project }) {
  return (
    <ProjectTimelineItem
      milestones={project.milestones}
      startDate={project.project_start_date}
      endDate={project.project_end_date}
      showToday={true}
      compact={false}
      showLabels={true}
    />
  );
}
```

## Performance Considerations

### Optimization Features
- **Memoized Calculations**: All date and position calculations use `useMemo`
- **Stable Dependencies**: Carefully managed dependencies to prevent infinite loops
- **Efficient Re-renders**: Components only update when necessary data changes
- **Lazy Loading**: Components handle loading states gracefully

### Memory Management
- **Cleanup**: Proper cleanup of event listeners and timeouts
- **State Management**: Minimal state with efficient updates
- **Cross-Tab Coordination**: Automatic cleanup of coordination locks

## Accessibility

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Proper focus management throughout components
- ARIA labels for screen readers

### Visual Accessibility  
- High contrast milestone colors
- Clear visual hierarchy
- Responsive text sizing
- Proper color combinations for color-blind users

### Screen Reader Support
- Comprehensive tooltip information
- Semantic HTML structure
- Descriptive labels and descriptions

## Testing

### Test Page
The system includes a comprehensive test page at:
`/dev-tools/test-timeline`

### Test Scenarios
- Multiple projects with different milestone statuses
- Various date ranges and project durations
- Grid and list view mode switching
- Responsive behavior testing
- Error state handling

## Browser Compatibility

### Supported Features
- Modern CSS (Grid, Flexbox, CSS Variables)
- ES6+ JavaScript features
- Local Storage API
- Modern event handling

### Requirements
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Integration Points

### Database Integration
- Compatible with `get_upcoming_project_timelines` stored procedure
- Supports configurable project limits
- Handles milestone status mapping

### Dashboard Integration
- Seamlessly integrates with main dashboard layout
- Follows established design patterns
- Consistent with other dashboard components (ActionPlan alerts, Recent Projects)

### Internationalization
- Full i18n support with next-intl
- Translated labels, tooltips, and status messages
- Date formatting respects user locale
- RTL layout support ready

## Future Enhancements

### Planned Features
- Drag-and-drop milestone rescheduling
- Gantt chart view mode
- Advanced filtering options
- Export capabilities
- Milestone notifications

### Technical Improvements
- Virtual scrolling for large project lists
- Caching layer for timeline calculations
- WebSocket real-time updates
- Progressive enhancement

---

## Troubleshooting

### Common Issues

#### Milestone Labels Not Appearing
- Verify `showLabels={true}` is passed to ProjectTimelineItem
- Check container height is sufficient (`h-24` for labeled timelines)
- Ensure milestone data includes valid names and dates

#### Timeline Not Displaying
- Verify project dates are valid ISO strings
- Check milestone target dates are properly formatted
- Ensure milestone array is not empty

#### Performance Issues
- Check for infinite loops in parent components
- Verify memoized dependencies are stable
- Monitor for excessive re-renders in DevTools

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug_timeline', 'true');
```

---

**Last Updated**: 2025-08-28  
**Component Version**: v1.0.0  
**Maintainer**: GeoGrowth Team