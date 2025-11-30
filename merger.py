import os

# Define the output file name
output_file = "full_project_code.txt"

# Define folders to exclude (important to avoid massive files)
exclude_dirs = {'.git', 'node_modules', '.next', 'dist', 'coverage'}
# Define file extensions to look for (add more if needed)
extensions = {'.ts', '.js', '.tsx', '.jsx', '.prisma', '.json', '.md', '.css'}

def merge_files():
    with open(output_file, 'w', encoding='utf-8') as outfile:
        # Walk through the current directory
        for root, dirs, files in os.walk("."):
            # Remove excluded directories from the walk
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if any(file.endswith(ext) for ext in extensions) and file != "package-lock.json":
                    file_path = os.path.join(root, file)
                    
                    try:
                        outfile.write(f"\n{'='*50}\n")
                        outfile.write(f"FILE PATH: {file_path}\n")
                        outfile.write(f"{'='*50}\n\n")
                        
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                            outfile.write("\n")
                            
                        print(f"Added: {file_path}")
                    except Exception as e:
                        print(f"Skipped {file_path} due to error: {e}")

if __name__ == "__main__":
    merge_files()
    print(f"\nDone! All code is saved in {output_file}")