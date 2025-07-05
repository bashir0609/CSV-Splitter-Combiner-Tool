-----

### **Project: CSV Toolkit Web**

**Objective:** To convert a Python-based desktop utility into a modern, scalable, and user-friendly web application using Next.js and the App Router.

-----

### **Phase 1: Foundation & Core Features (Complete)**

**Goal:** Establish a robust and scalable project architecture and implement the first two core tools.

**✅ Requirements Met:**

  * **Modern Folder Structure:** Implemented the `app/(tools)/` route group for UI pages and a single, centralized `app/api/` directory for all backend logic.
  * **Reusable Components:** Created a `ToolPageTemplate`, `Navbar`, `Footer`, `ErrorDisplay`, and `CsvPreviewTable` for a consistent UI.
  * **Reusable Logic:** Built a `useFileProcessor` custom hook to handle all client-side file processing logic, making new feature additions easy.
  * **Tool 1: JSON to CSV:** Fully implemented with file upload, preview, and download functionality.
  * **Tool 2: Split CSV:** Fully implemented with file upload, analysis, and `.zip` download functionality.
  * **Branding:** Added your name and GitHub repository links to all relevant files.

**Final File Structure for Phase 1:**

```
app/
├── (tools)/
│   ├── json-to-csv/
│   │   └── page.tsx
│   ├── combine-csv/
│   │   └── page.tsx
│   └── split-csv/
│       └── page.tsx
│
├── api/
│   ├── combine-csv/
│   │   ├── route.ts
│   │   ├── analyze/
│   │   │   └── route.ts
│   │   └── preview/
│   │       └── route.ts
│   ├── json-to-csv/
│   │   ├── route.ts
│   │   └── preview/
│   │       └── route.ts
│   └── split-csv/
│       ├── route.ts
│       └── preview/
│           └── route.ts
│
├── components/
│   ├── ComingSoon.tsx
│   ├── CombineCsv.tsx
│   ├── ColumnMappingPreview.tsx
│   ├── CsvPreviewTable.tsx
│   ├── DashboardLayout.tsx
│   ├── ErrorDisplay.tsx
│   ├── Footer.tsx
│   ├── JoinOnColumn.tsx
│   ├── JsonToCsv.tsx
│   ├── Navbar.tsx
│   ├── SplitCsv.tsx
│   └── ToolPageTemplate.tsx
│
├── hooks/
│   ├── useColumnMapping.ts
│   └── useFileProcessor.ts
│
├── layout.tsx
└── page.tsx
```

-----

### **Phase 2: Toolkit Expansion (In Progress)**

**Goal:** Build out the remaining features from the original Python application, creating placeholder pages first and then implementing the full functionality for each.

**✅ Completed Tools:**

1. **✅ Combine CSVs** - Advanced CSV merging tool
   - Multiple file upload handling
   - Intelligent column mapping with fuzzy matching
   - Duplicate removal options
   - Step-by-step workflow (Upload → Map → Preview → Download)
   - Enhanced `useFileProcessor` with custom download names
   - New `useColumnMapping` hook for intelligent column matching

**📋 Remaining Tools to Implement:**

2. **Join on Column:**
   - **File:** `app/(tools)/join-on-column/page.tsx`
   - **Component:** Create `app/components/JoinOnColumn.tsx`
   - **API:** Create `app/api/join-on-column/route.ts`
   - **Features:** Database-like joins (inner, left, right, outer)

3. **Merge Side-by-Side:**
   - **File:** `app/(tools)/merge-side-by-side/page.tsx`
   - **Component:** Create `app/components/MergeSideBySide.tsx`
   - **API:** Create `app/api/merge-side-by-side/route.ts`
   - **Features:** Horizontal file combining

4. **Remove Duplicates:**
   - **File:** `app/(tools)/remove-duplicates/page.tsx`
   - **Component:** Create `app/components/RemoveDuplicates.tsx`
   - **API:** Create `app/api/remove-duplicates/route.ts`
   - **Features:** Deduplication between files

5. **🆕 Remove Blank Columns:** (New standalone tool)
   - **File:** `app/(tools)/remove-blank-columns/page.tsx`
   - **Component:** Create `app/components/RemoveBlankColumns.tsx`
   - **API:** Create `app/api/remove-blank-columns/route.ts`
   - **Features:** Remove columns with configurable empty cell thresholds

-----

### **Current Status Summary**

- **Phase 1:** ✅ Complete (2/2 tools)
- **Phase 2:** 🔄 In Progress (2/5 tools complete)
  - ✅ Combine CSVs
  - ⏳ Join on Column 
  - ⏳ Merge Side-by-Side
  - ⏳ Remove Duplicates
  - ⏳ Remove Blank Columns (new addition)

**Next Steps:** Choose which of the 4 remaining tools to implement next.

-----

### **Phase 3: Polish & Finalization (Future)**

**Goal:** Refine the application and add final touches for a production-grade user experience.

**Requirements:**
  * Add a dark/light mode toggle
  * Implement robust user feedback (toast notifications)
  * Add comprehensive tests for all API endpoints
  * Finalize documentation (`README.md`, `CONTRIBUTING.md`)

**Architecture Achievements:**
- Enhanced `useFileProcessor` hook with custom download functionality
- New `useColumnMapping` hook for intelligent column matching
- Consistent UI patterns established
- Scalable API structure in place