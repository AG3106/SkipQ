import sys
from pypdf import PdfReader

try:
    with open("c:/Users/Lenovo/Desktop/Sem4/CS253/Project_WS1/sdd_text.txt", "w", encoding="utf-8") as f:
        reader = PdfReader("c:/Users/Lenovo/Desktop/Sem4/CS253/Project_WS1/SDD_Group9CS253__1_.pdf")
        for page in reader.pages:
            f.write(page.extract_text() + "\n")
    print("PDF extracted successfully.")
except Exception as e:
    print(f"Error: {e}")
