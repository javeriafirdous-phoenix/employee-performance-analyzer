# 🧮 Employee Performance Analyzer (Demo)

This Google Sheets + Apps Script project automates employee performance reporting based on shift timings, workdays, and ad type scoring.  

It’s designed to simulate real-world shift handling — including night shifts, extended hours, and weighted ad performance — in a data analysis context.

---

## 🚀 Features
- 🔄 Automatically calculates daily weighted performance for each employee  
- 🕒 Handles complex shift logic (including overnight and extended shifts)  
- ⚡ Supports multiple ad types with customizable weights  
- 📅 Groups results by workday automatically  
- 📊 Generates a clean report sheet for quick insights

---

## 📁 Project Structure
| File | Description |
|------|--------------|
| `Employee Performance Analyzer (Demo).xlsx` | Dummy data for 4 agents across multiple shifts |
| `Code.gs` | Google Apps Script code for automation |
| `report` sheet | Output generated automatically by the script |

---

## 🧠 How It Works
1. **Input data** is stored in two sheets:
   - `details`: shift timings, ad types, and weights  
   - `scoreData`: timestamped entries of ad activity  

2. The script:
   - Determines each entry’s correct workday based on shift start  
   - Computes weighted scores per employee  
   - Extends shift time by +2 hours for tolerance  
   - Generates a detailed daily performance report  

3. Results are written to the `report` sheet automatically.

---

## 🧰 Technologies Used
- **Google Apps Script (JavaScript)**
- **Google Sheets**

---

## 🧑‍💻 Usage
1. Open Google Sheets → Extensions → Apps Script  
2. Paste the content of `Code.gs`  
3. Prepare your sheets: `details`, `scoreData`, `report`  
4. Click ▶️ to run `generateShiftReportWithWorkdayLogic()`  
5. View the auto-generated report in the `report` sheet

---

## 📜 License
This project is for demonstration purposes.  
Feel free to reuse the logic with your own data!

---

## 👩‍💻 Author
**Javeria Firdous**  
Developer | Data Enthusiast | Educator-Turned-Technologist  
[GitHub](https://github.com/javeriafirdous-phoenix)
