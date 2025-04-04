# Back to the Future Trivia Game - Admin Interface Documentation

## Overview

The Admin Interface for the Back to the Future Trivia Game is a secure, web-based dashboard that allows game administrators to create, manage, and monitor trivia games. This interface is designed to be intuitive and user-friendly, while providing powerful tools for game management.

## Authentication

The Admin Interface uses Firebase Authentication to secure access:

- Only users with admin privileges can access the interface
- Authentication is handled via email/password
- Unauthorized users are redirected to the login page
- Session persistence is managed by Firebase

## Dashboard

The Dashboard provides an overview of the trivia game platform:

- **Statistics Cards**: Quick view of total games, questions, completed games, and active games
- **Recent Activity**: Tabs showing recent games and questions
- **Quick Actions**: Shortcuts to create games, add questions, and manage players

## Game Management

The Games page allows administrators to:

### View and Filter Games

- Search games by name
- Filter by status (Scheduled, Active, Completed, Ended)
- Sort by creation date

### Game Actions

- **Create Game**: Set up a new trivia game with custom settings
- **View/Edit Game**: Modify game settings and details
- **Manage Players**: View and manage players in a specific game
- **Start Game**: Activate a scheduled game
- **End Game**: Manually end an active game
- **Delete Game**: Remove a game and all associated data

### Game Details

Each game includes:

- Name
- Status (color-coded for easy identification)
- Creation date
- Allowed difficulty levels
- Number of players

## Question Management

The Questions page provides tools to:

### View and Filter Questions

- Search questions by text
- Filter by level (1, 2, 3)
- Filter by type (Multiple Choice, True/False, Write-in)
- Filter by media presence

### Question Actions

- **Add Question**: Create a new trivia question
- **Edit Question**: Modify an existing question
- **Delete Question**: Remove a question from the database

### Question Details

Each question displays:

- Question text
- Difficulty level
- Question type
- Media indicators (image/video)
- Point value

## Player Management

The Player Management interface (accessed through a specific game) allows:

- Viewing all players in a game
- Checking player progress and scores
- Removing players from a game
- Adjusting player scores if needed

## Data Structure

The Admin Interface interacts with Firebase Firestore using the following collections:

### Games Collection

```
games/
  gameId/
    name: string
    status: "scheduled" | "active" | "completed" | "ended"
    startTime: timestamp
    endTime: timestamp
    duration: number (minutes)
    allowedLevels: number[]
    questionsPerLevel: number
    enableHints: boolean
    enableBonusQuestions: boolean
    enablePostGameReview: boolean
    createdBy: string
    createdAt: timestamp
    updatedAt: timestamp
    players: string[] (player IDs)
    questions: string[] (question IDs)
```

### Questions Collection

```
questions/
  questionId/
    text: string
    type: "multiple-choice" | "true-false" | "write-in"
    level: 1 | 2 | 3
    pointValue: number
    timeLimit: number (seconds)
    options: { id: string, text: string, isCorrect: boolean }[] (for multiple-choice/true-false)
    correctAnswer: string (for write-in)
    imageUrl: string (optional)
    videoUrl: string (optional)
    hint: string (optional)
    hintPenalty: number
    explanation: string (optional)
    createdAt: timestamp
    updatedAt: timestamp
    createdBy: string
```

### Players Collection

```
players/
  playerId/
    name: string
    email: string (optional)
    profileImageUrl: string (optional)
    gameId: string
    status: "active" | "completed" | "kicked"
    joinTime: timestamp
    updatedAt: timestamp
    sessions: {
      startTime: timestamp
      endTime: timestamp
      selectedLevels: number[]
      currentLevel: number
      currentQuestionIndex: number
      answers: {
        questionId: string
        selectedOptionId: string
        writtenAnswer: string
        usedHint: boolean
        timeRemaining: number
        isCorrect: boolean
        pointsEarned: number
      }[]
      totalScore: number
      isCompleted: boolean
    }[]
```

## Technical Implementation

The Admin Interface is built using:

- **React**: For the user interface
- **React Router**: For navigation
- **Firebase Authentication**: For secure access
- **Firebase Firestore**: For data storage
- **Firebase Storage**: For media uploads
- **Shadcn UI**: For UI components
- **Tailwind CSS**: For styling
- **React Query**: For data fetching and caching
- **React Hook Form**: For form handling
- **Zod**: For form validation

## Security Considerations

- All Firebase rules are configured to restrict access to admin users only
- Sensitive operations require confirmation dialogs
- Input validation is performed on all forms
- Error handling is implemented for all API calls

## Future Enhancements

Potential future improvements to the Admin Interface:

1. **Advanced Analytics**: More detailed game and player statistics
2. **Bulk Operations**: Import/export questions, batch edit/delete
3. **User Management**: Create and manage admin users
4. **Theme Customization**: Customize the look and feel of the trivia game
5. **Question Templates**: Save and reuse question templates
6. **Media Library**: Manage uploaded images and videos
7. **Localization**: Support for multiple languages

## Troubleshooting

Common issues and solutions:

- **Authentication Issues**: Ensure the user has admin privileges in Firebase
- **Data Not Loading**: Check Firebase connectivity and permissions
- **Media Upload Failures**: Verify Firebase Storage rules and bucket configuration
- **Form Submission Errors**: Check console for validation errors

## Support

For additional support or feature requests, please contact the development team.
