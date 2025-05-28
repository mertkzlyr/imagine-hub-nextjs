# ImagineHub

A modern web application built with Next.js, React, TypeScript, and Tailwind CSS.

## 🚀 Features

- Modern React with Next.js 15.3.2
- TypeScript for type safety
- Tailwind CSS for styling
- Responsive design
- Server-side rendering (SSR)
- Static site generation (SSG)
- API routes support
- React Context for state management

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 15.3.2
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI Library:** [React](https://reactjs.org/) 19
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) 4.1.7
- **Icons:** [React Icons](https://react-icons.github.io/react-icons/)
- **Development:** Turbopack for faster development

## 📦 Project Structure

```
src/
├── app/           # Next.js pages and routes
├── components/    # Reusable UI components
├── services/      # Business logic and API calls
├── context/       # React context providers
└── config/        # Configuration files
```

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd imaginehub
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production (required before running start)
- `npm run start` - Start the production server (must run `npm run build` first)
- `npm run lint` - Run ESLint for code linting

### Production Deployment

To run the application in production mode:

```bash
# First, build the application
npm run build

# Then, start the production server
npm run start
```

## 🐳 Docker Support

The project includes Docker configuration for containerized deployment:

```bash
# Build the Docker image
docker build -t imaginehub .

# Run the container
docker run -p 3000:3000 imaginehub
```

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Vercel](https://vercel.com/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
