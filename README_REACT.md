# convite_gustavo_lerner - React App

This is a React-based invitation website for Bar Mitzvah and Wedding celebration.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Building for Production

To create a production build:
```bash
npm run build
```

The build folder will be ready to be deployed.

## Project Structure

```
src/
├── components/
│   ├── InviteSection.js      # Bar Mitzvah and Wedding invitation sections
│   ├── InfoSection.js        # Event details and maps
│   ├── CarouselSection.js    # Video and photo galleries
│   ├── RSVPSection.js        # Google Form for confirmations
│   └── GiftlistSection.js    # Gift list information
├── App.js                    # Main App component
├── App.css                   # App styles
├── index.js                  # React entry point
└── index.css                 # Global styles

public/
├── index.html                # HTML template
└── assets/
    ├── images/               # Image files
    └── videos/               # Video files

content.json                  # Content data
```

## Content Management

Edit `content.json` to update:
- Invite titles and names
- Image sources
- Video sources
- Photo gallery items
- Any other text content

## Styling

All styles are in `src/index.css`. The app uses:
- Google Fonts (Great Vibes, Allura, Marck Script, Libre Baskerville)
- CSS Grid for galleries
- Responsive design with media queries

## Features

- Responsive design
- Image and video galleries
- Google Maps integration
- Google Forms for RSVP
- Dynamic content from JSON file
- Smooth animations and transitions
