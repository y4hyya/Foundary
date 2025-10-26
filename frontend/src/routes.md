# Frontend Routing Configuration

## Routes Overview

The application uses React Router v7 for client-side routing with the following structure:

### Route Definitions

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Home` | Home page displaying featured projects and main navigation |
| `/project/:id` | `ProjectDetail` | Individual project detail page with funding information |
| `/create-project` | `CreateProject` | Project creation form for launching new campaigns |

## Route Details

### Home Page (`/`)
- **Component**: `src/pages/Home.tsx`
- **Purpose**: Landing page and project discovery
- **Features**:
  - Welcome message
  - Link to create new project
  - Featured projects section (to be implemented)

### Project Detail Page (`/project/:id`)
- **Component**: `src/pages/ProjectDetail.tsx`
- **Purpose**: Display detailed information about a specific project
- **URL Parameters**:
  - `id` - Project identifier
- **Features**:
  - Back navigation to home
  - Project information display
  - Funding/support functionality

### Create Project Page (`/create-project`)
- **Component**: `src/pages/CreateProject.tsx`
- **Purpose**: Form for creating new crowdfunding projects
- **Features**:
  - Project title input
  - Description textarea
  - Funding goal (in SUI tokens)
  - Deadline date picker
  - Form validation
  - Submit and cancel actions

## Navigation Flow

```
Home (/)
  ├── Create Project (/create-project)
  │   └── Returns to Home after creation
  └── Project Detail (/project/:id)
      └── Back to Home
```

## Implementation Details

- **Router**: BrowserRouter from react-router-dom
- **Route Configuration**: Centralized in `App.tsx`
- **Page Components**: Organized in `src/pages/` directory
- **Styling**: Custom CSS in `App.css` with modern dark theme

