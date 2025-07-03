import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog, ttk
import pandas as pd
import os
import sys
import json
import chardet
import re

# Hide console window on Windows
if sys.platform == "win32":
    try:
        import ctypes
        console_window = ctypes.windll.kernel32.GetConsoleWindow()
        if console_window:
            ctypes.windll.user32.ShowWindow(console_window, 0)
    except:
        pass

def split_csv():
    """Split a CSV file into multiple parts"""
    # Get number of splits
    num_splits_str = simpledialog.askstring("Number of Files",
                                            "How many files do you want to split the CSV into?",
                                            parent=root)
    if not num_splits_str:
        return

    try:
        num_splits = int(num_splits_str)
        if num_splits <= 0:
            messagebox.showerror("Error", "The number of files must be a positive integer.")
            return
    except (ValueError, TypeError):
        messagebox.showerror("Error", "Invalid input. Please enter a valid integer.")
        return

    # Select file to split
    file_path = filedialog.askopenfilename(
        title="Select CSV to Split",
        filetypes=[("CSV files", "*.csv")]
    )
    if not file_path:
        return

    try:
        df = pd.read_csv(file_path)
        total_rows = len(df)

        if total_rows == 0:
            messagebox.showinfo("Info", "The selected CSV file is empty.")
            return

        rows_per_file = -(-total_rows // num_splits)
        base_name, extension = os.path.splitext(file_path)
        files_created = 0

        for i in range(num_splits):
            start_row = i * rows_per_file
            end_row = min(start_row + rows_per_file, total_rows)

            if start_row >= total_rows:
                break

            split_df = df.iloc[start_row:end_row]
            output_path = f"{base_name}_part{i+1}{extension}"
            split_df.to_csv(output_path, index=False)
            files_created += 1

        messagebox.showinfo("Success",
                            f"Successfully split the file into {files_created} parts.\n"
                            f"Files are saved as {base_name}_partX{extension}")

    except Exception as e:
        messagebox.showerror("Error", f"An error occurred while splitting the CSV:\n{e}")

def combine_csv_simple():
    """Combine CSV files without duplicate removal"""
    files = filedialog.askopenfilenames(
        title="Select CSVs to Combine",
        filetypes=[("CSV files", "*.csv")]
    )
    if not files:
        return

    try:
        df_list = [pd.read_csv(f) for f in files]
        combined_df = pd.concat(df_list, ignore_index=True)

        save_path = filedialog.asksaveasfilename(
            title="Save Combined CSV",
            defaultextension=".csv",
            filetypes=[("CSV files", "*.csv")]
        )
        if save_path:
            combined_df.to_csv(save_path, index=False)
            messagebox.showinfo("Success",
                                f"Files combined successfully!\n"
                                f"Location: {save_path}\n"
                                f"Total rows: {len(combined_df)}")

    except Exception as e:
        messagebox.showerror("Error", f"Failed to combine CSVs:\n{e}")

def combine_with_duplicate_removal():
    """Combine CSV files with duplicate removal options"""
    # Clear the current interface
    for widget in main_frame.winfo_children():
        widget.destroy()

    # Create new interface for combine with duplicate removal
    title_label = tk.Label(main_frame, text="Combine CSVs with Duplicate Removal",
                           font=("Arial", 14, "bold"))
    title_label.pack(pady=(0, 20))

    # File selection
    file_frame = tk.Frame(main_frame)
    file_frame.pack(fill="x", pady=(0, 15))

    files_label = tk.Label(file_frame, text="Selected files: None",
                           font=("Arial", 10), anchor="w")
    files_label.pack(fill="x")

    selected_files = []

    def select_files():
        nonlocal selected_files
        files = filedialog.askopenfilenames(
            title="Select CSVs to Combine",
            filetypes=[("CSV files", "*.csv")]
        )
        if files:
            selected_files = list(files)
            files_label.config(text=f"Selected files: {len(selected_files)} files")

            # Load first file to get column names
            try:
                df = pd.read_csv(selected_files[0])
                column_combo['values'] = ["All columns"] + list(df.columns)
                column_combo.set("All columns")
            except:
                pass

    select_btn = tk.Button(file_frame, text="Select CSV Files", command=select_files,
                           width=20, height=2, font=("Arial", 10))
    select_btn.pack(pady=(5, 0))

    # Duplicate removal options
    duplicate_frame = tk.LabelFrame(main_frame, text="Duplicate Removal Options",
                                      font=("Arial", 11, "bold"), padx=15, pady=15)
    duplicate_frame.pack(fill="x", pady=(0, 15))

    # Remove duplicates checkbox
    remove_var = tk.BooleanVar()
    remove_check = tk.Checkbutton(duplicate_frame, text="Remove duplicate rows",
                                  variable=remove_var, font=("Arial", 10))
    remove_check.pack(anchor="w", pady=(0, 10))

    # Column selection
    col_frame = tk.Frame(duplicate_frame)
    col_frame.pack(fill="x", pady=(0, 10))

    tk.Label(col_frame, text="Check duplicates based on:",
             font=("Arial", 9)).pack(anchor="w")
    column_var = tk.StringVar()
    column_combo = ttk.Combobox(col_frame, textvariable=column_var,
                                values=["All columns"], state="readonly", width=25)
    column_combo.set("All columns")
    column_combo.pack(anchor="w", pady=(5, 0))

    # Keep option
    keep_frame = tk.Frame(duplicate_frame)
    keep_frame.pack(fill="x")

    tk.Label(keep_frame, text="Which duplicate to keep:",
             font=("Arial", 9)).pack(anchor="w")
    keep_var = tk.StringVar(value="first")
    tk.Radiobutton(keep_frame, text="Keep first occurrence",
                   variable=keep_var, value="first", font=("Arial", 9)).pack(anchor="w")
    tk.Radiobutton(keep_frame, text="Keep last occurrence",
                   variable=keep_var, value="last", font=("Arial", 9)).pack(anchor="w")

    # Action buttons
    action_frame = tk.Frame(main_frame)
    action_frame.pack(pady=(20, 0), fill="x")

    def process_files():
        if not selected_files:
            messagebox.showerror("Error", "Please select CSV files first.")
            return

        try:
            # Read and combine files
            df_list = [pd.read_csv(f) for f in selected_files]
            combined_df = pd.concat(df_list, ignore_index=True)

            # Apply duplicate removal if requested
            duplicate_msg = ""
            if remove_var.get():
                original_count = len(combined_df)

                if column_var.get() != "All columns":
                    combined_df = combined_df.drop_duplicates(subset=[column_var.get()],
                                                              keep=keep_var.get())
                else:
                    combined_df = combined_df.drop_duplicates(keep=keep_var.get())

                removed_count = original_count - len(combined_df)
                duplicate_msg = f"\n{removed_count} duplicate rows removed."

            # Save file
            save_path = filedialog.asksaveasfilename(
                title="Save Combined CSV",
                defaultextension=".csv",
                filetypes=[("CSV files", "*.csv")]
            )

            if save_path:
                combined_df.to_csv(save_path, index=False)
                messagebox.showinfo("Success",
                                    f"Files combined successfully!\n"
                                    f"Location: {save_path}\n"
                                    f"Total rows: {len(combined_df)}{duplicate_msg}")
                back_to_main()

        except Exception as e:
            messagebox.showerror("Error", f"Failed to combine CSVs:\n{e}")

    def back_to_main():
        create_main_interface()

    combine_btn = tk.Button(action_frame, text="Combine Files", command=process_files,
                            width=15, height=2, font=("Arial", 10, "bold"),
                            bg="#4CAF50", fg="white")
    combine_btn.pack(side="left", padx=(0, 10))

    back_btn = tk.Button(action_frame, text="Back to Main", command=back_to_main,
                         width=15, height=2, font=("Arial", 10))
    back_btn.pack(side="left")

def json_to_csv():
    """Convert JSON file to CSV format with robust parsing"""
    # Ask user to select JSON file
    file_path = filedialog.askopenfilename(
        title="Select JSON File",
        filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
    )
    if not file_path:
        return

    try:
        # Detect file encoding
        with open(file_path, 'rb') as f:
            raw_data = f.read(10000)
            result = chardet.detect(raw_data)
            encoding = result['encoding'] or 'utf-8'

        # Read file content
        with open(file_path, 'r', encoding=encoding, errors='replace') as f:
            content = f.read().strip()

        # Handle empty files
        if not content:
            messagebox.showinfo("Info", "The JSON file is empty.")
            return

        # Attempt to parse JSON
        try:
            # First try standard JSON parsing
            data = json.loads(content)
        except json.JSONDecodeError as e:
            # If standard parsing fails, attempt to repair common issues
            try:
                repaired = repair_json(content)
                data = json.loads(repaired)
            except Exception as repair_error:
                # Try to load as line-delimited JSON as last resort
                try:
                    data = [json.loads(line) for line in content.splitlines() if line.strip()]
                except:
                    # If all methods fail, show detailed error
                    error_msg = (
                        f"Failed to parse JSON:\n"
                        f"Standard error: {str(e)}\n"
                        f"Repair error: {str(repair_error)}"
                    )
                    messagebox.showerror("JSON Parse Error", error_msg)
                    return

        # Convert to DataFrame
        if isinstance(data, dict):
            # Single JSON object - convert to list of one element
            df = pd.json_normalize([data])
        elif isinstance(data, list):
            # Array of JSON objects
            df = pd.json_normalize(data)
        else:
            raise ValueError("Unsupported JSON structure")

        if df.empty:
            messagebox.showinfo("Info", "The JSON file contains no data.")
            return

        # Ask user for save location
        save_path = filedialog.asksaveasfilename(
            title="Save Converted CSV",
            defaultextension=".csv",
            filetypes=[("CSV files", "*.csv")]
        )
        if not save_path:
            return

        # Save CSV
        df.to_csv(save_path, index=False, encoding='utf-8')
        messagebox.showinfo("Success",
                            f"JSON converted to CSV successfully!\n"
                            f"Location: {save_path}\n"
                            f"Total rows: {len(df)}\n"
                            f"Detected encoding: {encoding}")

    except Exception as e:
        messagebox.showerror("Error", f"Failed to convert JSON to CSV:\n{str(e)}")

def repair_json(content):
    """Attempt to fix common JSON formatting issues"""
    # Replace single quotes with double quotes, but avoid replacing in string values
    # This regex replaces single quotes only when they're used as property delimiters
    repaired = re.sub(r"(\s*)(\w+)(\s*):(\s*)'([^']*)'", r'\1"\2"\3:\4"\5"', content)

    # Remove trailing commas
    repaired = re.sub(r',(\s*[}\]])', r'\1', repaired)

    # Wrap unquoted property names in double quotes
    repaired = re.sub(r'([\{\,])(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*):', r'\1\2"\3"\4:', repaired)

    # Convert JavaScript-style comments to JSON-compatible
    repaired = re.sub(r'^\s*//.*$', '', repaired, flags=re.MULTILINE)  # Remove // comments
    repaired = re.sub(r'/\*.*?\*/', '', repaired, flags=re.DOTALL)     # Remove /* */ comments

    return repaired

def merge_csv_vlookup():
    """Merge two CSV files using a VLOOKUP-like operation, keeping all columns."""
    for widget in main_frame.winfo_children():
        widget.destroy()

    title_label = tk.Label(main_frame, text="Merge/Join on Column (VLOOKUP)", font=("Arial", 14, "bold"))
    title_label.pack(pady=(0, 20))

    left_file_path = ""
    right_file_path = ""
    left_df = None
    right_df = None

    def select_left_file():
        nonlocal left_file_path, left_df
        path = filedialog.askopenfilename(title="Select Left File (the one to add to)", filetypes=[("CSV files", "*.csv")])
        if not path:
            return
        
        try:
            temp_df = pd.read_csv(path)
            if temp_df.empty:
                messagebox.showwarning("Warning", f"The selected file is empty.\n\nFile: {os.path.basename(path)}")
                return

            left_file_path = path
            left_df = temp_df
            left_file_label.config(text=f"Left File: {os.path.basename(path)}")
            update_columns()
        except Exception as e:
            messagebox.showerror("File Read Error", f"Could not read the Left File.\n\nFile: {os.path.basename(path)}\n\nError: {e}")
            left_df = None
            left_file_label.config(text="Left File: None")


    def select_right_file():
        nonlocal right_file_path, right_df
        path = filedialog.askopenfilename(title="Select Right File (the one to lookup from)", filetypes=[("CSV files", "*.csv")])
        if not path:
            return
        
        try:
            temp_df = pd.read_csv(path)
            if temp_df.empty:
                messagebox.showwarning("Warning", f"The selected file is empty.\n\nFile: {os.path.basename(path)}")
                return

            right_file_path = path
            right_df = temp_df
            right_file_label.config(text=f"Right File: {os.path.basename(path)}")
            update_columns()
        except Exception as e:
            messagebox.showerror("File Read Error", f"Could not read the Right File.\n\nFile: {os.path.basename(path)}\n\nError: {e}")
            right_df = None
            right_file_label.config(text="Right File: None")

    def update_columns():
        if left_df is not None and right_df is not None:
            common_columns = list(set(left_df.columns) & set(right_df.columns))
            merge_column_combo['values'] = common_columns
            if common_columns:
                merge_column_combo.set(common_columns[0])
            else:
                messagebox.showinfo("No Common Columns", "The two selected files do not have any columns with the exact same name.")


    file_selection_frame = tk.Frame(main_frame)
    file_selection_frame.pack(fill="x", pady=10)

    left_file_btn = tk.Button(file_selection_frame, text="Select Left File", command=select_left_file)
    left_file_btn.pack(side="left", padx=5)
    left_file_label = tk.Label(file_selection_frame, text="Left File: None")
    left_file_label.pack(side="left", padx=5)

    right_file_btn = tk.Button(file_selection_frame, text="Select Right File", command=select_right_file)
    right_file_btn.pack(side="right", padx=5)
    right_file_label = tk.Label(file_selection_frame, text="Right File: None")
    right_file_label.pack(side="right", padx=5)

    options_frame = tk.LabelFrame(main_frame, text="Merge Options", font=("Arial", 11, "bold"), padx=15, pady=15)
    options_frame.pack(fill="x", expand=True, pady=10)

    merge_column_label = tk.Label(options_frame, text="Merge on Column:")
    merge_column_label.pack(anchor="w")
    merge_column_var = tk.StringVar()
    merge_column_combo = ttk.Combobox(options_frame, textvariable=merge_column_var, state="readonly")
    merge_column_combo.pack(anchor="w", fill="x", pady=5)

    merge_type_label = tk.Label(options_frame, text="Merge Type:")
    merge_type_label.pack(anchor="w", pady=(10, 0))
    merge_type_var = tk.StringVar(value="left")
    merge_type_combo = ttk.Combobox(options_frame, textvariable=merge_type_var, values=["left", "inner", "outer"], state="readonly")
    merge_type_combo.pack(anchor="w", fill="x", pady=5)

    def perform_merge():
        if left_df is None or right_df is None:
            messagebox.showerror("Error", "Please select both files.")
            return

        merge_col = merge_column_var.get()
        if not merge_col:
            messagebox.showerror("Error", "Please select a column to merge on.")
            return
        
        try:
            # Perform the merge, keeping all columns. Pandas handles suffixes for overlapping column names.
            merged_df = pd.merge(left_df, right_df, on=merge_col, how=merge_type_var.get())
            
            # Remove columns that are entirely empty after the merge
            initial_cols = len(merged_df.columns)
            merged_df.dropna(axis=1, how='all', inplace=True)
            cols_removed = initial_cols - len(merged_df.columns)

            save_path = filedialog.asksaveasfilename(
                title="Save Merged CSV",
                defaultextension=".csv",
                filetypes=[("CSV files", "*.csv")]
            )
            if save_path:
                merged_df.to_csv(save_path, index=False)
                messagebox.showinfo("Success",
                                    f"Files merged successfully!\n"
                                    f"Location: {save_path}\n"
                                    f"Total rows: {len(merged_df)}\n"
                                    f"Total columns: {len(merged_df.columns)}\n"
                                    f"Empty columns removed: {cols_removed}")
                create_main_interface()

        except Exception as e:
            messagebox.showerror("Error", f"Failed to merge files:\n{e}")

    action_frame = tk.Frame(main_frame)
    action_frame.pack(pady=(20, 0), fill="x")

    merge_btn = tk.Button(action_frame, text="Merge Files", command=perform_merge, width=15, height=2, font=("Arial", 10, "bold"), bg="#FF9800", fg="white")
    merge_btn.pack(side="left", padx=(0, 10))

    back_btn = tk.Button(action_frame, text="Back to Main", command=create_main_interface, width=15, height=2, font=("Arial", 10))
    back_btn.pack(side="left")
    
def merge_side_by_side():
    """Merge two files side-by-side, combining all columns."""
    for widget in main_frame.winfo_children():
        widget.destroy()

    title_label = tk.Label(main_frame, text="Merge Files Side-by-Side", font=("Arial", 14, "bold"))
    title_label.pack(pady=(0, 20))

    file1_path, file2_path = "", ""
    df1, df2 = None, None

    def select_file1():
        nonlocal file1_path, df1
        path = filedialog.askopenfilename(title="Select First File", filetypes=[("CSV files", "*.csv")])
        if path:
            file1_path = path
            file1_label.config(text=f"File 1: {os.path.basename(path)}")
            df1 = pd.read_csv(path)

    def select_file2():
        nonlocal file2_path, df2
        path = filedialog.askopenfilename(title="Select Second File", filetypes=[("CSV files", "*.csv")])
        if path:
            file2_path = path
            file2_label.config(text=f"File 2: {os.path.basename(path)}")
            df2 = pd.read_csv(path)

    file_selection_frame = tk.Frame(main_frame)
    file_selection_frame.pack(fill="x", pady=20)

    file1_btn = tk.Button(file_selection_frame, text="Select File 1", command=select_file1, width=15, height=2)
    file1_btn.pack(pady=5)
    file1_label = tk.Label(file_selection_frame, text="File 1: Not Selected")
    file1_label.pack(pady=5)

    file2_btn = tk.Button(file_selection_frame, text="Select File 2", command=select_file2, width=15, height=2)
    file2_btn.pack(pady=5)
    file2_label = tk.Label(file_selection_frame, text="File 2: Not Selected")
    file2_label.pack(pady=5)

    def perform_merge():
        if df1 is None or df2 is None:
            messagebox.showerror("Error", "Please select both CSV files.")
            return

        try:
            # Combine files side-by-side
            merged_df = pd.concat([df1, df2], axis=1)

            # Remove columns that are completely empty
            initial_cols = len(merged_df.columns)
            merged_df.dropna(axis=1, how='all', inplace=True)
            cols_removed = initial_cols - len(merged_df.columns)

            save_path = filedialog.asksaveasfilename(
                title="Save Merged CSV",
                defaultextension=".csv",
                filetypes=[("CSV files", "*.csv")]
            )
            if save_path:
                merged_df.to_csv(save_path, index=False)
                messagebox.showinfo("Success",
                                    f"Files merged successfully!\n"
                                    f"Location: {save_path}\n"
                                    f"Total rows: {len(merged_df)}\n"
                                    f"Total columns: {len(merged_df.columns)}\n"
                                    f"Empty columns removed: {cols_removed}")
                create_main_interface()

        except Exception as e:
            messagebox.showerror("Error", f"Failed to merge files:\n{e}")

    action_frame = tk.Frame(main_frame)
    action_frame.pack(pady=(20, 0), fill="x", expand=True)

    merge_btn = tk.Button(action_frame, text="Merge Files", command=perform_merge, width=15, height=2, font=("Arial", 10, "bold"), bg="#00BCD4", fg="white")
    merge_btn.pack(side="left", padx=(0, 10))

    back_btn = tk.Button(action_frame, text="Back to Main", command=create_main_interface, width=15, height=2, font=("Arial", 10))
    back_btn.pack(side="left")


def check_duplicates_between_files():
    """Remove duplicates from the second file that exist in the first file"""
    for widget in main_frame.winfo_children():
        widget.destroy()

    title_label = tk.Label(main_frame, text="Remove Duplicates Between 2 Files", font=("Arial", 14, "bold"))
    title_label.pack(pady=(0, 20))

    file1_path, file2_path = "", ""
    df1, df2 = None, None

    def select_file1():
        nonlocal file1_path, df1
        path = filedialog.askopenfilename(title="Select First File (Reference)", filetypes=[("CSV files", "*.csv")])
        if path:
            file1_path = path
            file1_label.config(text=f"File 1: {os.path.basename(path)}")
            df1 = pd.read_csv(path)
            update_common_columns()

    def select_file2():
        nonlocal file2_path, df2
        path = filedialog.askopenfilename(title="Select Second File (to remove duplicates from)", filetypes=[("CSV files", "*.csv")])
        if path:
            file2_path = path
            file2_label.config(text=f"File 2: {os.path.basename(path)}")
            df2 = pd.read_csv(path)
            update_common_columns()

    def update_common_columns():
        if df1 is not None and df2 is not None:
            common_columns = list(set(df1.columns) & set(df2.columns))
            column_combo['values'] = common_columns
            if common_columns:
                column_combo.set(common_columns[0])

    file_selection_frame = tk.Frame(main_frame)
    file_selection_frame.pack(fill="x", pady=10)

    file1_btn = tk.Button(file_selection_frame, text="Select File 1", command=select_file1)
    file1_btn.pack(side="left", padx=5)
    file1_label = tk.Label(file_selection_frame, text="File 1: None")
    file1_label.pack(side="left", padx=5)

    file2_btn = tk.Button(file_selection_frame, text="Select File 2", command=select_file2)
    file2_btn.pack(side="right", padx=5)
    file2_label = tk.Label(file_selection_frame, text="File 2: None")
    file2_label.pack(side="right", padx=5)

    options_frame = tk.LabelFrame(main_frame, text="Options", font=("Arial", 11, "bold"), padx=15, pady=15)
    options_frame.pack(fill="x", expand=True, pady=10)

    column_label = tk.Label(options_frame, text="Column to Check for Duplicates:")
    column_label.pack(anchor="w")
    column_var = tk.StringVar()
    column_combo = ttk.Combobox(options_frame, textvariable=column_var, state="readonly")
    column_combo.pack(anchor="w", fill="x", pady=5)

    def process_duplicates():
        if not file1_path or not file2_path:
            messagebox.showerror("Error", "Please select both files.")
            return
        
        check_col = column_var.get()
        if not check_col:
            messagebox.showerror("Error", "Please select a column to check.")
            return
            
        try:
            initial_rows = len(df2)
            duplicate_values = df1[check_col].unique()
            cleaned_df2 = df2[~df2[check_col].isin(duplicate_values)]
            rows_removed = initial_rows - len(cleaned_df2)

            save_path = filedialog.asksaveasfilename(
                title="Save Cleaned File 2",
                defaultextension=".csv",
                filetypes=[("CSV files", "*.csv")]
            )
            if save_path:
                cleaned_df2.to_csv(save_path, index=False)
                messagebox.showinfo("Success", f"Duplicate rows removed from File 2 successfully!\nLocation: {save_path}\nRows removed: {rows_removed}\nRemaining rows: {len(cleaned_df2)}")
                create_main_interface()

        except Exception as e:
            messagebox.showerror("Error", f"Failed to process duplicates:\n{e}")

    action_frame = tk.Frame(main_frame)
    action_frame.pack(pady=(20, 0), fill="x")

    process_btn = tk.Button(action_frame, text="Remove Duplicates", command=process_duplicates, width=20, height=2, font=("Arial", 10, "bold"), bg="#f44336", fg="white")
    process_btn.pack(side="left", padx=(0, 10))

    back_btn = tk.Button(action_frame, text="Back to Main", command=create_main_interface, width=15, height=2, font=("Arial", 10))
    back_btn.pack(side="left")

def create_main_interface():
    """Create the main interface"""
    # Clear current interface
    for widget in main_frame.winfo_children():
        widget.destroy()

    # Title
    title_label = tk.Label(main_frame, text="CSV Toolkit",
                           font=("Arial", 16, "bold"))
    title_label.pack(pady=(0, 20))

    # Main buttons
    button_frame = tk.Frame(main_frame)
    button_frame.pack(expand=True)

    split_btn = tk.Button(button_frame, text="Split a CSV File", command=split_csv,
                          width=35, height=2, font=("Arial", 11))
    split_btn.pack(pady=5)

    combine_btn = tk.Button(button_frame, text="Combine Multiple CSVs (Append Rows)", command=combine_csv_simple,
                            width=35, height=2, font=("Arial", 11))
    combine_btn.pack(pady=5)

    combine_dup_btn = tk.Button(button_frame, text="Combine & Remove Duplicates",
                                command=combine_with_duplicate_removal,
                                width=35, height=2, font=("Arial", 11),
                                bg="#4CAF50", fg="white")
    combine_dup_btn.pack(pady=5)

    merge_vlookup_btn = tk.Button(button_frame, text="Merge/Join on Column (VLOOKUP)",
                                  command=merge_csv_vlookup,
                                  width=35, height=2, font=("Arial", 11),
                                  bg="#FF9800", fg="white")
    merge_vlookup_btn.pack(pady=5)
    
    merge_side_btn = tk.Button(button_frame, text="Merge Files Side-by-Side",
                               command=merge_side_by_side,
                               width=35, height=2, font=("Arial", 11),
                               bg="#00BCD4", fg="white")
    merge_side_btn.pack(pady=5)

    check_duplicates_btn = tk.Button(button_frame, text="Remove Duplicates Between 2 Files",
                                      command=check_duplicates_between_files,
                                      width=35, height=2, font=("Arial", 11),
                                      bg="#f44336", fg="white")
    check_duplicates_btn.pack(pady=5)

    json_btn = tk.Button(button_frame, text="Convert JSON to CSV", command=json_to_csv,
                         width=35, height=2, font=("Arial", 11),
                         bg="#2196F3", fg="white")
    json_btn.pack(pady=5)

    # Info
    info_label = tk.Label(button_frame, text="Choose an operation above",
                          font=("Arial", 9), fg="gray")
    info_label.pack(pady=(15, 0))

# --- GUI Setup ---
root = tk.Tk()
root.title("CSV Toolkit")
root.geometry("600x650") 
root.resizable(True, True)

# Center the window
root.update_idletasks()
x = (root.winfo_screenwidth() // 2) - (root.winfo_width() // 2)
y = (root.winfo_screenheight() // 2) - (root.winfo_height() // 2)
root.geometry(f"+{x}+{y}")

# Main frame
main_frame = tk.Frame(root, padx=30, pady=20)
main_frame.pack(fill="both", expand=True)

# Create the main interface
create_main_interface()

root.mainloop()
