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

def create_main_interface():
    """Create the main interface"""
    # Clear current interface
    for widget in main_frame.winfo_children():
        widget.destroy()
    
    # Title
    title_label = tk.Label(main_frame, text="CSV Splitter & Combiner", 
                          font=("Arial", 16, "bold"))
    title_label.pack(pady=(0, 20))
    
    # Main buttons
    button_frame = tk.Frame(main_frame)
    button_frame.pack(expand=True)
    
    split_btn = tk.Button(button_frame, text="Split a CSV File", command=split_csv, 
                         width=25, height=2, font=("Arial", 11))
    split_btn.pack(pady=8)
    
    combine_btn = tk.Button(button_frame, text="Combine Multiple CSVs", command=combine_csv_simple, 
                           width=25, height=2, font=("Arial", 11))
    combine_btn.pack(pady=8)
    
    combine_dup_btn = tk.Button(button_frame, text="Combine with Duplicate Removal", 
                               command=combine_with_duplicate_removal,
                               width=25, height=2, font=("Arial", 11),
                               bg="#4CAF50", fg="white")
    combine_dup_btn.pack(pady=8)
    
    # JSON to CSV conversion button
    json_btn = tk.Button(button_frame, text="Convert JSON to CSV", command=json_to_csv,
                        width=25, height=2, font=("Arial", 11),
                        bg="#2196F3", fg="white")
    json_btn.pack(pady=8)
    
    # Info
    info_label = tk.Label(button_frame, text="Choose an operation above", 
                         font=("Arial", 9), fg="gray")
    info_label.pack(pady=(15, 0))

# --- GUI Setup ---
root = tk.Tk()
root.title("CSV Splitter & Combiner")
root.geometry("500x550")
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
