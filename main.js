let allNotes = [], allRanks = [];
let header1, header2;
let averageElements = [], rankElements = [];
let htmlResourcesCreated = false;
let nbStudents = null;
let currentStudent = null, lastStudent = null;

let oldSend = window.XMLHttpRequest.prototype.send;

function newSend(data) {
    let pointer = this;
    let intervalID = window.setInterval(function () {
        if (pointer.readyState != 4)
            return;
        let answer = pointer.response;
        processAnswer(answer);
        clearInterval(intervalID);
    }, 1);
    return oldSend.apply(this, [].slice.call(arguments));
}

if (window.sessionStorage.getItem("informationSaved") == "true") {
    allRanks = JSON.parse(window.sessionStorage.getItem("allRanks"));
    allNotes = JSON.parse(window.sessionStorage.getItem("allNotes"));
    nbStudents = parseInt(window.sessionStorage.getItem("nbStudents"));
    currentStudent = parseInt(window.sessionStorage.getItem("currentStudent"));
    placeEvents();
}

window.XMLHttpRequest.prototype.send = newSend;
if (window.location.href.endsWith("/Notes")) {
    waitForElementToAppear("#menu-part > div > ed-menu:nth-child(" + (currentStudent + 3) + ") > div > div > ul > li:nth-child(4)", 100, function () {
        let button = document.querySelector("#menu-part > div > ed-menu:nth-child(" + (currentStudent + 3) + ") > div > div > ul > li:nth-child(4)");
        button.click();
    });
    waitForElementToAppear("#onglets-periodes > li.active", 100, function () {
        let subbutton = document.querySelector("#onglets-periodes > li.active");
        subbutton.click();
    });
}

function parseNotes(answerJson) {
    let currentNotes = [], currentRanks = [];
    let unorderedNotes = [];
    for (note of answerJson.data.notes) {
        let newNote = {
            codePeriod: note.codePeriode,
            matterLabel: note.libelleMatiere,
            coefficient: parseFloat(note.coef),
            classAverage: parseFloat(note.moyenneClasse),
            notSignificant: note.nonSignificatif,
            noteSur: parseFloat(note.noteSur),
            date: Date.parse(note.date),
            value: parseFloat(note.valeur.replace(",", "."))
        };
        unorderedNotes.push(newNote);
    }
    for (period of answerJson.data.periodes) {
        let newPeriodRanks = {
            periodID: period.idPeriode,
            periodStart: Date.parse(period.dateDebut),
            periodEnd: Date.parse(period.dateFin),
            periodRanks: []
        };
        for (discipline of period.ensembleMatieres.disciplines) {
            let newRank = {
                discipline: discipline.discipline,
                rank: discipline.rang
            };
            newPeriodRanks.periodRanks.push(newRank);
        }
        currentRanks.push(newPeriodRanks);
    }
    for (let i = 0; i < currentRanks.length; i++) {
        let orderedNotes = {
            codePeriod: currentRanks[i].periodID,
            mainAverage: 0,
            notesPerMatter: []
        };
        for (periodDiscipline of currentRanks[i].periodRanks) {
            let newNotesPerMatter = {
                matter: periodDiscipline.discipline,
                notes: [],
                average: 0
            };
            for (let l = 0; l < unorderedNotes.length; l++) {
                if (unorderedNotes[l].matterLabel == periodDiscipline.discipline && currentRanks[i].periodStart < unorderedNotes[l].date && unorderedNotes[l].date < currentRanks[i].periodEnd) {
                    newNotesPerMatter.notes.push(unorderedNotes[l]);
                }
            }
            orderedNotes.notesPerMatter.push(newNotesPerMatter);
        }
        currentNotes.push(orderedNotes);
    }
    allNotes[currentStudent] = currentNotes;
    allRanks[currentStudent] = currentRanks;
}

function processAnswer(answer) {
    if (typeof (answer) == typeof ("string"))
        if (answer.startsWith("{")) {
            answerJson = JSON.parse(answer);
            if (answerJson.data.notes != null) {
                parseNotes(answerJson);
                calculateAverage();
            }
            else if (answerJson.data.accounts != null) {
                if (nbStudents == null) {
                    nbStudents = answerJson.data.accounts[0].profile.eleves.length;
                    allNotes = new Array(nbStudents);
                    allRanks = new Array(nbStudents);
                    window.sessionStorage.setItem("allNotes", JSON.stringify(allNotes));
                    window.sessionStorage.setItem("allRanks", JSON.stringify(allRanks));
                    window.sessionStorage.setItem("nbStudents", nbStudents.toString());
                    window.sessionStorage.setItem("informationSaved", "true");
                    placeEvents();
                }
            }
        }
}

function calculateAverage() {
    for (period of allNotes[currentStudent]) {
        let totalAverage = 0;
        let mainCoefficient = 0;
        for (matter of period.notesPerMatter) {
            let totalValue = 0;
            let totalCoefficient = 0;
            for (note of matter.notes) {
                if (note.notSignificant == false) {
                    totalValue += note.value / note.noteSur * 20 * note.coefficient;
                    totalCoefficient += note.coefficient;
                }
            }
            if (totalCoefficient != 0) {
                matter.average = (totalValue / totalCoefficient).toFixed(2);
                totalAverage += parseFloat(matter.average);
                mainCoefficient++;
            }
        }
        if (mainCoefficient != 0)
            period.mainAverage = (totalAverage / mainCoefficient).toFixed(2);
    }
    window.sessionStorage.setItem("allNotes", JSON.stringify(allNotes));
    window.sessionStorage.setItem("allRanks", JSON.stringify(allRanks));
    window.sessionStorage.setItem("nbStudents", nbStudents.toString());
    window.sessionStorage.setItem("currentStudent", currentStudent.toString());
    window.sessionStorage.setItem("informationSaved", "true");
}

function waitForElementToAppear(selector, time, action) {
    if (document.querySelector(selector) != null) {
        action();
    }
    else {
        setTimeout(function () {
            waitForElementToAppear(selector, time, action);
        }, time);
    }
}

function createHtmlElement(text) {
    let temp = document.createElement("template");
    temp.innerHTML = text.trim();
    let element = temp.content.firstChild;
    return element;
}

//!
function placeEvents() {
    for (let i = 0; i < nbStudents; i++) {
        waitForElementToAppear("#menu-part > div > ed-menu:nth-child(" + (i + 3) + ") > div > div > ul > li:nth-child(4)", 100, function () {
            let button = document.querySelector("#menu-part > div > ed-menu:nth-child(" + (i + 3) + ") > div > div > ul > li:nth-child(4)");
            button.addEventListener("click", function () {
                lastStudent = currentStudent;
                currentStudent = i;
                htmlResourcesCreated = false;
                for (let l = 1; l < 10; l++) {
                    waitForElementToAppear("#onglets-periodes > li:nth-child(" + l + ")", 100, function () {
                        let subbutton = document.querySelector("#onglets-periodes > li:nth-child(" + l + ")");
                        subbutton.addEventListener("click", function () {
                            injectHtml(l - 1);
                        });
                    });
                }
                if (!window.location.href.endsWith("/Notes") || lastStudent != currentStudent) {
                    waitForElementToAppear("#onglets-periodes > li.active", 100, function () {
                        let subbutton = document.querySelector("#onglets-periodes > li.active");
                        subbutton.click();
                    });
                }
            });
        });
    }
}

function createHtmlResources() {
    averageElements = [];
    rankElements = [];
    let currentNotes = allNotes[currentStudent];
    let currentRanks = allRanks[currentStudent];
    header1 = createHtmlElement('<th class="average"> Moyenne </th>');
    header2 = createHtmlElement('<th class="rang"> Rang </th>');
    for (let i = 0; i < currentNotes.length; i++) {
        let averageElement = {
            period: "",
            mainAverage: null,
            elements: []
        };
        let rankElement = {
            period: "",
            elements: []
        };
        averageElement.period = currentNotes[i].codePeriod;
        rankElement.period = currentRanks[i].codePeriod;
        for (let l = 0; l < currentNotes[i].notesPerMatter.length; l++) {
            averageElement.elements.push(createHtmlElement('<td class="averageNote">' + currentNotes[i].notesPerMatter[l].average + '</td>'));
            rankElement.elements.push(createHtmlElement('<td class="rangNote">' + currentRanks[i].periodRanks[l].rank + '</td>'));
        }
        averageElements.push(averageElement);
        rankElements.push(rankElement);

        let lastRow = createHtmlElement('<tr></tr>');
        lastRow.appendChild(createHtmlElement('<td class="hiddenRow"></td>'));
        lastRow.appendChild(createHtmlElement('<td class="hiddenRow"></td>'));
        lastRow.appendChild(createHtmlElement('<td class="mainAverageText">MOYENNE GENERALE</td>'));
        lastRow.appendChild(createHtmlElement('<td class="mainAverageNote">' + currentNotes[i].mainAverage + '</td>'));
        lastRow.appendChild(createHtmlElement('<td class="hiddenRow fixed"></td>'));
        averageElement.mainAverage = lastRow;
    }
    htmlResourcesCreated = true;
}

function injectHtml(period) {
    let currentNotes = allNotes[currentStudent];
    if (!htmlResourcesCreated)
        createHtmlResources();
    waitForElementToAppear("#encart-notes > table > thead > tr", 100, function () {
        let place = document.querySelector("#encart-notes > table > thead > tr");
        place.appendChild(header1);
        place.appendChild(header2);
    });
    waitForElementToAppear("#encart-notes > table > tbody", 100, function () {
        let place = document.querySelector("#encart-notes > table > tbody");
        place.appendChild(averageElements[period].mainAverage);
    });
    for (let i = 1; i < currentNotes[period].notesPerMatter.length + 1; i++) {
        waitForElementToAppear("#encart-notes > table > tbody > tr:nth-child(" + i + ")", 100, function () {
            let place = document.querySelector("#encart-notes > table > tbody > tr:nth-child(" + i + ")");
            place.appendChild(averageElements[period].elements[i - 1]);
            place.appendChild(rankElements[period].elements[i - 1]);
        });
    }
};;

//selectors for table
//#encart-notes > table > tbody > tr:nth-child(1)
//#encart-notes > table > tbody > tr:nth-child(14)

//selectors for tabs
//#onglets-periodes > li:nth-child(1)
//#onglets-periodes > li:nth-child(9)
//#onglets-periodes > li.active

//selector for "notes" page
//#menu-part > div > ed-menu.ed-menu-eleve > div > div > ul > li:nth-child(4)
//#menu-part > div > ed-menu.ed-menu-eleve > div > div > ul > li:nth-child(4)

//selectors for students
//#menu-part > div > ed-menu:nth-child(4)
//#menu-part > div > ed-menu:nth-child(4) > div
//#menu-part > div > ed-menu:nth-child(3)

//selector for table
//#encart-notes > table > tbody