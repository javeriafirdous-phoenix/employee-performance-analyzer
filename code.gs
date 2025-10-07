function generateShiftReportWithWorkdayLogic() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const detailsSheet = ss.getSheetByName("Details");
  const scoreSheet = ss.getSheetByName("scoreData");
  const reportSheet = ss.getSheetByName("Report");

  const detailsData = detailsSheet.getDataRange().getValues();
  const scoreData = scoreSheet.getRange(2, 1, scoreSheet.getLastRow() - 1, 4).getValues(); // A-D

  const adType = {};
  const shiftStart = {};
  const shiftEnd = {};
  const nameList = [];
  

  // Parse shift and adType data
  for (let i = 1; i < detailsData.length; i++) {
    const name = detailsData[i][0];      // A
    const start = detailsData[i][1];     // B
    const end = detailsData[i][2];       // C
    const type = detailsData[i][5];      // F
    const value = detailsData[i][6];     // G

    if (name) {
      shiftStart[name] = parseTime(start);
      shiftEnd[name] = parseTime(end);
      if (!nameList.includes(name)) nameList.push(name);
    }

    if (type) adType[type] = Number(value);
  }

  // For accumulating results
  const workdayScores = {}; // { workdayStr: { name: totalScore } }
  const violations = {};    // { workdayStr: [ {name, type, timestamp} ] }

  // Process each row in scoreData

  for (let [timestampStr, name, type, count] of scoreData) {
    if (!timestampStr || !name || !type || !adType[type]) continue;
    
    const timestamp = new Date(timestampStr);
    const shiftStartTime = shiftStart[name];
    const shiftEndTime = shiftEnd[name];

    if (!shiftStartTime || !shiftEndTime) continue;

    // Get workday based on agent's shift start time and timestamp
    const [workday, shiftStartDateTime,shiftEndDateTime] = getAgentWorkday(timestamp, shiftStartTime, shiftEndTime);
    const workdayStr= Utilities.formatDate(workday, Session.getScriptTimeZone(), "dd/MM/yyyy");

    

    const shiftEndPlus2Hr = new Date(shiftEndDateTime.getTime() + 2 * 60 * 60 * 1000);
//Logger.log(timestampStr + shiftStartDateTime + shiftEndPlus2Hr);
    const prevshiftEndDateTime =  new Date(shiftEndPlus2Hr);
    const prevshiftstartDateTime = new Date(shiftStartDateTime);

    prevshiftEndDateTime.setDate(shiftEndPlus2Hr.getDate() - 1);
    prevshiftstartDateTime.setDate(shiftStartDateTime.getDate() - 1);
    // Logger.log("prev shift")
    // Logger.log(prevshiftstartDateTime);
    // Logger.log(prevshiftEndDateTime);

    if (timestamp >= shiftStartDateTime && timestamp <= shiftEndPlus2Hr) {
      // Valid entry
      const score = count * adType[type];
      if (!workdayScores[workdayStr]) workdayScores[workdayStr] = {};
      if (!workdayScores[workdayStr][name]) workdayScores[workdayStr][name] = 0;
      workdayScores[workdayStr][name] += score;
     // Logger.log(timestampStr + name + score.toString());
  
    } else if (timestamp >= prevshiftstartDateTime && timestamp <= prevshiftEndDateTime){
      const prevWorkDay = new Date(workday);
      prevWorkDay.setDate(prevWorkDay.getDate() - 1);
      const prevworkdayStr= Utilities.formatDate(prevWorkDay, Session.getScriptTimeZone(), "dd/MM/yyyy");
      // Logger.log("this one")
      // Logger.log(prevworkdayStr);
      const score = count * adType[type];
      if (!workdayScores[prevworkdayStr]) workdayScores[prevworkdayStr] = {};
      if (!workdayScores[prevworkdayStr][name]) workdayScores[prevworkdayStr][name] = 0;
      workdayScores[prevworkdayStr][name] += score;
    }
    
    else {
      // Violation
      if (!violations[workdayStr]) violations[workdayStr] = [];
      violations[workdayStr].push({ name, type, timestamp });
    }
  }

  // Write headers to report sheet
  reportSheet.clearContents();
  reportSheet.getRange(1, 1).setValue("Date");

  let col = 2;
  const nameToCol = {};
  for (let name of nameList) {
    reportSheet.getRange(1, col).setValue(name);
    nameToCol[name] = col;
    col += 1; // Leave one column gap
  }

  // Write report data
  const sortedWorkdays = Object.keys(workdayScores).sort((a, b) => {
    const [d1, m1, y1] = a.split("/").map(Number);
    const [d2, m2, y2] = b.split("/").map(Number);
    return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
  });

  for (let i = 0; i < sortedWorkdays.length; i++) {
    const workday = sortedWorkdays[i];
    const row = i + 2;

    reportSheet.getRange(row, 1).setValue(workday);

    for (let name in workdayScores[workday]) {
      const col = nameToCol[name];
      if (col) {
        reportSheet.getRange(row, col).setValue(workdayScores[workday][name]);
      }
    }

    // Add violations 3 columns after last name
    const violationList = violations[workday];
    if (violationList && violationList.length > 0) {
      const violationCol = col + 1;
      const messages = violationList.map(v => `${v.name} (${v.type}) @ ${Utilities.formatDate(new Date(v.timestamp), Session.getScriptTimeZone(), "dd/MM HH:mm")}`);
      reportSheet.getRange(row, violationCol).setValue("Violations:");
      reportSheet.getRange(row, violationCol + 1).setValue(messages.join(", "));
    }
  }
  const todayDate = new Date(Date.now())
  //const todayDateStr = 
 scoreSheet.getRange(3, 6).setValue(todayDate);
 Logger.log("Report Generated Successfully");
}

// --------- Helper Functions ---------

function parseTime(timeStr) {
  if (typeof timeStr === "string") {
    const [hour, min] = timeStr.split(":").map(Number);
    return new Date(0, 0, 0, hour, min);
  } else if (Object.prototype.toString.call(timeStr) === "[object Date]") {
    return new Date(0, 0, 0, timeStr.getHours(), timeStr.getMinutes());
  }
  return null;
}

function getAgentWorkday(timestamp, shiftStartTime, shiftEndTime) {
    const officialWorkday = new Date(timestamp);
  const shiftStartDateTime = new Date(timestamp);
  const shiftStartHour = shiftStartTime.getHours();
  const shiftStartMinute = shiftStartTime.getMinutes();
  const shiftEndDateTime = new Date(timestamp);
  const shiftEndHour = shiftEndTime.getHours();
  const shiftEndMinute = shiftEndTime.getMinutes();

  if (shiftStartHour < 6) {
  
      officialWorkday.setDate(officialWorkday.getDate() - 1);
     // Logger.log("official workday" + officialWorkday)
  }
  
  
  if (shiftEndTime < shiftStartTime) {
      // Night shift: end is on next day
      shiftEndDateTime.setDate(shiftEndDateTime.getDate() + 1);
    }
  officialWorkday.setHours(0, 0, 0, 0);
  shiftStartDateTime.setHours(shiftStartHour, shiftStartMinute, 0, 0);
  shiftEndDateTime.setHours(shiftEndHour, shiftEndMinute, 0, 0);
  return [officialWorkday, shiftStartDateTime, shiftEndDateTime];
}

function getShiftDateTime(baseDate, time) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), time.getHours(), time.getMinutes());
}
