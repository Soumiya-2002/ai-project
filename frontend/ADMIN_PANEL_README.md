# Admin Panel - Teacher & Video Management System

A comprehensive admin panel built with React for managing teachers and their educational videos.

## Features

### 📊 Dashboard Module
- **Statistics Overview**: Real-time statistics showing total teachers, videos, and performance metrics
- **Teacher Distribution**: Visual representation of teachers by standard (Sr, Jr, 1-10)
- **Average Score Tracking**: Monitor overall teacher performance
- **Quick Actions**: Fast navigation to key features

### 👨‍🏫 Teacher Management
- **Complete CRUD Operations**: Add, edit, view, and delete teachers
- **Teacher Information**:
  - Name, Email, Phone
  - Standard (Sr, Jr, 1-10)
  - Subject specialization
  - Years of experience
  - Performance score (0-100%)
- **Advanced Filtering**: Filter by standard
- **Search Functionality**: Search by name, email, or subject
- **Score-based Color Coding**:
  - Excellent (90-100%): Green
  - Good (75-89%): Blue
  - Average (60-74%): Yellow
  - Poor (<60%): Red

### 🎥 Video Upload & Management
- **Video Upload**: Upload educational videos with metadata
- **Video Information**:
  - Teacher association
  - Video title and description
  - Duration
  - Standard and subject
  - Thumbnail image
  - Upload date
- **Video Library**: Grid-based video gallery
- **Filtering & Search**: Find videos by standard, teacher, or subject
- **Video Cards**: Beautiful card-based layout with thumbnails

## Technology Stack

- **Frontend**: React 19.2.0
- **Routing**: React Router DOM 7.9.6
- **Styling**: Vanilla CSS with modern design
- **State Management**: React Hooks + LocalStorage
- **Notifications**: React Toastify

## Design Features

- **Modern UI/UX**: Glassmorphism effects and gradient backgrounds
- **Dark Theme**: Professional dark mode interface
- **Responsive Design**: Works on all screen sizes
- **Smooth Animations**: Fade-in, slide-up, and hover effects
- **Interactive Elements**: Hover states and micro-animations
- **Collapsible Sidebar**: Space-efficient navigation

## Getting Started

### Installation

```bash
npm install
```

### Running the Application

```bash
npm start
```

The application will open at `http://localhost:3000`

### Default Routes

- `/` - Login page
- `/admin/dashboard` - Dashboard overview
- `/admin/teachers` - Teacher management
- `/admin/videos` - Video management

## Data Storage

The application uses **localStorage** for data persistence:
- `teachers` - Array of teacher objects
- `videos` - Array of video objects

### Sample Data

The application comes pre-loaded with sample data including:
- 8 sample teachers across different standards
- 4 sample videos

To reset data, clear localStorage or use the browser's developer tools.

## Standards Supported

- **Sr** (Senior) - Advanced level
- **Jr** (Junior) - Intermediate level
- **1-10** - Standard grades 1 through 10

## Features Breakdown

### Dashboard
- 6 statistics cards with real-time data
- Bar chart showing teacher distribution
- Quick action buttons
- Animated card effects

### Teacher List
- Sortable table view
- Avatar generation from names
- Badge-based standard display
- Modal-based add/edit forms
- Inline delete with confirmation

### Video Upload
- File upload for videos and thumbnails
- Auto-populate teacher details
- Duration tracking
- Grid-based video gallery
- Thumbnail preview

## Color Scheme

- **Primary Gradient**: Purple to Pink (#667eea → #764ba2)
- **Secondary Gradient**: Pink to Red (#f093fb → #f5576c)
- **Accent Gradient**: Blue to Cyan (#4facfe → #00f2fe)
- **Background**: Dark blue gradients
- **Text**: White and light gray tones

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Backend API integration
- Video player functionality
- Advanced analytics
- User authentication
- File upload to cloud storage
- Export/Import data functionality
- Bulk operations
- Advanced search filters

## License

This project is part of a professional login system.

---

Built with ❤️ using React
