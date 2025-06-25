# CSV Splitter & Combiner Tool 📊

[![Python Version](https://img.shields.io/badge/python-3.7+-blue.svg)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/bashir0609/csv-splitter-combiner-tool)

A powerful, user-friendly desktop application for managing CSV files efficiently. Built with Python and Tkinter, this tool provides essential data management capabilities without requiring any technical expertise.

## 🎯 Why This Tool?

Working with large CSV files can be challenging:
- **Large files** are slow to open and process
- **Multiple data sources** need to be combined
- **Duplicate records** waste storage and cause data quality issues
- **Manual processing** is time-consuming and error-prone

This tool solves these problems with an intuitive GUI interface that anyone can use.

## ✨ Key Features

### 🔪 Smart CSV Splitting
- **Intelligent Division**: Split large CSV files into smaller, manageable chunks
- **Custom Split Count**: Specify exactly how many files you want (2, 5, 10, 100+)
- **Header Preservation**: Each split file maintains original column headers
- **Automatic Naming**: Files are named systematically (`file_part1.csv`, `file_part2.csv`, etc.)
- **Even Distribution**: Rows are distributed as evenly as possible across files

### 🔗 Advanced File Combining

#### Simple Combine Mode
- **Drag & Drop Style**: Select multiple CSV files at once
- **Instant Merging**: Combines files while preserving all data
- **Header Management**: Automatically handles header rows
- **Large File Support**: Efficiently processes files of any size

#### Smart Duplicate Removal
- **Column-Specific Detection**: Remove duplicates based on any column:
  - Email addresses
  - Customer IDs
  - Product codes
  - Names
  - Phone numbers
  - Any custom field
- **Full Row Comparison**: Detect completely identical rows
- **Flexible Keep Options**:
  - Keep first occurrence (default)
  - Keep last occurrence (most recent data)
- **Real-time Statistics**: See exactly how many duplicates were found and removed

### 🖥️ User Experience

#### Single Window Design
- **No Pop-ups**: Everything happens in one clean interface
- **Intuitive Flow**: Clear step-by-step process
- **Visual Feedback**: Progress indicators and status messages
- **Error Handling**: Helpful error messages with suggestions

#### Cross-Platform Compatibility
- **Windows**: Double-click `.pyw` file to run
- **macOS**: Run with `python csv_tool.pyw`
- **Linux**: Compatible with all major distributions

## 🚀 Getting Started

### Prerequisites
- **Python 3.7+** (Download from [python.org](https://python.org))
- **Basic CSV files** to work with

### Installation

#### Method 1: Simple Download (Recommended)
1. Download `csv_tool.pyw` from the [releases page](https://github.com/bashir0609/csv-splitter-combiner-tool/releases)
2. Install dependencies:
   ```bash
   pip install pandas
   ```
3. Double-click `csv_tool.pyw` to run (Windows) or:
   ```bash
   python csv_tool.pyw
   ```

#### Method 2: Clone Repository
```bash
# Clone the repository
git clone https://github.com/bashir0609/csv-splitter-combiner-tool.git

# Navigate to project directory
cd csv-splitter-combiner

# Install dependencies
pip install -r requirements.txt

# Run the application
python csv_tool.pyw
```

### First Run
1. **Launch** the application
2. **Choose** your operation from the main menu
3. **Follow** the on-screen prompts
4. **Enjoy** your processed CSV files!

## 📖 How to Use

### Splitting a CSV File

1. Click **"Split a CSV File"**
2. Enter the **number of files** you want (e.g., 5)
3. **Select your CSV file** using the file browser
4. Click **OK** - files will be saved in the same directory

**Example**: A 10,000-row file split into 4 parts creates:
- `data_part1.csv` (2,500 rows)
- `data_part2.csv` (2,500 rows)  
- `data_part3.csv` (2,500 rows)
- `data_part4.csv` (2,500 rows)

### Simple Combining

1. Click **"Combine Multiple CSVs"**
2. **Select multiple files** (hold Ctrl/Cmd to select multiple)
3. **Choose save location** for the combined file
4. Done! All files are merged into one

### Advanced Combining with Duplicate Removal

1. Click **"Combine with Duplicate Removal"**
2. **Select CSV files** to combine
3. **Configure duplicate removal**:
   - ✅ Check "Remove duplicate rows"
   - Choose column (e.g., "Email") or "All columns"
   - Select keep first/last occurrence
4. Click **"Combine Files"**
5. **Review results** - see how many duplicates were removed

## 💡 Use Cases & Examples

### 📧 Email Marketing
**Problem**: Multiple email lists with duplicate subscribers
```
list1.csv: 5,000 emails
list2.csv: 3,000 emails  
list3.csv: 2,000 emails
Overlap: ~1,500 duplicates
```
**Solution**: Combine with duplicate removal on "Email" column
**Result**: Clean list of 8,500 unique subscribers

### 📊 Data Analysis
**Problem**: 50MB CSV file too large for Excel
**Solution**: Split into 10 smaller files (5MB each)
**Result**: Easy to analyze in any spreadsheet program

### 🏢 Customer Data Management
**Problem**: Multiple departments have customer lists with overlapping records
**Solution**: Combine all lists, remove duplicates based on "Customer_ID"
**Result**: Single master customer database

### 📋 Inventory Management
**Problem**: Product data from different suppliers with duplicate SKUs
**Solution**: Combine with duplicate removal on "SKU" column, keep last occurrence (latest data)
**Result**: Up-to-date product catalog

## 🔧 Technical Specifications

### Performance
- **Memory Efficient**: Processes files larger than available RAM
- **Fast Processing**: Optimized pandas operations
- **Large File Support**: Tested with files up to 1GB+
- **Minimal CPU Usage**: Lightweight operations

### File Format Support
- **CSV Files**: Primary format (`.csv`)
- **Encoding**: Automatic detection of UTF-8, ASCII, Latin-1
- **Delimiters**: Automatic detection of commas, tabs, semicolons
- **Headers**: Intelligent header detection and preservation

### Error Handling
- **Malformed CSV**: Graceful handling of formatting issues
- **Empty Files**: Clear error messages
- **Permission Errors**: Helpful suggestions for file access issues
- **Memory Limits**: Automatic chunked processing for large files

## 🛠️ Development

### Project Structure
```
csv-splitter-combiner-tool/
├── csv_tool.pyw           # Main application file
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── LICENSE               # MIT License
├── .gitignore           # Git ignore rules
└── docs/                # Additional documentation
    ├── screenshots/     # Application screenshots
    └── examples/        # Sample CSV files
```

### Dependencies
- **pandas**: Data manipulation and analysis
- **tkinter**: GUI framework (included with Python)

### Building from Source
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run application
python csv_tool.pyw
```

### Creating Executable
```bash
# Install PyInstaller
pip install pyinstaller

# Create standalone executable
pyinstaller --onefile --windowed csv_tool.pyw

# Executable will be in dist/ directory
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues
- **Bug Reports**: Use the [issue tracker](https://github.com/bashir0609/csv-splitter-combiner-tool/issues)
- **Feature Requests**: Suggest new features or improvements
- **Documentation**: Help improve documentation and examples

### Development Contributions
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Coding Standards
- **PEP 8**: Follow Python style guidelines
- **Comments**: Document complex logic
- **Testing**: Test your changes thoroughly
- **Compatibility**: Ensure cross-platform compatibility

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Initial release
- ✅ CSV splitting functionality
- ✅ Simple CSV combining
- ✅ Advanced duplicate removal
- ✅ Single window interface
- ✅ Cross-platform support

### Planned Features
- 🔄 Excel file support (.xlsx, .xls)
- 🔄 Command-line interface
- 🔄 Batch processing
- 🔄 Data preview before processing
- 🔄 Custom delimiter selection
- 🔄 Progress bars for large files

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 [Bashir Ahmed]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

## 🙏 Acknowledgments

- **pandas team** for the excellent data manipulation library
- **Python community** for tkinter and ongoing support
- **Contributors** who have helped improve this tool
- **Users** who provide feedback and feature requests

## 📞 Support

### Getting Help
- **Documentation**: Check this README first
- **Issues**: Search [existing issues](https://github.com/bashir0609/csv-splitter-combiner-tool/issues)
- **Discussions**: Join [community discussions](https://github.com/bashir0609/csv-splitter-combiner-tool/discussions)

### Contact
- **GitHub**: [@bashir0609](https://github.com/bashir0609)
- **Email**: islahwebservice@gmail.com
- **Twitter**: [@bashir0609](https://twitter.com/bashir0609)

---

**⭐ If this tool helped you, please give it a star on GitHub!**

Made with ❤️ for the data community
