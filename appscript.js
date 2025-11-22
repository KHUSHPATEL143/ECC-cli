
// --- CONFIGURATION ---
const ADMIN_EMAILS = ["khushpatel9979@gmail.com", "janmejay@gmail.com"];

/**
 * Handles HTTP GET requests.
 */
function doGet(e) {
  const page = e.parameter.page;
  let data;

  try {
    switch (page) {
      case "dashboard":
        data = getDashboardData();
        break;
      case "portfolio":
        data = getPortfolioData();
        break;
      case "members":
        data = getMembersData();
        break;
      case "portfolioHistory":
        data = getPortfolioHistoryData();
        break;
      case "myContribution":
        if (!e.parameter.email) throw new Error("Email parameter is required.");
        data = getMyContribution(e.parameter.email);
        break;
      case "getPendingUsers":
        ensureAdmin(e.parameter.adminEmail);
        data = getPendingUsers();
        break;
      case "getNotifications":
        if (!e.parameter.email) throw new Error("Email parameter is required.");
        data = getNotifications(e.parameter.email);
        break;
      case "getNotificationsAdmin":
        ensureAdmin(e.parameter.adminEmail);
        data = getNotificationsAdmin();
        break;
      case "userDetails":
        if (!e.parameter.email) throw new Error("Email parameter is required.");
        data = getUserDetails(e.parameter.email);
        break;
      case "adminDashboard":
        ensureAdmin(e.parameter.adminEmail);
        data = getAdminDashboardData();
        break;
      default:
        throw new Error("Invalid page parameter");
    }
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles HTTP POST requests.
 */
function doPost(e) {
  try {
    const requestBody = JSON.parse(e.postData.contents);
    const action = requestBody.action;
    let response;

    const adminActions = [
        "addUser", "updateDashboardMetric", "addPortfolioHolding", 
        "deletePortfolioHolding", "addUserContribution", "addPortfolioHistory",
        "updatePortfolioHolding", "recalculateMetrics", "updatePortfolioHistory",
        "deletePortfolioHistory", "approveUser", "rejectUser", "addNotification",
        "toggleNotificationStatus", "deleteNotification", "getNotificationsAdmin"
    ];

    if (adminActions.includes(action)) {
        ensureAdmin(requestBody.adminEmail);
    }

    switch (action) {
      case "signIn":
        response = handleSignIn(requestBody.email, requestBody.password);
        break;
      case "requestSignUp":
        response = handleRequestSignUp(requestBody.name, requestBody.email, requestBody.mobile, requestBody.password);
        break;
      case "approveUser":
        response = handleApproveUser(requestBody.email);
        break;
      case "rejectUser":
        response = handleRejectUser(requestBody.email);
        break;
      case "addUser":
        response = handleAddUser(requestBody.newEmail, requestBody.newPassword, requestBody.newName, requestBody.newMobile);
        break;
      case "addNotification":
        response = handleAddNotification(requestBody.message, requestBody.targetEmail);
        break;
      case "toggleNotificationStatus":
        response = handleToggleNotificationStatus(requestBody.id, requestBody.isActive);
        break;
      case "deleteNotification":
        response = handleDeleteNotification(requestBody.id);
        break;
      case "updateDashboardMetric":
        response = handleUpdateDashboardMetric(requestBody.metricName, requestBody.metricValue);
        break;
      case "addPortfolioHolding":
        response = handleAddPortfolioHolding(requestBody.holding, requestBody.useGoogleFinance);
        break;
      case "deletePortfolioHolding":
        response = handleDeletePortfolioHolding(requestBody.stockName);
        break;
      case "updatePortfolioHolding":
        response = handleUpdatePortfolioHolding(requestBody.rowIndex, requestBody.holding, requestBody.useGoogleFinance);
        break;
      case "addUserContribution":
        response = handleAddUserContribution(requestBody.userEmail, requestBody.amount, requestBody.date, requestBody.notes, requestBody.isMonthly);
        break;
      case "addPortfolioHistory":
        response = handleAddPortfolioHistory(requestBody.date, requestBody.value);
        break;
      case "updatePortfolioHistory":
        response = handleUpdatePortfolioHistory(requestBody.rowIndex, requestBody.point);
        break;
      case "deletePortfolioHistory":
        response = handleDeletePortfolioHistory(requestBody.rowIndex);
        break;
      case "recalculateMetrics":
        response = recalculateDashboardMetrics();
        break;
      case "updateUserProfile":
        response = handleUpdateUserProfile(requestBody.email, requestBody.name, requestBody.mobile);
        break;
      case "uploadFile":
        response = handleUploadFile(requestBody);
        break;
      default:
        throw new Error("Invalid action");
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", data: response }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- HELPER FUNCTIONS ---

function ensureAdmin(email) {
  if (!ADMIN_EMAILS.includes(String(email).trim().toLowerCase())) {
    throw new Error("Unauthorized: Admin access required.");
  }
}

function cleanNumber(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Remove currency symbols (₹, $), commas, and whitespace
  // This regex keeps only digits, decimal points, and negative signs
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// --- DATA FETCHING FUNCTIONS ---

function getPortfolioHistoryData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PortfolioHistory");
  if (!sheet) return { labels: [], data: [], points: [] };
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return { labels: [], data: [], points: [] };
  const headers = values.shift();
  const dateIndex = headers.indexOf("Date");
  const valueIndex = headers.indexOf("Value");
  if (dateIndex === -1 || valueIndex === -1) return { labels: [], data: [], points: [] };
  
  const labels = values.map(row => Utilities.formatDate(new Date(row[dateIndex]), "GMT", "MMM yyyy"));
  // Use cleanNumber to ensure valid float values for the chart
  const data = values.map(row => cleanNumber(row[valueIndex]));
  
  const points = values.map((row, index) => ({
      date: Utilities.formatDate(new Date(row[dateIndex]), "GMT", "yyyy-MM-dd"),
      value: cleanNumber(row[valueIndex]),
      rowIndex: index
  }));
  return { labels, data, points };
}

function handleDeletePortfolioHolding(stockName) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Portfolio");
    if (!sheet) throw new Error("Sheet 'Portfolio' not found.");
    
    // Fetch all data to find the row
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) throw new Error("No data in Portfolio sheet.");

    const headers = data[0];
    const stockNameColIndex = headers.indexOf("Stock Name");
    
    if (stockNameColIndex === -1) throw new Error("'Stock Name' column not found in Portfolio sheet.");
    
    const targetStockName = String(stockName).trim().toLowerCase();
    let rowIndexToDelete = -1;
    
    // Loop through data rows (skipping header at index 0)
    for (let i = 1; i < data.length; i++) {
        const rowStockName = String(data[i][stockNameColIndex]).trim().toLowerCase();
        if (rowStockName === targetStockName) {
            rowIndexToDelete = i + 1; // Sheet rows are 1-based
            break;
        }
    }
    
    if (rowIndexToDelete > -1) {
        sheet.deleteRow(rowIndexToDelete);
        return { message: `Holding '${stockName}' deleted successfully.` };
    } else {
        throw new Error(`Holding '${stockName}' not found.`);
    }
}

// ... (Rest of the existing functions remain unchanged, include them below) ...

function getNotifications(email) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Notifications");
    if (!sheet || sheet.getLastRow() < 2) return [];
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const messageIndex = headers.indexOf("Message");
    const targetIndex = headers.indexOf("TargetEmail");
    const activeIndex = headers.indexOf("IsActive");
    const idIndex = headers.indexOf("ID");

    const normalizedEmail = String(email).trim().toLowerCase();

    const activeNotifications = data.filter(row => {
        const isActive = row[activeIndex];
        const targetEmail = String(row[targetIndex]).trim();
        return isActive === true && (targetEmail === "ALL" || targetEmail.toLowerCase() === normalizedEmail);
    });

    return activeNotifications.map(row => ({
        id: row[idIndex],
        message: row[messageIndex]
    }));
}

function getNotificationsAdmin() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Notifications");
    if (!sheet || sheet.getLastRow() < 2) return [];
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    if (!headers || headers.length === 0) return [];
    return data.map(row => {
        const notification = {};
        headers.forEach((header, i) => notification[header] = row[i]);
        return notification;
    });
}

function getPendingUsers() {
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    if (!usersSheet) return [];
    const data = usersSheet.getDataRange().getValues();
    const headers = data.shift();
    const statusIndex = headers.indexOf("Status");
    if (statusIndex === -1) return [];

    const pendingUsers = data.filter(row => row[statusIndex] === 'Pending');
    
    return pendingUsers.map(row => {
        const user = {};
        headers.forEach((header, i) => user[header] = row[i]);
        return user;
    });
}

function getDashboardData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dashboard");
  if (!sheet) throw new Error("Sheet 'Dashboard' not found.");
  const range = sheet.getDataRange();
  const values = range.getValues();
  const data = {};
  values.slice(1).forEach(row => { data[row[0]] = row[1]; });
  return data;
}

function getPortfolioData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Portfolio");
  if (!sheet) throw new Error("Sheet 'Portfolio' not found.");
  const values = sheet.getDataRange().getValues();
  const headers = values.shift(); 
  return values.map((row, index) => {
    const holding = {};
    headers.forEach((header, i) => { holding[header] = row[i]; });
    holding.rowIndex = index;
    return holding;
  });
}

function getMembersData() {
    const membersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Members");
    if (!membersSheet) throw new Error("Sheet 'Members' not found.");
    const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ContributionsLog");
    let contributions = {};
    if (logSheet) {
        const logData = logSheet.getDataRange().getValues();
        if (logData.length > 1) {
            const logHeaders = logData.shift();
            const emailIndex = logHeaders.indexOf("Email");
            const amountIndex = logHeaders.indexOf("Amount");
            if (emailIndex > -1 && amountIndex > -1) {
                logData.forEach(row => {
                    const email = String(row[emailIndex]).trim().toLowerCase();
                    const amount = parseFloat(row[amountIndex] || 0);
                    contributions[email] = (contributions[email] || 0) + amount;
                });
            }
        }
    }
    const membersData = membersSheet.getDataRange().getValues();
    const membersHeaders = membersData.shift();
    const emailIndex = membersHeaders.indexOf("Email");
    return membersData.map(row => {
      const member = {};
      membersHeaders.forEach((header, index) => { member[header] = row[index]; });
      if (emailIndex > -1) {
          const memberEmail = String(row[emailIndex]).trim().toLowerCase();
          member['Contribution'] = contributions[memberEmail] || 0;
      } else {
          member['Contribution'] = 0;
      }
      return member;
    });
}

function getMyContribution(email) {
    const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ContributionsLog");
    if (!logSheet) return { contribution: 0 };
    const data = logSheet.getDataRange().getValues();
    if (data.length < 2) return { contribution: 0 };
    const headers = data.shift();
    const emailColIndex = headers.indexOf("Email");
    const amountColIndex = headers.indexOf("Amount");
    if (emailColIndex === -1 || amountColIndex === -1) throw new Error("'Email' or 'Amount' column not found in ContributionsLog sheet.");
    const userTotal = data.reduce((acc, row) => {
        if (String(row[emailColIndex]).trim().toLowerCase() === String(email).trim().toLowerCase()) {
            return acc + parseFloat(row[amountColIndex] || 0);
        }
        return acc;
    }, 0);
    return { contribution: userTotal };
}

function getUserDetails(email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    const contributionsLogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ContributionsLog");
    const dashboardSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dashboard");

    if (!usersSheet) throw new Error("Sheet 'Users' not found.");

    const usersData = usersSheet.getDataRange().getValues();
    const usersHeaders = usersData.shift();
    const userEmailIndex = usersHeaders.indexOf("Email");
    const userNameIndex = usersHeaders.indexOf("Name");
    const userStatusIndex = usersHeaders.indexOf("Status");
    const mobileIndex = usersHeaders.indexOf("Mobile");

    let userData = {};
    let userRow = usersData.find(row => String(row[userEmailIndex]).trim().toLowerCase() === normalizedEmail);

    if (userRow) {
        userData.name = userRow[userNameIndex];
        userData.email = userRow[userEmailIndex];
        userData.accountStatus = userRow[userStatusIndex];
        userData.isAdmin = ADMIN_EMAILS.includes(normalizedEmail);
        userData.mobile = mobileIndex > -1 ? userRow[mobileIndex] : "";
        userData.joinDate = "N/A"; 
    } else {
        throw new Error(`User with email '${email}' not found.`);
    }

    let totalContribution = 0;
    let lastContributionDate = null;
    let lastContributionAmount = 0;
    let contributionHistory = [];
    let totalContributionsOfAllUsers = 0;

    if (contributionsLogSheet) {
        const contributionsData = contributionsLogSheet.getDataRange().getValues();
        if (contributionsData.length > 1) {
            const contributionsHeaders = contributionsData.shift();
            const logEmailIndex = contributionsHeaders.indexOf("Email");
            const logAmountIndex = contributionsHeaders.indexOf("Amount");
            const logDateIndex = contributionsHeaders.indexOf("Date");
            const logNotesIndex = contributionsHeaders.indexOf("Notes");
            const logIsMonthlyIndex = contributionsHeaders.indexOf("IsMonthly");

            contributionsData.forEach(row => {
                const currentEmail = String(row[logEmailIndex]).trim().toLowerCase();
                const amount = parseFloat(row[logAmountIndex] || 0);
                const date = row[logDateIndex];

                totalContributionsOfAllUsers += amount; 

                if (currentEmail === normalizedEmail) {
                    totalContribution += amount;
                    contributionHistory.push({
                        date: Utilities.formatDate(new Date(date), "GMT", "yyyy-MM-dd"),
                        amount: amount,
                        status: "Approved",
                        notes: logNotesIndex > -1 ? row[logNotesIndex] : "",
                        isMonthly: logIsMonthlyIndex > -1 ? row[logIsMonthlyIndex] : false
                    });

                    if (!lastContributionDate || new Date(date) > new Date(lastContributionDate)) {
                        lastContributionDate = Utilities.formatDate(new Date(date), "GMT", "yyyy-MM-dd");
                        lastContributionAmount = amount;
                    }
                }
            });
        }
    }
    userData.totalContribution = totalContribution;
    userData.lastContributionDate = lastContributionDate;
    userData.lastContributionAmount = lastContributionAmount;
    userData.contributionHistory = contributionHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    let totalFundValue = 0; 
    let totalReturn = 0;
    let returnPercentage = "0%";
    let investedInStocks = 0;

    if (dashboardSheet) {
        const dashboardData = dashboardSheet.getDataRange().getValues();
        const dashboardMap = {};
        dashboardData.forEach(row => { dashboardMap[row[0]] = row[1]; });

        totalFundValue = parseFloat(dashboardMap["Total Fund Value"] || 0);
        totalReturn = parseFloat(dashboardMap["Total Return"] || 0);
        returnPercentage = dashboardMap["Return Percentage"] || "0%";
        investedInStocks = parseFloat(dashboardMap["Invested in Stocks"] || 0);
    }

    let userProportion = (totalContributionsOfAllUsers > 0) ? (totalContribution / totalContributionsOfAllUsers) : 0;

    userData.userTotalFundValue = totalFundValue * userProportion;
    userData.userInvestedInStocks = investedInStocks * userProportion;
    userData.userTotalReturn = userData.userInvestedInStocks * (parseFloat(returnPercentage) / 100);
    userData.userReturnPercentage = returnPercentage; 

    return userData;
}

function getAdminDashboardData() {
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const contributionsLogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ContributionsLog");

  let totalUsers = 0;
  let pendingApprovals = 0;
  if (usersSheet) {
    const usersData = usersSheet.getDataRange().getValues();
    const headers = usersData.shift();
    const statusIndex = headers.indexOf("Status");
    if (statusIndex !== -1) {
      usersData.forEach(row => {
        if (row[statusIndex] === 'Active') {
          totalUsers++;
        } else if (row[statusIndex] === 'Pending') {
          pendingApprovals++;
        }
      });
    }
  }

  let totalFundValue = 0;
  if (contributionsLogSheet) {
    const amounts = contributionsLogSheet.getRange("B2:B").getValues().flat().filter(String);
    totalFundValue = amounts.reduce((acc, val) => acc + parseFloat(val || 0), 0);
  }

  return {
    totalUsers: totalUsers,
    pendingApprovals: pendingApprovals,
    totalFundValue: totalFundValue
  };
}

function handleAddNotification(message, targetEmail) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Notifications");
    if (!sheet) throw new Error("Sheet 'Notifications' not found.");
    const newId = Utilities.getUuid();
    sheet.appendRow([newId, message, targetEmail, true, new Date()]);
    return { message: "Notification added successfully." };
}

function handleToggleNotificationStatus(id, isActive) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Notifications");
    if (!sheet) throw new Error("Sheet 'Notifications' not found.");
    const data = sheet.getDataRange().getValues();
    const idIndex = data[0].indexOf("ID");
    const activeIndex = data[0].indexOf("IsActive");
    const rowIndex = data.findIndex((row, index) => index > 0 && row[idIndex] == id);
    if (rowIndex > 0) {
        sheet.getRange(rowIndex + 1, activeIndex + 1).setValue(isActive);
        return { message: `Notification status updated.` };
    } else {
        throw new Error(`Notification with ID '${id}' not found.`);
    }
}

function handleDeleteNotification(id) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Notifications");
    if (!sheet) throw new Error("Sheet 'Notifications' not found.");
    const data = sheet.getDataRange().getValues();
    const idIndex = data[0].indexOf("ID");
    const rowIndex = data.findIndex((row, index) => index > 0 && row[idIndex] == id);
    if (rowIndex > 0) {
        sheet.deleteRow(rowIndex + 1);
        return { message: `Notification deleted.` };
    } else {
        throw new Error(`Notification with ID '${id}' not found.`);
    }
}

function handleRequestSignUp(name, email, mobile, password) {
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    if (!usersSheet) throw new Error("Sheet 'Users' not found.");
    const normalizedEmail = String(email).trim().toLowerCase();
    const data = usersSheet.getDataRange().getValues();
    const headers = data.shift();
    const emailIndex = headers.indexOf("Email");
    const userExists = data.some(row => String(row[emailIndex]).trim().toLowerCase() === normalizedEmail);
    if (userExists) {
        throw new Error("An account with this email already exists or is pending approval.");
    }
    const newRow = headers.map(header => {
        if (header === "Name") return name;
        if (header === "Email") return email;
        if (header === "Mobile") return mobile;
        if (header === "Password") return password;
        if (header === "Status") return "Pending";
        return "";
    });
    usersSheet.appendRow(newRow);
    return { message: "Sign-up request submitted successfully. You will be notified upon approval." };
}

function handleApproveUser(email) {
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    if (!usersSheet) throw new Error("Sheet 'Users' not found.");
    const data = usersSheet.getDataRange().getValues();
    const headers = data.shift();
    const emailIndex = headers.indexOf("Email");
    const statusIndex = headers.indexOf("Status");
    const nameIndex = headers.indexOf("Name");
    const userRowIndex = data.findIndex(row => String(row[emailIndex]).trim().toLowerCase() === String(email).trim().toLowerCase());
    if (userRowIndex > -1) {
        const name = data[userRowIndex][nameIndex];
        const membersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Members");
        if (!membersSheet) throw new Error("Sheet 'Members' not found.");
        const memberHeaders = membersSheet.getRange(1, 1, 1, membersSheet.getLastColumn()).getValues()[0];
        const newMemberRow = memberHeaders.map(header => {
            if (header === "Name") return name;
            if (header === "Email") return email;
            if (header === "Join Date") return new Date();
            return "";
        });
        membersSheet.appendRow(newMemberRow);
        usersSheet.getRange(userRowIndex + 2, statusIndex + 1).setValue("Active");
        return { message: `User ${email} approved and added.` };
    } else {
        throw new Error(`Pending user with email '${email}' not found.`);
    }
}

function handleRejectUser(email) {
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    if (!usersSheet) throw new Error("Sheet 'Users' not found.");
    const data = usersSheet.getDataRange().getValues();
    const headers = data.shift();
    const emailIndex = headers.indexOf("Email");
    const statusIndex = headers.indexOf("Status");
    const userRowIndex = data.findIndex(row => 
        String(row[emailIndex]).trim().toLowerCase() === String(email).trim().toLowerCase() &&
        row[statusIndex] === 'Pending'
    );
    if (userRowIndex > -1) {
        usersSheet.deleteRow(userRowIndex + 2);
        return { message: `User request for ${email} rejected.` };
    } else {
        throw new Error(`Pending user with email '${email}' not found.`);
    }
}

function handleSignIn(email, password) {
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!usersSheet) throw new Error("Sheet 'Users' not found.");
  const data = usersSheet.getDataRange().getValues();
  const headers = data.shift();
  const emailIndex = headers.indexOf("Email");
  const passwordIndex = headers.indexOf("Password");
  const statusIndex = headers.indexOf("Status");
  const userRow = data.find(row => 
    String(row[emailIndex]).trim().toLowerCase() === String(email).trim().toLowerCase() && 
    String(row[passwordIndex]).trim() === String(password).trim()
  );
  if (userRow) {
    if (userRow[statusIndex] !== 'Active') {
        throw new Error("This account is pending approval or has been deactivated.");
    }
    const userEmail = userRow[emailIndex];
    const isAdmin = ADMIN_EMAILS.includes(String(userEmail).trim().toLowerCase());
    return { isAuthenticated: true, email: userEmail, isAdmin: isAdmin };
  } else {
    return { isAuthenticated: false, message: "Invalid email or password." };
  }
}

function handleAddUser(email, password, name, mobile) {
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  if (!usersSheet) throw new Error("Sheet 'Users' not found.");
  const userEmails = usersSheet.getRange("B:B").getValues().flat();
  if (userEmails.map(e => String(e).trim().toLowerCase()).includes(String(email).trim().toLowerCase())) {
    throw new Error("User with this email already exists.");
  }
  const membersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Members");
  if (!membersSheet) throw new Error("Sheet 'Members' not found.");
  const userHeaders = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
  const newUserRow = userHeaders.map(header => {
      if (header === "Name") return name;
      if (header === "Email") return email;
      if (header === "Mobile") return mobile;
      if (header === "Password") return password;
      if (header === "Status") return "Active";
      return "";
  });
  usersSheet.appendRow(newUserRow);
  const memberHeaders = membersSheet.getRange(1, 1, 1, membersSheet.getLastColumn()).getValues()[0];
  const newMemberRow = memberHeaders.map(header => {
      if (header === "Name") return name;
      if (header === "Email") return email;
      if (header === "Join Date") return new Date();
      return "";
  });
  membersSheet.appendRow(newMemberRow);
  return { message: `User ${name} (${email}) added successfully.` };
}

function handleUpdateDashboardMetric(metricName, metricValue) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dashboard");
  if (!sheet) throw new Error("Sheet 'Dashboard' not found.");
  const data = sheet.getDataRange().getValues();
  const metricRowIndex = data.findIndex(row => row[0] === metricName);
  if (metricRowIndex > -1) {
    sheet.getRange(metricRowIndex + 1, 2).setValue(metricValue);
    return { message: `Metric '${metricName}' updated successfully.` };
  } else {
    sheet.appendRow([metricName, metricValue]);
    return { message: `Metric '${metricName}' added successfully.` };
  }
}

function handleAddPortfolioHolding(holding, useGoogleFinance) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Portfolio");
    if (!sheet) throw new Error("Sheet 'Portfolio' not found.");
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(() => "");
    
    headers.forEach((header, index) => {
        if (holding[header] !== undefined) {
            newRow[index] = holding[header];
        }
    });

    sheet.appendRow(newRow);
    
    if (useGoogleFinance && holding.Ticker) {
        const lastRow = sheet.getLastRow();
        const currentPriceColIndex = headers.indexOf("Current Price") + 1;
        if (currentPriceColIndex > 0) {
            sheet.getRange(lastRow, currentPriceColIndex).setFormula(`=GOOGLEFINANCE("${holding.Ticker}", "price")`);
        }
    }

    return { message: `Holding '${holding['Stock Name']}' added successfully.` };
}

function handleUpdatePortfolioHolding(rowIndex, holding, useGoogleFinance) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Portfolio");
    if (!sheet) throw new Error("Sheet 'Portfolio' not found.");
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const sheetRow = parseInt(rowIndex) + 2; 
    if (sheetRow > sheet.getLastRow() || sheetRow < 2) throw new Error("Invalid row index for updating holding.");

    headers.forEach((header, index) => {
        if (holding[header] !== undefined) {
             if (header === "Current Price" && useGoogleFinance) return;
             sheet.getRange(sheetRow, index + 1).setValue(holding[header]);
        }
    });

    if (useGoogleFinance && holding.Ticker) {
        const currentPriceColIndex = headers.indexOf("Current Price") + 1;
        if (currentPriceColIndex > 0) {
             sheet.getRange(sheetRow, currentPriceColIndex).setFormula(`=GOOGLEFINANCE("${holding.Ticker}", "price")`);
        }
    }

    return { message: `Holding '${holding['Stock Name']}' updated successfully.` };
}

function handleAddUserContribution(userEmail, amount, date, notes, isMonthly) {
    const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ContributionsLog");
    if (!logSheet) throw new Error("Sheet 'ContributionsLog' not found. Please create it.");
    logSheet.appendRow([userEmail, amount, new Date(date), notes || "", isMonthly || false]);
    recalculateDashboardMetrics();
    return { message: `Contribution for '${userEmail}' logged successfully.` };
}

function handleAddPortfolioHistory(date, value) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PortfolioHistory");
    if (!sheet) throw new Error("Sheet 'PortfolioHistory' not found.");
    sheet.appendRow([new Date(date), value]);
    return { message: `Portfolio history for '${date}' added.` };
}

function handleUpdatePortfolioHistory(rowIndex, point) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PortfolioHistory");
    if (!sheet) throw new Error("Sheet 'PortfolioHistory' not found.");
    const sheetRow = parseInt(rowIndex) + 2;
    if (sheetRow > sheet.getLastRow() || sheetRow < 2) throw new Error("Invalid row index for updating history point.");
    sheet.getRange(sheetRow, 1, 1, 2).setValues([[new Date(point.date), point.value]]);
    return { message: `Chart data point updated successfully.` };
}

function handleDeletePortfolioHistory(rowIndex) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PortfolioHistory");
    if (!sheet) throw new Error("Sheet 'PortfolioHistory' not found.");
    const sheetRow = parseInt(rowIndex) + 2;
    if (sheetRow > sheet.getLastRow() || sheetRow < 2) throw new Error("Invalid row index for deleting history point.");
    sheet.deleteRow(sheetRow);
    return { message: `Chart data point deleted successfully.` };
}

function recalculateDashboardMetrics() {
  const portfolioSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Portfolio");
  if (portfolioSheet) {
    const data = portfolioSheet.getDataRange().getValues();
    if (data.length > 1) {
        const headers = data.shift();
        const priceIndex = headers.indexOf("Purchase Price");
        const sharesIndex = headers.indexOf("Shares");
        if (priceIndex > -1 && sharesIndex > -1) {
          const totalInvested = data.reduce((acc, row) => {
            const price = parseFloat(row[priceIndex] || 0);
            const shares = parseFloat(row[sharesIndex] || 0);
            return acc + (price * shares);
          }, 0);
          handleUpdateDashboardMetric("Invested in Stocks", totalInvested);
        }
    }
  }
  const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ContributionsLog");
  if (logSheet) {
    const amounts = logSheet.getRange("B2:B").getValues().flat().filter(String);
    const totalContributions = amounts.reduce((acc, val) => acc + parseFloat(val || 0), 0);
    handleUpdateDashboardMetric("Total Fund Value", totalContributions);
  }
  return { message: "Dashboard metrics have been recalculated." };
}

function handleUpdateUserProfile(email, name, mobile) {
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    if (!usersSheet) throw new Error("Sheet 'Users' not found.");
    
    const data = usersSheet.getDataRange().getValues();
    const headers = data.shift();
    const emailIndex = headers.indexOf("Email");
    const nameIndex = headers.indexOf("Name");
    const mobileIndex = headers.indexOf("Mobile");

    const userRowIndex = data.findIndex(row => String(row[emailIndex]).trim().toLowerCase() === String(email).trim().toLowerCase());
    
    if (userRowIndex > -1) {
        const rowNum = userRowIndex + 2;
        if (nameIndex > -1) usersSheet.getRange(rowNum, nameIndex + 1).setValue(name);
        if (mobileIndex > -1) usersSheet.getRange(rowNum, mobileIndex + 1).setValue(mobile);
        
        // Also update name in Members sheet
        const membersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Members");
        if (membersSheet) {
             const memData = membersSheet.getDataRange().getValues();
             const memHeaders = memData.shift();
             const memEmailIndex = memHeaders.indexOf("Email");
             const memNameIndex = memHeaders.indexOf("Name");
             const memRowIndex = memData.findIndex(row => String(row[memEmailIndex]).trim().toLowerCase() === String(email).trim().toLowerCase());
             if (memRowIndex > -1 && memNameIndex > -1) {
                 membersSheet.getRange(memRowIndex + 2, memNameIndex + 1).setValue(name);
             }
        }

        return { message: "Profile updated successfully." };
    } else {
        throw new Error("User not found.");
    }
}

function handleUploadFile(payload) {
    try {
        const folderName = "ElevateCapitalProofs";
        let folder;
        const folders = DriveApp.getFoldersByName(folderName);
        
        if (folders.hasNext()) {
            folder = folders.next();
        } else {
            folder = DriveApp.createFolder(folderName);
        }

        const blob = Utilities.newBlob(Utilities.base64Decode(payload.data), payload.mimeType, payload.fileName);
        const file = folder.createFile(blob);
        file.setDescription(`Uploaded by: ${payload.uploadedBy} | Type: ${payload.fileType}`);
        
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        const fileUrl = file.getUrl();

        const proofsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Proofs");
        if (proofsSheet) {
            proofsSheet.appendRow([payload.fileName, payload.fileType, new Date(), payload.uploadedBy, fileUrl]);
        } else {
            const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Proofs");
            newSheet.appendRow(["File Name", "File Type", "Upload Date", "Uploaded By", "File URL"]);
            newSheet.appendRow([payload.fileName, payload.fileType, new Date(), payload.uploadedBy, fileUrl]);
        }

        return { message: "File uploaded successfully.", url: fileUrl };
    } catch (e) {
        throw new Error("File upload failed: " + e.message);
    }
}
