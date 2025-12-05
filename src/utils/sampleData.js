// Sample data initialization for the admin panel
export const initializeSampleData = () => {
    // Check if data already exists
    const existingTeachers = localStorage.getItem('teachers');
    const existingVideos = localStorage.getItem('videos');

    // Initialize sample teachers if none exist
    if (!existingTeachers) {
        const sampleTeachers = [
            {
                id: 1701234567890,
                name: 'Dr. Sarah Johnson',
                email: 'sarah.johnson@school.com',
                phone: '+1 234 567 8901',
                standard: 'Sr',
                subject: 'Mathematics',
                experience: '15',
                score: '95'
            },
            {
                id: 1701234567891,
                name: 'Prof. Michael Chen',
                email: 'michael.chen@school.com',
                phone: '+1 234 567 8902',
                standard: 'Sr',
                subject: 'Physics',
                experience: '12',
                score: '92'
            },
            {
                id: 1701234567892,
                name: 'Ms. Emily Rodriguez',
                email: 'emily.rodriguez@school.com',
                phone: '+1 234 567 8903',
                standard: 'Jr',
                subject: 'English',
                experience: '8',
                score: '88'
            },
            {
                id: 1701234567893,
                name: 'Mr. David Kumar',
                email: 'david.kumar@school.com',
                phone: '+1 234 567 8904',
                standard: 'Jr',
                subject: 'Chemistry',
                experience: '6',
                score: '85'
            },
            {
                id: 1701234567894,
                name: 'Mrs. Lisa Anderson',
                email: 'lisa.anderson@school.com',
                phone: '+1 234 567 8905',
                standard: '5',
                subject: 'Science',
                experience: '10',
                score: '90'
            },
            {
                id: 1701234567895,
                name: 'Mr. James Wilson',
                email: 'james.wilson@school.com',
                phone: '+1 234 567 8906',
                standard: '8',
                subject: 'History',
                experience: '7',
                score: '87'
            },
            {
                id: 1701234567896,
                name: 'Ms. Anna Martinez',
                email: 'anna.martinez@school.com',
                phone: '+1 234 567 8907',
                standard: '3',
                subject: 'Art',
                experience: '5',
                score: '82'
            },
            {
                id: 1701234567897,
                name: 'Dr. Robert Taylor',
                email: 'robert.taylor@school.com',
                phone: '+1 234 567 8908',
                standard: '10',
                subject: 'Biology',
                experience: '14',
                score: '93'
            }
        ];

        localStorage.setItem('teachers', JSON.stringify(sampleTeachers));
    }

    // Initialize sample videos if none exist
    if (!existingVideos) {
        const sampleVideos = [
            {
                id: 1701234567900,
                teacherId: '1701234567890',
                teacherName: 'Dr. Sarah Johnson',
                standard: 'Sr',
                subject: 'Mathematics',
                title: 'Advanced Calculus - Derivatives and Integration',
                description: 'Comprehensive guide to understanding derivatives and integration techniques for senior students.',
                duration: '45:30',
                uploadDate: '2024-11-15',
                videoFile: null,
                thumbnail: null
            },
            {
                id: 1701234567901,
                teacherId: '1701234567891',
                teacherName: 'Prof. Michael Chen',
                standard: 'Sr',
                subject: 'Physics',
                title: 'Quantum Mechanics Fundamentals',
                description: 'Introduction to quantum mechanics principles and their applications in modern physics.',
                duration: '52:15',
                uploadDate: '2024-11-18',
                videoFile: null,
                thumbnail: null
            },
            {
                id: 1701234567902,
                teacherId: '1701234567892',
                teacherName: 'Ms. Emily Rodriguez',
                standard: 'Jr',
                subject: 'English',
                title: 'Creative Writing Workshop',
                description: 'Learn the art of creative writing with practical exercises and examples.',
                duration: '38:45',
                uploadDate: '2024-11-20',
                videoFile: null,
                thumbnail: null
            },
            {
                id: 1701234567903,
                teacherId: '1701234567894',
                teacherName: 'Mrs. Lisa Anderson',
                standard: '5',
                subject: 'Science',
                title: 'The Solar System Exploration',
                description: 'Journey through our solar system and learn about planets, moons, and space phenomena.',
                duration: '28:20',
                uploadDate: '2024-11-22',
                videoFile: null,
                thumbnail: null
            }
        ];

        localStorage.setItem('videos', JSON.stringify(sampleVideos));
    }
};

export const clearAllData = () => {
    localStorage.removeItem('teachers');
    localStorage.removeItem('videos');
};
