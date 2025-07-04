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
│   └── split-csv/
│       └── page.tsx
│
├── api/
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
│   ├── CsvPreviewTable.tsx
│   ├── DashboardLayout.tsx
│   ├── ErrorDisplay.tsx
│   ├── Footer.tsx
│   ├── JsonToCsv.tsx
│   ├── Navbar.tsx
│   ├── SplitCsv.tsx
│   └── ToolPageTemplate.tsx
│
├── hooks/
│   └── useFileProcessor.ts
│
├── layout.tsx
└── page.tsx
```

-----

### **Phase 2: Toolkit Expansion (Next Steps)**

**Goal:** Build out the remaining features from the original Python application, creating placeholder pages first and then implementing the full functionality for each.

**Requirements & Plan:**

1.  **Create Placeholder Pages (Complete):** All remaining tool pages have been created with a "Coming Soon" message to ensure the navbar is fully functional.

2.  **Implement "Combine CSVs":**

      * **File:** `app/(tools)/combine-csv/page.tsx`
      * **Component:** Create `app/components/CombineCsv.tsx`.
      * **UI:** Needs to handle multiple file selections (`<input type="file" multiple />`).
      * **API:** Create `app/api/combine-csv/route.ts`. The API must accept multiple files, read them, and append their rows into a single CSV.

3.  **Implement "Join on Column":**

      * **File:** `app/(tools)/join-on-column/page.tsx`
      * **Component:** Create `app/components/JoinOnColumn.tsx`.
      * **UI:** Will require two separate file inputs, logic to find common columns between them, and dropdowns to select the join key and join type (inner, left, etc.).
      * **API:** Create `app/api/join-on-column/route.ts`. This will be the most complex API, performing a database-like join operation.

4.  **Implement "Merge Side-by-Side":**

      * **File:** `app/(tools)/merge-side-by-side/page.tsx`
      * **Component:** Create `app/components/MergeSideBySide.tsx`.
      * **UI:** Will need two file inputs.
      * **API:** Create `app/api/merge-side-by-side/route.ts`. The API will place the columns of the two files next to each other.

5.  **Implement "Remove Duplicates":**

      * **File:** `app/(tools)/remove-duplicates/page.tsx`
      * **Component:** Create `app/components/RemoveDuplicates.tsx`.
      * **UI:** Will need inputs for two files and a dropdown to select the column to check for duplicates.
      * **API:** Create `app/api/remove-duplicates/route.ts`. The API will remove rows from the second file if their key exists in the first file.

-----

### **Phase 3: Polish & Finalization (Future)**

**Goal:** Refine the application and add final touches for a production-grade user experience.

**Requirements:**

  * Add a dark/light mode toggle.
  * Implement more robust user feedback (e.g., toast notifications for success or error messages).
  * Add comprehensive tests for all API endpoints.
  * Finalize the `README.md` and create a `CONTRIBUTING.md` file to encourage community involvement.
