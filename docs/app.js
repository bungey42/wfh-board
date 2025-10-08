// ✅ Full app.js with drag-and-drop for next week, half-day labels, booking rules, wfhAbility logic + tab persistence

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

  let employees = [];

  function loadEmployees() {
    return db.collection("employees")
      .where("active", "==", true)
      .get()
      .then(snapshot => {
        employees = snapshot.docs.map(doc => doc.data());
      });
  }

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
  let nextWeekDayIndex = 0; // ✅ Track current day tab for nextWeek view

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

    const person = employees.find(p => p.name === name);
    const card = document.createElement("div");
    card.className = "card";
    card.draggable = editable;
    card.dataset.name = name;

    if (person) {
      card.innerHTML = `<img src="${person.photoUrl}" alt="${person.name}"><span>${person.name}${half}</span>`;
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

  function buildWeekTabs(containerId, weekData, editable, activeDayIndex = 0) {
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

        // ✅ Track selected tab for next week view
        if (containerId === "nextWeekContainer") {
          nextWeekDayIndex = idx;
        }
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

    // ✅ Reopen the last selected tab (default: Monday)
    tabs.children[activeDayIndex]?.click();
  }

  function moveCard(day, column, name) {
    const person = employees.find(p => p.name === name);
    const ability = person?.wfhAbility || "normal";

    const onLeave = Object.values(nextWeekState).some(d =>
      (d["On Annual Leave"] || []).some(e => extractName(e) === name)
    );
    const alreadyWFH = Object.values(nextWeekState).some(d =>
      (d["Working from Home"] || []).some(e => extractName(e) === name)
    );
    const wfhNormalCount = (nextWeekState[day]["Working from Home"] || []).filter(e => {
      const empName = extractName(e);
      const emp = employees.find(p => p.name === empName);
      return emp?.wfhAbility === "normal";
    }).length;
    const totalEmployees = employees.length;
    const notInOffice = ["On Annual Leave", "Working from Home", "Sick Leave"]
      .reduce((sum, col) => sum + (nextWeekState[day][col] || []).length, 0);
    const percentInOffice = (totalEmployees - notInOffice) / totalEmployees;

    if (column === "Working from Home" && ability !== "any") {
      if (nextWeekData.bankHoliday || (nextWeekData.mandatoryOfficeDays || []).includes(day)) {
        alert("❌ You cannot book WFH on a restricted day.");
        return;
      }
      if (ability === "none") {
        alert("❌ This user is not permitted to work from home.");
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
      if (ability === "normal" && wfhNormalCount >= 3) {
        alert("⚠️ Only 3 people can work from home per day.");
        return;
      }
      if (percentInOffice < 0.6) {
        alert("❌ At least 60% of staff must be in the office to allow WFH on this day.");
        return;
      }
    }

    columns.forEach(c => {
      nextWeekState[day][c] = (nextWeekState[day][c] || []).filter(entry => extractName(entry) !== name);
    });

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
        buildWeekTabs("nextWeekContainer", nextWeekState, true, nextWeekDayIndex); // ✅ persist day
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
  loadEmployees().then(loadBoards);
});
