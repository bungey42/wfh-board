

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


const employees = [{"Name": "Joe Bungey", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2022/03/Joe-Bungey.png"}, {"Name": "Jeni Jones", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2025/07/Untitled-design-6.png"}, {"Name": "Phil Boshier", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2020/11/38.jpg"}, {"Name": "Daniela Kent", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2023/02/11.jpg"}, {"Name": "Gregg Raven", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2022/09/Gregg-Raven.png"}, {"Name": "Oscar Dixon-Barrow", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2022/03/Oscar-Dixon-Barrow.png"}, {"Name": "Jack Perks", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2023/08/Headshots-1.png"}, {"Name": "Elaine Connell", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2022/06/14.jpg"}, {"Name": "Martha Cumiskey", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2023/07/Headshots-3.png"}, {"Name": "Matt Owen", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2025/05/matt-e1747131126274.png"}, {"Name": "Charlotte Berrow", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2025/05/Untitled-design-3-e1747750363328.png"}, {"Name": "Hannah Lawry", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2020/11/Hannah-Lawry-low-re.png"}, {"Name": "Molly McGuire", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2023/10/Molly-McGuire.png"}, {"Name": "Ben McKenna-Smith", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2023/04/Ben-McKenna-Smith-1.png"}, {"Name": "Ben Hackston", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2022/01/Headshots-2.png"}, {"Name": "Summer Bolitho", "Photo URL": "https://www.mustardjobs.co.uk/wp-content/uploads/2025/05/summer-e1747140054919.png"}];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const columns = ["In Office", "Working from Home", "On Annual Leave"];
let nextData = null;
let nextWeekState = {};

const today = new Date();
const nextMonday = new Date();
nextMonday.setDate(today.getDate() + (8 - today.getDay()));
const currentMonday = new Date();
currentMonday.setDate(today.getDate() - (today.getDay() - 1));

const weekKeys = [
  getWeekKeyFromDate(currentMonday),
  getWeekKeyFromDate(nextMonday)
];

async function loadBothWeeks() {
  const [currentSnap, nextSnap] = await Promise.all([
    db.collection("boards").doc(weekKeys[0]).get(),
    db.collection("boards").doc(weekKeys[1]).get()
  ]);

  const currentData = currentSnap.exists ? currentSnap.data() : null;
  nextData = nextSnap.exists ? nextSnap.data() : null;

  if (currentData) {
    const section = createWeekSection("Current Week (Read-Only)", currentData.state, false);
    document.getElementById("currentWeekContainer").appendChild(section);
  }

  if (nextData && nextData.released) {
    nextWeekState = nextData.state || initEmptyState();
    const section = createWeekSection("Next Week (Editable)", nextWeekState, true);
    document.getElementById("nextWeekContainer").appendChild(section);

    document.getElementById("message").textContent =
      nextData.bankHoliday
        ? "⚠️ No WFH allowed next week due to a bank holiday."
        : "✅ You may book one WFH day for the upcoming week.";
  } else {
    document.getElementById("message").textContent =
      "⏳ Bookings for next week are not open yet.";
  }

  document.getElementById("weekToggle").dispatchEvent(new Event("change"));
}

function getWeekKeyFromDate(dateObj) {
  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return d.getUTCFullYear() + "-W" + String(weekNum).padStart(2, "0");
}

function initEmptyState() {
  const state = {};
  for (let i = 0; i < 5; i++) {
    state[i] = {
      "In Office": employees.map(e => e.Name),
      "Working from Home": [],
      "On Annual Leave": []
    };
  }
  return state;
}

function createCard(person) {
  const card = document.createElement("div");
  card.className = "card";
  card.draggable = true;
  card.dataset.name = person.Name;
  card.innerHTML = `<img src="${person["Photo URL"]}" alt="${person.Name}"><span>${person.Name}</span>`;
  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text", person.Name);
  });
  return card;
}

function moveCard(day, column, name) {
  const onLeave = Object.values(nextWeekState).some(dayData =>
    (dayData["On Annual Leave"] || []).includes(name)
  );
  if (onLeave) {
    alert("❌ You cannot book WFH in a week where you are on annual leave.");
    return;
  }
  if (nextData.bankHoliday || (nextData.mandatoryOfficeDays || []).includes(day)) {
    alert("❌ You cannot book WFH on a restricted day.");
    return;
  }
  const wfhCount = (nextWeekState[day]["Working from Home"] || []).length;
  const alreadyWFH = Object.values(nextWeekState).some(dayData =>
    (dayData["Working from Home"] || []).includes(name)
  );
  if (column === "Working from Home") {
    if (wfhCount >= 3) {
      alert("⚠️ Only 3 people can work from home per day.");
      return;
    }
    if (alreadyWFH) {
      alert("⚠️ You can only book one WFH day per week.");
      return;
    }
  }

  columns.forEach(col => {
    nextWeekState[day][col] = (nextWeekState[day][col] || []).filter(p => p !== name);
  });
  nextWeekState[day][column].push(name);
  db.collection("boards").doc(weekKeys[1]).update({ state: nextWeekState });
  loadBothWeeks();
}

function createWeekSection(title, weekState, editable) {
  const container = document.createElement("div");
  const tabs = document.createElement("div");
  tabs.className = "tabs";
  container.appendChild(tabs);

  const tabContent = document.createElement("div");
  container.appendChild(tabContent);

  days.forEach((day, idx) => {
    const btn = document.createElement("button");
    btn.textContent = day;
    btn.className = "tab-button";
    btn.onclick = () => {
      tabContent.querySelectorAll(".day-container").forEach(c => c.classList.remove("active"));
      tabs.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(title + "-day-" + idx).classList.add("active");
    };
    tabs.appendChild(btn);

    const dayDiv = document.createElement("div");
    dayDiv.className = "day-container";
    dayDiv.id = title + "-day-" + idx;
    const cols = document.createElement("div");
    cols.className = "columns";

    columns.forEach(col => {
      const colDiv = document.createElement("div");
      colDiv.className = "column";
      colDiv.dataset.day = idx;
      colDiv.dataset.column = col;

      if (editable) {
        colDiv.addEventListener("dragover", e => e.preventDefault());
        colDiv.addEventListener("drop", e => {
          const name = e.dataTransfer.getData("text");
          moveCard(idx, col, name);
        });
      }

      const titleEl = document.createElement("h2");
      titleEl.textContent = col;
      colDiv.appendChild(titleEl);

      const people = (weekState?.[idx]?.[col] || []);
      people.forEach(name => {
        const person = employees.find(p => p.Name === name);
        if (person) {
          const card = createCard(person);
          if (!editable) card.draggable = false;
          colDiv.appendChild(card);
        }
      });

      cols.appendChild(colDiv);
    });
    dayDiv.appendChild(cols);
    tabContent.appendChild(dayDiv);
  });
  tabs.firstChild.click();
  return container;
}

document.getElementById("weekToggle").addEventListener("change", (e) => {
  const showCurrent = e.target.value === "current";
  document.getElementById("currentWeekContainer").style.display = showCurrent ? "block" : "none";
  document.getElementById("nextWeekContainer").style.display = showCurrent ? "none" : "block";
});

loadBothWeeks();
