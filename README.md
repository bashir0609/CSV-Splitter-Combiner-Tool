# 📊 CSV Toolkit Web

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A powerful, modern web application for CSV data processing and manipulation**

[🚀 Live Demo](#) • [📖 Documentation](#features) • [🐛 Report Bug](https://github.com/bashir0609/csv-toolkit/issues) • [✨ Request Feature](https://github.com/bashir0609/csv-toolkit/issues)

</div>

---

## ✨ Features

CSV Toolkit Web provides **8 powerful tools** for all your CSV data processing needs:

### 🔄 **Data Transformation**
- **JSON to CSV** - Convert JSON files to CSV format with smart column detection
- **Split CSV** - Split large CSV files into manageable chunks with custom row limits

### 🔗 **Data Joining & Merging**
- **Combine CSVs** - Merge multiple CSV files with intelligent column mapping
- **Merge Side-by-Side** - VLOOKUP-style merging using key columns
- **Join on Column** - Database-style joins (Inner, Left, Right, Outer)
- **VLOOKUP** - Excel-style lookup operations with multiple return columns

### 🧹 **Data Cleaning**
- **Remove Duplicates** - Eliminate duplicate rows with configurable matching
- **Remove Blank Columns** - Clean up empty columns with customizable thresholds

### 🎯 **Key Highlights**
- ⚡ **Client-side processing** - No data leaves your browser
- 🔍 **Real-time preview** - See results before downloading
- 🎨 **Intuitive UI** - Clean, modern interface with step-by-step workflows
- 📱 **Responsive design** - Works seamlessly on desktop, tablet, and mobile
- 🚀 **High performance** - Handles large files efficiently
- 🔒 **Privacy-first** - All processing happens locally

---

## 🎬 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bashir0609/csv-toolkit.git
   cd csv-toolkit
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## 🛠️ Built With

### Core Technologies
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Papa Parse](https://www.papaparse.com/)** - Powerful CSV parsing library

### Key Libraries
- **[React Icons](https://react-icons.github.io/react-icons/)** - Beautiful icon components
- **[Lucide React](https://lucide.dev/)** - Modern icon library
- **[JSZip](https://stuk.github.io/jszip/)** - Client-side ZIP file generation

---

## 📁 Project Structure

```
app/
├── (tools)/                    # Tool pages with route grouping
│   ├── json-to-csv/
│   ├── split-csv/
│   ├── combine-csv/
│   ├── merge-side-by-side/
│   ├── remove-duplicates/
│   ├── remove-blank-columns/
│   ├── join-on-column/
│   └── vlookup/
│
├── api/                         # API routes for data processing
│   ├── json-to-csv/
│   │   ├── route.ts
│   │   └── preview/route.ts
│   ├── split-csv/
│   │   ├── route.ts
│   │   └── preview/route.ts
│   ├── combine-csv/
│   │   ├── route.ts
│   │   ├── analyze/route.ts
│   │   └── preview/route.ts
│   ├── merge-side-by-side/
│   │   ├── route.ts
│   │   ├── analyze/route.ts
│   │   └── preview/route.ts
│   ├── remove-duplicates/
│   │   ├── route.ts
│   │   ├── analyze/route.ts
│   │   └── preview/route.ts
│   ├── remove-blank-columns/
│   │   ├── route.ts
│   │   ├── analyze/route.ts
│   │   └── preview/route.ts
│   ├── join-on-column/
│   │   ├── route.ts
│   │   ├── analyze/route.ts
│   │   └── preview/route.ts
│   └── vlookup/
│       ├── route.ts
│       ├── analyze/route.ts
│       └── preview/route.ts
│
├── components/                 # Reusable React components
│   ├── tools/                  # Tool-specific components
│   ├── ui/                     # UI components
│   └── layout/                 # Layout components
│
└── hooks/                      # Custom React hooks
    ├── useFileProcessor.ts     # File processing logic
    └── useColumnMapping.ts     # Column mapping logic
```

---

## 🎯 Usage Examples

### Basic CSV Splitting
1. Navigate to **Split CSV** tool
2. Upload your large CSV file
3. Configure split settings (rows per file, naming pattern)
4. Preview the split structure
5. Download the ZIP file containing split files

### Advanced Data Joining
1. Go to **Join on Column** tool
2. Upload two CSV files (left and right tables)
3. Select join type (Inner, Left, Right, Outer)
4. Choose the column to join on
5. Configure output options
6. Preview joined results
7. Download the merged file

### VLOOKUP Operations
1. Open **VLOOKUP** tool
2. Upload Main Data file and Lookup Table file
3. Select lookup column from main data
4. Configure return columns from lookup table
5. Choose match type (exact/approximate)
6. Preview enriched data
7. Download the result

---

## 🏗️ Architecture

### Design Principles
- **Client-side First** - All processing happens in the browser for privacy
- **Progressive Enhancement** - Works without JavaScript for basic functionality
- **Component Reusability** - Shared components and hooks across tools
- **Type Safety** - Full TypeScript coverage for reliability
- **Performance** - Optimized for large file processing

### Key Patterns
- **3-Step Workflow** - Upload → Configure → Preview → Download
- **Custom Hooks** - Reusable logic for file processing and column mapping
- **API Route Organization** - Consistent `/analyze`, `/preview`, `/route` structure
- **Error Boundaries** - Graceful error handling throughout the application

---

## 🚀 Performance

- **Large File Support** - Tested with files up to 100MB+
- **Memory Efficient** - Streaming processing for large datasets
- **Fast Processing** - Optimized algorithms for quick results
- **Client-side** - No server limitations or upload restrictions

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Guidelines
- Follow the existing code style and patterns
- Add TypeScript types for all new code
- Include tests for new functionality
- Update documentation as needed
- Use conventional commit messages

---

## 📝 API Reference

### File Processing Endpoints

All tools follow a consistent API structure:

#### Analyze Endpoint
```
POST /api/{tool}/analyze
```
Analyzes uploaded files and returns structure information.

#### Preview Endpoint
```
POST /api/{tool}/preview
```
Generates a preview of the processing results.

#### Process Endpoint
```
POST /api/{tool}
```
Performs the actual processing and returns the result file.

### Custom Hooks

#### `useFileProcessor`
Handles file upload, processing, and download workflows.

```typescript
const {
  files,
  status,
  feedback,
  error,
  previewData,
  handleFileChange,
  handleProcess,
  handlePreview
} = useFileProcessor({
  processApiEndpoint: '/api/tool-name',
  previewApiEndpoint: '/api/tool-name/preview',
  outputFileNameGenerator: (files) => 'result.csv'
});
```

#### `useColumnMapping`
Manages intelligent column mapping with fuzzy matching.

```typescript
const {
  columnMappings,
  isAllMapped,
  updateColumnMapping,
  initializeMappings
} = useColumnMapping({
  analysisData,
  onMappingChange: (mappings) => console.log(mappings)
});
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

---

## 📊 Roadmap

### Phase 3: Polish & Production Ready
- [ ] Dark/Light mode toggle
- [ ] Mobile responsiveness improvements
- [ ] Toast notifications
- [ ] Progress indicators for large files
- [ ] Accessibility enhancements

### Future Enhancements
- [ ] Excel file support (.xlsx)
- [ ] Advanced filtering options
- [ ] Batch processing capabilities
- [ ] Data validation features
- [ ] Export format options (JSON, Excel)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Bashir Ahmed**
- GitHub: [@bashir0609](https://github.com/bashir0609)
- Portfolio: [Your Portfolio URL]

---

## 🙏 Acknowledgments

- [Papa Parse](https://www.papaparse.com/) for excellent CSV parsing
- [Next.js team](https://nextjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS approach
- [Lucide](https://lucide.dev/) for beautiful icons

---

## 📈 Project Stats

![GitHub Stars](https://img.shields.io/github/stars/bashir0609/csv-toolkit?style=social)
![GitHub Forks](https://img.shields.io/github/forks/bashir0609/csv-toolkit?style=social)
![GitHub Issues](https://img.shields.io/github/issues/bashir0609/csv-toolkit)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/bashir0609/csv-toolkit)

---

<div align="center">

**Made with ❤️ and ☕ by [Bashir Ahmed](https://github.com/bashir0609)**

⭐ **Star this repo if you find it helpful!**

</div>