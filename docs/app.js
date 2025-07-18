// ✅ Full app.js with drag-and-drop for next week, half-day labels, and booking rules

document.addEventListener("DOMContentLoaded", function () {
  const firebaseConfig = {
    apiKey: "AIzaSyCxHyL3-ecLuVjGrM2HjEbfAV7Kgh-Ufs8",
    authDomain: "wfh-board.firebaseapp.com",
    projectId: "wfh-board",
    storageBucket: "wfh-board.appspot.com",
    messagingSenderId: "204510362340",
    appId: "1:204510362340:web:77f93cb517cbbee2f70af1"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  const employees = [{"Name": "Joe Bungey", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2022/03/Joe-Bungey.png"}, {"Name": "Jeni Jones", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2025/07/Untitled-design-6.png"}, {"Name": "Phil Boshier", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2020/11/38.jpg"}, {"Name": "Daniela Kent", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2023/02/11.jpg"}, {"Name": "Gregg Raven", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2022/09/Gregg-Raven.png"}, {"Name": "Oscar Dixon-Barrow", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2022/03/Oscar-Dixon-Barrow.png"}, {"Name": "Jack Perks", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2023/08/Headshots-1.png"}, {"Name": "Elaine Connell", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2022/06/14.jpg"}, {"Name": "Martha Cumiskey", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2023/07/Headshots-3.png"}, {"Name": "Matt Owen", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2025/05/matt-e1747131126274.png"}, {"Name": "Charlotte Berrow", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2025/05/Untitled-design-3-e1747750363328.png"}, {"Name": "Hannah Lawry", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2020/11/Hannah-Lawry-low-re.png"}, {"Name": "Molly McGuire", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2023/10/Molly-McGuire.png"}, {"Name": "Ben McKenna-Smith", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2023/04/Ben-McKenna-Smith-1.png"}, {"Name": "Ben Hackston", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2022/01/Headshots-2.png"}, {"Name": "Summer Bolitho", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2025/05/summer-e1747140054919.png"}, {"Name": "Jack Wheeler", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2020/11/Jack-Wheeler-2.png"}];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const columns = ["In Office", "Working from Home", "On Annual Leave", "Sick Leave"];
  const columnLabels = {
    "In Office": "🏢 In Office",
    "Working from Home": "🏠 Working from Home",
    "On Annual Leave": "☀️ On Annual Leave",
    "Sick Leave": "🤒 Sick Leave"
  };

  const weekToggle = document.getElementById("weekToggle");
  const messageEl = document.getElementById("message");

  const today = new Date();
  const nextMonday = new Date();
  nextMonday.setDate(today.getDate() + (8 - today.getDay()));
  const currentMonday = new Date();
  currentMonday.setDate(today.getDate() - (today.getDay() - 1));

  const weekKeys = [getWeekKey(currentMonday), getWeekKey(nextMonday)];

  let currentWeekData = null;
  let nextWeekData = null;
  let nextWeekState = null;

  function getWeekKey(dateObj) {
    const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return d.getUTCFullYear() + "-W" + String(weekNum).padStart(2, "0");
  }

  function extractName(entry) {
    return typeof entry === "object" ? entry.name : entry;
  }

  function createCard(entry, editable) {
    const name = typeof entry === "object" ? entry.name : entry;
    const half = typeof entry === "object" && entry.half ? ` (${entry.half})` : "";

    const person = employees.find(p => p.Name === name);
    const card = document.createElement("div");
    card.className = "card";
    card.draggable = editable;
    card.dataset.name = name;

    if (person) {
      card.innerHTML = `<img src="${person["Photo URL"]}" alt="${person.Name}"><span>${person.Name}${half}</span>`;
    } else {
      card.textContent = name + half;
    }

    if (editable) {
      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", name);
      });
    }

    return card;
  }

  function buildWeekTabs(containerId, weekData, editable) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const tabs = document.createElement("div");
    tabs.className = "tabs";
    container.appendChild(tabs);

    const tabContent = document.createElement("div");
    container.appendChild(tabContent);

    days.forEach((day, idx) => {
      const btn = document.createElement("button");
      btn.className = "tab-button";
      btn.textContent = day;
      btn.addEventListener("click", () => {
        tabContent.querySelectorAll(".day-container").forEach(d => d.classList.remove("active"));
        tabs.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(`${containerId}-day-${idx}`).classList.add("active");
      });
      tabs.appendChild(btn);

      const dayDiv = document.createElement("div");
      dayDiv.className = "day-container";
      dayDiv.id = `${containerId}-day-${idx}`;

      const columnsDiv = document.createElement("div");
      columnsDiv.className = "columns";

      columns.forEach(col => {
        const colDiv = document.createElement("div");
        colDiv.className = "column";
        colDiv.dataset.day = idx;
        colDiv.dataset.column = col;

        const titleEl = document.createElement("h2");
        titleEl.textContent = columnLabels[col] || col;
        colDiv.appendChild(titleEl);

        const entries = weekData?.[idx]?.[col] || [];
        entries.forEach(entry => {
          colDiv.appendChild(createCard(entry, editable));
        });

        if (editable && col !== "Sick Leave") {
          colDiv.addEventListener("dragover", e => e.preventDefault());
          colDiv.addEventListener("drop", (e) => {
            const name = e.dataTransfer.getData("text/plain");
            moveCard(idx, col, name);
          });
        }

        columnsDiv.appendChild(colDiv);
      });

      dayDiv.appendChild(columnsDiv);
      tabContent.appendChild(dayDiv);
    });

    tabs.firstChild?.click();
  }

  function moveCard(day, column, name) {
    const onLeave = Object.values(nextWeekState).some(d =>
      (d["On Annual Leave"] || []).some(e => extractName(e) === name)
    );
    const alreadyWFH = Object.values(nextWeekState).some(d =>
      (d["Working from Home"] || []).some(e => extractName(e) === name)
    );
    const wfhCount = (nextWeekState[day]["Working from Home"] || []).length;
    const totalEmployees = employees.length;
    const notInOffice = ["On Annual Leave", "Working from Home", "Sick Leave"]
      .reduce((sum, col) => sum + (nextWeekState[day][col] || []).length, 0);
    const percentInOffice = (totalEmployees - notInOffice) / totalEmployees;

    if (column === "Working from Home") {
      if (nextWeekData.bankHoliday || (nextWeekData.mandatoryOfficeDays || []).includes(day)) {
        alert("❌ You cannot book WFH on a restricted day.");
        return;
      }
      if (onLeave) {
        alert("❌ You cannot book WFH in a week where you are on annual leave.");
        return;
      }
      if (alreadyWFH) {
        alert("⚠️ You can only book one WFH day per week.");
        return;
      }
      if (wfhCount >= 3) {
        alert("⚠️ Only 3 people can work from home per day.");
        return;
      }
      if (percentInOffice < 0.6) {
        alert("❌ At least 60% of staff must be in the office to allow WFH on this day.");
        return;
      }
    }

    // Remove from all columns
    columns.forEach(c => {
      nextWeekState[day][c] = (nextWeekState[day][c] || []).filter(entry => extractName(entry) !== name);
    });

    // Add to new column
    nextWeekState[day][column] = nextWeekState[day][column] || [];
    nextWeekState[day][column].push(name);

    db.collection("boards").doc(weekKeys[1]).update({ state: nextWeekState });
    loadBoards();
  }

  async function loadBoards() {
    const [currentSnap, nextSnap] = await Promise.all([
      db.collection("boards").doc(weekKeys[0]).get(),
      db.collection("boards").doc(weekKeys[1]).get()
    ]);

    currentWeekData = currentSnap.exists ? currentSnap.data() : null;
    nextWeekData = nextSnap.exists ? nextSnap.data() : null;
    nextWeekState = nextWeekData?.state || null;

    const showCurrent = weekToggle.value === "current";
    document.getElementById("currentWeekContainer").style.display = showCurrent ? "block" : "none";
    document.getElementById("nextWeekContainer").style.display = showCurrent ? "none" : "block";

    if (showCurrent) {
      if (currentWeekData?.state) {
        buildWeekTabs("currentWeekContainer", currentWeekData.state, false);
        messageEl.textContent = "";
      } else {
        document.getElementById("currentWeekContainer").innerHTML = "No data available.";
      }
    } else {
      if (nextWeekData?.released) {
        buildWeekTabs("nextWeekContainer", nextWeekState, true);
        messageEl.textContent = nextWeekData.bankHoliday
          ? "⚠️ No WFH allowed next week due to a bank holiday."
          : "✅ You may book one WFH day for next week.";
      } else {
        document.getElementById("nextWeekContainer").innerHTML = "";
        messageEl.textContent = "⏳ Next week is not yet released.";
      }
    }
  }

  weekToggle.addEventListener("change", loadBoards);
  loadBoards();
});
