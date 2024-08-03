var db;
initSqlJs().then((SQL) => {
  db = new SQL.Database();
  db.exec("PRAGMA foreign_keys = on;");
  db.exec(
    "CREATE TABLE studinfo (id int, rollno text primary key, stud_name text, grade text);"
  );
  db.exec(
    "CREATE TABLE subject(id int, subno text primary key, subname text, guidename text);"
  );
  db.exec(
    "CREATE TABLE stud_sub(id int,rollno text, subno text, FOREIGN KEY (rollno) references studinfo (rollno), FOREIGN KEY (subno) references subject (subno), PRIMARY KEY(rollno, subno));"
  );
  db.exec(`insert into studinfo values(0, '', '', '');`);
  db.exec(`INSERT INTO subject VALUES(0, "", "", "");`);
  // Initial render
  renderTable("studinfo");
  renderTable("subject");
  renderTable("stud_sub");
});

function renderStudSub(tableName) {
  const tableBody = document.getElementById("studsub-output");
  tableBody.innerHTML = "";
  const res = db.exec("SELECT * FROM stud_sub;");
  if (res[0]) {
    res[0].values.forEach((data, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${index + 1}</td>
          <td>
            <div class="rollno-container">
              <input id = "rollno-search" placeholder="Search Roll No..." type = "text" name = "${
                res[0].columns[1]
              }" value="${data[1]}" oninput = "handleChange(${data[0]},event)">
              <ul id="rollno-dropdown" class="dropdown">
                <!-- List items will be dynamically inserted here -->
              </ul>
            </div>
          </td>
          <td>
            <div class="subno-container">
              <input id = "subno-search" placeholder="Search Subject No..." type = "text" name = "${
                res[0].columns[2]
              }" value="${data[2]}" oninput= "handleChange(${data[0]}, event)">
              <ul id="subno-dropdown" class="dropdown">
                <!-- List items will be dynamically inserted here -->
              </ul>
            </div>
          </td>
          <td><button onclick="remove(${
            data[0]
          }, ${tableName})" style="margin-right: 10px">Remove</button>
          </td>
          `;
      tableBody.appendChild(row);
    });
  }
}

function handleChange(id, event) {
  const { name, value } = event.target;
  var dropdown, res;
  if (name == "rollno") {
    dropdown = document.getElementById("rollno-dropdown");
    res = db.exec(
      `Select ${name} from studinfo where rollno like "%${value}%";`
    );
  } else {
    dropdown = document.getElementById("subno-dropdown");
    res = db.exec(`Select ${name} from subject where subno like "%${value}%";`);
  }
  dropdown.style.display = "block";
  dropdown.innerHTML = "";
  if (res[0]) {
    res[0].values.forEach((data, index) => {
      const li = document.createElement("li");
      li.innerHTML = data;
      li.id = data;
      li.addEventListener("click", (e) => {
        db.exec(
          `UPDATE stud_sub set ${name} = "${e.target.id}" where id = ${id};`
        );
        renderTable("stud_sub");
        dropdown.style.display = "none";
      });
      dropdown.appendChild(li);
    });
  }
}

function renderTable(tableName) {
  var tableBody;
  const res = db.exec(`SELECT * FROM ${tableName};`);
  if (tableName == "studinfo") {
    tableBody = document.getElementById("data-output");
  } else if (tableName == "subject") {
    tableBody = document.getElementById("subject-output");
  } else {
    renderStudSub(tableName);
    return;
  }
  tableBody.innerHTML = "";
  if (res[0]) {
    res[0].values.forEach((data, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${index + 1}</td>
          <td><input type="text" name="${res[0].columns[1]}" value="${
        data[1]
      }" oninput="handleInputChange(${data[0]}, event, ${tableName})" /></td>
          <td><input type="text" name="${res[0].columns[2]}" value="${
        data[2]
      }" oninput="handleInputChange(${data[0]}, event, ${tableName})" /></td>
          <td><input type="text" name="${res[0].columns[3]}" value="${
        data[3]
      }" oninput="handleInputChange(${data[0]}, event, ${tableName})" /></td>
          <td><button onclick="remove(${
            data[0]
          }, ${tableName})" style="margin-right: 10px">Remove</button>
        `;
      tableBody.appendChild(row);
    });
  }
}

function handleInputChange(index, event, tableName) {
  const { name, value } = event.target;
  const query = `UPDATE ${tableName.id} SET ${name} = '${value}' WHERE id = ${index};`;
  db.exec(query);
}

function add(event) {
  const res = db.exec(`SELECT * from ${event.target.name};`);
  if (event.target.name == "studinfo" || event.target.name == "subject") {
    db.exec(
      `INSERT INTO ${event.target.name} VALUES(${
        res[0] ? res[0].values.length : 0
      }, "", "", "");`
    );
  } else {
    db.exec(
      `INSERT INTO ${event.target.name} VALUES(${
        res[0] ? res[0].values.length : 0
      }, "", "");`
    );
  }
  renderTable(event.target.name);
}

function remove(index, tableName) {
  db.exec(`DELETE FROM ${tableName.id} where id = ${index}`);
  const res = db.exec("SELECT * FROM stud_sub;");
  renderTable(tableName.id);
}

function saveJson(event) {
  const res = db.exec(`SELECT * FROM ${event.target.name};`);
  const jsonData = JSON.stringify(res);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.target.name}_data.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadJson(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  db.exec(`DELETE from ${event.target.name};`);
  reader.onload = (e) => {
    res = JSON.parse(e.target.result);
    res[0].values.forEach((data) => {
      db.exec(
        `INSERT into ${event.target.name} values(${data[0]}, '${data[1]}', '${data[2]}', '${data[3]}');`
      );
    });
    renderTable(event.target.name);
  };
  reader.readAsText(file);
}

function generateOutput(event) {
  const tableName = event.target.name;
  var outputSection, outputTable;
  const res = db.exec(`SELECT * FROM ${tableName};`);
  if (tableName == "studinfo") {
    outputSection = document.getElementById("output-section");
    outputTable = document.getElementById("output-table");
  } else if (tableName == "subject") {
    outputSection = document.getElementById("subject-output-section");
    outputTable = document.getElementById("subject-output-table");
  } else {
    outputSection = document.getElementById("studsub-output-section");
    outputTable = document.getElementById("studsub-output-table");
  }
  outputTable.innerHTML = "";
  if (res[0]) {
    res[0].values.forEach((data, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${index + 1}</td>
          <td><input type="text" name="rollno" value="${
            data[1]
          }" readonly /></td>
          <td><input type="text" name="stud_name" value="${
            data[2]
          }" readonly /></td>
          ${
            tableName != "stud_sub"
              ? `<td><input type="text" name="grade" value="${data[3]}" readonly /></td>`
              : ""
          }
        `;
      outputTable.appendChild(row);
    });
  }
  outputSection.classList.remove("hidden");
}
